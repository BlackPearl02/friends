import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import type { PublicRoom, RoomIntent } from "@friends/types";
import {
  fetchRoom,
  joinRoom,
  leaveRoom,
  replayMatch,
  RoomInProgressError,
  setRoomIntent,
  voteRound,
} from "./api";
import { authenticateActivity } from "./auth";
import { logDiscordEmbedProbe } from "./discordRpcTarget";
import { resolveDiscordClientId } from "./resolveDiscordClientId";
import "./friends.css";
import { FinishedPanel } from "./FinishedPanel";
import { t } from "./i18n";
import { LobbyPanel } from "./LobbyPanel";
import { previewFinished, previewReveal, previewRound, previewRoom, previewTie } from "./previewData";
import { RoundPanel } from "./RoundPanel";
import { subscribeDiscordParticipants } from "./discordParticipants";
import {
  buildRichPresenceActivity,
  presenceRoundNumber,
  resolvePresencePhase,
  syncDiscordPresence,
} from "./discordPresence";
import {
  applyLocalIntent,
  applyPeerIntent,
  applyPeerReveal,
  applyPeerRoundStart,
  applyVoteAndMaybeReveal,
  awaitingLobbyStart,
  roundFanoutFromRoom,
} from "./roomOptimistic";
import { dbgRt } from "./dbgRt";
import { mergePublicRoom, shouldApplyPollResult } from "./roomApply";
import { createRoomRefreshGate, isRoomMembershipLostError } from "./roomRefresh";
import { subscribeRoomInvalidation, publishRoomPatch } from "./roomRealtime";
import { ROOM_POLL_MS } from "./roomSync";
import { isShellLoading, shellBannerKind, type ShellPhase } from "./shellStatus";

const envClientId = import.meta.env.VITE_DISCORD_CLIENT_ID?.trim() ?? "";
const clientId = resolveDiscordClientId(envClientId);
const JOIN_RETRY_MS = 2_000;

type BootResult = {
  sdk: DiscordSDK;
  accessToken: string;
  userId: string;
  instanceId: string;
  room: PublicRoom;
};

type AuthSession = {
  sdk: DiscordSDK;
  accessToken: string;
  userId: string;
  instanceId: string;
};

/** One bootstrap across React StrictMode's double effect invoke in dev. */
let bootPromise: Promise<BootResult> | null = null;
let authSessionPromise: Promise<AuthSession> | null = null;

function authenticateSession(clientId: string): Promise<AuthSession> {
  if (!authSessionPromise) {
    authSessionPromise = (async () => {
      const sdk = new DiscordSDK(clientId);
      logDiscordEmbedProbe({ clientIdTail: clientId.slice(-6) });
      // ready() is awaited inside authenticateActivity (with timeout).
      const auth = await authenticateActivity(sdk, clientId);
      return {
        sdk,
        accessToken: auth.accessToken,
        userId: auth.user.id,
        instanceId: sdk.instanceId,
      };
    })().catch((err: unknown) => {
      authSessionPromise = null;
      throw err;
    });
  }
  return authSessionPromise;
}

function bootstrapActivity(clientId: string): Promise<BootResult> {
  if (!bootPromise) {
    bootPromise = (async () => {
      const session = await authenticateSession(clientId);
      console.info("[squimbo-auth] join");
      const room = await joinRoom(session.accessToken, {
        instanceId: session.instanceId,
        channelId: session.sdk.channelId,
        guildId: session.sdk.guildId,
      });
      console.info("[squimbo-auth] ready");
      return { ...session, room };
    })().catch((err: unknown) => {
      bootPromise = null;
      throw err;
    });
  }
  return bootPromise;
}

function BrandHeader() {
  return (
    <>
      <div className="friends-brand">
        <img className="friends-logo" src="/squimbo-logo.png" alt={t("shell.title")} width={56} height={56} />
        <p className="friends-subtitle" style={{ margin: 0 }}>
          {t("shell.subtitle")}
        </p>
      </div>
      <img className="friends-cover" src="/squimbo-cover-art.png" alt="" />
    </>
  );
}

function initialPreviewRoom(preview: string | null): PublicRoom | null {
  if (preview === "finished") return previewFinished;
  if (preview === "tie") return previewTie;
  if (preview === "reveal") return previewReveal;
  if (preview === "round") return previewRound;
  if (preview) return previewRoom;
  return null;
}

