import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { User } from "@friends/db";
import type { PublicRoom, RoomIntent } from "@friends/types" with { "resolution-mode": "import" };
import { PrismaService } from "../prisma/prisma.service";
import { pickRandomOffset } from "./pick-random";
import { PRESENCE_STALE_MS, PRESENCE_STALE_PLAYING_MS } from "./presence";
import { clientVisibleRoundResults, clientVisibleScore } from "./public-room-mask";
import { ROOM_IN_PROGRESS_CODE } from "./room-codes";
import { isRoundTie, tallyVotes } from "./round-results";
import { REVEAL_SYNC_MS } from "./reveal-sync";
import { RoomPartyService } from "./room-party.service";
import { aggregateScoreIncrements } from "./scoring";

const MIN_PLAYERS = 2;

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly party?: RoomPartyService,
  ) {}

  async join(
    user: User,
    input: { instanceId: string; channelId?: string | null; guildId?: string | null },
  ): Promise<PublicRoom> {
    const existing = await this.prisma.gameRoom.findUnique({
      where: { discordInstanceId: input.instanceId },
    });
    const room = existing
      ? existing
      : await this.prisma.gameRoom.create({
          data: {
            discordInstanceId: input.instanceId,
            discordChannelId: input.channelId ?? null,
            discordGuildId: input.guildId ?? null,
            hostUserId: user.id,
          },
        });

    await this.pruneStalePlayers(room.id);

    if (room.status === "playing") {
      const member = await this.prisma.roomPlayer.findUnique({
        where: { roomId_userId: { roomId: room.id, userId: user.id } },
      });
      if (!member) {
        const playerCount = await this.prisma.roomPlayer.count({ where: { roomId: room.id } });
        if (playerCount > 0) {
          throw new ConflictException(ROOM_IN_PROGRESS_CODE);
        }
        // Everyone left mid-session — reclaim so a new party can lobby again.
        await this.prisma.gameRoom.update({
          where: { id: room.id },
          data: { status: "lobby", sessionKey: randomUUID() },
        });
      }
    }

    const now = new Date();
    await this.prisma.roomPlayer.upsert({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
      create: { roomId: room.id, userId: user.id, lastSeenAt: now },
      update: { lastSeenAt: now },
    });

    const publicRoom = await this.loadPublic(room.id);
    await this.pingRealtime(input.instanceId, { kind: "roster" });
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
    await this.pingRealtime(instanceId, { kind: "roster" });
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
    await this.pruneStalePlayers(room.id);

    const players = await this.prisma.roomPlayer.findMany({ where: { roomId: room.id } });
    const allContinue =
      players.length >= MIN_PLAYERS && players.every((p) => p.intent === "continue");
    const allWrapUp =
      players.length >= MIN_PLAYERS && players.every((p) => p.intent === "wrap_up");
    const allRevote =
      players.length >= MIN_PLAYERS && players.every((p) => p.intent === "revote");

    if (allContinue && room.status === "lobby") {
      // Prompt bank is EN-only in MVP; Activity UI chrome stays en+pl separately.
      await this.beginRound(room.id);
    } else if (allContinue && room.status === "playing" && latest?.status === "reveal") {
      await this.settleRevealRound(room.id);
      await this.beginRound(room.id);
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
    } else if (allRevote && room.status === "playing" && latest?.status === "reveal") {
      await this.reopenTiedRound(room.id);
    }

    const publicRoom = await this.loadPublic(room.id);
    await this.pingRealtime(instanceId, {
      kind: "intent",
      intentUserId: user.id,
      intent,
    });
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
    await this.touchPresence(round.roomId, user.id);
    await this.pruneStalePlayers(round.roomId);

    const [playerCount, voteCount] = await Promise.all([
      this.prisma.roomPlayer.count({ where: { roomId: round.roomId } }),
      this.prisma.vote.count({ where: { roundId: round.id } }),
    ]);
    // Ping peers before heavy loadPublic so badges move even if GET is cold.
    await this.pingRealtime(round.room.discordInstanceId, {
      kind: "vote",
      votedUserId: user.id,
      voteCount,
    });

    if (playerCount >= MIN_PLAYERS && voteCount >= playerCount) {
      await this.revealRound(round.roomId);
      await this.pingRealtime(round.room.discordInstanceId, {
        kind: "vote",
        votedUserId: user.id,
        voteCount,
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
    const publicRoom = await this.loadPublic(room.id);
    await this.pingRealtime(instanceId, { kind: "roster" });
    return publicRoom;
  }

  private async beginRound(roomId: string) {
    const locale = "en" as const;
    const room = await this.prisma.gameRoom.findUniqueOrThrow({ where: { id: roomId } });
    const [sessionRounds, allRounds] = await Promise.all([
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
    ]);
    // Random unused most_likely — fixed id order made every night feel identical.
    const unusedWhere = {
      kind: "most_likely" as const,
      locale,
      id: { notIn: sessionRounds.map((r) => r.promptId) },
    };
    const remaining = await this.prisma.prompt.count({ where: unusedWhere });
    if (remaining === 0) {
      await this.finishSession(roomId);
      return;
    }
    const prompt = await this.prisma.prompt.findFirst({
      where: unusedWhere,
      skip: pickRandomOffset(remaining),
    });
    if (!prompt) {
      await this.finishSession(roomId);
      return;
    }

    const index = (allRounds[0]?.index ?? -1) + 1;
    await this.prisma.$transaction([
      this.prisma.gameRoom.update({
        where: { id: roomId },
        data: { status: "playing", locale },
      }),
      this.prisma.round.create({
        data: {
          roomId,
          promptId: prompt.id,
          sessionKey: room.sessionKey,
          index,
          status: "voting",
        },
      }),
      this.prisma.roomPlayer.updateMany({
        where: { roomId },
        data: { intent: "none" },
      }),
    ]);
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
  private async revealRound(roomId: string) {
    const round = await this.prisma.round.findFirst({
      where: { roomId, status: "voting" },
      orderBy: { index: "desc" },
    });
    if (!round) throw new NotFoundException("Nothing to reveal");

    await this.prisma.$transaction(async (tx) => {
      const stillVoting = await tx.round.findFirst({
        where: { id: round.id, status: "voting" },
      });
      if (!stillVoting) return;

      await tx.round.update({
        where: { id: round.id },
        data: {
          status: "reveal",
          revealedAt: new Date(Date.now() + REVEAL_SYNC_MS),
        },
      });
      await tx.roomPlayer.updateMany({
        where: { roomId },
        data: { intent: "none" },
      });
    });
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
  private async reopenTiedRound(roomId: string) {
    const round = await this.prisma.round.findFirst({
      where: { roomId, status: "reveal" },
      include: { votes: true },
      orderBy: { index: "desc" },
    });
    if (!round) throw new NotFoundException("Nothing to revote");
    if (!isRoundTie(tallyVotes(round.votes))) {
      throw new BadRequestException("Revote is only available when the round is tied");
    }

    await this.prisma.$transaction([
      // Done without settleRevealRound — no points for a voided tie ballot.
      this.prisma.round.update({ where: { id: round.id }, data: { status: "done" } }),
      this.prisma.round.create({
        data: {
          roomId,
          promptId: round.promptId,
          sessionKey: round.sessionKey,
          index: round.index + 1,
          status: "voting",
        },
      }),
      this.prisma.roomPlayer.updateMany({
        where: { roomId },
        data: { intent: "none" },
      }),
    ]);
  }

  private async pingRealtime(
    discordInstanceId: string,
    patch?: {
      kind?: "vote" | "intent" | "roster";
      votedUserId?: string;
      voteCount?: number;
      intentUserId?: string;
      intent?: RoomIntent;
    },
  ) {
    await this.party?.notifyRoomChanged(discordInstanceId, patch);
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
        players: { include: { user: true } },
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
