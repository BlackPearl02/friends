import { describe, expect, it } from "vitest";
import { isRevealTie, leadersFromTallies } from "./roundReveal";

describe("leadersFromTallies", () => {
  it("returns the single top vote-getter", () => {
    expect(leadersFromTallies({ a: 1, b: 3, c: 2 })).toEqual({
      userIds: ["b"],
      votes: 3,
    });
  });

  it("returns every tied top vote-getter", () => {
    expect(leadersFromTallies({ a: 2, b: 2, c: 1 })).toEqual({
      userIds: ["a", "b"],
      votes: 2,
    });
  });

  it("handles an empty tally map", () => {
    expect(leadersFromTallies({})).toEqual({ userIds: [], votes: 0 });
  });
});

describe("isRevealTie", () => {
  it("is true only when two or more share the lead", () => {
    expect(isRevealTie({ a: 2, b: 2 })).toBe(true);
    expect(isRevealTie({ a: 3, b: 1 })).toBe(false);
    expect(isRevealTie(undefined)).toBe(false);
  });
});
