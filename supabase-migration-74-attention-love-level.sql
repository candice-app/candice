-- Migration 74 — attention_log.love_level (satisfaction §3.3).
-- « Déjà offert → il a aimé ? » → échelle de love en TEXTE premium (pas d'emoji) :
-- un_peu / beaucoup / enormement. Distincte de feedback (juste/a_cote/pas_le_moment = timing).
-- Additive ; RLS existante owner-only (user_id = auth.uid()) inchangée.

ALTER TABLE attention_log ADD COLUMN IF NOT EXISTS love_level text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='attention_log_love_level_check') THEN
    ALTER TABLE attention_log ADD CONSTRAINT attention_log_love_level_check
      CHECK (love_level IS NULL OR love_level IN ('un_peu','beaucoup','enormement'));
  END IF;
END $$;
