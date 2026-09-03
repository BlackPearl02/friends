import { describe, expect, it } from "vitest";
import { resolveActivityLocale } from "./index";

describe("resolveActivityLocale", () => {
  it("maps pl and pl-PL to Polish", () => {
    expect(resolveActivityLocale("pl")).toBe("pl");
    expect(resolveActivityLocale("pl-PL")).toBe("pl");
  });

  it("falls back to English", () => {
    expect(resolveActivityLocale("en-US")).toBe("en");
    expect(resolveActivityLocale("de")).toBe("en");
  });
});
