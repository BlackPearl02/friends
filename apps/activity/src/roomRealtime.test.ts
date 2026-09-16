import { describe, expect, it } from "vitest";
import { partyRoomPath } from "@friends/types";
import {
  isRoomRealtimeConfigured,
  parseRoomRealtimePayload,
  partyRoomWebSocketUrl,
  resolvePartyKitBase,
} from "./roomRealtime";

describe("partyRoomPath", () => {
  it("scopes the PartyKit room to the Discord instance", () => {
    expect(partyRoomPath("abc-123")).toBe("/parties/main/abc-123");
  });
});

describe("parseRoomRealtimePayload", () => {
  it("keeps safe vote fields and drops unknown junk", () => {
    expect(
      parseRoomRealtimePayload({
        t: 1,
        kind: "vote",
        votedUserId: "u1",
        voteCount: 2,
        targetUserId: "secret",
      }),
    ).toEqual({
      t: 1,
      kind: "vote",
      votedUserId: "u1",
      voteCount: 2,
    });
  });

  it("falls back to a bare wake-up for invalid shapes", () => {
    expect(parseRoomRealtimePayload(null)).toEqual({ t: 1 });
    expect(parseRoomRealtimePayload({ kind: "hack", intent: "drop_tables" })).toEqual({ t: 1 });
  });
});

describe("resolvePartyKitBase", () => {
  it("passes through absolute https URLs", () => {
    expect(resolvePartyKitBase("https://squimbo.partykit.dev/", "https://ignored.example")).toBe(
      "https://squimbo.partykit.dev",
    );
  });

  it("expands Discord-mapped prefixes against the Activity origin", () => {
    expect(resolvePartyKitBase("/party", "https://123.discordsays.com")).toBe(
      "https://123.discordsays.com/party",
    );
  });

  it("returns empty when a relative path has no origin", () => {
    expect(resolvePartyKitBase("/party", undefined)).toBe("");
  });
});

describe("partyRoomWebSocketUrl", () => {
  it("builds a wss URL under the Discord /party mapping", () => {
    expect(partyRoomWebSocketUrl("/party", "inst-1", "https://123.discordsays.com")).toBe(
      "wss://123.discordsays.com/party/parties/main/inst-1",
    );
  });
});

describe("isRoomRealtimeConfigured", () => {
  it("is false in unit tests without Vite PartyKit env", () => {
    expect(isRoomRealtimeConfigured()).toBe(false);
  });
});
