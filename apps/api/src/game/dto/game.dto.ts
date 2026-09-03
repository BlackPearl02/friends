import { IsIn, IsOptional, IsString, MinLength } from "class-validator";
import type { PromptCategory } from "@friends/types";

export class RoomJoinDto {
  @IsString()
  @MinLength(8)
  instanceId!: string;

  @IsOptional()
  @IsString()
  channelId?: string | null;

  @IsOptional()
  @IsString()
  guildId?: string | null;
}

export class RoomStartDto {
  @IsIn(["party", "family", "colleagues", "spicy"])
  category!: PromptCategory;

  @IsOptional()
  @IsIn(["en", "pl"])
  locale?: "en" | "pl";
}

export class RoundVoteDto {
  @IsString()
  @MinLength(8)
  roundId!: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsIn(["a", "b", "complete", "skip"])
  choice?: "a" | "b" | "complete" | "skip";

  @IsOptional()
  @IsString()
  text?: string;
}
