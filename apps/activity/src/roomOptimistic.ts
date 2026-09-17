import type { PublicPrompt, PublicRoom, RoomIntent } from "@friends/types";
import { REVEAL_HOLD_MS } from "./revealHold";

/** Optimistic local patch: caller's intent only (predict positive). */
export function applyLocalIntent(
  room: PublicRoom,
  userId: string,
  intent: RoomIntent,
): PublicRoom {
  return {
    ...room,
    players: room.players.map((p) => (p.userId === userId ? { ...p, intent } : p)),
  };
}

/**
 * Optimistic local patch after casting a vote.
 * Does not invent reveal — only marks the caller as voted.
 */
export function applyLocalVote(room: PublicRoom, userId: string): PublicRoom {
  const me = room.players.find((p) => p.userId === userId);
  if (!me || me.hasVoted || !room.round || room.round.status !== "voting") {
    return room;
  }
  return {
    ...room,
    players: room.players.map((p) =>
      p.userId === userId ? { ...p, hasVoted: true } : p,
    ),
    round: {
      ...room.round,
      voteCount: room.round.voteCount + 1,
    },
  };
}

/**
 * Apply a peer's public vote flag from Realtime (no targets).
 * Used so badges update before the next GET /rooms/current returns.
 */
export function applyPeerVote(
  room: PublicRoom,
  voterId: string,
  voteCount?: number,
): PublicRoom {
  if (!room.round || room.round.status !== "voting") return room;
  const peer = room.players.find((p) => p.userId === voterId);
  if (!peer) return room;

  const players = peer.hasVoted
    ? room.players
    : room.players.map((p) => (p.userId === voterId ? { ...p, hasVoted: true } : p));
  const nextCount = Math.max(
    room.round.voteCount,
    voteCount ?? (peer.hasVoted ? room.round.voteCount : room.round.voteCount + 1),
  );

  if (peer.hasVoted && nextCount === room.round.voteCount) return room;

  return {
    ...room,
    players,
    round: {
      ...room.round,
      voteCount: nextCount,
    },
  };
}

/** Apply a peer's lobby/reveal intent from Realtime. */
export function applyPeerIntent(
  room: PublicRoom,
  userId: string,
  intent: RoomIntent,
): PublicRoom {
  const peer = room.players.find((p) => p.userId === userId);
  if (!peer || peer.intent === intent) return room;
  return applyLocalIntent(room, userId, intent);
}

function earlierIso(a: string, b: string): string {
  const am = Date.parse(a);
  const bm = Date.parse(b);
  if (Number.isNaN(am)) return b;
  if (Number.isNaN(bm)) return a;
  return am <= bm ? a : b;
}

/**
 * Enter reveal hold from Realtime (no tallies yet — GET fills results).
 * Anchors both clients to the same absolute `revealedAt`.
 * If already revealing, keep the earlier `revealedAt` (simultaneous last votes).
 */
export function applyPeerReveal(
  room: PublicRoom,
  revealedAt: string,
  serverTime?: string,
): PublicRoom {
  if (!room.round || room.round.status === "done") return room;

  if (room.round.status === "reveal" && room.round.revealedAt) {
    const keepAt = earlierIso(room.round.revealedAt, revealedAt);
    const nextServer = serverTime ?? room.serverTime;
    if (keepAt === room.round.revealedAt && nextServer === room.serverTime) {
      return room;
    }
    return {
      ...room,
      serverTime: nextServer,
      round: {
        ...room.round,
        revealedAt: keepAt,
      },
    };
  }

  return {
    ...room,
    serverTime: serverTime ?? room.serverTime,
    players: room.players.map((p) => (p.hasVoted ? p : { ...p, hasVoted: true })),
    round: {
      ...room.round,
      status: "reveal",
      revealedAt,
    },
  };
}

/** True when every seated player has a vote flag (or voteCount covers the roster). */
export function allPlayersVoted(room: PublicRoom): boolean {
  if (!room.round || room.round.status !== "voting") return false;
  const n = room.players.length;
  if (n < 1) return false;
  if (room.players.every((p) => p.hasVoted)) return true;
  return room.round.voteCount >= n;
}

export type RevealHoldStart = {
  room: PublicRoom;
  revealedAt: string;
  serverTime: string;
  started: boolean;
};

/**
 * If the local roster shows a full vote, enter reveal hold immediately.
 * Caller should `publishRoomPatch({ kind: "reveal", ... })` when `started` is true.
 */
export function maybeStartRevealHold(
  room: PublicRoom,
  nowMs: number = Date.now(),
  holdMs: number = REVEAL_HOLD_MS,
): RevealHoldStart {
  if (!allPlayersVoted(room)) {
    return { room, revealedAt: "", serverTime: "", started: false };
  }
  const serverTime = new Date(nowMs).toISOString();
  const revealedAt = new Date(nowMs + holdMs).toISOString();
  const next = applyPeerReveal(room, revealedAt, serverTime);
  return {
    room: next,
    revealedAt,
    serverTime,
    started: next !== room || next.round?.status === "reveal",
  };
}

/**
 * Apply a vote patch then optionally start reveal hold.
 * Returns whether a new reveal hold should be fanout-published.
 */
export function applyVoteAndMaybeReveal(
  room: PublicRoom,
  voterId: string,
  voteCount: number | undefined,
  local: boolean,
  nowMs: number = Date.now(),
): { room: PublicRoom; publishReveal: RevealHoldStart | null } {
  const voted = local ? applyLocalVote(room, voterId) : applyPeerVote(room, voterId, voteCount);
  const hold = maybeStartRevealHold(voted, nowMs);
  if (!hold.started) {
    return { room: voted, publishReveal: null };
  }
  return { room: hold.room, publishReveal: hold };
}

/** How many players still have no reveal/lobby intent. */
export function playersWaitingOnIntent(room: PublicRoom): number {
  return room.players.filter((p) => p.intent === "none").length;
}

/**
 * True when the roster shows unanimous Ready in lobby — Nest still owes beginRound.
 * Used to burst-poll until `status === "playing"`.
 */
export function awaitingLobbyStart(room: PublicRoom): boolean {
  if (room.status !== "lobby" || room.players.length < 2) return false;
  return room.players.every((p) => p.intent === "continue");
}

/**
 * Apply Nest's public round-start fanout so peers see the prompt without waiting on GET.
 */
export function applyPeerRoundStart(
  room: PublicRoom,
  patch: {
    roundId: string;
    roundIndex: number;
    prompt: PublicPrompt;
    serverTime?: string;
  },
): PublicRoom {
  if (room.round?.id === patch.roundId) {
    return room;
  }
  return {
    ...room,
    status: "playing",
    serverTime: patch.serverTime ?? room.serverTime,
    players: room.players.map((p) => ({
      ...p,
      intent: "none",
      hasVoted: false,
    })),
    round: {
      id: patch.roundId,
      index: patch.roundIndex,
      status: "voting",
      revealedAt: null,
      voteCount: 0,
      prompt: patch.prompt,
    },
  };
}
