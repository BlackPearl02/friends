import { describe, expect, it } from "vitest";
import { handleDiscordInteraction } from "./interaction-handler";

describe("handleDiscordInteraction", () => {
  it("responds to PING with PONG", () => {
    expect(handleDiscordInteraction({ type: 1 })).toEqual({ type: 1 });
  });

  it("launches Activity for /squimbo and /play", () => {
    expect(
      handleDiscordInteraction({ type: 2, data: { name: "squimbo" } }),
    ).toEqual({ type: 12 });
    expect(handleDiscordInteraction({ type: 2, data: { name: "play" } })).toEqual({
      type: 12,
    });
    expect(handleDiscordInteraction({ type: 2, data: { name: "Play" } })).toEqual({
      type: 12,
    });
  });

  it("returns an ephemeral hint for unknown commands", () => {
    const res = handleDiscordInteraction({ type: 2, data: { name: "help" } });
    expect(res.type).toBe(4);
    expect(res.data?.flags).toBe(64);
    expect(res.data?.content).toMatch(/squimbo/i);
  });
});
