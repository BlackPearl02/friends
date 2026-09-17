import { describe, expect, it } from "vitest";
import {
  isRoomRealtimeConfigured,
  parseRoomRealtimePayload,
  readFanoutSentAt,
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

  it("keeps public round-start prompt fields", () => {
    expect(
      parseRoomRealtimePayload({
        t: 1,
        kind: "round",
        roundId: "r2",
        roundIndex: 1,
        prompt: {
          id: "p2",
          kind: "most_likely",
          category: null,
          body: "Who is most likely?",
          optionA: null,
          optionB: null,
          secret: true,
        },
        serverTime: "2026-09-16T18:00:00.000Z",
      }),
    ).toEqual({
      t: 1,
      kind: "round",
      roundId: "r2",
      roundIndex: 1,
      prompt: {
        id: "p2",
        kind: "most_likely",
        category: null,
        body: "Who is most likely?",
        optionA: null,
        optionB: null,
      },
      serverTime: "2026-09-16T18:00:00.000Z",
    });
  });
});

describe("readFanoutSentAt", () => {
  it("reads client fanout clock for latency dbg", () => {
    expect(readFanoutSentAt({ tSent: 123 })).toBe(123);
    expect(readFanoutSentAt({})).toBeNull();
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
