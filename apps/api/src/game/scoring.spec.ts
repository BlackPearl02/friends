import { describe, expect, it } from "vitest";
import { aggregateScoreIncrements, scoreDelta, scoreForVoter } from "./scoring";

describe("scoreDelta", () => {
  it("awards the voted player on most_likely", () => {
    expect(scoreDelta("most_likely", { targetUserId: "u2" })).toEqual({
      userId: "u2",
      delta: 1,
    });
  });

  it("does not award this_or_that", () => {
    expect(scoreDelta("this_or_that", { choice: "a" })).toBeNull();
  });
});

describe("scoreForVoter", () => {
  it("awards a completed challenge to the voter", () => {
    expect(scoreForVoter("challenge", { choice: "complete" })).toBe(1);
  });

  it("awards nothing when the challenge is skipped", () => {
    expect(scoreForVoter("challenge", { choice: "skip" })).toBe(0);
  });
});

describe("aggregateScoreIncrements", () => {
  it("batches most_likely tallies per target", () => {
    const deltas = aggregateScoreIncrements("most_likely", [
      { voterId: "a", targetUserId: "x" },
      { voterId: "b", targetUserId: "x" },
      { voterId: "c", targetUserId: "y" },
    ]);
    expect(Object.fromEntries(deltas)).toEqual({ x: 2, y: 1 });
  });

  it("sums challenge points onto voters", () => {
    const deltas = aggregateScoreIncrements("challenge", [
      { voterId: "a", choice: "complete" },
      { voterId: "b", choice: "skip" },
    ]);
    expect(Object.fromEntries(deltas)).toEqual({ a: 1 });
  });
});
