import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { GameRoom, User } from "@friends/db";
import type { PublicPrompt, PublicRoom, RoomIntent } from "@friends/types" with { "resolution-mode": "import" };
import { isPrismaUniqueConflict } from "../prisma/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";
import { pickRandomOffset } from "./pick-random";
import { PRESENCE_STALE_MS, PRESENCE_STALE_PLAYING_MS } from "./presence";
import { clientVisibleRoundResults, clientVisibleScore } from "./public-room-mask";
import { ROOM_IN_PROGRESS_CODE } from "./room-codes";
import { isRoundTie, tallyVotes } from "./round-results";
import { REVEAL_SYNC_MS } from "./reveal-sync";
import { RoomRealtimeService } from "./room-realtime.service";
import { aggregateScoreIncrements } from "./scoring";

const MIN_PLAYERS = 2;

function shortInstanceId(instanceId: string): string {
  return instanceId.length <= 12 ? instanceId : `${instanceId.slice(0, 8)}…`;
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RoomRealtimeService,
  ) {}

  /**
   * Idempotent room create — concurrent joins for the same Discord instance
   * must not 500 on unique(discordInstanceId). Never overwrite hostUserId.
   */
  private async ensureRoom(input: {
    instanceId: string;
    channelId?: string | null;
    guildId?: string | null;
    hostUserId: string;
  }): Promise<{ room: GameRoom; created: boolean }> {
    const existing = await this.prisma.gameRoom.findUnique({
      where: { discordInstanceId: input.instanceId },
    });
    // Only fill channel/guild when the caller has them — undefined skips the column.
    const updateData = {
      ...(input.channelId != null ? { discordChannelId: input.channelId } : {}),
      ...(input.guildId != null ? { discordGuildId: input.guildId } : {}),
    };

    try {
      const room = await this.prisma.gameRoom.upsert({
        where: { discordInstanceId: input.instanceId },
        create: {
          discordInstanceId: input.instanceId,
          discordChannelId: input.channelId ?? null,
          discordGuildId: input.guildId ?? null,
          hostUserId: input.hostUserId,
        },
        update: updateData,
      });
      return { room, created: !existing };
    } catch (err) {
      // Parallel upserts can still race to P2002 on discordInstanceId.
      if (!isPrismaUniqueConflict(err)) throw err;
      const room = await this.prisma.gameRoom.findUnique({
        where: { discordInstanceId: input.instanceId },
      });
      if (!room) throw err;
      return { room, created: false };
    }
  }

  private async upsertRoomPlayer(roomId: string, userId: string, lastSeenAt: Date): Promise<void> {
    try {
      await this.prisma.roomPlayer.upsert({
        where: { roomId_userId: { roomId, userId } },
        create: { roomId, userId, lastSeenAt },
        update: { lastSeenAt },
      });
    } catch (err) {
      // Same user double-booting — row already exists; refresh presence.
      if (!isPrismaUniqueConflict(err)) throw err;
      await this.prisma.roomPlayer.update({
        where: { roomId_userId: { roomId, userId } },
        data: { lastSeenAt },
      });
    }
  }

  async join(
    user: User,
    input: { instanceId: string; channelId?: string | null; guildId?: string | null },
  ): Promise<PublicRoom> {
    const { room, created } = await this.ensureRoom({
      instanceId: input.instanceId,
      channelId: input.channelId,
      guildId: input.guildId,
      hostUserId: user.id,
    });

    await this.pruneStalePlayers(room.id);

    if (room.status === "playing") {
      const member = await this.prisma.roomPlayer.findUnique({
        where: { roomId_userId: { roomId: room.id, userId: user.id } },
      });
      if (!member) {
        const playerCount = await this.prisma.roomPlayer.count({ where: { roomId: room.id } });
        if (playerCount > 0) {
          this.logger.warn(
            `join rejected in-progress room=${room.id} instance=${shortInstanceId(input.instanceId)}`,
          );
          throw new ConflictException(ROOM_IN_PROGRESS_CODE);
        }
        // Everyone left mid-session — reclaim so a new party can lobby again.
        await this.prisma.gameRoom.update({
          where: { id: room.id },
          data: { status: "lobby", sessionKey: randomUUID() },
        });
        this.logger.log(`join reclaimed empty playing room=${room.id}`);
      }
    }

    const now = new Date();
    await this.upsertRoomPlayer(room.id, user.id, now);

    this.logger.log(
      `join ${created ? "created" : "joined"} room=${room.id} instance=${shortInstanceId(input.instanceId)}`,
    );

    const publicRoom = await this.loadPublic(room.id);
    // Fire-and-forget — never block sign-in on Realtime latency.
    void this.pingRealtime(input.instanceId, { kind: "roster" });
    return publicRoom;
  }

  async current(user: User, instanceId: string): Promise<PublicRoom> {
    const room = await this.requireMemberRoom(user.id, instanceId);
    await this.touchPresence(room.id, user.id);
    await this.pruneStalePlayers(room.id);
    return this.loadPublic(room.id);
  }

  /** Best-effort Activity close — idempotent if already gone. */
  async leave(user: User, instanceId: string): Promise<{ ok: true }> {
    const room = await this.prisma.gameRoom.findUnique({
      where: { discordInstanceId: instanceId },
    });
    if (!room) return { ok: true };
    await this.prisma.roomPlayer.deleteMany({
      where: { roomId: room.id, userId: user.id },
    });
    this.logger.log(`leave room=${room.id} instance=${shortInstanceId(instanceId)}`);
    void this.pingRealtime(instanceId, { kind: "roster" });
    return { ok: true };
  }

  async setIntent(user: User, instanceId: string, intent: RoomIntent): Promise<PublicRoom> {
    if (intent !== "none" && intent !== "continue" && intent !== "wrap_up" && intent !== "revote") {
      throw new BadRequestException("Invalid intent");
    }

    const room = await this.prisma.gameRoom.findUnique({
      where: { discordInstanceId: instanceId },
      include: {
        players: true,
        rounds: {
          orderBy: { index: "desc" },
          take: 1,
          include: { votes: true },
        },
      },
    });
    if (!room) throw new NotFoundException("Room not found");
    await this.assertMember(room.id, user.id);

    const latest = room.rounds[0] ?? null;
    if (room.status === "playing" && latest?.status === "voting") {
      throw new BadRequestException("Intent is not used while voting — cast a vote instead");
    }
    if (room.status === "finished") {
      throw new BadRequestException("Session is finished");
    }
    if (room.status === "lobby" && (intent === "wrap_up" || intent === "revote")) {
      throw new BadRequestException("Cannot wrap up or revote from lobby");
    }
    if (intent === "revote") {
      if (room.status !== "playing" || latest?.status !== "reveal") {
        throw new BadRequestException("Revote is only available after a tied reveal");
      }
      if (!isRoundTie(tallyVotes(latest.votes))) {
        throw new BadRequestException("Revote is only available when the round is tied");
      }
    }

    await this.prisma.roomPlayer.update({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
      data: { intent, lastSeenAt: new Date() },
    });

    // Fast path: if the roster already agrees to advance, skip prune until after fanout.
    // Otherwise prune first so a stale "none" cannot block Ready / continue.
    let players = await this.prisma.roomPlayer.findMany({ where: { roomId: room.id } });
    let allContinue =
      players.length >= MIN_PLAYERS && players.every((p) => p.intent === "continue");
    let allWrapUp =
      players.length >= MIN_PLAYERS && players.every((p) => p.intent === "wrap_up");
    let allRevote =
      players.length >= MIN_PLAYERS && players.every((p) => p.intent === "revote");
    const looksLikeAdvance =
      (allContinue && (room.status === "lobby" || latest?.status === "reveal")) ||
      (allWrapUp && latest?.status === "reveal") ||
      (allRevote && latest?.status === "reveal");
    let deferredPrune = false;
    if (looksLikeAdvance) {
      deferredPrune = true;
    } else {
      await this.pruneStalePlayers(room.id);
      players = await this.prisma.roomPlayer.findMany({ where: { roomId: room.id } });
      allContinue =
        players.length >= MIN_PLAYERS && players.every((p) => p.intent === "continue");
      allWrapUp =
        players.length >= MIN_PLAYERS && players.every((p) => p.intent === "wrap_up");
      allRevote =
        players.length >= MIN_PLAYERS && players.every((p) => p.intent === "revote");
    }

    let phaseAdvanced = false;
    let roundStart: Awaited<ReturnType<GameService["beginRound"]>> = null;
    if (allContinue && room.status === "lobby") {
      // Prompt bank is EN-only in MVP; Activity UI chrome stays en+pl separately.
      roundStart = await this.beginRound(room.id);
      phaseAdvanced = true;
    } else if (allContinue && room.status === "playing" && latest?.status === "reveal") {
      roundStart = await this.settleAndBeginRound(room.id);
      phaseAdvanced = true;
    } else if (allWrapUp && room.status === "playing" && latest?.status === "reveal") {
      const revealedInSession = await this.prisma.round.count({
        where: {
          roomId: room.id,
          sessionKey: room.sessionKey,
          status: { in: ["reveal", "done"] },
        },
      });
      if (revealedInSession < 1) {
        throw new BadRequestException("Need at least one reveal before wrapping up");
      }
      await this.settleRevealRound(room.id);
      await this.finishSession(room.id);
      phaseAdvanced = true;
    } else if (allRevote && room.status === "playing" && latest?.status === "reveal") {
      roundStart = await this.reopenTiedRound(room.id);
      phaseAdvanced = true;
    }

    // Wake peers as soon as the phase commit lands — don't wait for loadPublic.
    // After beginRound, fan out the public prompt so the first question is simultaneous.
    if (roundStart) {
      void this.pingRealtime(instanceId, {
        kind: "round",
        roundId: roundStart.roundId,
        roundIndex: roundStart.index,
        prompt: roundStart.prompt,
        serverTime: new Date().toISOString(),
      });
    } else if (phaseAdvanced) {
      void this.pingRealtime(instanceId, { kind: "roster" });
    }

    const publicRoom = await this.loadPublic(room.id);
    if (deferredPrune) {
      void this.pruneStalePlayers(room.id);
    }
    if (!phaseAdvanced) {
      // Don't await Realtime — peers should not wait on Nest→Supabase RTT.
      void this.pingRealtime(instanceId, {
        kind: "intent",
        intentUserId: user.id,
        intent,
      });
    }
    return publicRoom;
  }

  async vote(
    user: User,
    input: { roundId: string; targetUserId?: string; choice?: string; text?: string },
  ): Promise<PublicRoom> {
    const round = await this.prisma.round.findUnique({
      where: { id: input.roundId },
      include: { prompt: true, room: true },
    });
    if (!round || round.status !== "voting") throw new NotFoundException("Round is not open");
    await this.assertMember(round.roomId, user.id);

    if (round.prompt.kind === "most_likely") {
      if (!input.targetUserId || input.targetUserId === user.id) {
        throw new ForbiddenException("Vote for someone else");
      }
      await this.assertMember(round.roomId, input.targetUserId);
    }

    await this.prisma.vote.upsert({
      where: { roundId_voterId: { roundId: round.id, voterId: user.id } },
      create: {
        roundId: round.id,
        voterId: user.id,
        targetUserId: input.targetUserId ?? null,
        choice: input.choice ?? null,
        text: input.text?.slice(0, 280) ?? null,
      },
      update: {
        targetUserId: input.targetUserId ?? null,
        choice: input.choice ?? null,
        text: input.text?.slice(0, 280) ?? null,
      },
    });
    this.logger.log(`vote round=${round.id} room=${round.roomId}`);
    // #region agent log
    this.logger.log(`dbg-rt H2 vote_ping_immediate votedUserIdTail=${user.id.slice(-6)}`);
    // #endregion
    // Fire before counts/presence so peer badges do not wait on prune/DB round-trips.
    void this.pingRealtime(round.room.discordInstanceId, {
      kind: "vote",
      votedUserId: user.id,
      roundId: round.id,
    });

    const [playerCount, voteCount] = await Promise.all([
      this.prisma.roomPlayer.count({ where: { roomId: round.roomId } }),
      this.prisma.vote.count({ where: { roundId: round.id } }),
    ]);
    void this.pingRealtime(round.room.discordInstanceId, {
      kind: "vote",
      votedUserId: user.id,
      voteCount,
      roundId: round.id,
    });

    await this.touchPresence(round.roomId, user.id);
    await this.pruneStalePlayers(round.roomId);

    if (playerCount >= MIN_PLAYERS && voteCount >= playerCount) {
      const revealedAt = await this.revealRound(round.roomId);
      void this.pingRealtime(round.room.discordInstanceId, {
        kind: "reveal",
        revealedAt: revealedAt.toISOString(),
        serverTime: new Date().toISOString(),
        votedUserId: user.id,
        voteCount,
        roundId: round.id,
      });
    }

    return this.loadPublic(round.roomId);
  }

  async replay(user: User, instanceId: string): Promise<PublicRoom> {
    const room = await this.requireMemberRoom(user.id, instanceId);
    if (room.status !== "finished") {
      throw new ForbiddenException("Session is not finished");
    }
    const nextSession = randomUUID();
    await this.prisma.$transaction([
      this.prisma.gameRoom.update({
        where: { id: room.id },
        data: { status: "lobby", sessionKey: nextSession },
      }),
      this.prisma.roomPlayer.updateMany({
        where: { roomId: room.id },
        data: { score: 0, intent: "none" },
      }),
    ]);
    this.logger.log(`replay room=${room.id} instance=${shortInstanceId(instanceId)}`);
    const publicRoom = await this.loadPublic(room.id);
    await this.pingRealtime(instanceId, { kind: "roster" });
    return publicRoom;
  }

  private async beginRound(roomId: string): Promise<{
    roundId: string;
    index: number;
    prompt: PublicPrompt;
  } | null> {
    const locale = "en" as const;
    const room = await this.prisma.gameRoom.findUniqueOrThrow({ where: { id: roomId } });
    // One parallel wave: session used ids + max index + candidate bank (no count+skip RTT).
    const [sessionRounds, allRounds, candidates] = await Promise.all([
      this.prisma.round.findMany({
        where: { roomId, sessionKey: room.sessionKey },
        select: { promptId: true },
      }),
      this.prisma.round.findMany({
        where: { roomId },
        select: { index: true },
        orderBy: { index: "desc" },
        take: 1,
      }),
      this.prisma.prompt.findMany({
        where: { kind: "most_likely", locale },
      }),
    ]);
    const used = new Set(sessionRounds.map((r) => r.promptId));
    const unused = candidates.filter((p) => !used.has(p.id));
    if (unused.length === 0) {
      await this.finishSession(roomId);
      return null;
    }
    const prompt = unused[pickRandomOffset(unused.length)]!;

    const index = (allRounds[0]?.index ?? -1) + 1;
    const created = await this.prisma.$transaction(async (tx) => {
      await tx.gameRoom.update({
        where: { id: roomId },
        data: { status: "playing", locale },
      });
      const round = await tx.round.create({
        data: {
          roomId,
          promptId: prompt.id,
          sessionKey: room.sessionKey,
          index,
          status: "voting",
        },
        select: { id: true },
      });
      await tx.roomPlayer.updateMany({
        where: { roomId },
        data: { intent: "none" },
      });
      return round;
    });

    return {
      roundId: created.id,
      index,
      prompt: {
        id: prompt.id,
        kind: "most_likely",
        category: prompt.category,
        body: prompt.body,
        optionA: prompt.optionA,
        optionB: prompt.optionB,
      },
    };
  }

  /**
   * Continue after reveal: settle scores and open the next voting round in one transaction
   * so peers get `kind:round` sooner.
   */
  private async settleAndBeginRound(roomId: string): Promise<{
    roundId: string;
    index: number;
    prompt: PublicPrompt;
  } | null> {
    const locale = "en" as const;
    const round = await this.prisma.round.findFirst({
      where: { roomId, status: "reveal" },
      include: { votes: true, prompt: true },
      orderBy: { index: "desc" },
    });
    if (!round) return null;

    const [sessionRounds, candidates] = await Promise.all([
      this.prisma.round.findMany({
        where: { roomId, sessionKey: round.sessionKey },
        select: { promptId: true },
      }),
      this.prisma.prompt.findMany({
        where: { kind: "most_likely", locale },
      }),
    ]);
    const used = new Set(sessionRounds.map((r) => r.promptId));
    const unused = candidates.filter((p) => !used.has(p.id));
    if (unused.length === 0) {
      await this.settleRevealRound(roomId);
      await this.finishSession(roomId);
      return null;
    }
    const prompt = unused[pickRandomOffset(unused.length)]!;
    const index = round.index + 1;

    const created = await this.prisma.$transaction(async (tx) => {
      const stillReveal = await tx.round.findFirst({
        where: { id: round.id, status: "reveal" },
      });
      if (!stillReveal) return null;

      const increments = aggregateScoreIncrements(round.prompt.kind, round.votes);
      await Promise.all(
        [...increments.entries()].map(([userId, delta]) =>
          tx.roomPlayer.update({
            where: { roomId_userId: { roomId, userId } },
            data: { score: { increment: delta } },
          }),
        ),
      );
      await tx.round.update({ where: { id: round.id }, data: { status: "done" } });
      await tx.gameRoom.update({
        where: { id: roomId },
        data: { status: "playing", locale },
      });
      const next = await tx.round.create({
        data: {
          roomId,
          promptId: prompt.id,
          sessionKey: round.sessionKey,
          index,
          status: "voting",
        },
        select: { id: true },
      });
      await tx.roomPlayer.updateMany({
        where: { roomId },
        data: { intent: "none" },
      });
      return next;
    });

    if (!created) return null;

    return {
      roundId: created.id,
      index,
      prompt: {
        id: prompt.id,
        kind: "most_likely",
        category: prompt.category,
        body: prompt.body,
        optionA: prompt.optionA,
        optionB: prompt.optionB,
      },
    };
  }

  private async finishSession(roomId: string) {
    await this.prisma.$transaction([
      this.prisma.gameRoom.update({
        where: { id: roomId },
        data: { status: "finished" },
      }),
      this.prisma.roomPlayer.updateMany({
        where: { roomId },
        data: { intent: "none" },
      }),
    ]);
  }

  /** Lock votes for display — scores land when the party leaves reveal. */
  private async revealRound(roomId: string): Promise<Date> {
    const round = await this.prisma.round.findFirst({
      where: { roomId, status: "voting" },
      orderBy: { index: "desc" },
    });
    if (!round) throw new NotFoundException("Nothing to reveal");

    this.logger.log(`reveal start round=${round.id} room=${roomId}`);
    const revealedAt = new Date(Date.now() + REVEAL_SYNC_MS);

    await this.prisma.$transaction(async (tx) => {
      const stillVoting = await tx.round.findFirst({
        where: { id: round.id, status: "voting" },
      });
      if (!stillVoting) return;

      await tx.round.update({
        where: { id: round.id },
        data: {
          status: "reveal",
          revealedAt,
        },
      });
      await tx.roomPlayer.updateMany({
        where: { roomId },
        data: { intent: "none" },
      });
    });

    return revealedAt;
  }

  /** Apply +1s once, then mark the round settled so revote cannot double-score. */
  private async settleRevealRound(roomId: string) {
    const round = await this.prisma.round.findFirst({
      where: { roomId, status: "reveal" },
      include: { prompt: true, votes: true },
      orderBy: { index: "desc" },
    });
    if (!round) return;

    await this.prisma.$transaction(async (tx) => {
      const stillReveal = await tx.round.findFirst({
        where: { id: round.id, status: "reveal" },
      });
      if (!stillReveal) return;

      const increments = aggregateScoreIncrements(round.prompt.kind, round.votes);
      await Promise.all(
        [...increments.entries()].map(([userId, delta]) =>
          tx.roomPlayer.update({
            where: { roomId_userId: { roomId, userId } },
            data: { score: { increment: delta } },
          }),
        ),
      );
      await tx.round.update({ where: { id: round.id }, data: { status: "done" } });
    });
  }

  /** Keep the tied ballot for history; open a fresh voting round on the same prompt. */
  private async reopenTiedRound(roomId: string): Promise<{
    roundId: string;
    index: number;
    prompt: PublicPrompt;
  } | null> {
    const round = await this.prisma.round.findFirst({
      where: { roomId, status: "reveal" },
      include: { votes: true, prompt: true },
      orderBy: { index: "desc" },
    });
    if (!round) throw new NotFoundException("Nothing to revote");
    if (!isRoundTie(tallyVotes(round.votes))) {
      throw new BadRequestException("Revote is only available when the round is tied");
    }

    const index = round.index + 1;
    const created = await this.prisma.$transaction(async (tx) => {
      // Done without settleRevealRound — no points for a voided tie ballot.
      await tx.round.update({ where: { id: round.id }, data: { status: "done" } });
      const next = await tx.round.create({
        data: {
          roomId,
          promptId: round.promptId,
          sessionKey: round.sessionKey,
          index,
          status: "voting",
        },
        select: { id: true },
      });
      await tx.roomPlayer.updateMany({
        where: { roomId },
        data: { intent: "none" },
      });
      return next;
    });

    return {
      roundId: created.id,
      index,
      prompt: {
        id: round.prompt.id,
        kind: round.prompt.kind as PublicPrompt["kind"],
        category: round.prompt.category,
        body: round.prompt.body,
        optionA: round.prompt.optionA,
        optionB: round.prompt.optionB,
      },
    };
  }

  private async pingRealtime(
    discordInstanceId: string,
    patch?: {
      kind?: "vote" | "intent" | "roster" | "reveal" | "round";
      votedUserId?: string;
      voteCount?: number;
      intentUserId?: string;
      intent?: RoomIntent;
      revealedAt?: string;
      serverTime?: string;
      roundId?: string;
      roundIndex?: number;
      prompt?: {
        id: string;
        kind: string;
        category: string | null;
        body: string;
        optionA: string | null;
        optionB: string | null;
      };
    },
  ) {
    // Supabase Realtime Broadcast via Discord `/sb` mapping (public vote/intent patch).
    await this.realtime?.notifyRoomChanged(discordInstanceId, patch);
  }

  private async pruneStalePlayers(roomId: string) {
    const room = await this.prisma.gameRoom.findUnique({
      where: { id: roomId },
      select: { status: true },
    });
    const staleMs = room?.status === "playing" ? PRESENCE_STALE_PLAYING_MS : PRESENCE_STALE_MS;
    await this.prisma.roomPlayer.deleteMany({
      where: {
        roomId,
        lastSeenAt: { lt: new Date(Date.now() - staleMs) },
      },
    });
  }

  private async touchPresence(roomId: string, userId: string) {
    await this.prisma.roomPlayer.updateMany({
      where: { roomId, userId },
      data: { lastSeenAt: new Date() },
    });
  }

  private async requireMemberRoom(userId: string, instanceId: string) {
    const room = await this.prisma.gameRoom.findUnique({
      where: { discordInstanceId: instanceId },
    });
    if (!room) throw new NotFoundException("Room not found");
    await this.assertMember(room.id, userId);
    return room;
  }

  private async assertMember(roomId: string, userId: string) {
    const row = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!row) throw new ForbiddenException("Not in this room");
  }

  private async loadPublic(roomId: string): Promise<PublicRoom> {
    const room = await this.prisma.gameRoom.findUniqueOrThrow({
      where: { id: roomId },
      include: {
        players: { include: { user: true }, orderBy: { createdAt: "asc" } },
        rounds: {
          include: { prompt: true, votes: true },
          orderBy: { index: "desc" },
          take: 1,
        },
      },
    });
    const round = room.rounds[0] ?? null;
    const showResults = clientVisibleRoundResults(round?.status);
    const voting = round != null && round.status === "voting";
    const voterIds = voting ? new Set(round.votes.map((v) => v.voterId)) : null;
    const sessionRoundCount = await this.prisma.round.count({
      where: {
        roomId,
        sessionKey: room.sessionKey,
        status: { in: ["reveal", "done"] },
      },
    });
    const serverTime = new Date();

    return {
      id: room.id,
      status: room.status,
      category: room.category,
      hostUserId: room.hostUserId,
      sessionKey: room.sessionKey,
      sessionRoundCount,
      serverTime: serverTime.toISOString(),
      players: room.players.map((p) => ({
        userId: p.userId,
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl,
        score: clientVisibleScore(room.status, p.score),
        intent: p.intent as RoomIntent,
        hasVoted: voterIds ? voterIds.has(p.userId) : false,
      })),
      round: round
        ? {
            id: round.id,
            index: round.index,
            status: round.status,
            revealedAt: round.revealedAt ? round.revealedAt.toISOString() : null,
            prompt: {
              id: round.prompt.id,
              kind: round.prompt.kind,
              category: round.prompt.category,
              body: round.prompt.body,
              optionA: round.prompt.optionA,
              optionB: round.prompt.optionB,
            },
            voteCount: round.votes.length,
            results: showResults
              ? {
                  tallies: tallyVotes(round.votes),
                  answers: round.votes
                    .filter((v) => v.text)
                    .map((v) => ({ userId: v.voterId, text: v.text as string })),
                }
              : undefined,
          }
        : null,
    };
  }
}
