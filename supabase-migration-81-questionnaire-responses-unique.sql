-- Migration 81 — questionnaire_responses : contrainte d'unicité (contact_id, user_id).
-- (Lot 0 bis. Numéro 81 — le fichier « 49 » demandé entrait en collision avec
--  supabase-migration-49-handle-profile-view.sql ; numéro tranché avec Estelle.)
--
-- CAUSE RACINE : les trois upserts de IncognitoFlow.tsx ciblent
-- onConflict("contact_id,user_id"), mais aucune contrainte d'unicité n'existait sur
-- ce couple (seule la PK sur id) → Postgres rejetait chaque écriture avec l'erreur
-- 42P10 → questionnaire_responses restait à 0 ligne (échec silencieux, corrigé au
-- chantier 0 pour la visibilité ; ici pour la persistance).
--
-- MESURES AVANT (2026-09-30, base réelle du projet) :
--   (a) lignes totales        : 0
--   (b) couples en doublon     : 0
--   (c) contact_id/user_id NULL : 0 / 0
-- → aucun doublon, aucun NULL : une contrainte UNIQUE classique est sûre et suffisante.
--
-- Additive.

ALTER TABLE questionnaire_responses
  ADD CONSTRAINT questionnaire_responses_contact_user_key UNIQUE (contact_id, user_id);
