import { dbgRt } from "./dbgRt";

const DISCORDSAYS_APP_ID = /^(\d{17,20})\.discordsays\.com$/i;

/**
 * Prefer the Application ID Discord actually framed us under
 * (`{appId}.discordsays.com`). A mis-baked `VITE_DISCORD_CLIENT_ID` makes
 * `sdk.ready()` hang forever (HANDSHAKE client_id mismatch).
 */
export function resolveDiscordClientId(
  envClientId: string,
  hostname: string = typeof window !== "undefined" ? window.location.hostname : "",
): string {
  const fromEnv = envClientId.trim();
  const match = hostname.match(DISCORDSAYS_APP_ID);
  const fromHost = match?.[1] ?? "";

  if (fromHost && fromEnv && fromHost !== fromEnv) {
    // #region agent log
    dbgRt("H8", "resolveDiscordClientId.ts", "client_id_mismatch", {
      envTail: fromEnv.slice(-6),
      hostTail: fromHost.slice(-6),
      using: "host",
    });
    // #endregion
  } else if (fromHost) {
    // #region agent log
    dbgRt("H8", "resolveDiscordClientId.ts", "client_id_ok", {
      hostTail: fromHost.slice(-6),
      source: fromEnv === fromHost ? "env+host" : "host",
    });
    // #endregion
  }

  return fromHost || fromEnv;
}
