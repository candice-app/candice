-- Migration 11 — Vecteurs d'attention (Lot 1 Modèle d'Analyse)
-- Appliquée le : 2026-05-22
--
-- Ajoute à my_profile les 4 colonnes JSONB qui stockeront :
--   - les réponses brutes de l'Étape 1 (attention_answers)
--   - le vecteur calculé côté réception (attention_reception)
--   - le vecteur calculé côté expression (attention_expression)
--   - l'horodatage du dernier calcul (attention_computed_at)
--
-- Dimensions des vecteurs : MOT, SER, CAD_C, CAD_S, EXP, GES, SUR (7 exactement).
-- Le contact physique est hors modèle — aucune dimension le concernant.
-- physical_contact_with est conservé (déprécié, ni lu ni écrit par le nouveau modèle).
--
-- Migration idempotente : peut être rejouée sans erreur ni perte de données.

-- 11.1 Réponses brutes classées de l'Étape 1
-- Structure cible :
--   {"reception":{"q1":["MOT","GES"],"q2":[],"q3":[],"q4":[]},"expression":{"qE":[]}}
ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS attention_answers JSONB;

-- 11.2 Vecteur 7 dimensions — face réception
-- Structure cible :
--   {"MOT":20,"SER":8,"CAD_C":0,"CAD_S":3,"EXP":15,"GES":6,"SUR":0}
ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS attention_reception JSONB;

-- 11.3 Vecteur 7 dimensions — face expression (même structure)
ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS attention_expression JSONB;

-- 11.4 Horodatage du dernier calcul des vecteurs
ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS attention_computed_at TIMESTAMPTZ;
