/**
 * Keep in sync with `@friends/types` room realtime helpers
 * (Nest CJS cannot value-import that ESM package).
 */
export const ROOM_REALTIME_EVENT = "room_changed" as const;

export function roomRealtimeTopic(discordInstanceId: string): string {
  return `room:${discordInstanceId}`;
}

/** Mirrors `@friends/types` RoomRealtimePayload — safe public fields only. */
export type RoomRealtimePayload = {
  t: 1;
  kind?: "vote" | "intent" | "roster";
  votedUserId?: string;
  voteCount?: number;
  intentUserId?: string;
  intent?: "none" | "continue" | "wrap_up" | "revote";
};
