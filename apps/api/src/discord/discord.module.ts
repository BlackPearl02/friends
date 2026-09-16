import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DiscordActivityAuthService } from "./activity-auth.service";
import { DiscordActivityController } from "./activity.controller";
import { DiscordApiClient } from "./discord-api.client";
import { DiscordInteractionsController } from "./interactions.controller";
import { DiscordInteractionsService } from "./interactions.service";

@Module({
  imports: [AuthModule],
  controllers: [DiscordActivityController, DiscordInteractionsController],
  providers: [
    DiscordApiClient,
    DiscordActivityAuthService,
    DiscordInteractionsService,
  ],
})
export class DiscordModule {}
