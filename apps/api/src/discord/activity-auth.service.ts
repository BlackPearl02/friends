/**
 * Discord Activity OAuth exchange — maps Discord user to a Friends JWT.
 *
 * Tries redirect shapes Discord accepts for Embedded App codes
 * (omit → https://127.0.0.1 → https://{clientId}.discordsays.com) unless
 * DISCORD_ACTIVITY_REDIRECT_URI is set.
 */
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ActivityExchangeResponse } from "@friends/types";
import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { DiscordApiClient } from "./discord-api.client";
import type { DiscordActivityExchangeDto } from "./dto/exchange.dto";

function avatarUrl(id: string, avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
}

@Injectable()
export class DiscordActivityAuthService {
  private readonly logger = new Logger(DiscordActivityAuthService.name);

  constructor(
    private readonly api: DiscordApiClient,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private redirectCandidates(): Array<string | undefined> {
    const override = this.config.get<string>("DISCORD_ACTIVITY_REDIRECT_URI")?.trim();
    if (override) return [override];
    const clientId = this.config.get<string>("DISCORD_CLIENT_ID")?.trim() ?? "";
    return [
      undefined,
      "https://127.0.0.1",
      clientId ? `https://${clientId}.discordsays.com` : undefined,
    ].filter((v, i, arr) => arr.indexOf(v) === i);
  }

  async exchange(dto: DiscordActivityExchangeDto): Promise<ActivityExchangeResponse> {
    const candidates = this.redirectCandidates();
    let lastError: unknown;
    let token: { access_token: string } | undefined;
    for (const redirectUri of candidates) {
      try {
        token = await this.api.exchangeCode({
          code: dto.code,
          ...(redirectUri ? { redirectUri } : {}),
        });
        this.logger.log(`Activity token ok (redirect=${redirectUri ?? "omitted"})`);
        break;
      } catch (err) {
        lastError = err;
        if (!this.api.isRetryableTokenError(err)) break;
      }
    }
    if (!token) {
      throw lastError instanceof UnauthorizedException
        ? lastError
        : new UnauthorizedException("Discord Activity sign-in failed.");
    }

    const me = await this.api.getMe(token.access_token);
    const displayName = (me.global_name?.trim() || me.username).slice(0, 80);
    const user = await this.prisma.user.upsert({
      where: { discordId: me.id },
      create: {
        discordId: me.id,
        displayName,
        avatarUrl: avatarUrl(me.id, me.avatar),
      },
      update: {
        displayName,
        avatarUrl: avatarUrl(me.id, me.avatar),
      },
    });

    return {
      accessToken: this.auth.signAccessToken(user),
      discordAccessToken: token.access_token,
      user: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
