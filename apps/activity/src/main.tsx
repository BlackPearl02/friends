import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import type { PromptCategory, PublicRoom } from "@friends/types";
import { fetchRoom, joinRoom, revealRound, startMatch, voteRound } from "./api";
import { authenticateActivity } from "./auth";
import { resolveActivityLocale, t } from "./i18n";
import { LobbyPanel } from "./LobbyPanel";
import { RoundPanel } from "./RoundPanel";
import { cardStyle, colors, shellStyle } from "./theme";

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID?.trim() ?? "";

function App() {
  const [status, setStatus] = useState("boot");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [lastCategory, setLastCategory] = useState<PromptCategory>("party");

  useEffect(() => {
    if (!clientId) {
      setStatus("missing-client-id");
      return;
    }
    const sdk = new DiscordSDK(clientId);
    void sdk
      .ready()
      .then(async () => {
        setStatus("authorizing");
        const auth = await authenticateActivity(sdk, clientId);
        setAccessToken(auth.accessToken);
        setUserId(auth.user.id);
        const inst = sdk.instanceId;
        setInstanceId(inst);
        const joined = await joinRoom(auth.accessToken, {
          instanceId: inst,
          channelId: sdk.channelId,
          guildId: sdk.guildId,
        });
        setRoom(joined);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setStatus(err instanceof Error ? err.message : t("shell.genericError"));
      });
  }, []);

  useEffect(() => {
    if (status !== "ready" || !accessToken || !instanceId) return;
    const id = window.setInterval(() => {
      void fetchRoom(accessToken, instanceId)
        .then(setRoom)
        .catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(id);
  }, [status, accessToken, instanceId]);

  const ready = status === "ready" && accessToken && userId && instanceId && room;
  const loading = status === "boot" || status === "authorizing";

  return (
    <main style={shellStyle}>
      <style>{`
        html, body, #root { margin: 0; min-height: 100%; height: 100%; background: ${colors.bg}; }
        body { overflow-x: hidden; }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>
      <div style={{ padding: "1.25rem 1.35rem 1.75rem", maxWidth: "40rem", margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.1em", color: colors.accent, fontWeight: 700 }}>
          FRIENDS
        </p>
        <h1 style={{ fontSize: "1.45rem", margin: "0.3rem 0 0.4rem" }}>{t("shell.title")}</h1>
        <p style={{ margin: 0, color: colors.muted, lineHeight: 1.45 }}>{t("shell.subtitle")}</p>

        {!ready && (
          <section style={cardStyle} aria-live="polite">
            <p style={{ margin: 0, fontWeight: 600 }}>
              {status === "missing-client-id"
                ? t("shell.notConfigured")
                : loading
                  ? status === "boot"
                    ? t("shell.authBoot")
                    : t("shell.authAuthorizing")
                  : status.includes("HTTP") || status.toLowerCase().includes("sign")
                    ? t("shell.signInFailed")
                    : t("shell.genericError")}
            </p>
            {!loading && (
              <p style={{ margin: "0.4rem 0 0", color: colors.muted, fontSize: "0.85rem" }}>
                {status === "missing-client-id" ? t("shell.missingClientIdDev") : t("shell.signInFailedDetail")}
              </p>
            )}
          </section>
        )}

        {ready && room.status === "lobby" && (
          <LobbyPanel
            room={room}
            currentUserId={userId}
            onStart={async (category) => {
              setLastCategory(category);
              setRoom(await startMatch(accessToken, instanceId, category, resolveActivityLocale()));
            }}
          />
        )}

        {ready && room.round && (
          <RoundPanel
            room={room}
            currentUserId={userId}
            onVote={async (body) => {
              setRoom(await voteRound(accessToken, { roundId: room.round!.id, ...body }));
            }}
            onReveal={async () => {
              setRoom(await revealRound(accessToken, instanceId));
            }}
            onNext={async () => {
              setRoom(await startMatch(accessToken, instanceId, room.category ?? lastCategory, resolveActivityLocale()));
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
