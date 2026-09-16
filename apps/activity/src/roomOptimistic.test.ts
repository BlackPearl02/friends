import { describe, expect, it } from "vitest";
import type { PublicRoom } from "@friends/types";
import { applyLocalIntent, applyLocalVote, playersWaitingOnIntent } from "./roomOptimistic";

function baseRoom(overrides: Partial<PublicRoom> = {}): PublicRoom {
  return {
    id: "room-1",
    status: "playing",
    category: null,
    hostUserId: "a",
    sessionKey: "sess",
    sessionRoundCount: 1,
    serverTime: "2026-09-16T18:00:00.000Z",
    players: [
      {
        userId: "a",
        displayName: "A",
        avatarUrl: null,
        score: 0,
        intent: "none",
        hasVoted: false,
      },
      {
        userId: "b",
        displayName: "B",
        avatarUrl: null,
        score: 0,
        intent: "none",
        hasVoted: false,
      },
    ],
    round: {
      id: "r1",
      index: 0,
      status: "voting",
      revealedAt: null,
      prompt: {
        id: "p1",
        kind: "most_likely",
        category: null,
        body: "Who?",
        optionA: null,
        optionB: null,
      },
      voteCount: 0,
    },
    ...overrides,
  };
}

describe("applyLocalIntent", () => {
  it("updates only the caller's intent", () => {
    const next = applyLocalIntent(baseRoom(), "a", "continue");
    expect(next.players.find((p) => p.userId === "a")?.intent).toBe("continue");
    expect(next.players.find((p) => p.userId === "b")?.intent).toBe("none");
  });
});

describe("applyLocalVote", () => {
  it("marks the caller as voted and bumps voteCount once", () => {
    const next = applyLocalVote(baseRoom(), "a");
    expect(next.players.find((p) => p.userId === "a")?.hasVoted).toBe(true);
    expect(next.players.find((p) => p.userId === "b")?.hasVoted).toBe(false);
    expect(next.round?.voteCount).toBe(1);
  });

  it("is a no-op when the caller already voted", () => {
    const room = baseRoom({
      players: [
        {
          userId: "a",
          displayName: "A",
          avatarUrl: null,
          score: 0,
          intent: "none",
          hasVoted: true,
        },
        {
          userId: "b",
          displayName: "B",
          avatarUrl: null,
          score: 0,
          intent: "none",
          hasVoted: false,
        },
      ],
      round: {
        id: "r1",
        index: 0,
        status: "voting",
        revealedAt: null,
        prompt: {
          id: "p1",
          kind: "most_likely",
          category: null,
          body: "Who?",
          optionA: null,
          optionB: null,
        },
        voteCount: 1,
      },
    });
    expect(applyLocalVote(room, "a")).toBe(room);
  });
});

describe("playersWaitingOnIntent", () => {
  it("counts players still on none", () => {
    const room = applyLocalIntent(baseRoom(), "a", "continue");
    expect(playersWaitingOnIntent(room)).toBe(1);
  });
});
