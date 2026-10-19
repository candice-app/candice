-- Migration 89 — knowledge_evidences : `projection_bridge` (PONT de projection legacy, lot B).
--
-- Décision (19 oct, condition A#3) : certaines projections (temperament_axes, lifestyle_axes) se
-- calculent depuis des `deltas` d'AXES qui sont L'ANCIEN DICTIONNAIRE — pas de la sémantique
-- canonique. Les graver comme evidence mettrait la sortie du vieux dictionnaire à côté du nouveau.
-- On les met donc dans un champ NOMMÉ COMME UN PONT : `projection_bridge` (jsonb). Il est INTERDIT
-- à la lecture par le HSG, les respirations et l'analyse — rien ne doit le lire comme une
-- connaissance sur la personne ; il n'existe QUE pour reconstruire la projection le temps que le
-- moteur de recommandation réécrit lise les PROFILE constructs V15.
--
-- ⚠ CONDITION DE MORT (écrite au doc §47quater) : le jour où la reco réécrite lit les PROFILE
--    constructs, `projection_bridge` et les colonnes du scoring legacy sont supprimés. Une
--    redondance sans condition de retrait devient permanente.
--
-- ADDITIF, NULLABLE (seuls les domaines à axes le remplissent). knowledge_evidences VIDE en prod
-- (flag off) → sûr. Une seule migration pour le lot (les domaines suivants réutilisent ce champ).

BEGIN;

ALTER TABLE knowledge_evidences ADD COLUMN projection_bridge jsonb; -- PONT legacy, jamais lu par le HSG

-- DERNIÈRE INSTRUCTION — auto-enregistrement (convention permanente depuis la 84).
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-89-projection-bridge.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
