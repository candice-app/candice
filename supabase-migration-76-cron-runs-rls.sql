-- Migration 76 — cron_runs : fermeture de l'exposition (RLS + révocation grants).
--
-- CONTEXTE (diagnostic lot RLS) :
--   cron_runs avait RLS DÉSACTIVÉE + SELECT accordé à anon ET authenticated.
--   → n'importe quel visiteur (même anonyme) pouvait lire la télémétrie des crons
--     (job_name, timestamps, compteurs, error_message, metadata contenant des UUID
--      d'utilisateurs poussés par detect-and-generate).
--
-- CIBLE : RLS activée + ZÉRO policy (seul service_role/postgres y accède, comme
--   cross_validations). Les 4 crons écrivent via createAdminClient() (service_role,
--   BYPASSRLS et non visé par la révocation) → écriture 100 % préservée.
--   Vérifié : aucun accès cron_runs via client user dans le code.
--
-- Additive (aucune donnée touchée ; la purge des UUID existants = migration 78).

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

-- Révocation explicite des grants hérités (defaults Supabase sur le schéma public).
REVOKE ALL ON cron_runs FROM anon;
REVOKE ALL ON cron_runs FROM authenticated;

-- Pas de CREATE POLICY : sans policy, RLS bloque tout rôle non-BYPASSRLS.
-- service_role (crons) conserve son accès (BYPASSRLS).
