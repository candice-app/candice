-- Migration 100 — persist_journal : verrouillage des GRANTs sur `authenticated` seul.
--
-- POURQUOI. Le fichier de la 99 annonçait `authenticated` seul (REVOKE ALL FROM PUBLIC ; GRANT TO
-- authenticated). La base, elle, porte anon + authenticated + service_role + postgres. Ce n'est pas un trou
-- (persist_journal est SECURITY INVOKER et fait `v_uid := auth.uid()` + RAISE si NULL : un appelant anon ou
-- service_role, sans JWT utilisateur, ne peut rien écrire). MAIS le fichier 99 DÉCRIT UN ÉTAT QU'IL N'ATTEINT
-- PAS — exactement la classe d'erreur que ce chantier traque. On la corrige.
--
-- CAUSE. Supabase pose des *default privileges* qui accordent EXECUTE sur toute fonction neuve à
-- anon, authenticated, service_role AU MOMENT DU CREATE. Un `REVOKE ... FROM PUBLIC` ne retire PAS ces grants
-- nominatifs par rôle (il ne touche que le pseudo-rôle PUBLIC) → il faut révoquer anon et service_role nommément.
--
-- PORTÉE. Additive et strictement corrective : on retire EXECUTE à anon et service_role. On LAISSE
-- `authenticated` (le seul appelant légitime) et `postgres` (le propriétaire). Rejouable sans erreur : révoquer
-- un droit déjà absent est un no-op silencieux en Postgres.

REVOKE EXECUTE ON FUNCTION public.persist_journal(jsonb, jsonb, jsonb, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.persist_journal(jsonb, jsonb, jsonb, jsonb) FROM service_role;

-- Auto-enregistrement (convention applied_migrations : colonne `filename`, nom COMPLET du fichier, insert
-- CONDITIONNEL — PAS de colonne `migration`, PAS de ON CONFLICT ; rejouable sans erreur).
INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-100-persist-journal-grants.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations
  WHERE filename = 'supabase-migration-100-persist-journal-grants.sql'
);
