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

/** How many players still have no reveal/lobby intent. */
export function playersWaitingOnIntent(room: PublicRoom): number {
  return room.players.filter((p) => p.intent === "none").length;
}
