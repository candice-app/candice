-- Migration 54 — Refonte Profil V2, Phase B : nouveaux champs d'analyse.
--
-- Produits par le prompt enrichi (engine 2.2) pour la nouvelle fiche pilote :
--   summary_long     TEXT   — analyse complète (sheet « Lire l'analyse complète », 3 paragraphes)
--   podium_intro     TEXT   — phrase d'introduction du podium (langage d'attention)
--   understood_cards JSONB  — 4 cards « Ce que Candice a compris » [{eyebrow, text}]
--   works_phrases    JSONB  — phrases courtes « Ce qui marche » {beau, personnel, experientiel, utile, premium, surprise}
--                             (les NIVEAUX restent calculés déterministes côté code — jamais par le LLM)
--   territory        JSONB  — {titre, phrase, cartes: [{nom, description, statut: 'desirable'|'eviter'}]}
--   universe         JSONB  — {lieux_ambiances[], matieres[], reves_envies[], phrase}
--
-- Le « Lire plus » des sections profondes/mondes vit dans sections.*.more
-- (JSONB existant — pas de colonne). Les catégories de marques vivent dans
-- entities.brands_categorized (JSONB existant).
--
-- Additive uniquement. RLS : profile_analysis déjà protégée (policies
-- existantes user/proche) — aucune nouvelle policy requise.

ALTER TABLE profile_analysis ADD COLUMN IF NOT EXISTS summary_long     TEXT;
ALTER TABLE profile_analysis ADD COLUMN IF NOT EXISTS podium_intro     TEXT;
ALTER TABLE profile_analysis ADD COLUMN IF NOT EXISTS understood_cards JSONB;
ALTER TABLE profile_analysis ADD COLUMN IF NOT EXISTS works_phrases    JSONB;
ALTER TABLE profile_analysis ADD COLUMN IF NOT EXISTS territory        JSONB;
ALTER TABLE profile_analysis ADD COLUMN IF NOT EXISTS universe         JSONB;
