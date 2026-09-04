export const API_PATHS = {
  activityExchange: "/discord/activity/exchange",
  roomJoin: "/game/rooms/join",
  roomGet: "/game/rooms/current",
  roomIntent: "/game/rooms/intent",
  roomReplay: "/game/rooms/replay",
  roundVote: "/game/rounds/vote",
} as const;

export type PromptKind = "most_likely" | "this_or_that" | "truth" | "challenge";
/** Legacy pack labels — unused in MVP start/selection. */
export type PromptCategory = "party" | "family" | "colleagues" | "spicy";
export type RoomStatus = "lobby" | "playing" | "finished";
export type RoundStatus = "voting" | "reveal" | "done";
export type VoteChoice = "a" | "b" | "complete" | "skip";
export type RoomIntent = "none" | "continue" | "wrap_up";

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
