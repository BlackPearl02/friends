import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DiscordActivityAuthService } from "./activity-auth.service";
import { DiscordActivityController } from "./activity.controller";
import { DiscordApiClient } from "./discord-api.client";

@Module({
  imports: [AuthModule],
  controllers: [DiscordActivityController],
  providers: [DiscordApiClient, DiscordActivityAuthService],
})
export class DiscordModule {}
