import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordActivityAuthService } from "./activity-auth.service";

describe("DiscordActivityAuthService", () => {
  const api = {
    exchangeCode: vi.fn(),
    getMe: vi.fn(),
    isRetryableTokenError: vi.fn(),
  };
  const auth = { signAccessToken: vi.fn().mockReturnValue("jwt-token") };
  const config = { get: vi.fn(), getOrThrow: vi.fn() };
  const prisma = { user: { upsert: vi.fn() } };

  beforeEach(() => {
    vi.resetAllMocks();
    config.get.mockReturnValue("");
    prisma.user.upsert.mockResolvedValue({
      id: "user-1",
      displayName: "Ada",
      avatarUrl: null,
    });
    api.getMe.mockResolvedValue({ id: "discord-1", username: "ada", global_name: "Ada" });
    auth.signAccessToken.mockReturnValue("jwt-token");
  });

  it("retries token exchange when Discord rejects redirect_uri", async () => {
    api.exchangeCode
      .mockRejectedValueOnce(new UnauthorizedException("redirect_uri mismatch"))
      .mockResolvedValueOnce({ access_token: "discord-at" });
    api.isRetryableTokenError.mockReturnValueOnce(true);

    const service = new DiscordActivityAuthService(
      api as never,
      auth as never,
      config as never,
      prisma as never,
    );
    const result = await service.exchange({ code: "oauth-code-value" });
    expect(result.accessToken).toBe("jwt-token");
    expect(result.discordAccessToken).toBe("discord-at");
    expect(api.exchangeCode).toHaveBeenCalledTimes(2);
  });
});
