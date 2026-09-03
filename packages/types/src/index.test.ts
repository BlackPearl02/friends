import { describe, expect, it } from "vitest";
import { API_PATHS } from "./index";

describe("API_PATHS", () => {
  it("keeps Activity exchange under /discord/activity", () => {
    expect(API_PATHS.activityExchange).toBe("/discord/activity/exchange");
  });
});
