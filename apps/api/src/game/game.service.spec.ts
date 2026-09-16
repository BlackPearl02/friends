import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameService } from "./game.service";
import { PRESENCE_STALE_MS } from "./presence";
import { ROOM_IN_PROGRESS_CODE } from "./room-codes";

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
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
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

    expect(beginRound).toHaveBeenCalledWith("room-1");
  });

  it("finishes the session when all wrap up after reveal", async () => {
    const finishSession = vi.fn().mockResolvedValue(undefined);
    const settleRevealRound = vi.fn().mockResolvedValue(undefined);
    const loadPublic = vi.fn().mockResolvedValue({ id: "room-1", status: "finished" });
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "playing",
          locale: "en",
          sessionKey: "sess",
          players: [],
          rounds: [{ id: "r1", status: "reveal", votes: [{ targetUserId: "a" }] }],
        }),
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "a" }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
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
    (service as unknown as { settleRevealRound: typeof settleRevealRound }).settleRevealRound =
      settleRevealRound;
    (service as unknown as { loadPublic: typeof loadPublic }).loadPublic = loadPublic;

    await service.setIntent({ id: "a" } as never, "inst-long", "wrap_up");

    expect(settleRevealRound).toHaveBeenCalledWith("room-1");
    expect(finishSession).toHaveBeenCalledWith("room-1");
  });

  it("settles scores then starts the next round when all continue after reveal", async () => {
    const beginRound = vi.fn().mockResolvedValue(undefined);
    const settleRevealRound = vi.fn().mockResolvedValue(undefined);
    const loadPublic = vi.fn().mockResolvedValue({ id: "room-1", status: "playing" });
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "playing",
          locale: "en",
          sessionKey: "sess",
          players: [],
          rounds: [{ id: "r1", status: "reveal", votes: [{ targetUserId: "a" }] }],
        }),
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "a" }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findMany: vi.fn().mockResolvedValue([
          { userId: "a", intent: "continue" },
          { userId: "b", intent: "continue" },
        ]),
      },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { beginRound: typeof beginRound }).beginRound = beginRound;
    (service as unknown as { settleRevealRound: typeof settleRevealRound }).settleRevealRound =
      settleRevealRound;
    (service as unknown as { loadPublic: typeof loadPublic }).loadPublic = loadPublic;

    await service.setIntent({ id: "a" } as never, "inst-long", "continue");

    expect(settleRevealRound).toHaveBeenCalledWith("room-1");
    expect(beginRound).toHaveBeenCalledWith("room-1");
  });

  it("does not settle or begin a round when only some players continue after reveal", async () => {
    const beginRound = vi.fn().mockResolvedValue(undefined);
    const settleRevealRound = vi.fn().mockResolvedValue(undefined);
    const loadPublic = vi.fn().mockResolvedValue({ id: "room-1", status: "playing" });
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "playing",
          locale: "en",
          sessionKey: "sess",
          players: [],
          rounds: [{ id: "r1", status: "reveal", votes: [{ targetUserId: "a" }] }],
        }),
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "a" }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findMany: vi.fn().mockResolvedValue([
          { userId: "a", intent: "continue" },
          { userId: "b", intent: "none" },
        ]),
      },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { beginRound: typeof beginRound }).beginRound = beginRound;
    (service as unknown as { settleRevealRound: typeof settleRevealRound }).settleRevealRound =
      settleRevealRound;
    (service as unknown as { loadPublic: typeof loadPublic }).loadPublic = loadPublic;

    await service.setIntent({ id: "a" } as never, "inst-long", "continue");

    expect(settleRevealRound).not.toHaveBeenCalled();
    expect(beginRound).not.toHaveBeenCalled();
    expect(loadPublic).toHaveBeenCalledWith("room-1");
  });

  it("reopens a tied reveal when all choose revote", async () => {
    const reopenTiedRound = vi.fn().mockResolvedValue(undefined);
    const loadPublic = vi.fn().mockResolvedValue({ id: "room-1" });
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "playing",
          locale: "en",
          sessionKey: "sess",
          players: [],
          rounds: [
            {
              id: "r1",
              status: "reveal",
              votes: [
                { voterId: "a", targetUserId: "x" },
                { voterId: "b", targetUserId: "y" },
              ],
            },
          ],
        }),
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "a" }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findMany: vi.fn().mockResolvedValue([
          { userId: "a", intent: "revote" },
          { userId: "b", intent: "revote" },
        ]),
      },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { reopenTiedRound: typeof reopenTiedRound }).reopenTiedRound =
      reopenTiedRound;
    (service as unknown as { loadPublic: typeof loadPublic }).loadPublic = loadPublic;

    await service.setIntent({ id: "a" } as never, "inst-long", "revote");

    expect(reopenTiedRound).toHaveBeenCalledWith("room-1");
  });

  it("rejects revote when the reveal has a unique winner", async () => {
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "playing",
          locale: "en",
          sessionKey: "sess",
          players: [],
          rounds: [
            {
              id: "r1",
              status: "reveal",
              votes: [
                { voterId: "a", targetUserId: "x" },
                { voterId: "b", targetUserId: "x" },
              ],
            },
          ],
        }),
      },
      roomPlayer: {
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "a" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = new GameService(prisma as never);

    await expect(
      service.setIntent({ id: "a" } as never, "inst-long", "revote"),
    ).rejects.toBeInstanceOf(BadRequestException);
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
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
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
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
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
      prompt: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn(),
      },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { finishSession: typeof finishSession }).finishSession = finishSession;

    await (service as unknown as { beginRound: (id: string) => Promise<void> }).beginRound(
      "room-1",
    );

    expect(finishSession).toHaveBeenCalledWith("room-1");
    expect(prisma.prompt.findFirst).not.toHaveBeenCalled();
  });

  it("leaves remove the caller from the roster", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          discordInstanceId: "inst-long",
        }),
      },
      roomPlayer: { deleteMany },
    };
    const service = new GameService(prisma as never);

    await expect(service.leave({ id: "leaver" } as never, "inst-long")).resolves.toEqual({
      ok: true,
    });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { roomId: "room-1", userId: "leaver" },
    });
  });

  it("rejects join for a new player while a round is in progress", async () => {
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "playing",
          discordInstanceId: "inst-long",
        }),
      },
      roomPlayer: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(2),
        upsert: vi.fn(),
      },
    };
    const service = new GameService(prisma as never);

    await expect(
      service.join({ id: "late" } as never, { instanceId: "inst-long" }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ConflictException);
      expect((err as ConflictException).message).toBe(ROOM_IN_PROGRESS_CODE);
      return true;
    });
    expect(prisma.roomPlayer.upsert).not.toHaveBeenCalled();
  });

  it("allows an existing member to rejoin while playing", async () => {
    const loadPublic = vi.fn().mockResolvedValue({ id: "room-1", status: "playing" });
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      gameRoom: {
        findUnique: vi.fn().mockResolvedValue({
          id: "room-1",
          status: "playing",
          discordInstanceId: "inst-long",
        }),
      },
      roomPlayer: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue({ roomId: "room-1", userId: "member" }),
        upsert,
      },
    };
    const service = new GameService(prisma as never);
    (service as unknown as { loadPublic: typeof loadPublic }).loadPublic = loadPublic;

    await service.join({ id: "member" } as never, { instanceId: "inst-long" });

    expect(upsert).toHaveBeenCalled();
  });

  it("prunes stale players using the presence cutoff", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = { roomPlayer: { deleteMany } };
    const service = new GameService(prisma as never);
    const before = Date.now();

    await (service as unknown as { pruneStalePlayers: (id: string) => Promise<void> }).pruneStalePlayers(
      "room-1",
    );

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        roomId: "room-1",
        lastSeenAt: { lt: expect.any(Date) },
      },
    });
    const cutoff = deleteMany.mock.calls[0][0].where.lastSeenAt.lt as Date;
    expect(before - PRESENCE_STALE_MS - 50).toBeLessThanOrEqual(cutoff.getTime());
    expect(cutoff.getTime()).toBeLessThanOrEqual(Date.now() - PRESENCE_STALE_MS + 50);
  });

  it("picks a random unused prompt when beginning a round", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const transaction = vi.fn(async (ops: unknown) => ops);
    const prisma = {
      gameRoom: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "room-1",
          sessionKey: "sess",
          locale: "en",
        }),
        update: vi.fn(),
      },
      round: {
        findMany: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
        create: vi.fn(),
      },
      prompt: {
        count: vi.fn().mockResolvedValue(4),
        findFirst: vi.fn().mockResolvedValue({
          id: "p-random",
          kind: "most_likely",
          locale: "en",
        }),
      },
      roomPlayer: { updateMany: vi.fn() },
      $transaction: transaction,
    };
    const service = new GameService(prisma as never);

    await (service as unknown as { beginRound: (id: string) => Promise<void> }).beginRound(
      "room-1",
    );

    expect(prisma.prompt.findFirst).toHaveBeenCalledWith({
      where: {
        kind: "most_likely",
        locale: "en",
        id: { notIn: [] },
      },
      skip: 2,
    });
    expect(transaction).toHaveBeenCalled();
    randomSpy.mockRestore();
  });
});
