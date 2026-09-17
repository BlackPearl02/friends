import { describe, expect, it } from "vitest";
import {
  isRoomRealtimeConfigured,
  parseRoomRealtimePayload,
  resolveMappedBase,
} from "./roomRealtime";

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

describe("resolveMappedBase", () => {
  it("passes through absolute https URLs", () => {
    expect(resolveMappedBase("https://abc.supabase.co/", "https://ignored.example")).toBe(
      "https://abc.supabase.co",
    );
  });

  it("expands Discord-mapped /sb against the Activity origin", () => {
    expect(resolveMappedBase("/sb", "https://123.discordsays.com")).toBe(
      "https://123.discordsays.com/sb",
    );
  });

  it("strips accidental surrounding quotes from env values", () => {
    expect(resolveMappedBase('"/sb"', "https://123.discordsays.com")).toBe(
      "https://123.discordsays.com/sb",
    );
  });
});

describe("isRoomRealtimeConfigured", () => {
  it("is false in unit tests without Vite Supabase env", () => {
    expect(isRoomRealtimeConfigured()).toBe(false);
  });
});
