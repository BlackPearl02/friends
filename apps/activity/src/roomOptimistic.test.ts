import { describe, expect, it } from "vitest";
import type { PublicRoom } from "@friends/types";
import {
  applyLocalIntent,
  applyLocalVote,
  applyPeerIntent,
  applyPeerReveal,
  applyPeerRoundStart,
  applyPeerVote,
  applyVoteAndMaybeReveal,
  awaitingLobbyStart,
  maybeStartRevealHold,
  playersWaitingOnIntent,
  roundFanoutFromRoom,
} from "./roomOptimistic";
import { REVEAL_HOLD_MS } from "./revealHold";

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

describe("applyPeerVote", () => {
  it("marks a peer as voted and prefers the server voteCount", () => {
    const next = applyPeerVote(baseRoom(), "b", 1);
    expect(next.players.find((p) => p.userId === "b")?.hasVoted).toBe(true);
    expect(next.players.find((p) => p.userId === "a")?.hasVoted).toBe(false);
    expect(next.round?.voteCount).toBe(1);
  });

  it("is a no-op for unknown peers or non-voting rounds", () => {
    const room = baseRoom();
    expect(applyPeerVote(room, "missing", 1)).toBe(room);
    const revealed = baseRoom({
      round: {
        id: "r1",
        index: 0,
        status: "reveal",
        revealedAt: "2026-09-16T18:00:01.000Z",
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
    expect(applyPeerVote(revealed, "b", 2)).toBe(revealed);
  });

  it("ignores votes for a different round id", () => {
    const room = baseRoom();
    expect(applyPeerVote(room, "b", 1, "other-round")).toBe(room);
  });
});

describe("applyPeerIntent", () => {
  it("updates only the named peer intent in lobby", () => {
    const lobby = baseRoom({ status: "lobby", round: null });
    const next = applyPeerIntent(lobby, "b", "wrap_up");
    expect(next.players.find((p) => p.userId === "b")?.intent).toBe("wrap_up");
    expect(next.players.find((p) => p.userId === "a")?.intent).toBe("none");
  });

  it("ignores intent patches while voting", () => {
    const room = baseRoom();
    expect(applyPeerIntent(room, "b", "continue")).toBe(room);
  });
});

describe("applyPeerReveal", () => {
  it("enters reveal hold and marks everyone voted", () => {
    const next = applyPeerReveal(
      baseRoom(),
      "2026-09-16T18:00:00.900Z",
      "2026-09-16T18:00:00.000Z",
    );
    expect(next.round?.status).toBe("reveal");
    expect(next.round?.revealedAt).toBe("2026-09-16T18:00:00.900Z");
    expect(next.serverTime).toBe("2026-09-16T18:00:00.000Z");
    expect(next.players.every((p) => p.hasVoted)).toBe(true);
  });

  it("keeps the earlier revealedAt when already revealing", () => {
    const first = applyPeerReveal(
      baseRoom(),
      "2026-09-16T18:00:00.900Z",
      "2026-09-16T18:00:00.000Z",
    );
    const second = applyPeerReveal(
      first,
      "2026-09-16T18:00:01.200Z",
      "2026-09-16T18:00:00.300Z",
    );
    expect(second.round?.revealedAt).toBe("2026-09-16T18:00:00.900Z");
    expect(second.serverTime).toBe("2026-09-16T18:00:00.300Z");
  });

  it("ignores reveal for a different round id", () => {
    const room = baseRoom();
    expect(
      applyPeerReveal(room, "2026-09-16T18:00:00.900Z", "2026-09-16T18:00:00.000Z", "other-round"),
    ).toBe(room);
  });
});

describe("maybeStartRevealHold", () => {
  it("starts reveal when every player has voted", () => {
    const room = applyLocalVote(applyLocalVote(baseRoom(), "a"), "b");
    const now = Date.parse("2026-09-16T18:00:00.000Z");
    const hold = maybeStartRevealHold(room, now);
    expect(hold.started).toBe(true);
    expect(hold.room.round?.status).toBe("reveal");
    expect(hold.revealedAt).toBe(new Date(now + REVEAL_HOLD_MS).toISOString());
    expect(hold.serverTime).toBe(new Date(now).toISOString());
  });

  it("leaves the room unchanged when only some players voted", () => {
    const room = applyLocalVote(baseRoom(), "a");
    const hold = maybeStartRevealHold(room, Date.parse("2026-09-16T18:00:00.000Z"));
    expect(hold.started).toBe(false);
    expect(hold.room).toBe(room);
    expect(hold.room.round?.status).toBe("voting");
  });
});

describe("applyVoteAndMaybeReveal", () => {
  it("publishes reveal only on the completing vote", () => {
    const first = applyVoteAndMaybeReveal(baseRoom(), "a", undefined, true);
    expect(first.publishReveal).toBeNull();
    expect(first.room.round?.status).toBe("voting");

    const second = applyVoteAndMaybeReveal(first.room, "b", undefined, false);
    expect(second.publishReveal).not.toBeNull();
    expect(second.room.round?.status).toBe("reveal");
  });
});

describe("playersWaitingOnIntent", () => {
  it("counts players still on none", () => {
    const room = applyLocalIntent(baseRoom(), "a", "continue");
    expect(playersWaitingOnIntent(room)).toBe(1);
  });
});

describe("awaitingLobbyStart", () => {
  it("is true only when lobby and everyone is continue", () => {
    const lobby = baseRoom({ status: "lobby", round: null });
    expect(awaitingLobbyStart(lobby)).toBe(false);
    const oneReady = applyLocalIntent(lobby, "a", "continue");
    expect(awaitingLobbyStart(oneReady)).toBe(false);
    const allReady = applyLocalIntent(oneReady, "b", "continue");
    expect(awaitingLobbyStart(allReady)).toBe(true);
  });
});

describe("applyPeerRoundStart", () => {
  it("enters playing with the public prompt and clears intents", () => {
    const lobby = applyLocalIntent(
      applyLocalIntent(baseRoom({ status: "lobby", round: null }), "a", "continue"),
      "b",
      "continue",
    );
    const next = applyPeerRoundStart(lobby, {
      roundId: "r2",
      roundIndex: 0,
      prompt: {
        id: "p2",
        kind: "most_likely",
        category: null,
        body: "Who starts?",
        optionA: null,
        optionB: null,
      },
      serverTime: "2026-09-16T18:01:00.000Z",
    });
    expect(next.status).toBe("playing");
    expect(next.round?.id).toBe("r2");
    expect(next.round?.status).toBe("voting");
    expect(next.round?.prompt.body).toBe("Who starts?");
    expect(next.players.every((p) => p.intent === "none" && !p.hasVoted)).toBe(true);
  });

  it("is a no-op when the round id is already applied", () => {
    const room = baseRoom();
    expect(
      applyPeerRoundStart(room, {
        roundId: "r1",
        roundIndex: 0,
        prompt: room.round!.prompt,
      }),
    ).toBe(room);
  });
});

describe("roundFanoutFromRoom", () => {
  it("returns round fields for a voting room", () => {
    const room = baseRoom();
    expect(roundFanoutFromRoom(room)).toEqual({
      roundId: "r1",
      roundIndex: 0,
      prompt: room.round!.prompt,
      serverTime: room.serverTime,
    });
  });

  it("returns null without a voting round", () => {
    expect(roundFanoutFromRoom(baseRoom({ status: "lobby", round: null }))).toBeNull();
    const revealing = applyPeerReveal(
      baseRoom(),
      "2026-09-16T18:00:00.900Z",
      "2026-09-16T18:00:00.000Z",
    );
    expect(roundFanoutFromRoom(revealing)).toBeNull();
  });
});
