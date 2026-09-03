import { IsString, MinLength } from "class-validator";

export class DiscordActivityExchangeDto {
  @IsString()
  @MinLength(8)
  code!: string;
}
