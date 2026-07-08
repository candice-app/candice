-- Migration 59 — Phase D : bénéfice · durée des nudges « Pour mieux viser ».
--
-- Paquet VALIDÉ INTÉGRALEMENT par Estelle (STOP D final) — les 11
-- benefit_label ci-dessous sont des TEXTES VERROUILLÉS MOT POUR MOT :
-- aucun mécanisme ne les réécrit (servis verbatim depuis la banque) et
-- toute modification repasse par Estelle.
-- NB : le flag locked_text (colonne) reste réservé aux TEXTES DE QUESTIONS
-- (anti-reformulation) — il n'est pas posé ici pour ne pas geler des
-- question_text non encore revus (revue banque = lot Discovery Push).
--
-- Parfums : déjà en place (migration 53), non touchés.
-- Additive (UPDATE de libellés seulement).

UPDATE discovery_questions SET benefit_label = 'Des attentions qui te ressemblent vraiment', duration_label = '1 min'
WHERE dimension = 'attention' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Des idées cadeaux qui visent juste', duration_label = '30 sec'
WHERE dimension = 'gifts' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Des choix à ton goût, jamais à côté', duration_label = '30 sec'
WHERE dimension = 'style' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Tes maisons préférées en tête des idées', duration_label = '20 sec'
WHERE dimension = 'brands' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Des tables choisies comme tu les aimes', duration_label = '30 sec'
WHERE dimension = 'food' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Des escapades taillées pour toi', duration_label = '30 sec'
WHERE dimension = 'travel' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Des moments qui te nourrissent vraiment', duration_label = '30 sec'
WHERE dimension = 'hobbies' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Ce dont tu rêves, gardé pour le bon moment', duration_label = '20 sec'
WHERE dimension = 'dreams' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Des surprises bien dosées, jamais subies', duration_label = '20 sec'
WHERE dimension = 'surprises' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Des attentions justes, même les jours sensibles', duration_label = '20 sec'
WHERE dimension = 'conflicts' AND statut = 'active' AND benefit_label IS NULL;

UPDATE discovery_questions SET benefit_label = 'Zéro faux pas sur l''essentiel', duration_label = '30 sec'
WHERE dimension = 'practical' AND statut = 'active' AND benefit_label IS NULL;
