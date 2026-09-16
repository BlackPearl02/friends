import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ROOM_REALTIME_EVENT,
  roomRealtimeTopic,
  type RoomRealtimePayload,
} from "./room-realtime.constants";

/**
 * Best-effort Supabase Realtime Broadcast after room mutations.
 * No-ops when SUPABASE_URL / key are unset (local Docker without Realtime).
 */
@Injectable()
export class RoomRealtimeService {
  private readonly logger = new Logger(RoomRealtimeService.name);

  constructor(@Optional() private readonly config?: ConfigService) {}

  async notifyRoomChanged(
    discordInstanceId: string,
    patch: Omit<RoomRealtimePayload, "t"> = {},
  ): Promise<void> {
    const base = this.readConfig("SUPABASE_URL")?.replace(/\/+$/, "");
    const key =
      this.readConfig("SUPABASE_SERVICE_ROLE_KEY") ?? this.readConfig("SUPABASE_ANON_KEY");
    if (!base || !key || !discordInstanceId) return;

    const payload: RoomRealtimePayload = { t: 1, ...patch };

    try {
      const res = await fetch(`${base}/realtime/v1/api/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          messages: [
            {
              topic: roomRealtimeTopic(discordInstanceId),
              event: ROOM_REALTIME_EVENT,
              payload,
            },
          ],
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Realtime broadcast failed: HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown";
      this.logger.warn(`Realtime broadcast error: ${message}`);
    }
  }

  private readConfig(name: string): string | undefined {
    const fromConfig = this.config?.get<string>(name)?.trim();
    if (fromConfig) return fromConfig;
    const fromEnv = process.env[name]?.trim();
    return fromEnv || undefined;
  }
}
