/**
 * Mid-session, clients must not see running scores —
 * the finale scoreboard is the only public ranking.
 * Per-round tallies are visible only after votes lock (reveal / done).
 */
export function clientVisibleScore(roomStatus: string, score: number): number {
  return roomStatus === "finished" ? score : 0;
}

/** Tallies stay sealed while voting; exposed once the round is revealed. */
export function clientVisibleRoundResults(roundStatus: string | null | undefined): boolean {
  return roundStatus === "reveal" || roundStatus === "done";
}
