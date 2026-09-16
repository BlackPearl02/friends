/**
 * Keep in sync with `@friends/types` party helpers
 * (Nest CJS cannot value-import that ESM package).
 */
export function partyRoomPath(discordInstanceId: string): string {
  return `/parties/main/${encodeURIComponent(discordInstanceId)}`;
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
