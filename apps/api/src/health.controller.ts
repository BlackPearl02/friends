import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/public.decorator";
import { SkipThrottle } from "@nestjs/throttler";

/**
 * Lightweight warm-up for Vercel serverless (cron + probes).
 * Must stay public and cheap — no DB.
 */
@Controller()
export class HealthController {
  @Public()
  @SkipThrottle()
  @Get("health")
  health() {
    return { ok: true as const };
  }
}
