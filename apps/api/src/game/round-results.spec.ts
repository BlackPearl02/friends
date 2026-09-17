import { describe, expect, it } from "vitest";
import { isRoundTie, tallyVotes, topTallyKeys } from "./round-results";

describe("tallyVotes", () => {
  it("counts targetUserId votes", () => {
    expect(
      tallyVotes([
        { voterId: "v1", targetUserId: "a" },
        { voterId: "v2", targetUserId: "a" },
        { voterId: "v3", targetUserId: "b" },
      ]),
    ).toEqual({ a: 2, b: 1 });
  });
});

describe("topTallyKeys", () => {
  it("lists every key that shares the max in stable order", () => {
    expect(topTallyKeys({ a: 2, b: 2, c: 1 })).toEqual({ keys: ["a", "b"], max: 2 });
    expect(topTallyKeys({ b: 2, a: 2, c: 1 })).toEqual({ keys: ["a", "b"], max: 2 });
  });
});

describe("isRoundTie", () => {
  it("detects a shared lead", () => {
    expect(isRoundTie({ a: 2, b: 2 })).toBe(true);
    expect(isRoundTie({ a: 3, b: 1 })).toBe(false);
  });
});
