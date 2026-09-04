import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { User } from "@friends/db";
import type { PublicRoom, RoomIntent } from "@friends/types";
import { PrismaService } from "../prisma/prisma.service";
import { clientVisibleRoundResults, clientVisibleScore } from "./public-room-mask";
import { scoreDelta, scoreForVoter } from "./scoring";


const MIN_PLAYERS = 2;

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

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

    await this.prisma.roomPlayer.upsert({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
      create: { roomId: room.id, userId: user.id },
      update: {},
    });

    return this.loadPublic(room.id);
  }

  async current(user: User, instanceId: string): Promise<PublicRoom> {
    const room = await this.requireMemberRoom(user.id, instanceId);
    return this.loadPublic(room.id);
  }

  async setIntent(user: User, instanceId: string, intent: RoomIntent): Promise<PublicRoom> {
    if (intent !== "none" && intent !== "continue" && intent !== "wrap_up") {
      throw new BadRequestException("Invalid intent");
    }

    const room = await this.prisma.gameRoom.findUnique({
      where: { discordInstanceId: instanceId },
      include: {
        players: true,
        rounds: { orderBy: { index: "desc" }, take: 1 },
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
    if (room.status === "lobby" && intent === "wrap_up") {
      throw new BadRequestException("Cannot wrap up from lobby");
    }

    await this.prisma.roomPlayer.update({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
      data: { intent },
    });

    const players = await this.prisma.roomPlayer.findMany({ where: { roomId: room.id } });
    const allContinue =
      players.length >= MIN_PLAYERS && players.every((p) => p.intent === "continue");
    const allWrapUp =
      players.length >= MIN_PLAYERS && players.every((p) => p.intent === "wrap_up");

    if (allContinue && room.status === "lobby") {
      await this.beginRound(room.id, (room.locale as "en" | "pl") || "en");
    } else if (allContinue && room.status === "playing" && latest?.status === "reveal") {
      await this.beginRound(room.id, (room.locale as "en" | "pl") || "en");
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
      await this.finishSession(room.id);
    }

    return this.loadPublic(room.id);
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

    const [playerCount, voteCount] = await Promise.all([
      this.prisma.roomPlayer.count({ where: { roomId: round.roomId } }),
      this.prisma.vote.count({ where: { roundId: round.id } }),
    ]);
    if (playerCount >= MIN_PLAYERS && voteCount >= playerCount) {
      await this.revealRound(round.roomId);
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
    return this.loadPublic(room.id);
  }

  private async beginRound(roomId: string, locale: "en" | "pl") {
    const room = await this.prisma.gameRoom.findUniqueOrThrow({ where: { id: roomId } });
    const sessionRounds = await this.prisma.round.findMany({
      where: { roomId, sessionKey: room.sessionKey },
      select: { promptId: true },
    });
    const allRounds = await this.prisma.round.findMany({
      where: { roomId },
      select: { index: true },
      orderBy: { index: "desc" },
      take: 1,
    });
    const prompt = await this.prisma.prompt.findFirst({
      where: {
        kind: "most_likely",
        locale,
        id: { notIn: sessionRounds.map((r) => r.promptId) },
      },
      orderBy: { id: "asc" },
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

  private async revealRound(roomId: string) {
    const round = await this.prisma.round.findFirst({
      where: { roomId, status: "voting" },
      include: { prompt: true, votes: true },
      orderBy: { index: "desc" },
    });
    if (!round) throw new NotFoundException("Nothing to reveal");

    await this.prisma.$transaction(async (tx) => {
      const stillVoting = await tx.round.findFirst({
        where: { id: round.id, status: "voting" },
      });
      if (!stillVoting) return;

      for (const vote of round.votes) {
        const target = scoreDelta(round.prompt.kind, vote);
        if (target) {
          await tx.roomPlayer.update({
            where: { roomId_userId: { roomId, userId: target.userId } },
            data: { score: { increment: target.delta } },
          });
        }
        const voterPts = scoreForVoter(round.prompt.kind, vote);
        if (voterPts) {
          await tx.roomPlayer.update({
            where: { roomId_userId: { roomId, userId: vote.voterId } },
            data: { score: { increment: voterPts } },
          });
        }
      }
      await tx.round.update({ where: { id: round.id }, data: { status: "reveal" } });
      await tx.roomPlayer.updateMany({
        where: { roomId },
        data: { intent: "none" },
      });
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
    const showResults =
      clientVisibleRoundResults() && round != null && round.status !== "voting";
    const voting = round != null && round.status === "voting";
    const voterIds = voting ? new Set(round.votes.map((v) => v.voterId)) : null;
    const sessionRoundCount = await this.prisma.round.count({
      where: {
        roomId,
        sessionKey: room.sessionKey,
        status: { in: ["reveal", "done"] },
      },
    });

    return {
      id: room.id,
      status: room.status,
      category: room.category,
      hostUserId: room.hostUserId,
      sessionKey: room.sessionKey,
      sessionRoundCount,
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
                  tallies: round.votes.reduce<Record<string, number>>((acc, v) => {
                    const key = v.targetUserId ?? v.choice ?? v.voterId;
                    if (!key) return acc;
                    acc[key] = (acc[key] ?? 0) + 1;
                    return acc;
                  }, {}),
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
