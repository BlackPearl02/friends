-- AlterTable
ALTER TABLE "Prompt" ALTER COLUMN "category" DROP NOT NULL;

-- DropIndex
DROP INDEX "Prompt_category_locale_kind_idx";

-- CreateIndex
CREATE INDEX "Prompt_locale_kind_idx" ON "Prompt"("locale", "kind");
