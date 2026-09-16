import { describe, expect, it } from "vitest";
import { ROOM_REALTIME_EVENT, roomRealtimeTopic } from "@friends/types";
import { isRoomRealtimeConfigured } from "./roomRealtime";

describe("roomRealtimeTopic", () => {
  it("scopes the broadcast channel to the Discord instance", () => {
    expect(roomRealtimeTopic("abc-123")).toBe("room:abc-123");
    expect(ROOM_REALTIME_EVENT).toBe("room_changed");
  });
});

describe("isRoomRealtimeConfigured", () => {
  it("is false in unit tests without Vite Supabase env", () => {
    expect(isRoomRealtimeConfigured()).toBe(false);
  });
});
