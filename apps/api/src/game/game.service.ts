import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { User } from "@friends/db";
import type { PublicRoom, PromptCategory } from "@friends/types";
import { PrismaService } from "../prisma/prisma.service";
import { scoreDelta, scoreForVoter } from "./scoring";

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
    const room = await this.prisma.gameRoom.findUnique({
      where: { discordInstanceId: instanceId },
    });
    if (!room) throw new NotFoundException("Room not found");
    await this.assertMember(room.id, user.id);
    return this.loadPublic(room.id);
  }

  async start(user: User, instanceId: string, category: PromptCategory, locale: "en" | "pl" = "en"): Promise<PublicRoom> {
    const room = await this.requireHost(user.id, instanceId);
    const used = await this.prisma.round.findMany({
      where: { roomId: room.id },
      select: { promptId: true },
    });
    const prompt = await this.prisma.prompt.findFirst({
      where: {
        category,
        locale,
        id: { notIn: used.map((r) => r.promptId) },
      },
      orderBy: { id: "asc" },
    });
    if (!prompt) throw new NotFoundException("No prompts left for this pack");

    const index = used.length;
    await this.prisma.$transaction([
      this.prisma.gameRoom.update({
        where: { id: room.id },
        data: { status: "playing", category, locale },
      }),
      this.prisma.round.create({
        data: { roomId: room.id, promptId: prompt.id, index, status: "voting" },
      }),
    ]);
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
    return this.loadPublic(round.roomId);
  }

  async reveal(user: User, instanceId: string): Promise<PublicRoom> {
    const room = await this.requireHost(user.id, instanceId);
    const round = await this.prisma.round.findFirst({
      where: { roomId: room.id, status: "voting" },
      include: { prompt: true, votes: true },
      orderBy: { index: "desc" },
    });
    if (!round) throw new NotFoundException("Nothing to reveal");

    await this.prisma.$transaction(async (tx) => {
      for (const vote of round.votes) {
        const target = scoreDelta(round.prompt.kind, vote);
        if (target) {
          await tx.roomPlayer.update({
            where: { roomId_userId: { roomId: room.id, userId: target.userId } },
            data: { score: { increment: target.delta } },
          });
        }
        const voterPts = scoreForVoter(round.prompt.kind, vote);
        if (voterPts) {
          await tx.roomPlayer.update({
            where: { roomId_userId: { roomId: room.id, userId: vote.voterId } },
            data: { score: { increment: voterPts } },
          });
        }
      }
      await tx.round.update({ where: { id: round.id }, data: { status: "reveal" } });
    });

    return this.loadPublic(room.id);
  }

  private async requireHost(userId: string, instanceId: string) {
    const room = await this.prisma.gameRoom.findUnique({
      where: { discordInstanceId: instanceId },
    });
    if (!room) throw new NotFoundException("Room not found");
    if (room.hostUserId !== userId) throw new ForbiddenException("Host only");
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
    const showResults = round != null && round.status !== "voting";

    return {
      id: room.id,
      status: room.status,
      category: room.category,
      hostUserId: room.hostUserId,
      players: room.players.map((p) => ({
        userId: p.userId,
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl,
        score: p.score,
        isHost: p.userId === room.hostUserId,
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
