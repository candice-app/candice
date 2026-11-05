-- Migration 98 — IDENTIFIANT D'ÉVÈNEMENT DE CORRECTION (ligne 4 du chantier, 3ᵉ forme — décision Estelle 5 nov).
--
-- Problème tranché : une correction d'un champ libre crée DEUX sources (le verbatim DÉCLARÉ, écrit côté
-- client via la double-écriture ; l'extraction INFÉRÉE, écrite côté serveur). Superséder « sauf une seule
-- newSourceId » (option Y) ou « par horodatage » (option X) échouait : Y fait confiance au client pour une
-- liste qu'il ne possède pas ; X dépend d'horloges (le created_at du verbatim pouvait venir du navigateur).
--
-- 3ᵉ FORME : l'ÉVÈNEMENT de correction a une identité. Le client tire UN uuid de correction et l'envoie avec
-- les DEUX écritures ; les deux sources le portent. La supersession devient : « supersède toutes les sources
-- vivantes de cette question, pour ce déclarant et cette voie, SAUF celles qui portent cet identifiant ».
--   • aucune dépendance à une horloge ;
--   • le client n'est cru que sur une chose : renvoyer deux fois le même uuid (bien moins que lui faire
--     énumérer des identifiants qu'il n'a pas) ;
--   • marche avec deux sources neuves comme avec cinq ;
--   • trace l'évènement : « remplacé par la correction du 5 nov », pas « par la source machin ».
-- (superseded_by pointe, lui, vers le VERBATIM DÉCLARÉ de la correction, pas vers l'extraction — « ta
--  nouvelle réponse » est une réponse ; « une inférence du modèle » n'en est pas une. Câblé dans le code.)
--
-- Additive, nullable : les sources écrites AVANT cette colonne ont correction_event_id NULL → elles sont
-- traitées comme « ne portant pas l'identifiant courant », donc supersédées par une correction future
-- (correct : ce sont d'anciennes versions). Aucune donnée touchée.

BEGIN;

ALTER TABLE knowledge_sources
  ADD COLUMN IF NOT EXISTS correction_event_id uuid;

-- Index partiel : la supersession filtre par (user_id, about, question_code) puis par correction_event_id ;
-- l'index aide le lookup des anciennes versions sans balayer la table.
CREATE INDEX IF NOT EXISTS ks_correction_event_idx
  ON knowledge_sources (user_id, about_id, question_code)
  WHERE correction_event_id IS NOT NULL;

INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-98-correction-event-id.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
