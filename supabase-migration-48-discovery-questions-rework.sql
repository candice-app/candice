-- Migration 48 — Chantier 3 (corrections /moi Phase 4) : banque de questions Discovery
--
-- 3.2 La micro-question « Pratique » n°1 (practical.constraints) mélangeait
--     régime alimentaire, allergies, alcool et mobilité — découpée en 2 :
--       (a) practical.dietary   — contraintes alimentaires (+ précision allergie
--           obligatoire, gérée côté UI DiscoveryFlow)
--       (b) practical.mobility  — accessibilité/mobilité (follow-up obligatoire
--           type + intensité, géré côté UI — jamais de binaire)
--     Les values des options existantes sont conservées (vegetarian, vegan,
--     halal, casher, no_alcohol, food_allergy, none) : les réponses déjà
--     stockées restent valides. La garde par présence de donnée
--     (src/lib/discovery/dataPresence.ts) reconnaît l'ancienne clé.
--
-- 3.3 practical.logistics_relief reformulée au ton Candice (conciergerie
--     émotionnelle) — values inchangées, labels seulement.
--
-- Migration additive : UPDATE + INSERT, aucun DROP, aucune perte de réponse.

-- ── 3.2(a) — practical.constraints → practical.dietary ────────────────────────

UPDATE discovery_questions SET
  question_key   = 'practical.dietary',
  subdimension   = 'dietary',
  question_text  = 'Côté repas, y a-t-il des règles que tes proches doivent absolument connaître ?',
  options        = '[
    {"label":"Végétarien·ne","value":"vegetarian"},
    {"label":"Vegan","value":"vegan"},
    {"label":"Halal","value":"halal"},
    {"label":"Casher","value":"casher"},
    {"label":"Sans alcool","value":"no_alcohol"},
    {"label":"Allergie alimentaire","value":"food_allergy"},
    {"label":"Aucune","value":"none"}
  ]'::jsonb
WHERE question_key = 'practical.constraints';

-- ── 3.2(b) — practical.mobility (nouvelle question, follow-up UI dédié) ──────

INSERT INTO discovery_questions
  (question_key, dimension, subdimension, question_text, question_type, options, sort_order)
SELECT
  'practical.mobility', 'practical', 'mobility',
  'Y a-t-il quelque chose que ton corps te demande de respecter ? (marche, escaliers, station debout…)',
  'chips_single',
  '[{"label":"Oui","value":"yes"},{"label":"Non","value":"no"}]'::jsonb,
  141
WHERE NOT EXISTS (
  SELECT 1 FROM discovery_questions WHERE question_key = 'practical.mobility'
);

-- ── 3.3 — practical.logistics_relief reformulée (ton Candice) ─────────────────

UPDATE discovery_questions SET
  question_text = 'Quand quelqu''un veut te faire du bien, qu''est-ce qui t''enlève un vrai poids des épaules ?',
  options       = '[
    {"label":"Qu''on réserve à ma place","value":"reservation"},
    {"label":"Qu''on gère le trajet","value":"transport"},
    {"label":"Qu''on s''occupe des enfants","value":"children"},
    {"label":"Qu''on pense au repas","value":"meal"},
    {"label":"Qu''on fasse les courses","value":"groceries"},
    {"label":"Qu''on gère le ménage","value":"cleaning"},
    {"label":"Qu''on cale le bon moment","value":"timing"},
    {"label":"Qu''on prenne la décision pour moi","value":"decision"},
    {"label":"Qu''on règle les détails","value":"practical_details"},
    {"label":"Qu''on assure le suivi après","value":"follow_up"}
  ]'::jsonb
WHERE question_key = 'practical.logistics_relief';

-- Contrôle : les 3 lignes attendues
SELECT question_key, question_text
FROM discovery_questions
WHERE question_key IN ('practical.dietary', 'practical.mobility', 'practical.logistics_relief')
ORDER BY question_key;
