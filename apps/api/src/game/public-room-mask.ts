/**
 * Mid-session, clients must not see running scores or per-round tallies —
 * the finale scoreboard is the only public ranking.
 */
export function clientVisibleScore(roomStatus: string, score: number): number {
  return roomStatus === "finished" ? score : 0;
}

/** Per-round tallies stay server-side until (if ever) we choose to expose them. */
export function clientVisibleRoundResults(): boolean {
  return false;
}
