import { ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameService } from "./game.service";

describe("GameService authz", () => {
  const prisma = {
    gameRoom: { findUnique: vi.fn() },
    roomPlayer: { findUnique: vi.fn() },
  };
  const service = new GameService(prisma as never);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects start when the caller is not the host", async () => {
    prisma.gameRoom.findUnique.mockResolvedValue({
      id: "room-1",
      hostUserId: "host-id",
      discordInstanceId: "inst",
    });
    await expect(
      service.start({ id: "other-user" } as never, "inst", "party"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects vote when the caller is not in the room", async () => {
    prisma.gameRoom.findUnique.mockResolvedValue(undefined);
    const roundFind = vi.fn().mockResolvedValue({
      id: "round-1",
      roomId: "room-1",
      status: "voting",
      prompt: { kind: "most_likely" },
      room: { id: "room-1" },
    });
    (service as unknown as { prisma: { round: { findUnique: typeof roundFind } } }).prisma.round = {
      findUnique: roundFind,
    };
    prisma.roomPlayer.findUnique.mockResolvedValue(null);

    await expect(
      service.vote({ id: "outsider" } as never, {
        roundId: "round-1",
        targetUserId: "someone",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
