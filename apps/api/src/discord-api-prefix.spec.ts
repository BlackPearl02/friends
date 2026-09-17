import { describe, expect, it } from "vitest";
import { stripDiscordApiPrefix } from "./discord-api-prefix";

describe("stripDiscordApiPrefix", () => {
  it("strips a kept Discord /api prefix", () => {
    expect(stripDiscordApiPrefix("/api/discord/activity/exchange")).toBe(
      "/discord/activity/exchange",
    );
  });

  it("leaves already-stripped API paths alone", () => {
    expect(stripDiscordApiPrefix("/discord/activity/exchange")).toBe(
      "/discord/activity/exchange",
    );
  });

  it("rewrites bare /api and query forms", () => {
    expect(stripDiscordApiPrefix("/api")).toBe("/");
    expect(stripDiscordApiPrefix("/api?x=1")).toBe("/?x=1");
  });
});
