-- Migration 58 — Phase D : mapping des scopes stockés vers le découpage V2.
--
-- Les partages actifs/pending (contact_consents.scope) et les liens non
-- réclamés (profile_share_links.scope) stockent des clés V1. Sans mapping,
-- les partages accordés perdraient des sections à la bascule.
--
-- Correspondances (validées STOP A) :
--   radar → works · what_touches → deep_touch · insights → understood ·
--   gifts → deep_pleasure · avoid → deep_miss · restaurants → monde_tables ·
--   travel → monde_voyages · hobbies → monde_passions · style → monde_gouts ·
--   brands → univers · points_fixes → univers · parfums → facts_parfums ·
--   temperament_axes / temperament_modes / lifestyle_axes → (sortent de la
--   fiche, aucun équivalent affiché — retirés du scope).
--   lead / topchips / donut (ex-socle) → retirés (le socle est implicite).
--   Sentinelles 'blind' et 'socle' inchangées ; facts_* inchangées.
--   Un scope qui deviendrait vide → ARRAY['socle'] (essentiel seulement).
--
-- Additive (UPDATE de normalisation, aucune ligne supprimée).

CREATE OR REPLACE FUNCTION map_scope_v1_to_v2(old_scope TEXT[])
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    (SELECT array_agg(DISTINCT mapped) FROM (
      SELECT CASE s
        WHEN 'radar'         THEN 'works'
        WHEN 'what_touches'  THEN 'deep_touch'
        WHEN 'insights'      THEN 'understood'
        WHEN 'gifts'         THEN 'deep_pleasure'
        WHEN 'avoid'         THEN 'deep_miss'
        WHEN 'restaurants'   THEN 'monde_tables'
        WHEN 'travel'        THEN 'monde_voyages'
        WHEN 'hobbies'       THEN 'monde_passions'
        WHEN 'style'         THEN 'monde_gouts'
        WHEN 'brands'        THEN 'univers'
        WHEN 'points_fixes'  THEN 'univers'
        WHEN 'parfums'       THEN 'facts_parfums'
        WHEN 'temperament_axes'  THEN NULL
        WHEN 'temperament_modes' THEN NULL
        WHEN 'lifestyle_axes'    THEN NULL
        WHEN 'lead'          THEN NULL
        WHEN 'topchips'      THEN NULL
        WHEN 'donut'         THEN NULL
        ELSE s
      END AS mapped
      FROM unnest(old_scope) s
    ) t WHERE mapped IS NOT NULL),
    ARRAY['socle']
  );
$$;

UPDATE contact_consents
SET scope = map_scope_v1_to_v2(scope)
WHERE kind = 'profile_view' AND status IN ('pending', 'active');

UPDATE profile_share_links
SET scope = map_scope_v1_to_v2(scope)
WHERE claimed_at IS NULL AND revoked_at IS NULL;

DROP FUNCTION map_scope_v1_to_v2(TEXT[]);
