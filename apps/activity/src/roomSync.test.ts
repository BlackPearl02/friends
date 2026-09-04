import { describe, expect, it } from "vitest";
import { ROOM_POLL_MS } from "./roomSync";

describe("ROOM_POLL_MS", () => {
  it("keeps party sync under about one second", () => {
    expect(ROOM_POLL_MS).toBe(750);
    expect(ROOM_POLL_MS).toBeLessThanOrEqual(1000);
  });
});
