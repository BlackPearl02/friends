import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import type { PublicRoom } from "@friends/types";
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
import { applyLocalIntent, applyLocalVote } from "./roomOptimistic";
import { mergePublicRoom, shouldApplyPollResult } from "./roomApply";
import { subscribeRoomInvalidation } from "./roomRealtime";
import { ROOM_POLL_MS } from "./roomSync";
import { isShellLoading, shellBannerKind, type ShellPhase } from "./shellStatus";

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID?.trim() ?? "";
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
      await sdk.ready();
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
      const room = await joinRoom(session.accessToken, {
        instanceId: session.instanceId,
        channelId: session.sdk.channelId,
        guildId: session.sdk.guildId,
      });
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
        setBootError(err instanceof Error ? err.message : null);
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
    let inFlight = false;

    const tick = () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      const startedGen = syncGeneration.current;
      void fetchRoom(accessToken, instanceId)
        .then((next) => {
          if (
            cancelled ||
            !shouldApplyPollResult(startedGen, syncGeneration.current, mutationsInFlight.current)
          ) {
            return;
          }
          setRoom((prev) => (prev ? mergePublicRoom(prev, next) : next));
        })
        .catch(() => undefined)
        .finally(() => {
          inFlight = false;
        });
    };

    tick();
    const id = window.setInterval(tick, ROOM_POLL_MS);
    const unsubscribeRealtime = subscribeRoomInvalidation(instanceId, () => {
      tick();
    });
    return () => {
      cancelled = true;
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
            onIntent={async (intent) => {
              const snapshot = roomRef.current ?? room;
              syncGeneration.current += 1;
              setRoom(applyLocalIntent(snapshot, userId, intent));
              if (preview) return;
              setActionError(null);
              mutationsInFlight.current += 1;
              try {
                setRoom(await setRoomIntent(accessToken, instanceId, intent));
              } catch {
                setRoom(snapshot);
                setActionError(t("shell.actionFailed"));
              } finally {
                mutationsInFlight.current -= 1;
              }
            }}
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
              setRoom(applyLocalVote(snapshot, userId));
              setActionError(null);
              mutationsInFlight.current += 1;
              try {
                setRoom(
                  await voteRound(accessToken, { roundId: snapshot.round!.id, ...body }),
                );
              } catch {
                setRoom(snapshot);
                setActionError(t("shell.actionFailed"));
              } finally {
                mutationsInFlight.current -= 1;
              }
            }}
            onIntent={async (intent) => {
              const snapshot = roomRef.current ?? room;
              syncGeneration.current += 1;
              setRoom(applyLocalIntent(snapshot, userId, intent));
              if (preview) return;
              setActionError(null);
              mutationsInFlight.current += 1;
              try {
                setRoom(await setRoomIntent(accessToken, instanceId, intent));
              } catch {
                setRoom(snapshot);
                setActionError(t("shell.actionFailed"));
              } finally {
                mutationsInFlight.current -= 1;
              }
            }}
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
              setRoom(await replayMatch(accessToken, instanceId));
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
