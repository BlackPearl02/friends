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
