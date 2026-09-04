import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameService } from "./game.service";

describe("GameService authz", () => {
  const prisma = {
    gameRoom: { findUnique: vi.fn(), update: vi.fn() },
    roomPlayer: { findUnique: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const service = new GameService(prisma as never);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects vote when the caller is not in the room", async () => {
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

  it("rejects setIntent when the caller is not in the room", async () => {
    prisma.gameRoom.findUnique.mockResolvedValue({
      id: "room-1",
      status: "lobby",
      locale: "en",
      sessionKey: "sess",
      players: [],
      rounds: [],
    });
    prisma.roomPlayer.findUnique.mockResolvedValue(null);

    await expect(
      service.setIntent({ id: "outsider" } as never, "inst-long", "continue"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects replay when the caller is not in the room", async () => {
    prisma.gameRoom.findUnique.mockResolvedValue({
      id: "room-1",
      status: "finished",
      discordInstanceId: "inst-long",
    });
    prisma.roomPlayer.findUnique.mockResolvedValue(null);

    await expect(service.replay({ id: "outsider" } as never, "inst-long")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe("GameService session finale", () => {
  it("starts a round when all lobby players continue", async () => {
    const beginRound = vi.fn().mockResolvedValue(undefined);
    const loadPublic = vi.fn().mockResolvedValue({ id: "room-1", status: "playing" });
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "lobby",
          locale: "en",
          sessionKey: "sess",
          players: [
            { userId: "a", intent: "continue" },
            { userId: "b", intent: "none" },
          ],
          rounds: [],
        }),
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "b" }),
        update: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([
          { userId: "a", intent: "continue" },
          { userId: "b", intent: "continue" },
        ]),
      },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { beginRound: typeof beginRound }).beginRound = beginRound;
    (service as unknown as { loadPublic: typeof loadPublic }).loadPublic = loadPublic;

    await service.setIntent({ id: "b" } as never, "inst-long", "continue");

    expect(beginRound).toHaveBeenCalledWith("room-1", "en");
  });

  it("finishes the session when all wrap up after reveal", async () => {
    const finishSession = vi.fn().mockResolvedValue(undefined);
    const loadPublic = vi.fn().mockResolvedValue({ id: "room-1", status: "finished" });
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "playing",
          locale: "en",
          sessionKey: "sess",
          players: [],
          rounds: [{ id: "r1", status: "reveal" }],
        }),
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "a" }),
        update: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([
          { userId: "a", intent: "wrap_up" },
          { userId: "b", intent: "wrap_up" },
        ]),
      },
      round: {
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { finishSession: typeof finishSession }).finishSession = finishSession;
    (service as unknown as { loadPublic: typeof loadPublic }).loadPublic = loadPublic;

    await service.setIntent({ id: "a" } as never, "inst-long", "wrap_up");

    expect(finishSession).toHaveBeenCalledWith("room-1");
  });

  it("rejects wrap_up while voting", async () => {
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "playing",
          locale: "en",
          sessionKey: "sess",
          players: [],
          rounds: [{ id: "r1", status: "voting" }],
        }),
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "a" }),
      },
    };
    const service = new GameService(prisma as never);

    await expect(
      service.setIntent({ id: "a" } as never, "inst-long", "wrap_up"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("reveals when the last player votes", async () => {
    const revealRound = vi.fn().mockResolvedValue(undefined);
    const loadPublic = vi.fn().mockResolvedValue({ id: "room-1" });
    const prisma = {
      round: {
        findUnique: vi.fn().mockResolvedValue({
          id: "round-1",
          roomId: "room-1",
          status: "voting",
          prompt: { kind: "most_likely" },
          room: { id: "room-1" },
        }),
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "voter" }),
        count: vi.fn().mockResolvedValue(2),
      },
      vote: {
        upsert: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(2),
      },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { revealRound: typeof revealRound }).revealRound = revealRound;
    (service as unknown as { loadPublic: typeof loadPublic }).loadPublic = loadPublic;

    await service.vote({ id: "voter" } as never, {
      roundId: "round-1",
      targetUserId: "target",
    });

    expect(revealRound).toHaveBeenCalledWith("room-1");
  });

  it("replays with a new sessionKey and cleared scores", async () => {
    const loadPublic = vi.fn().mockResolvedValue({ id: "room-1", status: "lobby" });
    const roomUpdate = vi.fn().mockResolvedValue({});
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const transaction = vi.fn(async (ops: unknown) => ops);
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "finished",
          discordInstanceId: "inst-long",
          sessionKey: "old",
        }),
        update: roomUpdate,
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "member" }),
        updateMany,
      },
      $transaction: transaction,
      round: { deleteMany: vi.fn() },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { loadPublic: typeof loadPublic }).loadPublic = loadPublic;

    await service.replay({ id: "member" } as never, "inst-long");

    expect(roomUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "room-1" },
        data: expect.objectContaining({ status: "lobby", sessionKey: expect.any(String) }),
      }),
    );
    expect(updateMany).toHaveBeenCalledWith({
      where: { roomId: "room-1" },
      data: { score: 0, intent: "none" },
    });
    expect(prisma.round.deleteMany).not.toHaveBeenCalled();
  });

  it("finishes the session when beginRound has no prompts left", async () => {
    const finishSession = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      gameRoom: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "room-1",
          sessionKey: "sess",
          locale: "en",
        }),
      },
      round: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ promptId: "p1" }])
          .mockResolvedValueOnce([{ index: 0 }]),
      },
      prompt: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { finishSession: typeof finishSession }).finishSession = finishSession;

    await (
      service as unknown as { beginRound: (id: string, locale: "en" | "pl") => Promise<void> }
    ).beginRound("room-1", "en");

    expect(finishSession).toHaveBeenCalledWith("room-1");
  });
});
