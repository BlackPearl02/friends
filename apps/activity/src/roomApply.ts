import type { PublicPlayer, PublicRoom, RoundStatus } from "@friends/types";

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
 * Keep optimistic Ready / continue / wrap badges when a stale GET still says none.
 * Does not invent intents the other way (none → continue only comes from server/fanout).
 */
export function mergeStickyPlayerIntents(
  prevPlayers: PublicPlayer[],
  nextPlayers: PublicPlayer[],
): PublicPlayer[] {
  return nextPlayers.map((p) => {
    const prevP = prevPlayers.find((x) => x.userId === p.userId);
    if (!prevP) return p;
    if (p.intent === "none" && prevP.intent !== "none") {
      return { ...p, intent: prevP.intent };
    }
    return p;
  });
}

/**
 * Merge a polled/mutation room onto previous local state without regressing UX.
 * Same round while voting: never drop hasVoted or lower voteCount.
 * Never degrade reveal/done back to voting for the same round id.
 * Never drop an in-progress round for a stale lobby snapshot.
 * Never clear fanout Ready/continue badges on a stale lobby/reveal poll.
 */
export function mergePublicRoom(prev: PublicRoom, next: PublicRoom): PublicRoom {
  // Stale lobby must not undo an already-started round (slow intent HTTP).
  if (prev.status === "playing" && prev.round && next.status === "lobby") {
    return prev;
  }

  // Lobby → lobby: sticky intents so peer Ready fanout survives a slow Nest GET.
  // Lobby → playing (next.round set): take next so beginRound clearing intents wins.
  if (!prev.round && !next.round) {
    if (prev.status === "lobby" && next.status === "lobby") {
      return {
        ...next,
        players: mergeStickyPlayerIntents(prev.players, next.players),
      };
    }
    return next;
  }
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
    const players = mergeStickyPlayerIntents(prev.players, next.players).map((p) => ({
      ...p,
      hasVoted: p.hasVoted || prevVoted.has(p.userId),
    }));
    return {
      ...next,
      players,
      round: {
        ...next.round,
        voteCount,
      },
    };
  }

  // Same reveal/done: prefer server tallies/scores but keep an earlier hold anchor.
  if (
    prev.round.status === "reveal" &&
    next.round.status === "reveal" &&
    prev.round.revealedAt &&
    next.round.revealedAt
  ) {
    const prevMs = Date.parse(prev.round.revealedAt);
    const nextMs = Date.parse(next.round.revealedAt);
    const revealedAt =
      !Number.isNaN(prevMs) && !Number.isNaN(nextMs) && prevMs < nextMs
        ? prev.round.revealedAt
        : next.round.revealedAt;
    return {
      ...next,
      players: mergeStickyPlayerIntents(prev.players, next.players),
      round: {
        ...next.round,
        revealedAt,
        results: next.round.results ?? prev.round.results,
      },
    };
  }

  return {
    ...next,
    players: mergeStickyPlayerIntents(prev.players, next.players),
  };
}
