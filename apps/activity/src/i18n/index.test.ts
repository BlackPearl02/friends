import { describe, expect, it } from "vitest";
import { resolveActivityLocale } from "./index";

describe("resolveActivityLocale", () => {
  it("stays English in phase 1 even when Discord locale is Polish", () => {
    expect(resolveActivityLocale("pl")).toBe("en");
    expect(resolveActivityLocale("pl-PL")).toBe("en");
    expect(resolveActivityLocale("en-US")).toBe("en");
  });
});
