import type { PublicRoom, RoomIntent } from "@friends/types";

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

/** How many players still have no reveal/lobby intent. */
export function playersWaitingOnIntent(room: PublicRoom): number {
  return room.players.filter((p) => p.intent === "none").length;
}
