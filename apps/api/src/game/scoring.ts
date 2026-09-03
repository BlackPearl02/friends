import type { PromptKind } from "@friends/types";

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
