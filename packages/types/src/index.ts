export const API_PATHS = {
  activityExchange: "/discord/activity/exchange",
  roomJoin: "/game/rooms/join",
  roomGet: "/game/rooms/current",
  roomStart: "/game/rooms/start",
  roundVote: "/game/rounds/vote",
  roundReveal: "/game/rounds/reveal",
} as const;

export type PromptKind = "most_likely" | "this_or_that" | "truth" | "challenge";
export type PromptCategory = "party" | "family" | "colleagues" | "spicy";
export type RoomStatus = "lobby" | "playing" | "finished";
export type RoundStatus = "voting" | "reveal" | "done";
export type VoteChoice = "a" | "b" | "complete" | "skip";

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
  isHost: boolean;
};

export type PublicPrompt = {
  id: string;
  kind: PromptKind;
  category: PromptCategory;
  body: string;
  optionA: string | null;
  optionB: string | null;
};

export type PublicRound = {
  id: string;
  index: number;
  status: RoundStatus;
  prompt: PublicPrompt;
  results?: {
    tallies: Record<string, number>;
    answers?: Array<{ userId: string; text: string }>;
  };
};

export type PublicRoom = {
  id: string;
  status: RoomStatus;
  category: PromptCategory | null;
  hostUserId: string;
  players: PublicPlayer[];
  round: PublicRound | null;
};

export type RoomStartRequest = {
  category: PromptCategory;
  locale?: "en" | "pl";
};

export type RoundVoteRequest = {
  roundId: string;
  targetUserId?: string;
  choice?: VoteChoice;
  text?: string;
};
