import { describe, expect, it } from "vitest";
import { pickRandomOffset } from "./pick-random";

describe("pickRandomOffset", () => {
  it("always returns 0 when only one candidate remains", () => {
    expect(pickRandomOffset(1, () => 0)).toBe(0);
    expect(pickRandomOffset(1, () => 0.999)).toBe(0);
  });

  it("maps [0, 1) uniformly onto [0, count)", () => {
    expect(pickRandomOffset(4, () => 0)).toBe(0);
    expect(pickRandomOffset(4, () => 0.25)).toBe(1);
    expect(pickRandomOffset(4, () => 0.5)).toBe(2);
    expect(pickRandomOffset(4, () => 0.999)).toBe(3);
  });

  it("rejects non-positive counts", () => {
    expect(() => pickRandomOffset(0)).toThrow(RangeError);
    expect(() => pickRandomOffset(-1)).toThrow(RangeError);
  });
});
