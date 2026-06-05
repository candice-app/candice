-- Migration 33 — Discovery Brain : 2 micro-questions style/genre (target='self')
-- Additive uniquement — aucune donnée existante modifiée.
-- Ces questions sont des INDICES cadeaux — jamais des filtres durs.
-- Ne touche pas grammatical_gender.
-- À appliquer dans Supabase SQL Editor.

INSERT INTO discovery_questions (
  question_key, dimension, subdimension, question_text, question_type, options,
  trigger_condition, updates_dimensions, updates_must_have, updates_deal_breakers,
  profile_output_impact, sort_order, target, statut
) VALUES

-- Parfum : rayon de référence (sort_order 425, entre fragrance.perfume_risk=420 et fragrance.beauty_gift=430)
('fragrance.gender_orientation',
 'fragrance', 'gender_orientation',
 'Pour les parfums, tu te guides plutôt vers…',
 'chips_single',
 '[{"label":"Les parfums rayon femme","value":"femme"},{"label":"Les parfums rayon homme","value":"homme"},{"label":"Les parfums mixtes / unisexes","value":"mixte"},{"label":"Peu importe le rayon si j''aime le parfum","value":"indifferent"},{"label":"Je préfère ne pas préciser","value":"unspecified"}]',
 NULL,
 ARRAY['fragrance_gender_orientation'],
 false, false,
 'Indice cadeau pour orienter le choix de parfum selon le rayon habituel. Jamais un filtre dur.',
 425, 'self', 'active'),

-- Style : codes vestimentaires / rayons (sort_order 545, entre style.material_avoidance=540 et style.color_safe=550)
('style.cross_gender',
 'style', 'cross_gender',
 'Pour les vêtements et accessoires, tu te repères plutôt dans…',
 'chips_multi',
 '[{"label":"Le rayon femme","value":"femme"},{"label":"Le rayon homme","value":"homme"},{"label":"Les deux — je mélange","value":"mixte"},{"label":"Les pièces unisexes avant tout","value":"unisexe"},{"label":"Ça dépend de la pièce","value":"depends"},{"label":"Je préfère ne pas préciser","value":"unspecified"}]',
 NULL,
 ARRAY['style_cross_gender','style_gender_orientation','fit_preference'],
 false, false,
 'Indice cadeau : identifier si la personne porte des pièces mixtes ou suit les rayons traditionnels. Jamais un filtre dur.',
 545, 'self', 'active')

ON CONFLICT (question_key) DO NOTHING;
