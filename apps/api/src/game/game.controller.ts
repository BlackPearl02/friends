import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { User } from "@friends/db";
import { CurrentUser } from "../auth/current-user.decorator";
import { RoomJoinDto, RoomStartDto, RoundVoteDto } from "./dto/game.dto";
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
  current(@CurrentUser() user: User, @Query("instanceId") instanceId: string) {
    return this.game.current(user, instanceId);
  }

  @Post("rooms/start")
  start(
    @CurrentUser() user: User,
    @Query("instanceId") instanceId: string,
    @Body() dto: RoomStartDto,
  ) {
    return this.game.start(user, instanceId, dto.category, dto.locale ?? "en");
  }

  @Post("rounds/vote")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  vote(@CurrentUser() user: User, @Body() dto: RoundVoteDto) {
    return this.game.vote(user, dto);
  }

  @Post("rounds/reveal")
  reveal(@CurrentUser() user: User, @Query("instanceId") instanceId: string) {
    return this.game.reveal(user, instanceId);
  }
}
