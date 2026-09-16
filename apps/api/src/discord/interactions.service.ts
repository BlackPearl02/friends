import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  handleDiscordInteraction,
  type DiscordInteractionBody,
  type DiscordInteractionResponse,
} from "./interaction-handler";
import { verifyDiscordInteractionSignature } from "./interaction-verify";

@Injectable()
export class DiscordInteractionsService {
  constructor(private readonly config: ConfigService) {}

  /**
   * Verify Discord signature then produce the interaction callback body.
   * Throws 401 on bad signature (required for Discord endpoint validation).
   */
  handleRaw(input: {
    signatureHex: string | undefined;
    timestamp: string | undefined;
    rawBody: Buffer | string | undefined;
  }): DiscordInteractionResponse {
    const publicKeyHex = this.config.get<string>("DISCORD_PUBLIC_KEY")?.trim() ?? "";
    if (!publicKeyHex) {
      throw new UnauthorizedException("Discord interactions are not configured");
    }

    const rawBody =
      typeof input.rawBody === "string"
        ? input.rawBody
        : input.rawBody
          ? input.rawBody.toString("utf8")
          : "";

    const ok = verifyDiscordInteractionSignature({
      publicKeyHex,
      signatureHex: input.signatureHex ?? "",
      timestamp: input.timestamp ?? "",
      rawBody,
    });
    if (!ok) {
      throw new UnauthorizedException("invalid request signature");
    }

    let body: DiscordInteractionBody;
    try {
      body = JSON.parse(rawBody) as DiscordInteractionBody;
    } catch {
      throw new UnauthorizedException("invalid request signature");
    }

    return handleDiscordInteraction(body);
  }
}
