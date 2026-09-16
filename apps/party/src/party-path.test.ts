import { describe, expect, it } from "vitest";
import { stripDiscordPartyPrefix } from "./party-path";

describe("stripDiscordPartyPrefix", () => {
  it("strips a kept Discord /party prefix", () => {
    const req = new Request("https://worker.example/party/parties/main/inst-1", {
      method: "POST",
    });
    const next = stripDiscordPartyPrefix(req);
    expect(new URL(next.url).pathname).toBe("/parties/main/inst-1");
  });

  it("leaves already-stripped PartyKit paths alone", () => {
    const req = new Request("https://worker.example/parties/main/inst-1", {
      method: "POST",
    });
    const next = stripDiscordPartyPrefix(req);
    expect(next).toBe(req);
  });
});
