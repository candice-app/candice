-- Migration 56 — arbitrage Estelle A.3 : textes de questions VERROUILLÉS.
--
-- Un texte que Estelle verrouille est un texte que personne ne réécrit —
-- pas même Candice : locked_text = true → la reformulation Haiku est
-- désactivée, le texte de la banque est servi mot pour mot.
-- La personnalisation reste active pour les autres questions (avec la
-- règle anti-lyrisme).
--
-- Additive uniquement.

ALTER TABLE discovery_questions ADD COLUMN IF NOT EXISTS locked_text BOOLEAN NOT NULL DEFAULT false;

-- Textes validés mot pour mot par Estelle (banque parfums, migration 53)
UPDATE discovery_questions SET locked_text = true
WHERE question_key IN (
  'fragrance.perfume_risk',
  'fragrance.families',
  'fragrance.scent_deal_breakers'
);
