-- Migration 107 — FILS D'APPROFONDISSEMENT (conversation_threads). Lot « parcours conversationnel ».
--
-- RAISON D'ÊTRE : la validation d'un candidat repose sur un SEGMENT qui doit figurer dans les propos
-- de la personne. Si le fil (récit initial + tours) venait du client à chaque appel, un client modifié
-- pourrait fabriquer le récit qui rend n'importe quel segment « valide » : le contrôle existerait
-- encore dans le code, mais il ne contrôlerait plus rien. Le fil est donc écrit côté serveur, tour par
-- tour, et c'est CETTE copie qui sert de matière à la vérification. Le client n'en porte que l'identifiant.
--
-- CE QUE LA TABLE CONTIENT : le verbatim de la personne (son récit, ses réponses) et les questions que
-- Candice a posées. Rien d'inféré, rien de consolidé — le journal reste le seul lieu de la connaissance.
--
-- ACCÈS : RLS, une politique par propriétaire. Cascade sur auth.users : un fil ne survit pas au compte.
-- Enveloppe BEGIN/COMMIT. S'auto-enregistre dans applied_migrations. Appliquée par Estelle.

BEGIN;

CREATE TABLE IF NOT EXISTS conversation_threads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Le fil porte un sujet : le compte de la personne, ou la fiche d'un proche.
  about_kind      text NOT NULL CHECK (about_kind IN ('account','contact')),
  about_id        uuid NOT NULL,
  -- VERBATIM, jamais réécrit : c'est la matière où se vérifient les segments.
  recit_initial   text NOT NULL,
  -- [{question, reponse, ts}] — ajouté par le serveur, tour par tour.
  tours           jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{mention, contact_id, ambigu}] — identités résolues au fil de la conversation.
  personnes       jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Un fil se clôt quand la personne décline, change de sujet, ou qu'il n'y a plus rien à demander.
  clos_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- Un fil sans récit ne peut rien étayer : le refuser ici plutôt que de le découvrir à la validation.
  CONSTRAINT ct_recit_non_vide CHECK (length(btrim(recit_initial)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_ct_user_ouvert ON conversation_threads (user_id, updated_at DESC)
  WHERE clos_at IS NULL;

ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ct_owner ON conversation_threads;
CREATE POLICY ct_owner ON conversation_threads
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Privilèges alignés sur la migration 104 : anon ne garde rien (la RLS exige auth.uid(), qu'il n'a
-- pas) ; authenticated écrit et lit ses fils, sans DELETE ni TRUNCATE ; service_role pour le serveur.
REVOKE ALL ON TABLE conversation_threads FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE conversation_threads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE conversation_threads TO service_role;

-- ASSERTION DE L'EFFET, avant COMMIT. has_table_privilege résout PUBLIC et l'appartenance aux rôles ;
-- un filtre sur information_schema ne le ferait pas. Révocation non prise → LÈVE, rollback.
DO $$
DECLARE p text;
BEGIN
  FOREACH p IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE'] LOOP
    IF has_table_privilege('anon', 'conversation_threads', p) THEN
      RAISE EXCEPTION 'conversation_threads : anon conserve % — la révocation n''a pas pris', p;
    END IF;
  END LOOP;
  FOREACH p IN ARRAY ARRAY['DELETE','TRUNCATE'] LOOP
    IF has_table_privilege('authenticated', 'conversation_threads', p) THEN
      RAISE EXCEPTION 'conversation_threads : authenticated conserve % — un fil ne s''efface pas à la ligne', p;
    END IF;
  END LOOP;
  IF NOT has_table_privilege('authenticated', 'conversation_threads', 'INSERT') THEN
    RAISE EXCEPTION 'authenticated ne peut plus ouvrir de fil';
  END IF;
END $$;

INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-107-fils-approfondissement.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations WHERE filename = 'supabase-migration-107-fils-approfondissement.sql'
);

COMMIT;
