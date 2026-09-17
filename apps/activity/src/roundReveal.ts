/** Highest-tally keys from a reveal payload (empty if no votes landed). */
export function leadersFromTallies(tallies: Record<string, number>): {
  userIds: string[];
  votes: number;
} {
  const entries = Object.entries(tallies);
  if (entries.length === 0) return { userIds: [], votes: 0 };
  const votes = Math.max(...entries.map(([, n]) => n));
  // Stable order — Object key insertion follows vote-row order and can flip between polls.
  return {
    userIds: entries
      .filter(([, n]) => n === votes)
      .map(([id]) => id)
      .sort((a, b) => a.localeCompare(b)),
    votes,
  };
}

export function isRevealTie(tallies: Record<string, number> | undefined): boolean {
  if (!tallies) return false;
  return leadersFromTallies(tallies).userIds.length > 1;
}

/**
 * Remaining ms until clients should show tallies, anchored to absolute `revealedAt`.
 * Wall clock only — stale `serverTime` snapshots must not undo elapsed time for late peers.
 * `nowMs` is injectable for tests. `serverTime` kept for call-site compatibility.
 */
export function msUntilReveal(
  revealedAt: string | null | undefined,
  _serverTime?: string | null,
  nowMs: number = Date.now(),
): number {
  if (!revealedAt) return 0;
  const revealMs = Date.parse(revealedAt);
  if (Number.isNaN(revealMs)) return 0;
  return Math.max(0, revealMs - nowMs);
}

/** True when round is past voting and the reveal hold has elapsed. */
export function shouldShowReveal(
  round: { status: string; revealedAt?: string | null } | null | undefined,
  serverTime: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!round || round.status === "voting") return false;
  return msUntilReveal(round.revealedAt, serverTime, nowMs) === 0;
}
