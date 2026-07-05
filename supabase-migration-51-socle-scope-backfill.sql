-- Migration 51 — B.2 Phase 7 : harmonisation « essentiel seulement »
--
-- Depuis l'harmonisation (arbitrage Estelle 2026-07-05), zéro section
-- cochée produit TOUJOURS scope = ARRAY['socle'] — sur l'écran de réponse
-- comme sur le lien sortant. Ce backfill aligne les consents profile_view
-- créés avant, qui stockaient un scope vide pour le même choix.
--
-- Additive uniquement (UPDATE de normalisation, aucune perte d'information :
-- '{}' et '{socle}' désignent le même consentement « socle seul »).

UPDATE contact_consents
SET scope = ARRAY['socle']
WHERE kind = 'profile_view'
  AND scope = '{}';
