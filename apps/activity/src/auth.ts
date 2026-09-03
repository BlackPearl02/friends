import type { DiscordSDK } from "@discord/embedded-app-sdk";
import { exchangeActivityCode, type ActivityExchangeResponse } from "./api";

export async function authenticateActivity(
  sdk: DiscordSDK,
  clientId: string,
): Promise<ActivityExchangeResponse> {
  const authz = await sdk.commands.authorize({
    client_id: clientId,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds", "rpc.activities.write"],
  });
  const auth = await exchangeActivityCode({ code: authz.code });
  await sdk.commands.authenticate({ access_token: auth.discordAccessToken });
  return auth;
}
