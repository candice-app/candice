-- Migration 88 — knowledge_evidences : `dims` + `rank` (sémantique attention, journal autorité).
--
-- Décision (19 oct) : attention_reception / attention_expression doivent être RECONSTRUCTIBLES
-- depuis le journal seul — sinon le journal n'est pas l'autorité, c'est un second log parallèle
-- (hsg §47bis.3). Le vecteur se calcule, par question, depuis les DIMENSIONS affectives de chaque
-- option choisie (`dims`), pondérées par l'ORDRE de sélection (`rank` 1→poids 5, 2→3, 3→1).
--
-- `dims` et `rank` sont de la SÉMANTIQUE (le passage option → dimensions affectives), PAS de la
-- présentation : ils viennent du mapping V15, ne sont pas inventés. Ajout ADDITIF, NULLABLE
-- (seul le domaine attention les remplit ; les autres familles restent à NULL).
--
-- knowledge_evidences est VIDE en prod (aucune production câblée hors flag off) → sûr.

BEGIN;

ALTER TABLE knowledge_evidences ADD COLUMN dims text[];                 -- dimensions affectives (attention)
ALTER TABLE knowledge_evidences ADD COLUMN rank smallint;              -- ordre de sélection 1..3 (attention)
ALTER TABLE knowledge_evidences ADD CONSTRAINT kev_rank_range
  CHECK (rank IS NULL OR rank BETWEEN 1 AND 3);

-- DERNIÈRE INSTRUCTION — auto-enregistrement (convention permanente depuis la 84).
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-88-evidence-dims-rank.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
