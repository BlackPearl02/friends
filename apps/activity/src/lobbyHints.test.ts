import { describe, expect, it } from "vitest";
import { lobbyWaitingForDiscordJoin } from "./lobbyHints";

describe("lobbyWaitingForDiscordJoin", () => {
  it("is false when Discord participant count is unknown", () => {
    expect(lobbyWaitingForDiscordJoin(1, null)).toBe(false);
  });

  it("is true when Discord has more people than the Squimbo room", () => {
    expect(lobbyWaitingForDiscordJoin(1, 2)).toBe(true);
  });

  it("is false when counts match or room is ahead", () => {
    expect(lobbyWaitingForDiscordJoin(2, 2)).toBe(false);
    expect(lobbyWaitingForDiscordJoin(2, 1)).toBe(false);
  });
});
