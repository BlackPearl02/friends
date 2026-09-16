export const API_PATHS = {
  activityExchange: "/discord/activity/exchange",
  roomJoin: "/game/rooms/join",
  roomGet: "/game/rooms/current",
  roomLeave: "/game/rooms/leave",
  roomIntent: "/game/rooms/intent",
  roomReplay: "/game/rooms/replay",
  roundVote: "/game/rounds/vote",
} as const;

/**
 * Supabase Realtime Broadcast topic for a Discord Activity instance.
 * Safe public patches may be included; clients still refetch PublicRoom via JWT.
 */
export function roomRealtimeTopic(discordInstanceId: string): string {
  return `room:${discordInstanceId}`;
}

/** Broadcast event name — never carries vote targets or tallies. */
export const ROOM_REALTIME_EVENT = "room_changed" as const;

/** Nest ConflictException body when join is refused mid-session. */
export const ROOM_IN_PROGRESS_CODE = "ROOM_IN_PROGRESS" as const;

export type PromptKind = "most_likely" | "this_or_that" | "truth" | "challenge";
/** Legacy pack labels — unused in MVP start/selection. */
export type PromptCategory = "party" | "family" | "colleagues" | "spicy";
export type RoomStatus = "lobby" | "playing" | "finished";
export type RoundStatus = "voting" | "reveal" | "done";
export type VoteChoice = "a" | "b" | "complete" | "skip";
export type RoomIntent = "none" | "continue" | "wrap_up" | "revote";

/**
 * Optional public patch on the wake-up event (no targets / tallies).
 * Peers apply this immediately so UI does not wait on a slow GET.
 */
export type RoomRealtimePayload = {
  t: 1;
  kind?: "vote" | "intent" | "roster";
  votedUserId?: string;
  voteCount?: number;
  intentUserId?: string;
  intent?: RoomIntent;
};

export type ActivityExchangeRequest = {
  code: string;
};

export type ActivityExchangeResponse = {
  accessToken: string;
  discordAccessToken: string;
  user: { id: string; displayName: string; avatarUrl: string | null };
};

export type RoomJoinRequest = {
  instanceId: string;
  channelId?: string | null;
  guildId?: string | null;
};

export type PublicPlayer = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  intent: RoomIntent;
  /** True during voting when this player has cast a vote (no target leaked). */
  hasVoted: boolean;
};

export type PublicPrompt = {
  id: string;
  kind: PromptKind;
  category: PromptCategory | null;
  body: string;
  optionA: string | null;
  optionB: string | null;
};

export type PublicRound = {
  id: string;
  index: number;
  status: RoundStatus;
  prompt: PublicPrompt;
  /** Votes cast so far — safe during voting (no targets). */
  voteCount: number;
  /**
   * Wall-clock (ISO) when clients should show tallies after status becomes reveal.
   * Null while voting / before reveal is scheduled.
   */
  revealedAt: string | null;
  results?: {
    tallies: Record<string, number>;
    answers?: Array<{ userId: string; text: string }>;
  };
};

export type PublicRoom = {
  id: string;
  status: RoomStatus;
  category: PromptCategory | null;
  /** @deprecated Technical first-joiner id — no privileges. Kept for DB compatibility. */
  hostUserId: string;
  sessionKey: string;
  /** Revealed rounds in the current session (0-based next index ≈ this value). */
  sessionRoundCount: number;
  /** Server clock (ISO) at DTO build — pair with round.revealedAt for sync hold. */
  serverTime: string;
  players: PublicPlayer[];
  round: PublicRound | null;
};

export type RoomIntentRequest = {
  intent: RoomIntent;
};

export type RoundVoteRequest = {
  roundId: string;
  targetUserId?: string;
  choice?: VoteChoice;
  text?: string;
};
