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
  it("never exposes mid-session tallies on the public room", () => {
    expect(clientVisibleRoundResults()).toBe(false);
  });
});