function App() {
  const preview = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("preview")
    : null;
  const sdkRef = useRef<DiscordSDK | null>(null);
  const [phase, setPhase] = useState<ShellPhase>(preview ? "ready" : "boot");
  const [bootError, setBootError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(preview ? "preview" : null);
  const [userId, setUserId] = useState<string | null>(preview ? "you" : null);
  const [instanceId, setInstanceId] = useState<string | null>(preview ? "preview" : null);
  const [room, setRoom] = useState<PublicRoom | null>(initialPreviewRoom(preview));
  const [discordParticipantCount, setDiscordParticipantCount] = useState<number | null>(
    preview ? 2 : null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const roomRef = useRef<PublicRoom | null>(room);
  roomRef.current = room;
  /** Skip poll overwrites while a mutation's optimistic patch is in flight. */
  const mutationsInFlight = useRef(0);
  /** Bumped when a mutation starts — invalidates in-flight polls. */
  const syncGeneration = useRef(0);
  /** Burst-poll while lobby shows all Ready until Nest begins the round. */
  const lobbyStartBurstId = useRef<number | null>(null);
  const gateRequestRef = useRef<(() => void) | null>(null);

  const clearLobbyStartBurst = () => {
    if (lobbyStartBurstId.current != null) {
      window.clearInterval(lobbyStartBurstId.current);
      lobbyStartBurstId.current = null;
    }
  };

  const startLobbyStartBurst = () => {
    if (lobbyStartBurstId.current != null) return;
    let ticks = 0;
    lobbyStartBurstId.current = window.setInterval(() => {
      ticks += 1;
      gateRequestRef.current?.();
      const cur = roomRef.current;
      if (ticks >= 25 || !cur || cur.status !== "lobby" || !awaitingLobbyStart(cur)) {
        clearLobbyStartBurst();
      }
    }, 120);
    gateRequestRef.current?.();
  };

  /** Unix seconds — stable across presence updates until sessionKey changes. */
  const presenceStartedAtSec = useRef<number | null>(null);
  const presenceSessionKey = useRef<string | null>(null);
  const presenceFingerprint = useRef<string | null>(null);

  useEffect(() => {
    if (preview) return;
    if (!clientId) {
      setPhase("missing-client-id");
      return;
    }

    let cancelled = false;
    setPhase("authorizing");

    void bootstrapActivity(clientId)
      .then((boot) => {
        if (cancelled) return;
        sdkRef.current = boot.sdk;
        setAccessToken(boot.accessToken);
        setUserId(boot.userId);
        setInstanceId(boot.instanceId);
        setRoom(boot.room);
        setBootError(null);
        setPhase("ready");
      })
      .catch((err: unknown) => {
        // StrictMode abandons the first effect; ignore that attempt's updates.
        if (cancelled) return;
        if (err instanceof RoomInProgressError) {
          void authenticateSession(clientId).then((session) => {
            if (cancelled) return;
            sdkRef.current = session.sdk;
            setAccessToken(session.accessToken);
            setUserId(session.userId);
            setInstanceId(session.instanceId);
            setBootError(null);
            setPhase("waiting-in-progress");
          });
          return;
        }
        const message = err instanceof Error ? err.message : null;
        // #region agent log
        dbgRt("H6", "main.tsx:boot", "boot_failed", {
          err: message?.slice(0, 160) ?? "unknown",
          tClient: Date.now(),
          // Distinguishes pre-60s builds (12000) from current (60000).
          buildHint: "ready60s",
        });
        // #endregion
        setBootError(message);
        setPhase("error");
      });

    return () => {
      cancelled = true;
    };
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    if (phase !== "waiting-in-progress" || !accessToken || !instanceId) return;
    let cancelled = false;

    const tryJoin = () => {
      const sdk = sdkRef.current;
      void joinRoom(accessToken, {
        instanceId,
        channelId: sdk?.channelId,
        guildId: sdk?.guildId,
      })
        .then((next) => {
          if (cancelled) return;
          bootPromise = Promise.resolve({
            sdk: sdk!,
            accessToken,
            userId: userId!,
            instanceId,
            room: next,
          });
          setRoom(next);
          setPhase("ready");
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (err instanceof RoomInProgressError) return;
          setBootError(err instanceof Error ? err.message : null);
          setPhase("error");
        });
    };

    tryJoin();
    const id = window.setInterval(tryJoin, JOIN_RETRY_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [phase, accessToken, instanceId, userId, preview]);

  useEffect(() => {
    if (preview) return;
    if (phase !== "ready" || !accessToken || !instanceId) return;
    let cancelled = false;

    const gate = createRoomRefreshGate(async () => {
      if (cancelled) return;
      const startedGen = syncGeneration.current;
      try {
        const next = await fetchRoom(accessToken, instanceId);
        if (
          cancelled ||
          !shouldApplyPollResult(startedGen, syncGeneration.current, mutationsInFlight.current)
        ) {
          return;
        }
        setRoom((prev) => (prev ? mergePublicRoom(prev, next) : next));
      } catch (err: unknown) {
        if (cancelled || !isRoomMembershipLostError(err)) return;
        // Presence prune can drop a frozen iframe — re-join while still in lobby/empty play.
        try {
          const sdk = sdkRef.current;
          const next = await joinRoom(accessToken, {
            instanceId,
            channelId: sdk?.channelId,
            guildId: sdk?.guildId,
          });
          if (!cancelled) setRoom(next);
        } catch (joinErr: unknown) {
          if (cancelled) return;
          if (joinErr instanceof RoomInProgressError) {
            setPhase("waiting-in-progress");
          }
        }
      }
    });

    gateRequestRef.current = () => gate.request();

    gate.request();
    const id = window.setInterval(() => gate.request(), ROOM_POLL_MS);
    const unsubscribeRealtime = subscribeRoomInvalidation(instanceId, (payload) => {
      // Apply safe public patch before GET so peer badges do not wait ~poll latency.
      if (payload.kind === "reveal" && payload.revealedAt) {
        const revealedAt = payload.revealedAt;
        const serverTime = payload.serverTime;
        const roundId = payload.roundId;
        setRoom((prev) => {
          if (!prev) return prev;
          const next = applyPeerReveal(prev, revealedAt, serverTime, roundId);
          // #region agent log
          dbgRt("H10", "main.tsx:onInvalidate", "apply_peer_reveal", {
            changed: next !== prev,
            revealedAtTail: revealedAt.slice(-10),
            tClient: Date.now(),
          });
          // #endregion
          return next;
        });
      } else if (payload.kind === "vote" && payload.votedUserId) {
        const voterId = payload.votedUserId;
        const voteCount = payload.voteCount;
        const roundId = payload.roundId;
        const revealBox: {
          current: { revealedAt: string; serverTime: string; roundId?: string } | null;
        } = { current: null };
        setRoom((prev) => {
          if (!prev) return prev;
          const { room: next, publishReveal } = applyVoteAndMaybeReveal(
            prev,
            voterId,
            voteCount,
            false,
            Date.now(),
            roundId,
          );
          if (publishReveal) {
            revealBox.current = {
              revealedAt: publishReveal.revealedAt,
              serverTime: publishReveal.serverTime,
              roundId: next.round?.id,
            };
          }
          // #region agent log
          const peer = prev.players.find((p) => p.userId === voterId);
          dbgRt("H4", "main.tsx:onInvalidate", "apply_peer_vote_result", {
            changed: next !== prev,
            roundStatus: prev.round?.status ?? null,
            peerFound: Boolean(peer),
            alreadyVoted: peer?.hasVoted ?? null,
            voteCount: voteCount ?? null,
            prevVoteCount: prev.round?.voteCount ?? null,
            // post-fix: true means Realtime beat poll (badge path working).
            rtBeatPoll: next !== prev,
            startedReveal: Boolean(publishReveal),
            tClient: Date.now(),
          });
          // #endregion
          return next;
        });
        if (revealBox.current) {
          publishRoomPatch(instanceId, {
            kind: "reveal",
            revealedAt: revealBox.current.revealedAt,
            serverTime: revealBox.current.serverTime,
            roundId: revealBox.current.roundId,
          });
        }
      } else if (
        payload.kind === "round" &&
        payload.roundId &&
        payload.prompt &&
        typeof payload.roundIndex === "number"
      ) {
        const roundId = payload.roundId;
        const roundIndex = payload.roundIndex;
        const prompt = payload.prompt;
        const serverTime = payload.serverTime;
        setRoom((prev) => {
          if (!prev) return prev;
          const next = applyPeerRoundStart(prev, {
            roundId,
            roundIndex,
            prompt,
            serverTime,
          });
          // #region agent log
          dbgRt("H10", "main.tsx:onInvalidate", "apply_peer_round", {
            changed: next !== prev,
            roundIdTail: roundId.slice(-8),
            tClient: Date.now(),
          });
          // #endregion
          return next;
        });
        clearLobbyStartBurst();
      } else if (payload.kind === "intent" && payload.intentUserId && payload.intent) {
        const intentUserId = payload.intentUserId;
        const intent = payload.intent;
        setRoom((prev) => {
          if (!prev) return prev;
          const next = applyPeerIntent(prev, intentUserId, intent);
          if (next && awaitingLobbyStart(next)) startLobbyStartBurst();
          return next;
        });
      } else if (payload.kind === "roster") {
        // Nest finished beginRound / settle — pull the new prompt ASAP.
        if (roomRef.current && awaitingLobbyStart(roomRef.current)) {
          startLobbyStartBurst();
        } else {
          gate.request();
        }
      } else {
        // #region agent log
        dbgRt("H3", "main.tsx:onInvalidate", "wake_only_no_patch", {
          kind: payload.kind ?? "none",
          tClient: Date.now(),
        });
        // #endregion
      }
      // #region agent log
      dbgRt("H5", "main.tsx:onInvalidate", "gate_request_after_rt", { tClient: Date.now() });
      // #endregion
      gate.request();
    });
    return () => {
      cancelled = true;
      gateRequestRef.current = null;
      clearLobbyStartBurst();
      window.clearInterval(id);
      unsubscribeRealtime();
    };
  }, [phase, accessToken, instanceId, preview]);

  useEffect(() => {
    if (preview) return;
    if (!accessToken || !instanceId) return;
    if (phase !== "ready" && phase !== "waiting-in-progress") return;

    // pagehide only — effect cleanup must not leave (React StrictMode remount).
    const notifyLeave = () => {
      leaveRoom(accessToken, instanceId);
    };
    window.addEventListener("pagehide", notifyLeave);
    return () => {
      window.removeEventListener("pagehide", notifyLeave);
    };
  }, [phase, accessToken, instanceId, preview]);

  useEffect(() => {
    if (preview) return;
    if (phase !== "ready" && phase !== "waiting-in-progress") return;
    const sdk = sdkRef.current;
    if (!sdk) return;
    return subscribeDiscordParticipants(sdk, (count) => {
      setDiscordParticipantCount(count);
    });
  }, [phase, preview]);

  useEffect(() => {
    if (preview) return;
    if (phase !== "ready" && phase !== "waiting-in-progress") return;
    const sdk = sdkRef.current;
    if (!sdk || !instanceId) return;

    const presencePhase = resolvePresencePhase(phase, room);
    if (!presencePhase) return;

    const sessionKey = room?.sessionKey ?? `waiting:${instanceId}`;
    if (presenceSessionKey.current !== sessionKey) {
      presenceSessionKey.current = sessionKey;
      presenceStartedAtSec.current = Math.floor(Date.now() / 1000);
      presenceFingerprint.current = null;
    }
    const startTimestampSec = presenceStartedAtSec.current ?? Math.floor(Date.now() / 1000);

    const playerCount =
      room?.players.length ??
      (discordParticipantCount != null && discordParticipantCount > 0 ? discordParticipantCount : 1);

    const activity = buildRichPresenceActivity({
      phase: presencePhase,
      playerCount,
      partyId: instanceId,
      startTimestampSec,
      roundNumber: presenceRoundNumber(room),
    });

    void syncDiscordPresence(sdk, activity, presenceFingerprint);
  }, [phase, room, instanceId, discordParticipantCount, preview]);

  const ready = phase === "ready" && accessToken && userId && instanceId && room;
  const loading = isShellLoading(phase);
  const banner = shellBannerKind(phase, bootError);

  /** Optimistic intent + client fanout, then Nest authority. */
  const submitIntent = async (intent: RoomIntent) => {
    if (!ready) return;
    const snapshot = roomRef.current ?? room;
    syncGeneration.current += 1;
    const next = applyLocalIntent(snapshot, userId, intent);
    setRoom(next);
    if (awaitingLobbyStart(next)) startLobbyStartBurst();
    if (!preview) {
      publishRoomPatch(instanceId, {
        kind: "intent",
        intentUserId: userId,
        intent,
      });
    }
    if (preview) return;
    setActionError(null);
    mutationsInFlight.current += 1;
    try {
      const serverRoom = await setRoomIntent(accessToken, instanceId, intent);
      setRoom((prev) => (prev ? mergePublicRoom(prev, serverRoom) : serverRoom));
      clearLobbyStartBurst();
      // Backup Nest's kind:round so peers flip even if Nest→Supabase lags after HTTP.
      const fanout = roundFanoutFromRoom(serverRoom);
      if (fanout && fanout.roundId !== snapshot.round?.id) {
        publishRoomPatch(instanceId, {
          kind: "round",
          roundId: fanout.roundId,
          roundIndex: fanout.roundIndex,
          prompt: fanout.prompt,
          serverTime: fanout.serverTime,
        });
      }
    } catch {
      setRoom(snapshot);
      setActionError(t("shell.actionFailed"));
    } finally {
      mutationsInFlight.current -= 1;
    }
  };

  return (
    <main className="friends-shell">
      <div className="friends-stage">
        <BrandHeader />

        {!ready && (
          <section className="friends-card" aria-live="polite">
            <p style={{ margin: 0, fontWeight: 700 }}>
              {banner === "notConfigured"
                ? t("shell.notConfigured")
                : banner === "waitingInProgress"
                  ? t("shell.waitingInProgress")
                  : banner === "loading"
                    ? phase === "boot"
                      ? t("shell.authBoot")
                      : t("shell.authAuthorizing")
                    : banner === "signInFailed"
                      ? t("shell.signInFailed")
                      : t("shell.genericError")}
            </p>
            {!loading && (
              <p className="friends-subtitle">
                {banner === "notConfigured"
                  ? t("shell.missingClientIdDev")
                  : banner === "waitingInProgress"
                    ? t("shell.waitingInProgressDetail")
                    : t("shell.signInFailedDetail")}
              </p>
            )}
          </section>
        )}

        {ready && actionError && (
          <p className="hint" role="alert" style={{ margin: "0 0 0.5rem" }}>
            {actionError}
          </p>
        )}

        {ready && room.status === "lobby" && (
          <LobbyPanel
            room={room}
            currentUserId={userId}
            discordParticipantCount={discordParticipantCount}
            onInvite={async () => {
              if (preview) throw new Error("preview");
              const sdk = sdkRef.current;
              if (!sdk) throw new Error("no sdk");
              await sdk.commands.openInviteDialog();
            }}
            onIntent={submitIntent}
          />
        )}

        {ready && room.status === "playing" && room.round && (
          <RoundPanel
            room={room}
            currentUserId={userId}
            onVote={async (body) => {
              if (preview) return;
              const snapshot = roomRef.current ?? room;
              syncGeneration.current += 1;
              const { room: next, publishReveal } = applyVoteAndMaybeReveal(
                snapshot,
                userId,
                undefined,
                true,
              );
              setRoom(next);
              // Peer badges in ms — do not wait for Nest cold start.
              publishRoomPatch(instanceId, {
                kind: "vote",
                votedUserId: userId,
                roundId: snapshot.round!.id,
              });
              if (publishReveal) {
                publishRoomPatch(instanceId, {
                  kind: "reveal",
                  revealedAt: publishReveal.revealedAt,
                  serverTime: publishReveal.serverTime,
                  roundId: snapshot.round!.id,
                });
                // #region agent log
                dbgRt("H10", "main.tsx:onVote", "client_reveal_hold", {
                  fromClientFanout: true,
                  revealedAtTail: publishReveal.revealedAt.slice(-10),
                  tClient: Date.now(),
                });
                // #endregion
              }
              setActionError(null);
              mutationsInFlight.current += 1;
              try {
                const serverRoom = await voteRound(accessToken, {
                  roundId: snapshot.round!.id,
                  ...body,
                });
                setRoom((prev) => (prev ? mergePublicRoom(prev, serverRoom) : serverRoom));
              } catch {
                setRoom(snapshot);
                setActionError(t("shell.actionFailed"));
              } finally {
                mutationsInFlight.current -= 1;
              }
            }}
            onIntent={submitIntent}
          />
        )}

        {ready && room.status === "finished" && (
          <FinishedPanel
            room={room}
            currentUserId={userId}
            onReplay={async () => {
              if (preview) {
                setRoom(previewRoom);
                return;
              }
              const snapshot = roomRef.current ?? room;
              syncGeneration.current += 1;
              mutationsInFlight.current += 1;
              try {
                const serverRoom = await replayMatch(accessToken, instanceId);
                setRoom((prev) => (prev ? mergePublicRoom(prev, serverRoom) : serverRoom));
              } catch {
                setRoom(snapshot);
                setActionError(t("shell.actionFailed"));
              } finally {
                mutationsInFlight.current -= 1;
              }
            }}
          />
        )}
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
