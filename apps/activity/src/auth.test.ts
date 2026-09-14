import { describe, expect, it, vi } from "vitest";
import { ACTIVITY_OAUTH_SCOPES, authorizeActivityCode } from "./auth";

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
  });
});
