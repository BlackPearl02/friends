import { describe, expect, it, vi } from "vitest";
import { createRoomRefreshGate, isRoomMembershipLostError } from "./roomRefresh";

describe("createRoomRefreshGate", () => {
  it("queues a second request while the first is in flight", async () => {
    let resolveFirst!: () => void;
    const first = new Promise<void>((r) => {
      resolveFirst = r;
    });
    const run = vi
      .fn()
      .mockImplementationOnce(() => first)
      .mockResolvedValueOnce(undefined);

    const gate = createRoomRefreshGate(run);
    gate.request();
    gate.request();
    expect(run).toHaveBeenCalledTimes(1);
    expect(gate.isPending()).toBe(true);

    resolveFirst();
    await first;
    await Promise.resolve();
    await Promise.resolve();

    expect(run).toHaveBeenCalledTimes(2);
    expect(gate.isPending()).toBe(false);
  });
});

describe("isRoomMembershipLostError", () => {
  it("detects forbidden membership responses", () => {
    expect(isRoomMembershipLostError(new Error("HTTP 403: Not in this room"))).toBe(true);
    expect(isRoomMembershipLostError(new Error("HTTP 500"))).toBe(false);
  });
});
