-- Migration 53 — Refonte Profil V2, Phase B : banque parfums + métadonnées nudges.
--
-- Arbitrage Estelle (STOP A, point 6) :
--   • fragrance.family et fragrance.beauty_gift : ARCHIVÉES (hors sujet).
--     Les réponses existantes restent en base (profile_completion /
--     discovery_answers) — archived ne réapparaît jamais.
--   • fragrance.perfume_risk : MISE À JOUR avec le texte et les options
--     exacts de la Q1 (pas de doublon).
--   • fragrance.scent_deal_breakers : MISE À JOUR avec la Q3.
--   • fragrance.families : SEULE nouvelle clé (Q2).
--   • Réponses existantes conservées telles quelles : la garde les voit
--     answered ; « Modifier ma réponse » permet la mise à jour.
--
-- + Métadonnées des nudges « Pour mieux viser » : bénéfice + durée par
--   question (colonnes additives sur discovery_questions).

-- ── 1. Métadonnées nudges ──────────────────────────────────────────────────────

ALTER TABLE discovery_questions ADD COLUMN IF NOT EXISTS benefit_label TEXT;
ALTER TABLE discovery_questions ADD COLUMN IF NOT EXISTS duration_label TEXT;

-- ── 2. Archivage (jamais de suppression : réponses conservées) ────────────────

UPDATE discovery_questions SET statut = 'archived'
WHERE question_key IN ('fragrance.family', 'fragrance.beauty_gift');

-- ── 3. Q1 — mise à jour de fragrance.perfume_risk (textes exacts Estelle) ─────

UPDATE discovery_questions SET
  question_text = 'Recevoir un parfum, pour toi, c''est…',
  question_type = 'chips_single',
  options = '[
    {"label":"Je préfère choisir moi-même","value":"choose_myself"},
    {"label":"Possible si la personne connaît très bien mes goûts","value":"if_knows_taste"},
    {"label":"Seulement une marque que j''aime déjà","value":"known_brand_only"},
    {"label":"Plutôt une bougie ou un parfum d''intérieur","value":"home_fragrance"},
    {"label":"Je n''aime pas recevoir de parfum","value":"avoid"}
  ]'::jsonb,
  benefit_label = 'Éviter les cadeaux beauté à côté',
  duration_label = '30 sec'
WHERE question_key = 'fragrance.perfume_risk';

-- ── 4. Q3 — mise à jour de fragrance.scent_deal_breakers ──────────────────────

UPDATE discovery_questions SET
  question_text = 'À éviter absolument',
  question_type = 'chips_multi',
  options = '[
    {"label":"Trop sucré","value":"too_sweet"},
    {"label":"Patchouli","value":"patchouli"},
    {"label":"Très entêtant","value":"too_heady"},
    {"label":"Trop fruité","value":"too_fruity"},
    {"label":"Trop vanillé","value":"too_vanilla"},
    {"label":"Trop masculin","value":"too_masculine"},
    {"label":"Trop floral","value":"too_floral"},
    {"label":"Parfum trop connu","value":"too_common"},
    {"label":"Je ne sais pas","value":"unknown"}
  ]'::jsonb,
  benefit_label = 'Écarter ce qui gâche un parfum',
  duration_label = '20 sec'
WHERE question_key = 'fragrance.scent_deal_breakers';

-- ── 5. Q2 — création de fragrance.families (seule nouvelle clé) ───────────────

INSERT INTO discovery_questions (
  question_key, dimension, subdimension, question_text, question_type, options,
  trigger_condition, updates_dimensions, updates_must_have, updates_deal_breakers,
  profile_output_impact, sort_order, target, statut, benefit_label, duration_label
) VALUES (
  'fragrance.families', 'fragrance', 'families',
  'Les familles olfactives qui te plaisent le plus',
  'chips_multi',
  '[
    {"label":"Poudré","value":"powdery"},
    {"label":"Musqué propre","value":"clean_musk"},
    {"label":"Floral blanc","value":"white_floral"},
    {"label":"Floral frais","value":"fresh_floral"},
    {"label":"Ambré doux","value":"soft_amber"},
    {"label":"Vanillé léger","value":"light_vanilla"},
    {"label":"Boisé","value":"woody"},
    {"label":"Hespéridé","value":"citrus"},
    {"label":"Thé-aromatique","value":"tea_aromatic"},
    {"label":"Peau propre","value":"clean_skin"},
    {"label":"Je ne sais pas","value":"unknown"}
  ]'::jsonb,
  NULL,
  ARRAY['fragrance_families'],
  false, false,
  NULL, 425, 'self', 'active',
  'Des cadeaux parfum qui te ressemblent', '20 sec'
)
ON CONFLICT (question_key) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  question_type = EXCLUDED.question_type,
  options = EXCLUDED.options,
  statut = 'active',
  benefit_label = EXCLUDED.benefit_label,
  duration_label = EXCLUDED.duration_label;
