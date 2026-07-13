-- Migration 64 — clôture lot Refonte Profil V2 : dépose de l'instrumentation
-- perf TEMPORAIRE. Retire la table perf_beacons (créée en 60, colonnes v2 en 62).
-- Le composant PerfBeacon et la route /api/perf-log sont supprimés côté code.
-- NB : la migration 63 (profile_completion.personalized_text, pré-calcul D1
-- INACTIF mais conservé) N'EST PAS touchée.

DROP TABLE IF EXISTS perf_beacons;
