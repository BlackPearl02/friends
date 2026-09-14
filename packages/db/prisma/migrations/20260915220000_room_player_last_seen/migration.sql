-- AlterTable
ALTER TABLE "RoomPlayer" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "RoomPlayer_roomId_lastSeenAt_idx" ON "RoomPlayer"("roomId", "lastSeenAt");
