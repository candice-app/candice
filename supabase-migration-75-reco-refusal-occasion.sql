-- Migration 75 — reco_refusals.reserved_for_occasion (§3.4, option « Je la garde pour une occasion »).
-- Distingue le décalage TEMPOREL (reappear_at = date, réapparition PARESSEUSE par le temps)
-- de la mise en RÉSERVE conditionnelle : pas de date, réveil par un ÉVÉNEMENT à venir
-- (anniversaire, célébration, jalon). Ne jamais forcer une date arbitraire sur ce cas —
-- ce serait une fausse donnée. Additive ; RLS owner-only inchangée.

ALTER TABLE reco_refusals ADD COLUMN IF NOT EXISTS reserved_for_occasion boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN reco_refusals.reserved_for_occasion IS
  'true = « gardée pour une occasion » : mise en réserve SANS date (reappear_at NULL), réveillée par un événement à venir (anniversaire/célébration/jalon), pas par le temps qui passe. Horizons 1-3 = reappear_at (date). Option 4 = ce flag. Le réveil événementiel relève du moteur de reco (lot futur).';
