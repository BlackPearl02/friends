import { describe, expect, it } from "vitest";
import { isAuthorizedNotify } from "./notify-auth";

describe("isAuthorizedNotify", () => {
  it("accepts a matching Bearer secret", () => {
    expect(isAuthorizedNotify("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("rejects missing env, wrong token, or empty bearer", () => {
    expect(isAuthorizedNotify("Bearer s3cret", undefined)).toBe(false);
    expect(isAuthorizedNotify("Bearer nope", "s3cret")).toBe(false);
    expect(isAuthorizedNotify("Bearer ", "s3cret")).toBe(false);
    expect(isAuthorizedNotify(null, "s3cret")).toBe(false);
  });
});
