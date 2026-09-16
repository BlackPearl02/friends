import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns ok without touching the database", () => {
    expect(new HealthController().health()).toEqual({ ok: true });
  });
});
