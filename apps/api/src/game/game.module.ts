import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { RoomPartyService } from "./room-party.service";
import { RoomRealtimeService } from "./room-realtime.service";

@Module({
  controllers: [GameController],
  providers: [GameService, RoomPartyService, RoomRealtimeService],
})
export class GameModule {}
