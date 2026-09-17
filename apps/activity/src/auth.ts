import type { DiscordSDK } from "@discord/embedded-app-sdk";
import { exchangeActivityCode, type ActivityExchangeResponse } from "./api";

/** Required to join a room — keep minimal so authorize cannot hang on optional scopes. */
export const ACTIVITY_CORE_OAUTH_SCOPES = ["identify", "guilds"] as const;

/** Best-effort Rich Presence (`setActivity`) — requested after boot, never blocks sign-in. */
export const ACTIVITY_PRESENCE_OAUTH_SCOPES = ["rpc.activities.write"] as const;

/** @deprecated Boot uses core only; kept for tests / presence helpers. */
export const ACTIVITY_OAUTH_SCOPES = [
  ...ACTIVITY_CORE_OAUTH_SCOPES,
  ...ACTIVITY_PRESENCE_OAUTH_SCOPES,
] as const;

/** Discord authorize / ready can hang — fail soft into a visible error. */
export const AUTHORIZE_TIMEOUT_MS = 12_000;
export const READY_TIMEOUT_MS = 12_000;
export const EXCHANGE_TIMEOUT_MS = 15_000;

type OAuthScope = (typeof ACTIVITY_CORE_OAUTH_SCOPES)[number];

type AuthorizeArgs = {
  client_id: string;
  response_type: "code";
  state: string;
  scope: OAuthScope[];
  prompt?: "none";
};

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function authLog(step: string, detail?: string): void {
  if (detail) console.info("[squimbo-auth]", step, detail);
  else console.info("[squimbo-auth]", step);
}

/**
 * Silent authorize first; if Discord needs consent, open the modal once.
 * Core scopes only — presence is optional and must not block boot.
 */
export async function authorizeActivityCode(
  sdk: Pick<DiscordSDK, "commands">,
  clientId: string,
): Promise<string> {
  const base: AuthorizeArgs = {
    client_id: clientId,
    response_type: "code",
    state: "",
    scope: [...ACTIVITY_CORE_OAUTH_SCOPES],
  };

  try {
    authLog("authorize", "prompt=none");
    const authz = await withTimeout(
      sdk.commands.authorize({ ...base, prompt: "none" }),
      AUTHORIZE_TIMEOUT_MS,
      "Discord authorize (prompt=none)",
    );
    return authz.code;
  } catch (err: unknown) {
    authLog(
      "authorize-fallback",
      err instanceof Error ? err.message : "consent",
    );
    const authz = await withTimeout(
      sdk.commands.authorize(base),
      AUTHORIZE_TIMEOUT_MS,
      "Discord authorize",
    );
    return authz.code;
  }
}

export async function authenticateActivity(
  sdk: DiscordSDK,
  clientId: string,
): Promise<ActivityExchangeResponse> {
  authLog("ready");
  await withTimeout(sdk.ready(), READY_TIMEOUT_MS, "Discord SDK ready");

  const code = await authorizeActivityCode(sdk, clientId);
  authLog("exchange");
  const auth = await withTimeout(
    exchangeActivityCode({ code }),
    EXCHANGE_TIMEOUT_MS,
    "Activity code exchange",
  );
  authLog("authenticate");
  await withTimeout(
    sdk.commands.authenticate({ access_token: auth.discordAccessToken }),
    AUTHORIZE_TIMEOUT_MS,
    "Discord authenticate",
  );
  authLog("ok");
  return auth;
}
