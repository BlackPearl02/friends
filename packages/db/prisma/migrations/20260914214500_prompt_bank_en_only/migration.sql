-- MVP prompt bank is English-only. UI chrome stays en+pl in the Activity app.
-- Rounds that still point at non-EN prompts are dropped (votes cascade) so the
-- bank cleanup can proceed; low-activity MVP history only.

DELETE FROM "Round"
WHERE "promptId" IN (SELECT id FROM "Prompt" WHERE locale <> 'en');

UPDATE "GameRoom" SET locale = 'en' WHERE locale <> 'en';

DELETE FROM "Prompt" WHERE locale <> 'en';

ALTER TABLE "GameRoom" DROP CONSTRAINT "GameRoom_locale_supported_check";
ALTER TABLE "Prompt" DROP CONSTRAINT "Prompt_locale_supported_check";

ALTER TABLE "GameRoom"
  ADD CONSTRAINT "GameRoom_locale_en_only_check"
  CHECK ("locale" = 'en');

ALTER TABLE "Prompt"
  ADD CONSTRAINT "Prompt_locale_en_only_check"
  CHECK ("locale" = 'en');
