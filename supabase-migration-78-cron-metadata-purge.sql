-- Migration 78 — cron_runs.metadata : purge des UUID utilisateurs existants.
--
-- CONTEXTE (diagnostic lot RLS) :
--   detect-and-generate poussait "user:<uuid> — <msg>" dans metadata.errors.
--   cron_runs étant auparavant lisible hors RLS (cf. mig. 76), ces UUID fuyaient.
--   Le code ne stocke plus l'UUID (hash court sha256 non réversible, commit associé).
--   Cette migration nettoie l'EXISTANT.
--
-- Idempotente : redacte tout motif UUID présent dans metadata (n'importe où),
--   quel que soit son emplacement. Sans effet si aucune ligne concernée.
--   (Au moment de l'application : 0 ligne en base — sécurité pour les autres envs.)

UPDATE cron_runs
SET metadata = regexp_replace(
      metadata::text,
      '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
      'redacted',
      'g'
    )::jsonb
WHERE metadata::text ~ '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
