import { describe, expect, it } from "vitest";
import { activityUrl } from "./api";

describe("activityUrl", () => {
  it("prefixes /api when no explicit API origin is set", () => {
    expect(activityUrl("/discord/activity/exchange")).toBe("/api/discord/activity/exchange");
  });
});
