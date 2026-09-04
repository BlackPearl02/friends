import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { User } from "@friends/db";
import { CurrentUser } from "../auth/current-user.decorator";
import { RoomIntentDto, RoomJoinDto, RoundVoteDto } from "./dto/game.dto";
import { GameService } from "./game.service";

@Controller("game")
export class GameController {
  constructor(private readonly game: GameService) {}

  @Post("rooms/join")
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  join(@CurrentUser() user: User, @Body() dto: RoomJoinDto) {
    return this.game.join(user, dto);
  }

  @Get("rooms/current")
  // Party poll (~750ms × up to 8 clients) often shares one Discord/CF egress IP.
  @Throttle({ default: { limit: 800, ttl: 60_000 } })
  current(@CurrentUser() user: User, @Query("instanceId") instanceId: string) {
    return this.game.current(user, instanceId);
  }

  @Post("rooms/intent")
  @Throttle({ default: { limit: 180, ttl: 60_000 } })
  intent(
    @CurrentUser() user: User,
    @Query("instanceId") instanceId: string,
    @Body() dto: RoomIntentDto,
  ) {
    return this.game.setIntent(user, instanceId, dto.intent);
  }

  @Post("rounds/vote")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  vote(@CurrentUser() user: User, @Body() dto: RoundVoteDto) {
    return this.game.vote(user, dto);
  }

  @Post("rooms/replay")
  replay(@CurrentUser() user: User, @Query("instanceId") instanceId: string) {
    return this.game.replay(user, instanceId);
  }
}
