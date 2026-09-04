import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

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

export class RoomIntentDto {
  @IsIn(["none", "continue", "wrap_up"])
  intent!: "none" | "continue" | "wrap_up";
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
