import type { PublicRoom } from "@friends/types";

/** Local `?preview=lobby|round` only — never used in the Discord iframe. */
export const previewRoom: PublicRoom = {
  id: "preview",
  status: "lobby",
  category: null,
  hostUserId: "you",
  sessionKey: "preview-session",
  sessionRoundCount: 0,
  players: [
    { userId: "you", displayName: "Alex", avatarUrl: null, score: 0, intent: "continue", hasVoted: false },
    { userId: "p2", displayName: "Sam", avatarUrl: null, score: 0, intent: "none", hasVoted: false },
    { userId: "p3", displayName: "Jordan", avatarUrl: null, score: 0, intent: "continue", hasVoted: false },
  ],
  round: null,
};

export const previewRound: PublicRoom = {
  ...previewRoom,
  status: "playing",
  category: null,
  sessionRoundCount: 0,
  players: [
    { userId: "you", displayName: "Alex", avatarUrl: null, score: 0, intent: "none", hasVoted: true },
    { userId: "p2", displayName: "Sam", avatarUrl: null, score: 0, intent: "none", hasVoted: false },
    { userId: "p3", displayName: "Jordan", avatarUrl: null, score: 0, intent: "none", hasVoted: false },
  ],
  round: {
    id: "r1",
    index: 0,
    status: "voting",
    voteCount: 1,
    prompt: {
      id: "q1",
      kind: "most_likely",
      category: null,
      body: "Who is most likely to start a group chat at 2am?",
      optionA: null,
      optionB: null,
    },
  },
};

/** Post-vote consensus for local `?preview=reveal` (tallies stay sealed). */
export const previewReveal: PublicRoom = {
  ...previewRound,
  sessionRoundCount: 8,
  round: {
    id: "r1",
    index: 7,
    status: "reveal",
    voteCount: 3,
    prompt: {
      id: "q1",
      kind: "most_likely",
      category: null,
      body: "Who is most likely to start a group chat at 2am?",
      optionA: null,
      optionB: null,
    },
  },
  players: [
    { userId: "you", displayName: "Alex", avatarUrl: null, score: 0, intent: "none", hasVoted: false },
    { userId: "p2", displayName: "Sam", avatarUrl: null, score: 0, intent: "continue", hasVoted: false },
    { userId: "p3", displayName: "Jordan", avatarUrl: null, score: 0, intent: "wrap_up", hasVoted: false },
  ],
};

/** End-of-session scoreboard for local `?preview=finished`. */
export const previewFinished: PublicRoom = {
  ...previewReveal,
  status: "finished",
  sessionRoundCount: 8,
  players: [
    { userId: "you", displayName: "Alex", avatarUrl: null, score: 3, intent: "none", hasVoted: false },
    { userId: "p2", displayName: "Sam", avatarUrl: null, score: 7, intent: "none", hasVoted: false },
    { userId: "p3", displayName: "Jordan", avatarUrl: null, score: 4, intent: "none", hasVoted: false },
  ],
};
