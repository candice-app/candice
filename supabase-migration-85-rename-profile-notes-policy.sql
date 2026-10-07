-- Migration 85 — dérive console→dépôt : renommage de la policy RLS de profile_notes.
--
-- CONTEXTE : la policy RLS de profile_notes a été recréée À LA MAIN dans la console Supabase
-- sous le nom « Users can manage their own notes ». Son expression est IDENTIQUE au schéma
-- d'origine — FOR ALL USING (auth.uid() = user_id), propriétaire seul, aucun accès anonyme —
-- donc AUCUN problème de sécurité. L'audit de schéma l'a vue « absente » parce qu'elle était
-- cherchée sous le nom documenté users_own_profile_notes (supabase-schema.sql).
--
-- Ce fichier réaligne le seul NOM, pour que le dépôt redevienne la description exacte de la
-- base. UN SEUL ALTER POLICY, aucune modification de l'expression. One-shot (le renommage
-- n'est pas rejouable : une fois renommée, l'ancien nom n'existe plus).

BEGIN;

ALTER POLICY "Users can manage their own notes" ON profile_notes RENAME TO users_own_profile_notes;

-- DERNIÈRE INSTRUCTION — auto-enregistrement (convention permanente depuis la 84).
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-85-rename-profile-notes-policy.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
