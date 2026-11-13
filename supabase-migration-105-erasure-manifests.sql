-- Migration 105 — TABLE DE TRACE D'EFFACEMENT (erasure_manifests). Lot « effacement & droit à l'oubli ».
--
-- RAISON D'ÊTRE : le cron de suppression dure ne laisse aucune preuve de ce qu'il a fait (l'évènement
-- account_lifecycle_events qui enregistrait la demande est lui-même détruit par la cascade auth.users ; la seule
-- trace, cron_runs.metadata, n'est écrite que sur run entièrement réussi). Cette table répare les trois défauts
-- d'un seul choix structurel : AUCUNE clé étrangère vers auth.users → elle survit à la cascade qu'elle documente.
--
-- ⚠ CONTRAINTE DURE — DES COMPTES, JAMAIS DU CONTENU : aucun nom, aucun texte, aucun verbatim, AUCUN NOM DE
-- FICHIER (un nom de fichier porte souvent un nom de personne). Seulement des DÉNOMBREMENTS par table / par godet.
-- Si la trace portait du contenu, la preuve de l'effacement deviendrait une conservation de ce qu'on a effacé.
--
-- RÉTENTION — NE GARDE AUCUN IDENTIFIANT au-delà de la fenêtre de preuve (correction 2). Une empreinte, même non
-- salée, d'un uuid reste pseudonyme : quiconque connaît l'uuid par ailleurs (sauvegarde, journal, ticket) retrouve
-- la ligne. Donc : au-delà d'une fenêtre PARAMÉTRÉE (durée décidée par Estelle, jamais codée en dur), subject_user_id
-- passe à NULL et anonymized_at est posé ; on garde la date et les comptes, plus rien d'identifiant. Un CHECK rend
-- l'état incohérent impossible : on ne peut ni perdre l'id sans se déclarer anonymisé, ni se déclarer anonymisé en
-- gardant l'id. On retrouve une trace par identifiant tant qu'il est là, par date ensuite ; jamais par empreinte.
--
-- ACCÈS (correction 3) : RLS activée SANS politique + REVOKE ALL (dont TRUNCATE, non soumis à la RLS ; dont PUBLIC,
-- un privilège pouvant survivre par héritage) à PUBLIC/anon/authenticated + GRANT au seul service_role.
-- ⚠ service_role CONTOURNE la RLS (rolbypassrls = true chez Supabase — à confirmer en local, requête en pied) :
-- la protection de cette table vient donc des PRIVILÈGES, pas de la RLS. Personne ne doit lire l'inverse.
-- Un bloc d'assertion (has_table_privilege, qui résout PUBLIC + appartenance aux rôles) vérifie l'effet avant COMMIT.
--
-- Enveloppe BEGIN/COMMIT. S'auto-enregistre dans applied_migrations (dernière instruction). Appliquée par Estelle.

BEGIN;

CREATE TABLE IF NOT EXISTS erasure_manifests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SUJET : l'uuid pendant la fenêtre de preuve, PUIS plus rien (anonymized_at posé). JAMAIS de FK vers auth.users.
  subject_user_id    uuid,                       -- nullé par la rétention ; AUCUNE empreinte conservée
  anonymized_at      timestamptz,                -- posé quand subject_user_id est retiré (fin de fenêtre de preuve)
  -- DATES (des horodatages, pas du contenu)
  requested_at       timestamptz NOT NULL,       -- date de la demande d'effacement
  scheduled_for      timestamptz NOT NULL,       -- date d'échéance (demande + délai de grâce)
  attempted_at       timestamptz,                -- date de la tentative (null tant qu'aucune n'a eu lieu)
  created_at         timestamptz NOT NULL DEFAULT now(),
  -- ÉTAT (machine à états du lot ; voir src/lib/lifecycle/erasure/*)
  status             text NOT NULL CHECK (status IN ('DEMANDE','TENTATIVE','ECHEC_PARTIEL','ACHEVEMENT_VERIFIE')),
  attempt_no         integer NOT NULL DEFAULT 0, -- numéro de tentative (0 = demande enregistrée, pas encore tentée)
  run_id             uuid,                        -- identifiant du run de cron qui a exécuté la tentative
  -- DÉNOMBREMENTS (jsonb de compteurs {table|godet -> nombre}). JAMAIS de contenu, JAMAIS de nom de fichier.
  inventory_before   jsonb,                       -- compté JUSTE AVANT la première action destructrice
  residue_after      jsonb,                       -- ce que la passe de vérification trouve APRÈS (zéro attendu)
  error_message      text,                        -- message d'erreur d'une tentative partielle
  -- État incohérent impossible : anonymisé XOR porteur d'identifiant (jamais les deux, jamais aucun).
  CONSTRAINT erasure_anonymized_xor_subject CHECK ((anonymized_at IS NULL) = (subject_user_id IS NOT NULL))
);

-- Retrouver par identifiant tant qu'il est là, par date toujours.
CREATE INDEX IF NOT EXISTS idx_erasure_subject      ON erasure_manifests (subject_user_id);
CREATE INDEX IF NOT EXISTS idx_erasure_requested_at ON erasure_manifests (requested_at);

-- ACCÈS RESTREINT. RLS activée, AUCUNE politique → deny-all pour tout rôle soumis à la RLS. service_role la
-- contourne (rolbypassrls). REVOKE explicite (dont TRUNCATE et PUBLIC) ; service_role garde écriture + lecture.
ALTER TABLE erasure_manifests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE erasure_manifests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE erasure_manifests TO service_role;
-- Pas de DELETE accordé, même à service_role : une trace d'effacement ne s'efface pas à la ligne. La purge
-- légitime passe par la procédure de rétention ci-dessous (anonymisation), pas par un DELETE.

-- PROCÉDURE DE RÉTENTION — retire l'identifiant au-delà d'une fenêtre PARAMÉTRÉE (durée décidée par Estelle,
-- jamais codée en dur). Ne conserve AUCUNE empreinte : subject_user_id → NULL, anonymized_at → now(), comptes gardés.
-- SECURITY DEFINER + search_path figé. Ne touche que les lignes dont la fenêtre de preuve est expirée.
CREATE OR REPLACE FUNCTION anonymize_erasure_manifests(p_proof_window interval)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  n integer;
BEGIN
  IF p_proof_window IS NULL THEN
    RAISE EXCEPTION 'anonymize_erasure_manifests : fenêtre de preuve absente (durée à décider, jamais NULL)';
  END IF;
  UPDATE erasure_manifests
     SET subject_user_id = NULL,
         anonymized_at   = now()
   WHERE subject_user_id IS NOT NULL
     AND requested_at < now() - p_proof_window;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL     ON FUNCTION anonymize_erasure_manifests(interval) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION anonymize_erasure_manifests(interval) TO service_role;

-- ASSERTION DE L'EFFET (correction 3). has_table_privilege résout PUBLIC + appartenance aux rôles ; les filtres
-- sur information_schema.role_table_grants ne le font pas. anon/authenticated ne doivent RIEN garder ; service_role
-- doit pouvoir écrire (sinon la trace serait impossible). Révocation non prise OU écriture perdue → LÈVE, rollback.
DO $$
DECLARE t text; p text;
BEGIN
  FOREACH t IN ARRAY ARRAY['erasure_manifests'] LOOP
    FOREACH p IN ARRAY ARRAY['DELETE','TRUNCATE','UPDATE','INSERT','SELECT'] LOOP
      IF has_table_privilege('anon', t, p)
         OR has_table_privilege('authenticated', t, p) THEN
        RAISE EXCEPTION '% conserve % — la révocation n''a pas pris', t, p;
      END IF;
    END LOOP;
  END LOOP;
  IF NOT has_table_privilege('service_role', 'erasure_manifests', 'INSERT') THEN
    RAISE EXCEPTION 'service_role ne peut plus écrire : la trace serait impossible';
  END IF;
END $$;

-- Auto-enregistrement (convention applied_migrations : colonne `filename`, nom COMPLET, insert CONDITIONNEL).
INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-105-erasure-manifests.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations
  WHERE filename = 'supabase-migration-105-erasure-manifests.sql'
);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────────────────────────────
-- PREUVE (à lancer APRÈS application, lecture seule) que « RLS sans politique » suffit — i.e. qui contourne la RLS :
-- SELECT rolname, rolbypassrls, rolsuper FROM pg_roles
-- WHERE rolname IN ('anon','authenticated','service_role','postgres') ORDER BY 1;
--   (service_role attendu rolbypassrls = true → protection par PRIVILÈGES, pas par RLS.)
--
-- CONSULTATION (service_role seulement — documentée) :
-- -- Tant que l'uuid est conservé (fenêtre de preuve) :
-- SELECT id, status, requested_at, scheduled_for, attempted_at, attempt_no, inventory_before, residue_after
-- FROM erasure_manifests WHERE subject_user_id = :uuid ORDER BY requested_at;
-- -- Après anonymisation : plus d'identifiant ; par date et par état seulement.
-- SELECT id, status, requested_at, attempted_at, residue_after FROM erasure_manifests
-- WHERE anonymized_at IS NOT NULL AND requested_at >= :depuis ORDER BY requested_at;
-- -- Les échecs partiels (résidu non vide) :
-- SELECT id, status, attempted_at, residue_after FROM erasure_manifests
-- WHERE status = 'ECHEC_PARTIEL' ORDER BY attempted_at;
