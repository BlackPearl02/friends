/**
 * Keep in sync with `@friends/types` `roomRealtimeTopic` / `ROOM_REALTIME_EVENT`
 * (Nest CJS cannot value-import that ESM package).
 */
export const ROOM_REALTIME_EVENT = "room_changed" as const;

export function roomRealtimeTopic(discordInstanceId: string): string {
  return `room:${discordInstanceId}`;
}
