import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { RoomRealtimeService } from "./room-realtime.service";

@Module({
  controllers: [GameController],
  providers: [GameService, RoomRealtimeService],
})
export class GameModule {}
