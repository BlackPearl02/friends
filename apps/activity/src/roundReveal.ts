/** Highest-tally keys from a reveal payload (empty if no votes landed). */
export function leadersFromTallies(tallies: Record<string, number>): {
  userIds: string[];
  votes: number;
} {
  const entries = Object.entries(tallies);
  if (entries.length === 0) return { userIds: [], votes: 0 };
  const votes = Math.max(...entries.map(([, n]) => n));
  return {
    userIds: entries.filter(([, n]) => n === votes).map(([id]) => id),
    votes,
  };
}

export function isRevealTie(tallies: Record<string, number> | undefined): boolean {
  if (!tallies) return false;
  return leadersFromTallies(tallies).userIds.length > 1;
}

/**
 * Remaining ms until clients should show tallies, using server clocks from the DTO.
 * Callers schedule a timeout for this duration so every Activity flips together.
 */
export function msUntilReveal(
  revealedAt: string | null | undefined,
  serverTime: string | null | undefined,
): number {
  if (!revealedAt || !serverTime) return 0;
  const revealMs = Date.parse(revealedAt);
  const serverMs = Date.parse(serverTime);
  if (Number.isNaN(revealMs) || Number.isNaN(serverMs)) return 0;
  return Math.max(0, revealMs - serverMs);
}

/** True when round is past voting and the reveal hold has elapsed. */
export function shouldShowReveal(
  round: { status: string; revealedAt?: string | null } | null | undefined,
  serverTime: string | null | undefined,
): boolean {
  if (!round || round.status === "voting") return false;
  return msUntilReveal(round.revealedAt, serverTime) === 0;
}

