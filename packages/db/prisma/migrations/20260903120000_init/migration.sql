-- CreateSchema
CREATE TYPE "PromptKind" AS ENUM ('most_likely', 'this_or_that', 'truth', 'challenge');
CREATE TYPE "PromptCategory" AS ENUM ('party', 'family', 'colleagues', 'spicy');
CREATE TYPE "RoomStatus" AS ENUM ('lobby', 'playing', 'finished');
CREATE TYPE "RoundStatus" AS ENUM ('voting', 'reveal', 'done');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GameRoom" (
    "id" TEXT NOT NULL,
    "discordInstanceId" TEXT NOT NULL,
    "discordChannelId" TEXT,
    "discordGuildId" TEXT,
    "hostUserId" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'lobby',
    "category" "PromptCategory",
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GameRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomPlayer" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoomPlayer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "kind" "PromptKind" NOT NULL,
    "category" "PromptCategory" NOT NULL,
    "locale" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "optionA" TEXT,
    "optionB" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'voting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "choice" TEXT,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
CREATE UNIQUE INDEX "GameRoom_discordInstanceId_key" ON "GameRoom"("discordInstanceId");
CREATE INDEX "GameRoom_hostUserId_idx" ON "GameRoom"("hostUserId");
CREATE UNIQUE INDEX "RoomPlayer_roomId_userId_key" ON "RoomPlayer"("roomId", "userId");
CREATE INDEX "RoomPlayer_userId_idx" ON "RoomPlayer"("userId");
CREATE INDEX "Prompt_category_locale_kind_idx" ON "Prompt"("category", "locale", "kind");
CREATE UNIQUE INDEX "Round_roomId_index_key" ON "Round"("roomId", "index");
CREATE INDEX "Round_promptId_idx" ON "Round"("promptId");
CREATE UNIQUE INDEX "Vote_roundId_voterId_key" ON "Vote"("roundId", "voterId");
CREATE INDEX "Vote_voterId_idx" ON "Vote"("voterId");

ALTER TABLE "GameRoom" ADD CONSTRAINT "GameRoom_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoomPlayer" ADD CONSTRAINT "RoomPlayer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomPlayer" ADD CONSTRAINT "RoomPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Round" ADD CONSTRAINT "Round_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Round" ADD CONSTRAINT "Round_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
