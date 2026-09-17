import { describe, expect, it } from "vitest";
import { REVEAL_SYNC_MS } from "./reveal-sync";

describe("REVEAL_SYNC_MS", () => {
  it("holds long enough for party polls to catch up", () => {
    expect(REVEAL_SYNC_MS).toBe(900);
    expect(REVEAL_SYNC_MS).toBeGreaterThanOrEqual(400);
    expect(REVEAL_SYNC_MS).toBeLessThanOrEqual(1500);
  });
});
