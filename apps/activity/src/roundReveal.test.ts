import { describe, expect, it } from "vitest";
import { isRevealTie, leadersFromTallies, msUntilReveal, shouldShowReveal } from "./roundReveal";

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

describe("msUntilReveal / shouldShowReveal", () => {
  const serverTime = "2026-09-16T18:00:00.000Z";

  it("holds tallies until revealedAt", () => {
    expect(msUntilReveal("2026-09-16T18:00:00.600Z", serverTime)).toBe(600);
    expect(
      shouldShowReveal(
        { status: "reveal", revealedAt: "2026-09-16T18:00:00.600Z" },
        serverTime,
      ),
    ).toBe(false);
  });

  it("shows reveal when the hold has elapsed", () => {
    expect(msUntilReveal("2026-09-16T18:00:00.000Z", serverTime)).toBe(0);
    expect(
      shouldShowReveal(
        { status: "reveal", revealedAt: "2026-09-16T17:59:59.000Z" },
        serverTime,
      ),
    ).toBe(true);
  });

  it("shows immediately when revealedAt is missing", () => {
    expect(shouldShowReveal({ status: "reveal", revealedAt: null }, serverTime)).toBe(true);
  });

  it("never shows while still voting", () => {
    expect(
      shouldShowReveal(
        { status: "voting", revealedAt: "2026-09-16T17:59:59.000Z" },
        serverTime,
      ),
    ).toBe(false);
  });
});
