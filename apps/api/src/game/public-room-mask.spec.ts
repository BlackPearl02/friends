import { describe, expect, it } from "vitest";
import { clientVisibleRoundResults, clientVisibleScore } from "./public-room-mask";

describe("clientVisibleScore", () => {
  it("hides running scores until the session is finished", () => {
    expect(clientVisibleScore("lobby", 4)).toBe(0);
    expect(clientVisibleScore("playing", 4)).toBe(0);
    expect(clientVisibleScore("finished", 4)).toBe(4);
  });
});

describe("clientVisibleRoundResults", () => {
  it("exposes tallies only after votes lock", () => {
    expect(clientVisibleRoundResults("voting")).toBe(false);
    expect(clientVisibleRoundResults("reveal")).toBe(true);
    expect(clientVisibleRoundResults("done")).toBe(true);
    expect(clientVisibleRoundResults(undefined)).toBe(false);
  });
});
