-- Integrity checks mirroring API rules + unique prompt bank rows.

CREATE UNIQUE INDEX "Prompt_locale_kind_body_key" ON "Prompt"("locale", "kind", "body");

ALTER TABLE "Vote"
  ADD CONSTRAINT "Vote_no_self_target_check"
  CHECK ("targetUserId" IS NULL OR "targetUserId" <> "voterId");

ALTER TABLE "RoomPlayer"
  ADD CONSTRAINT "RoomPlayer_score_nonnegative_check"
  CHECK ("score" >= 0);

ALTER TABLE "Round"
  ADD CONSTRAINT "Round_index_nonnegative_check"
  CHECK ("index" >= 0);

ALTER TABLE "User"
  ADD CONSTRAINT "User_displayName_length_check"
  CHECK (char_length("displayName") BETWEEN 1 AND 80);

ALTER TABLE "Vote"
  ADD CONSTRAINT "Vote_text_length_check"
  CHECK ("text" IS NULL OR char_length("text") <= 280);

ALTER TABLE "Prompt"
  ADD CONSTRAINT "Prompt_body_nonempty_check"
  CHECK (char_length(trim("body")) > 0);

ALTER TABLE "GameRoom"
  ADD CONSTRAINT "GameRoom_locale_supported_check"
  CHECK ("locale" IN ('en', 'pl'));

ALTER TABLE "Prompt"
  ADD CONSTRAINT "Prompt_locale_supported_check"
  CHECK ("locale" IN ('en', 'pl'));
