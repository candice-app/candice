-- Migration 47 — B.2.1 Phase 2 : enrichissement profile_analysis
--
-- Ajoute 3 champs pour l'affichage riche de la fiche profil :
--   • insights    : 3 phrases "Ce que Candice a compris" (generées Sonnet)
--   • modes       : 4 modes tempérament {conflit, stress, decision, canal} (generés Sonnet
--                   quand my_profile.temperament_modes n'a que 'conflit' peuplé)
--   • style_radar : 7 axes 0-100 (Précision/Émotion/Surprise/Esthétique/Utilité/Temps/Discrétion)
--                   calculés déterministiquement côté computeProfileSynthesis
--
-- Tous JSONB additifs, nullables. Aucune RLS à toucher (héritée de users_own_analysis
-- + proche_read_consented_analysis migration 40).

ALTER TABLE profile_analysis
  ADD COLUMN IF NOT EXISTS insights    JSONB,
  ADD COLUMN IF NOT EXISTS modes       JSONB,
  ADD COLUMN IF NOT EXISTS style_radar JSONB;
