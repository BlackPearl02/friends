import type { PublicRoom, RoundStatus } from "@friends/types";

const STATUS_RANK: Record<RoundStatus, number> = {
  voting: 0,
  reveal: 1,
  done: 2,
};

/**
 * Whether a poll response should replace local room state.
 * Bump syncGeneration when a mutation starts so in-flight polls are ignored.
 */
export function shouldApplyPollResult(
  startedGeneration: number,
  currentGeneration: number,
  mutationsInFlight: number,
): boolean {
  return startedGeneration === currentGeneration && mutationsInFlight === 0;
}

/**
 * Merge a polled room onto previous local state without regressing vote UX.
 * Same round while voting: never drop hasVoted or lower voteCount.
 * Never degrade reveal/done back to voting for the same round id.
 */
export function mergePublicRoom(prev: PublicRoom, next: PublicRoom): PublicRoom {
  if (!prev.round || !next.round) return next;
  if (prev.round.id !== next.round.id) return next;

  if (STATUS_RANK[prev.round.status] > STATUS_RANK[next.round.status]) {
    return prev;
  }

  if (prev.round.status === "voting" && next.round.status === "voting") {
    const voteCount = Math.max(prev.round.voteCount, next.round.voteCount);
    const prevVoted = new Set(
      prev.players.filter((p) => p.hasVoted).map((p) => p.userId),
    );
    return {
      ...next,
      players: next.players.map((p) => ({
        ...p,
        hasVoted: p.hasVoted || prevVoted.has(p.userId),
      })),
      round: {
        ...next.round,
        voteCount,
      },
    };
  }

  return next;
}
