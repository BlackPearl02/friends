import { describe, expect, it, vi } from "vitest";
import {
  ACTIVITY_CORE_OAUTH_SCOPES,
  ACTIVITY_OAUTH_SCOPES,
  authorizeActivityCode,
  withTimeout,
} from "./auth";

describe("withTimeout", () => {
  it("rejects when the promise never settles", async () => {
    vi.useFakeTimers();
    const pending = withTimeout(new Promise<string>(() => undefined), 100, "test");
    const assertion = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    vi.useRealTimers();
  });
});

describe("authorizeActivityCode", () => {
  it("returns the code from silent authorize when it succeeds", async () => {
    const authorize = vi.fn().mockResolvedValue({ code: "silent-code" });
    const code = await authorizeActivityCode({ commands: { authorize } } as never, "client");
    expect(code).toBe("silent-code");
    expect(authorize).toHaveBeenCalledTimes(1);
    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "client",
        prompt: "none",
        scope: [...ACTIVITY_OAUTH_SCOPES],
      }),
    );
  });

  it("retries without prompt when silent authorize fails", async () => {
    const authorize = vi
      .fn()
      .mockRejectedValueOnce(new Error("consent_required"))
      .mockResolvedValueOnce({ code: "consent-code" });
    const code = await authorizeActivityCode({ commands: { authorize } } as never, "client");
    expect(code).toBe("consent-code");
    expect(authorize).toHaveBeenCalledTimes(2);
    expect(authorize.mock.calls[1][0]).not.toHaveProperty("prompt");
    expect(authorize.mock.calls[1][0].scope).toEqual([...ACTIVITY_OAUTH_SCOPES]);
  });

  it("falls back to core scopes when presence authorize fails", async () => {
    const authorize = vi
      .fn()
      .mockRejectedValueOnce(new Error("invalid_scope"))
      .mockRejectedValueOnce(new Error("invalid_scope"))
      .mockResolvedValueOnce({ code: "core-code" });
    const code = await authorizeActivityCode({ commands: { authorize } } as never, "client");
    expect(code).toBe("core-code");
    expect(authorize).toHaveBeenCalledTimes(3);
    expect(authorize.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        prompt: "none",
        scope: [...ACTIVITY_CORE_OAUTH_SCOPES],
      }),
    );
  });
});
