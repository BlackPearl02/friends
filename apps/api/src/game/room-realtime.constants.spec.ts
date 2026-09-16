import { describe, expect, it } from "vitest";
import { ROOM_REALTIME_EVENT, roomRealtimeTopic } from "@friends/types";
import {
  ROOM_REALTIME_EVENT as apiEvent,
  roomRealtimeTopic as apiTopic,
} from "./room-realtime.constants";

describe("room realtime constants", () => {
  it("stays aligned with @friends/types", () => {
    expect(apiEvent).toBe(ROOM_REALTIME_EVENT);
    expect(apiTopic("x")).toBe(roomRealtimeTopic("x"));
  });
});
