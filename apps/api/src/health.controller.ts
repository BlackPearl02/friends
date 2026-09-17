import { Body, Controller, Get, Logger, Post } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { Public } from "./auth/public.decorator";
import { DebugRtDto } from "./debug-rt.dto";

/**
 * Lightweight warm-up for Vercel serverless (cron + probes).
 * Must stay public and cheap — no DB.
 */
@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  @Public()
  @SkipThrottle()
  @Get("health")
  health() {
    return { ok: true as const };
  }

  /** Debug-mode client beacon (Activity → Nest). No secrets; rate-limited. */
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post("debug/rt")
  debugRt(@Body() body: DebugRtDto) {
    const hid = body.hypothesisId?.slice(0, 8) ?? "?";
    const msg = body.message?.slice(0, 80) ?? "?";
    const data = body.data ? JSON.stringify(body.data).slice(0, 240) : "{}";
    this.logger.log(`dbg-rt ${hid} ${msg} ${data}`);
    return { ok: true as const };
  }
}
