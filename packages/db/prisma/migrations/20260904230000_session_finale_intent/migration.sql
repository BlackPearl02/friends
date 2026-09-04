-- CreateEnum
CREATE TYPE "RoomIntent" AS ENUM ('none', 'continue', 'wrap_up');

-- AlterTable GameRoom
ALTER TABLE "GameRoom" ADD COLUMN "sessionKey" TEXT;

UPDATE "GameRoom" SET "sessionKey" = gen_random_uuid()::text WHERE "sessionKey" IS NULL;

ALTER TABLE "GameRoom" ALTER COLUMN "sessionKey" SET NOT NULL;

-- AlterTable Round
ALTER TABLE "Round" ADD COLUMN "sessionKey" TEXT;

UPDATE "Round" r
SET "sessionKey" = g."sessionKey"
FROM "GameRoom" g
WHERE r."roomId" = g."id" AND r."sessionKey" IS NULL;

ALTER TABLE "Round" ALTER COLUMN "sessionKey" SET NOT NULL;

CREATE INDEX "Round_roomId_sessionKey_idx" ON "Round"("roomId", "sessionKey");

-- AlterTable RoomPlayer: ready -> intent
ALTER TABLE "RoomPlayer" ADD COLUMN "intent" "RoomIntent" NOT NULL DEFAULT 'none';

UPDATE "RoomPlayer" SET "intent" = 'continue' WHERE "ready" = true;

ALTER TABLE "RoomPlayer" DROP COLUMN "ready";
