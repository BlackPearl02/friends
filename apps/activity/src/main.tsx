import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import type { PublicRoom } from "@friends/types";
import { fetchRoom, joinRoom, replayMatch, setRoomIntent, voteRound } from "./api";
import { authenticateActivity } from "./auth";
import "./friends.css";
import { FinishedPanel } from "./FinishedPanel";
import { t } from "./i18n";
import { LobbyPanel } from "./LobbyPanel";
import { previewFinished, previewReveal, previewRound, previewRoom } from "./previewData";
import { RoundPanel } from "./RoundPanel";
import { ROOM_POLL_MS } from "./roomSync";
import { isShellLoading, shellBannerKind, type ShellPhase } from "./shellStatus";
import { cardStyle } from "./theme";

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID?.trim() ?? "";

type BootResult = {
  sdk: DiscordSDK;
  accessToken: string;
  userId: string;
  instanceId: string;
  room: PublicRoom;
};

/** One bootstrap across React StrictMode's double effect invoke in dev. */
let bootPromise: Promise<BootResult> | null = null;

function bootstrapActivity(clientId: string): Promise<BootResult> {
  if (!bootPromise) {
    bootPromise = (async () => {
      const sdk = new DiscordSDK(clientId);
      await sdk.ready();
      const auth = await authenticateActivity(sdk, clientId);
      const instanceId = sdk.instanceId;
      const room = await joinRoom(auth.accessToken, {
        instanceId,
        channelId: sdk.channelId,
        guildId: sdk.guildId,
      });
      return {
        sdk,
        accessToken: auth.accessToken,
        userId: auth.user.id,
        instanceId,
        room,
      };
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
        <img className="friends-logo" src="/friends-logo.png" alt={t("shell.title")} width={56} height={56} />
        <p className="friends-subtitle" style={{ margin: 0 }}>
          {t("shell.subtitle")}
        </p>
      </div>
      <img className="friends-cover" src="/friends-cover-art.png" alt="" />
    </>
  );
}

function initialPreviewRoom(preview: string | null): PublicRoom | null {
  if (preview === "finished") return previewFinished;
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
        setBootError(err instanceof Error ? err.message : null);
        setPhase("error");
      });

    return () => {
      cancelled = true;
    };
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    if (phase !== "ready" || !accessToken || !instanceId) return;
    let cancelled = false;
    let inFlight = false;

    const tick = () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      void fetchRoom(accessToken, instanceId)
        .then((next) => {
          if (!cancelled) setRoom(next);
        })
        .catch(() => undefined)
        .finally(() => {
          inFlight = false;
        });
    };

    tick();
    const id = window.setInterval(tick, ROOM_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [phase, accessToken, instanceId, preview]);

  const ready = phase === "ready" && accessToken && userId && instanceId && room;
  const loading = isShellLoading(phase);
  const banner = shellBannerKind(phase, bootError);

  return (
    <main className="friends-shell">
      <div className="friends-stage">
        <BrandHeader />

        {!ready && (
          <section style={cardStyle} aria-live="polite">
            <p style={{ margin: 0, fontWeight: 700 }}>
              {banner === "notConfigured"
                ? t("shell.notConfigured")
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
                {banner === "notConfigured" ? t("shell.missingClientIdDev") : t("shell.signInFailedDetail")}
              </p>
            )}
          </section>
        )}

        {ready && room.status === "lobby" && (
          <LobbyPanel
            room={room}
            currentUserId={userId}
            onInvite={async () => {
              if (preview) throw new Error("preview");
              const sdk = sdkRef.current;
              if (!sdk) throw new Error("no sdk");
              await sdk.commands.openInviteDialog();
            }}
            onIntent={async (intent) => {
              if (preview) {
                setRoom({
                  ...room,
                  players: room.players.map((p) =>
                    p.userId === userId ? { ...p, intent } : p,
                  ),
                });
                return;
              }
              setRoom(await setRoomIntent(accessToken, instanceId, intent));
            }}
          />
        )}

        {ready && room.status === "playing" && room.round && (
          <RoundPanel
            room={room}
            currentUserId={userId}
            onVote={async (body) => {
              if (preview) return;
              setRoom(await voteRound(accessToken, { roundId: room.round!.id, ...body }));
            }}
            onIntent={async (intent) => {
              if (preview) {
                setRoom({
                  ...room,
                  players: room.players.map((p) =>
                    p.userId === userId ? { ...p, intent } : p,
                  ),
                });
                return;
              }
              setRoom(await setRoomIntent(accessToken, instanceId, intent));
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
