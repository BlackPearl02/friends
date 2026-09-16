import type { DiscordSDK } from "@discord/embedded-app-sdk";
import { exchangeActivityCode, type ActivityExchangeResponse } from "./api";

/** Required to join a room — keep minimal; extra RPC scopes can block authorize on some clients. */
export const ACTIVITY_CORE_OAUTH_SCOPES = ["identify", "guilds"] as const;

/** Best-effort Rich Presence (`setActivity`). Must never block Activity boot. */
export const ACTIVITY_PRESENCE_OAUTH_SCOPES = ["rpc.activities.write"] as const;

/** Preferred authorize scopes (core + presence). */
export const ACTIVITY_OAUTH_SCOPES = [
  ...ACTIVITY_CORE_OAUTH_SCOPES,
  ...ACTIVITY_PRESENCE_OAUTH_SCOPES,
] as const;

type OAuthScope = (typeof ACTIVITY_OAUTH_SCOPES)[number];

type AuthorizeArgs = {
  client_id: string;
  response_type: "code";
  state: string;
  scope: OAuthScope[];
  prompt?: "none";
};

async function authorizeWithScopes(
  sdk: Pick<DiscordSDK, "commands">,
  clientId: string,
  scopes: readonly OAuthScope[],
): Promise<string> {
  const base: AuthorizeArgs = {
    client_id: clientId,
    response_type: "code",
    state: "",
    scope: [...scopes],
  };

  try {
    const authz = await sdk.commands.authorize({ ...base, prompt: "none" });
    return authz.code;
  } catch {
    const authz = await sdk.commands.authorize(base);
    return authz.code;
  }
}

/**
 * Discord opens an OAuth modal when the user lacks a token for the requested scopes.
 * Prefer core + presence; if that fails (scope unavailable / consent cancelled),
 * fall back to core only so gameplay still starts.
 */
export async function authorizeActivityCode(
  sdk: Pick<DiscordSDK, "commands">,
  clientId: string,
): Promise<string> {
  try {
    return await authorizeWithScopes(sdk, clientId, ACTIVITY_OAUTH_SCOPES);
  } catch {
    return authorizeWithScopes(sdk, clientId, ACTIVITY_CORE_OAUTH_SCOPES);
  }
}

export async function authenticateActivity(
  sdk: DiscordSDK,
  clientId: string,
): Promise<ActivityExchangeResponse> {
  const code = await authorizeActivityCode(sdk, clientId);
  const auth = await exchangeActivityCode({ code });
  await sdk.commands.authenticate({ access_token: auth.discordAccessToken });
  return auth;
}
