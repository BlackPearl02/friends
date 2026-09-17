import { IsNumber, IsObject, IsOptional, IsString } from "class-validator";

/** Temporary debug beacon body — no secrets. */
export class DebugRtDto {
  @IsOptional()
  @IsString()
  hypothesisId?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  timestamp?: number;
}
