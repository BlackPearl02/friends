import { describe, expect, it } from "vitest";
import { ROOM_REALTIME_EVENT, roomRealtimeTopic } from "@friends/types";
import {
  isRoomRealtimeConfigured,
  parseRoomRealtimePayload,
  resolveSupabaseUrl,
} from "./roomRealtime";

describe("roomRealtimeTopic", () => {
  it("scopes the broadcast channel to the Discord instance", () => {
    expect(roomRealtimeTopic("abc-123")).toBe("room:abc-123");
    expect(ROOM_REALTIME_EVENT).toBe("room_changed");
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

describe("resolveSupabaseUrl", () => {
  it("passes through absolute https URLs", () => {
    expect(resolveSupabaseUrl("https://abc.supabase.co/", "https://ignored.example")).toBe(
      "https://abc.supabase.co",
    );
  });

  it("expands Discord-mapped prefixes against the Activity origin", () => {
    expect(resolveSupabaseUrl("/sb", "https://123.discordsays.com")).toBe(
      "https://123.discordsays.com/sb",
    );
  });

  it("returns empty when a relative path has no origin", () => {
    expect(resolveSupabaseUrl("/sb", undefined)).toBe("");
  });
});

describe("isRoomRealtimeConfigured", () => {
  it("is false in unit tests without Vite Supabase env", () => {
    expect(isRoomRealtimeConfigured()).toBe(false);
  });
});
