import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { partyRoomPath, type RoomRealtimePayload } from "./room-party.constants";

/**
 * Best-effort PartyKit HTTP notify after room mutations.
 * No-ops when PARTYKIT_HOST / PARTY_SERVER_SECRET are unset.
 */
@Injectable()
export class RoomPartyService {
  private readonly logger = new Logger(RoomPartyService.name);

  constructor(@Optional() private readonly config?: ConfigService) {}

  async notifyRoomChanged(
    discordInstanceId: string,
    patch: Omit<RoomRealtimePayload, "t"> = {},
  ): Promise<void> {
    const host = this.readConfig("PARTYKIT_HOST")?.replace(/\/+$/, "");
    const secret = this.readConfig("PARTY_SERVER_SECRET");
    if (!host || !secret || !discordInstanceId) return;

    const base = /^https?:\/\//i.test(host) ? host : `https://${host}`;
    const payload: RoomRealtimePayload = { t: 1, ...patch };

    try {
      const res = await fetch(`${base}${partyRoomPath(discordInstanceId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        this.logger.warn(
          `PartyKit notify failed: HTTP ${res.status}${detail ? ` ${detail.slice(0, 120)}` : ""}`,
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown";
      this.logger.warn(`PartyKit notify error: ${message}`);
    }
  }

  private readConfig(name: string): string | undefined {
    const fromConfig = this.config?.get<string>(name)?.trim();
    if (fromConfig) return fromConfig;
    const fromEnv = process.env[name]?.trim();
    return fromEnv || undefined;
  }
}
