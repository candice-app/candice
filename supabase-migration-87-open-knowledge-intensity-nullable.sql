-- Migration 87 — knowledge_open_knowledge.intensity : NOT NULL → NULLABLE.
--
-- La 82 a créé la colonne en `text NOT NULL CHECK (intensity IN ('weak','moderate','strong'))`.
-- Décision du 9 oct (cf. OpenKnowledge.intensity, InterestEvidence.relationship avant elle) :
-- l'intensité est une donnée DÉCLARÉE facultative. L'incognito I7 (support_modality) la laisse
-- NON RENSEIGNÉE — « l'écoute semble lui faire du bien », sans dire à quel point. Sous la forme
-- actuelle, la première écriture d'un OpenKnowledge I7 (intensity NULL) serait rejetée par le
-- NOT NULL : le câblage de produceIncognitoOption casserait à la première écriture réelle.
--
-- Correctif : intensity devient NULLABLE ; l'absence vaut « non renseignée », JAMAIS une valeur
-- de repli (aucun défaut 'weak'/'moderate' nulle part, ni en base ni dans la projection rows.ts
-- qui mappe déjà undefined → NULL). Le CHECK tolère explicitement NULL, comme knowledge_facts
-- l'a fait en 83 (IS NULL OR IN …).
--
-- knowledge_open_knowledge est VIDE aujourd'hui (créée en 82, aucune production câblée) → le
-- changement est sûr, aucune ligne existante à requalifier.

BEGIN;

ALTER TABLE knowledge_open_knowledge ALTER COLUMN intensity DROP NOT NULL;

ALTER TABLE knowledge_open_knowledge DROP CONSTRAINT IF EXISTS knowledge_open_knowledge_intensity_check;
ALTER TABLE knowledge_open_knowledge
  ADD CONSTRAINT kok_intensity CHECK (intensity IS NULL OR intensity IN ('weak','moderate','strong'));

-- DERNIÈRE INSTRUCTION — auto-enregistrement (convention permanente depuis la 84).
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-87-open-knowledge-intensity-nullable.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
