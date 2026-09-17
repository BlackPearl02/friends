import { describe, expect, it } from "vitest";
import { isRevealTie, leadersFromTallies, msUntilReveal, shouldShowReveal, shouldShowRevealResults } from "./roundReveal";

describe("leadersFromTallies", () => {
  it("returns the single top vote-getter", () => {
    expect(leadersFromTallies({ a: 1, b: 3, c: 2 })).toEqual({
      userIds: ["b"],
      votes: 3,
    });
  });

  it("returns every tied top vote-getter in stable id order", () => {
    expect(leadersFromTallies({ a: 2, b: 2, c: 1 })).toEqual({
      userIds: ["a", "b"],
      votes: 2,
    });
    expect(leadersFromTallies({ b: 2, a: 2, c: 1 })).toEqual({
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
  const now = Date.parse(serverTime);

  it("holds tallies until revealedAt (wall clock)", () => {
    expect(msUntilReveal("2026-09-16T18:00:00.600Z", serverTime, now)).toBe(600);
    expect(
      shouldShowReveal(
        { status: "reveal", revealedAt: "2026-09-16T18:00:00.600Z" },
        serverTime,
        now,
      ),
    ).toBe(false);
  });

  it("shows reveal when the hold has elapsed", () => {
    expect(msUntilReveal("2026-09-16T18:00:00.000Z", serverTime, now)).toBe(0);
    expect(
      shouldShowReveal(
        { status: "reveal", revealedAt: "2026-09-16T17:59:59.000Z" },
        serverTime,
        now,
      ),
    ).toBe(true);
  });

  it("syncs late peers to the same absolute revealedAt", () => {
    const revealedAt = "2026-09-16T18:00:00.900Z";
    const early = msUntilReveal(revealedAt, serverTime, now);
    const late = msUntilReveal(revealedAt, serverTime, now + 400);
    expect(early).toBe(900);
    expect(late).toBe(500);
    expect(early - late).toBe(400);
  });

  it("shows immediately when revealedAt is missing", () => {
    expect(shouldShowReveal({ status: "reveal", revealedAt: null }, serverTime, now)).toBe(true);
  });

  it("never shows while still voting", () => {
    expect(
      shouldShowReveal(
        { status: "voting", revealedAt: "2026-09-16T17:59:59.000Z" },
        serverTime,
        now,
      ),
    ).toBe(false);
  });
});

describe("shouldShowRevealResults", () => {
  const serverTime = "2026-09-16T18:00:00.000Z";
  const now = Date.parse(serverTime);

  it("waits for tallies even after the hold elapsed", () => {
    expect(
      shouldShowRevealResults(
        { status: "reveal", revealedAt: "2026-09-16T17:59:59.000Z" },
        serverTime,
        now,
      ),
    ).toBe(false);
    expect(
      shouldShowRevealResults(
        {
          status: "reveal",
          revealedAt: "2026-09-16T17:59:59.000Z",
          results: { tallies: { a: 1, b: 1 } },
        },
        serverTime,
        now,
      ),
    ).toBe(true);
  });
});
