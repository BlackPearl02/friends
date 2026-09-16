import type { PromptKind } from "@friends/types" with { "resolution-mode": "import" };

export function scoreDelta(kind: PromptKind, vote: { targetUserId?: string | null; choice?: string | null; text?: string | null }): { userId: string; delta: number } | null {
  if (kind === "most_likely" && vote.targetUserId) {
    return { userId: vote.targetUserId, delta: 1 };
  }
  if (kind === "truth" && vote.choice !== "skip" && (vote.text?.trim() ?? "").length > 0) {
    return null;
  }
  if (kind === "challenge" && vote.choice === "complete") {
    return null;
  }
  return null;
}

/** Truth/challenge points go to the voter; most_likely points go to the target. */
export function scoreForVoter(kind: PromptKind, vote: { choice?: string | null; text?: string | null }): number {
  if (kind === "truth" && vote.choice !== "skip" && (vote.text?.trim() ?? "").length > 0) return 1;
  if (kind === "challenge" && vote.choice === "complete") return 1;
  return 0;
}

type ScoreVote = {
  voterId: string;
  targetUserId?: string | null;
  choice?: string | null;
  text?: string | null;
};

/** Collapse per-vote score deltas into one increment per player (fewer DB updates). */
export function aggregateScoreIncrements(
  kind: PromptKind,
  votes: ScoreVote[],
): Map<string, number> {
  const deltas = new Map<string, number>();
  const add = (userId: string, delta: number) => {
    if (delta === 0) return;
    deltas.set(userId, (deltas.get(userId) ?? 0) + delta);
  };
  for (const vote of votes) {
    const target = scoreDelta(kind, vote);
    if (target) add(target.userId, target.delta);
    add(vote.voterId, scoreForVoter(kind, vote));
  }
  return deltas;
}
