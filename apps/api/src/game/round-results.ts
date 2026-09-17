/** Aggregate vote targets for a most_likely (or choice-keyed) round. */
export function tallyVotes(
  votes: Array<{
    voterId: string;
    targetUserId?: string | null;
    choice?: string | null;
  }>,
): Record<string, number> {
  return votes.reduce<Record<string, number>>((acc, v) => {
    const key = v.targetUserId ?? v.choice ?? v.voterId;
    if (!key) return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

/** Keys that share the highest tally (empty when nobody was voted for). */
export function topTallyKeys(tallies: Record<string, number>): { keys: string[]; max: number } {
  const entries = Object.entries(tallies);
  if (entries.length === 0) return { keys: [], max: 0 };
  const max = Math.max(...entries.map(([, n]) => n));
  return {
    keys: entries
      .filter(([, n]) => n === max)
      .map(([key]) => key)
      .sort((a, b) => a.localeCompare(b)),
    max,
  };
}

export function isRoundTie(tallies: Record<string, number>): boolean {
  return topTallyKeys(tallies).keys.length > 1;
}
