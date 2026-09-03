import { HttpException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type DiscordToken = { access_token: string; token_type: string };

export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

function clientMessage(err: unknown): string {
  if (err instanceof HttpException) {
    const body = err.getResponse();
    if (typeof body === "string" && body.trim()) return body;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return "Discord request failed.";
}

@Injectable()
export class DiscordApiClient {
  private readonly logger = new Logger(DiscordApiClient.name);

  constructor(private readonly config: ConfigService) {}

  async exchangeCode(params: { code: string; redirectUri?: string }): Promise<DiscordToken> {
    const clientId = this.config.getOrThrow<string>("DISCORD_CLIENT_ID");
    const clientSecret = this.config.getOrThrow<string>("DISCORD_CLIENT_SECRET");
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: params.code,
    });
    if (params.redirectUri) body.set("redirect_uri", params.redirectUri);

    const res = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`token exchange HTTP ${res.status}`);
      throw new UnauthorizedException(
        text.toLowerCase().includes("redirect") ? "redirect_uri mismatch" : "invalid Discord code",
      );
    }
    return (await res.json()) as DiscordToken;
  }

  async getMe(accessToken: string): Promise<DiscordUser> {
    const res = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new UnauthorizedException("Discord profile failed");
    return (await res.json()) as DiscordUser;
  }

  isRetryableTokenError(err: unknown): boolean {
    const m = clientMessage(err).toLowerCase();
    return m.includes("redirect_uri") || m.includes("internal server error");
  }
}
