import { describe, expect, it } from "vitest";
import type { PublicRoom } from "@friends/types";
import { mergePublicRoom, shouldApplyPollResult } from "./roomApply";

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

describe("shouldApplyPollResult", () => {
  it("applies only when generation matches and no mutation is in flight", () => {
    expect(shouldApplyPollResult(3, 3, 0)).toBe(true);
    expect(shouldApplyPollResult(2, 3, 0)).toBe(false);
    expect(shouldApplyPollResult(3, 3, 1)).toBe(false);
  });
});

describe("mergePublicRoom", () => {
  it("does not clear optimistic hasVoted from a stale poll", () => {
    const prev = baseRoom({
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
    const stale = baseRoom({
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
    });

    const merged = mergePublicRoom(prev, stale);
    expect(merged.players.find((p) => p.userId === "a")?.hasVoted).toBe(true);
    expect(merged.round?.voteCount).toBe(1);
  });

  it("keeps reveal when a stale poll still says voting", () => {
    const prev = baseRoom({
      round: {
        id: "r1",
        index: 0,
        status: "reveal",
        revealedAt: "2026-09-16T18:00:00.600Z",
        prompt: {
          id: "p1",
          kind: "most_likely",
          category: null,
          body: "Who?",
          optionA: null,
          optionB: null,
        },
        voteCount: 2,
        results: { tallies: { a: 1, b: 1 } },
      },
    });
    const stale = baseRoom();
    expect(mergePublicRoom(prev, stale)).toBe(prev);
  });

  it("keeps playing when a stale mutation response is still lobby", () => {
    const prev = baseRoom({ status: "playing" });
    const stale = baseRoom({ status: "lobby", round: null });
    expect(mergePublicRoom(prev, stale)).toBe(prev);
  });

  it("keeps lobby Ready when a stale poll still says none", () => {
    const prev = baseRoom({
      status: "lobby",
      round: null,
      players: [
        {
          userId: "a",
          displayName: "A",
          avatarUrl: null,
          score: 0,
          intent: "continue",
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
    });
    const stale = baseRoom({
      status: "lobby",
      round: null,
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
    });
    const merged = mergePublicRoom(prev, stale);
    expect(merged.players.find((p) => p.userId === "a")?.intent).toBe("continue");
    expect(merged.players.find((p) => p.userId === "b")?.intent).toBe("none");
  });

  it("accepts lobby → playing so beginRound cleared intents win", () => {
    const prev = baseRoom({
      status: "lobby",
      round: null,
      players: [
        {
          userId: "a",
          displayName: "A",
          avatarUrl: null,
          score: 0,
          intent: "continue",
          hasVoted: false,
        },
        {
          userId: "b",
          displayName: "B",
          avatarUrl: null,
          score: 0,
          intent: "continue",
          hasVoted: false,
        },
      ],
    });
    const next = baseRoom({
      status: "playing",
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
    });
    const merged = mergePublicRoom(prev, next);
    expect(merged.status).toBe("playing");
    expect(merged.round?.id).toBe("r1");
    expect(merged.players.every((p) => p.intent === "none")).toBe(true);
  });

  it("keeps reveal continue when a stale poll still says none", () => {
    const prev = baseRoom({
      players: [
        {
          userId: "a",
          displayName: "A",
          avatarUrl: null,
          score: 0,
          intent: "continue",
          hasVoted: true,
        },
        {
          userId: "b",
          displayName: "B",
          avatarUrl: null,
          score: 0,
          intent: "none",
          hasVoted: true,
        },
      ],
      round: {
        id: "r1",
        index: 0,
        status: "reveal",
        revealedAt: "2026-09-16T18:00:00.600Z",
        prompt: {
          id: "p1",
          kind: "most_likely",
          category: null,
          body: "Who?",
          optionA: null,
          optionB: null,
        },
        voteCount: 2,
        results: { tallies: { a: 1, b: 1 } },
      },
    });
    const stale = baseRoom({
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
          hasVoted: true,
        },
      ],
      round: {
        id: "r1",
        index: 0,
        status: "reveal",
        revealedAt: "2026-09-16T18:00:00.600Z",
        prompt: {
          id: "p1",
          kind: "most_likely",
          category: null,
          body: "Who?",
          optionA: null,
          optionB: null,
        },
        voteCount: 2,
        results: { tallies: { a: 1, b: 1 } },
      },
    });
    const merged = mergePublicRoom(prev, stale);
    expect(merged.players.find((p) => p.userId === "a")?.intent).toBe("continue");
  });

  it("upgrades reveal tallies without extending revealedAt", () => {
    const prev = baseRoom({
      round: {
        id: "r1",
        index: 0,
        status: "reveal",
        revealedAt: "2026-09-16T18:00:00.600Z",
        prompt: {
          id: "p1",
          kind: "most_likely",
          category: null,
          body: "Who?",
          optionA: null,
          optionB: null,
        },
        voteCount: 2,
      },
    });
    const next = baseRoom({
      round: {
        id: "r1",
        index: 0,
        status: "reveal",
        revealedAt: "2026-09-16T18:00:01.200Z",
        prompt: {
          id: "p1",
          kind: "most_likely",
          category: null,
          body: "Who?",
          optionA: null,
          optionB: null,
        },
        voteCount: 2,
        results: { tallies: { a: 1, b: 1 } },
      },
    });
    const merged = mergePublicRoom(prev, next);
    expect(merged.round?.revealedAt).toBe("2026-09-16T18:00:00.600Z");
    expect(merged.round?.results?.tallies).toEqual({ a: 1, b: 1 });
  });

  it("keeps a newer round when a stale poll returns an older index", () => {
    const prev = baseRoom({
      round: {
        id: "r2",
        index: 1,
        status: "voting",
        revealedAt: null,
        prompt: {
          id: "p2",
          kind: "most_likely",
          category: null,
          body: "Next?",
          optionA: null,
          optionB: null,
        },
        voteCount: 0,
      },
    });
    const stale = baseRoom({
      round: {
        id: "r1",
        index: 0,
        status: "reveal",
        revealedAt: "2026-09-16T18:00:00.600Z",
        prompt: {
          id: "p1",
          kind: "most_likely",
          category: null,
          body: "Who?",
          optionA: null,
          optionB: null,
        },
        voteCount: 2,
        results: { tallies: { a: 1, b: 1 } },
      },
    });
    expect(mergePublicRoom(prev, stale)).toBe(prev);
  });

  it("keeps lobby when a stale poll returns finished after replay", () => {
    const prev = baseRoom({
      status: "lobby",
      sessionKey: "sess-2",
      round: null,
    });
    const stale = baseRoom({
      status: "finished",
      sessionKey: "sess-1",
      round: null,
    });
    expect(mergePublicRoom(prev, stale)).toBe(prev);
  });

  it("does not sticky-intent while voting", () => {
    const prev = baseRoom({
      players: [
        {
          userId: "a",
          displayName: "A",
          avatarUrl: null,
          score: 0,
          intent: "continue",
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
    });
    const next = baseRoom({
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
    });
    const merged = mergePublicRoom(prev, next);
    expect(merged.players.find((p) => p.userId === "a")?.intent).toBe("none");
  });

  it("accepts a fresher peer voteCount", () => {
    const prev = baseRoom({
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
    const next = baseRoom({
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
          hasVoted: true,
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
        voteCount: 2,
      },
    });
    const merged = mergePublicRoom(prev, next);
    expect(merged.round?.voteCount).toBe(2);
    expect(merged.players.every((p) => p.hasVoted)).toBe(true);
  });
});
