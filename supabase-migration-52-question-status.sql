-- Migration 52 — Refonte Profil V2, Phase B : statut par micro-question et par user.
--
-- Cycle de vie : not_started → answered / skipped ; outdated et
-- needs_precision (posés par de futurs jobs de fraîcheur) redeviennent
-- proposables ; archived ne réapparaît jamais.
-- Règles produit :
--   • answered / archived ne réapparaissent JAMAIS sur AUCUN chemin —
--     answered devient « Modifier ma réponse » côté UI.
--   • La présence d'une donnée en fiche rétro-alimente answered
--     (écrit par la couche serveur, src/lib/discovery/status.ts).
--
-- Additive : colonne + backfill dérivé de l'existant (is_filled / skipped_count).
-- RLS : la table profile_completion est déjà protégée (users_own_completion,
-- FOR ALL USING auth.uid() = user_id — migration 29). Aucune nouvelle policy requise.

ALTER TABLE profile_completion ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_started';

ALTER TABLE profile_completion DROP CONSTRAINT IF EXISTS profile_completion_status_check;
ALTER TABLE profile_completion ADD CONSTRAINT profile_completion_status_check
  CHECK (status IN ('not_started', 'answered', 'skipped', 'outdated', 'needs_precision', 'archived'));

-- Backfill depuis l'état v1 : is_filled = répondu via Discovery ;
-- skipped_count > 0 = passé ; sinon la question a seulement été posée.
UPDATE profile_completion
SET status = CASE
  WHEN is_filled THEN 'answered'
  WHEN skipped_count > 0 THEN 'skipped'
  ELSE 'not_started'
END
WHERE status = 'not_started';

CREATE INDEX IF NOT EXISTS idx_profile_completion_status
  ON profile_completion (user_id, status);
