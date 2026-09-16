import { describe, expect, it } from "vitest";
import { partyRoomPath as typesPath } from "@friends/types";
import { partyRoomPath as apiPath } from "./room-party.constants";

describe("partyRoomPath", () => {
  it("matches @friends/types encoding", () => {
    expect(apiPath("abc-123")).toBe(typesPath("abc-123"));
    expect(apiPath("a/b")).toBe("/parties/main/a%2Fb");
  });
});
