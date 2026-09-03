import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../auth/public.decorator";
import { DiscordActivityAuthService } from "./activity-auth.service";
import { DiscordActivityExchangeDto } from "./dto/exchange.dto";

@Controller("discord")
export class DiscordActivityController {
  constructor(private readonly activityAuth: DiscordActivityAuthService) {}

  @Public()
  @Post("activity/exchange")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  activityExchange(@Body() dto: DiscordActivityExchangeDto) {
    return this.activityAuth.exchange(dto);
  }
}
