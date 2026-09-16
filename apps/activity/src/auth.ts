import type { DiscordSDK } from "@discord/embedded-app-sdk";
import { exchangeActivityCode, type ActivityExchangeResponse } from "./api";

/** Scopes required for Squimbo — keep minimal; unused RPC scopes block some joins. */
export const ACTIVITY_OAUTH_SCOPES = ["identify", "guilds", "rpc.activities.write"] as const;

type AuthorizeArgs = {
  client_id: string;
  response_type: "code";
  state: string;
  scope: Array<(typeof ACTIVITY_OAUTH_SCOPES)[number]>;
  prompt?: "none";
};

/**
 * Discord opens an OAuth modal when the user lacks a token for the requested scopes.
 * Try silent `prompt: "none"` first; if that fails (common for first-time joiners),
 * retry without prompt so consent can complete.
 */
export async function authorizeActivityCode(
  sdk: Pick<DiscordSDK, "commands">,
  clientId: string,
): Promise<string> {
  const base: AuthorizeArgs = {
    client_id: clientId,
    response_type: "code",
    state: "",
    scope: [...ACTIVITY_OAUTH_SCOPES],
  };

  try {
    const authz = await sdk.commands.authorize({ ...base, prompt: "none" });
    return authz.code;
  } catch {
    const authz = await sdk.commands.authorize(base);
    return authz.code;
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
