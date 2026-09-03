import { describe, expect, it } from "vitest";
import { scoreDelta, scoreForVoter } from "./scoring";

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
