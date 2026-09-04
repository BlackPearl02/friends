-- AlterTable
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Vote_targetUserId_idx" ON "Vote"("targetUserId");
