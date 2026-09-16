import {
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  type RawBodyRequest,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { Public } from "../auth/public.decorator";
import { DiscordInteractionsService } from "./interactions.service";

@Controller("discord")
export class DiscordInteractionsController {
  constructor(private readonly interactions: DiscordInteractionsService) {}

  /**
   * Discord Interactions Endpoint URL target.
   * Developer Portal → General Information → Interactions Endpoint URL
   * → https://<API_PUBLIC_URL>/discord/interactions
   */
  @Public()
  @Post("interactions")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-signature-ed25519") signature: string | undefined,
    @Headers("x-signature-timestamp") timestamp: string | undefined,
  ) {
    if (!req.rawBody) {
      throw new UnauthorizedException("invalid request signature");
    }
    return this.interactions.handleRaw({
      signatureHex: signature,
      timestamp,
      rawBody: req.rawBody,
    });
  }
}
