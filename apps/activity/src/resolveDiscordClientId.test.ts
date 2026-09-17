import { describe, expect, it, vi } from "vitest";
import { resolveDiscordClientId } from "./resolveDiscordClientId";

vi.mock("./dbgRt", () => ({
  dbgRt: vi.fn(),
}));

describe("resolveDiscordClientId", () => {
  it("prefers discordsays app id over a mismatched env id", () => {
    expect(
      resolveDiscordClientId(
        "1545063093929775175",
        "1545063528422183043.discordsays.com",
      ),
    ).toBe("1545063528422183043");
  });

  it("uses env when not on discordsays", () => {
    expect(resolveDiscordClientId("1545063528422183043", "localhost")).toBe(
      "1545063528422183043",
    );
  });

  it("uses host when env is empty", () => {
    expect(resolveDiscordClientId("", "1545063528422183043.discordsays.com")).toBe(
      "1545063528422183043",
    );
  });
});
