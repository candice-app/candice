-- Migration 106 — EFFACEMENT : jeton d'annulation + fonction d'inventaire. Lot « effacement & droit à l'oubli » (105).
--
-- DEUX AJOUTS, tous deux additifs :
--
-- 1. my_profile.deletion_cancel_token (uuid) — jeton OPAQUE, à usage unique, du lien d'annulation envoyé par courriel.
--    Posé par /api/account/delete, NULLÉ à l'annulation ET à l'achèvement. Modèle « jeton stocké » retenu plutôt
--    qu'un HMAC sans état : révocable, à usage unique, aucun secret d'environnement de plus à gérer ni à confondre
--    avec CRON_SECRET. Le handler GET /api/account/cancel-deletion le consomme dans la MÊME écriture que l'annulation.
--
-- 2. erasure_inventory(uuid) — dénombrement, RATTACHÉ AU COMPTE, des lignes qui survivraient encore. Sert à la PASSE
--    DE VÉRIFICATION du moteur : l'achèvement ne se déclare jamais sans que cette fonction rende zéro partout.
--    ⚠ Une fonction SECURITY DEFINER qui construit du SQL dynamique est exactement la surface qu'on a passé le lot à
--    fermer. D'où quatre contraintes NON négociables (décision du 13/11) :
--      a. SET search_path = public, pg_temp figé — un schéma temporaire ne peut pas détourner un nom non qualifié ;
--      b. EXECUTE révoqué à PUBLIC/anon/authenticated (un REVOKE à anon/authenticated ne retire pas un droit tenu
--         via PUBLIC), accordé au SEUL service_role ; assertion has_function_privilege avant COMMIT, comme en 104 ;
--      c. AUCUN paramètre autre qu'un uuid. La liste des tables se dérive du catalogue DANS la fonction (fermeture
--         transitive), jamais passée par l'appelant : un paramètre textuel sur une DEFINER qui bâtit du SQL = une
--         injection avec invitation. Le nom de table n'entre dans le SQL que via %I (quote_ident) ; la valeur, que
--         par bind ($1) ;
--      d. STABLE — aucune écriture, propriété lisible dans la signature.
--    Le RATTACHEMENT couvre LES DEUX voies, à l'identique du harnais d'essai (03-cron-quatre-scenarios.mts, fonction
--    `inventaire`), pour que la comparaison soit opposable : les tables portant user_id (direct), et celles portant
--    contact_id (jointure sur contacts.user_id). Une table PUBLIQUE de la fermeture qui ne tombe dans NI l'une NI
--    l'autre FAIT ÉCHOUER la fonction — un inventaire incomplet rendrait « zéro résidu », donc ACHEVEMENT_VERIFIE,
--    mensonger. Les tables non publiques de la fermeture (auth.*, effacées par la cascade d'auth.users) tombent
--    d'elles-mêmes : la jointure au catalogue des colonnes ne porte que sur le schéma public.
--
-- Appliquée par Estelle. Enveloppe BEGIN/COMMIT. S'auto-enregistre dans applied_migrations (dernière instruction).

BEGIN;

-- 1. JETON D'ANNULATION ──────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS deletion_cancel_token uuid;

-- Recherche par jeton (le handler GET lit la ligne par ce seul champ). Partiel : n'indexe que les demandes en cours.
CREATE INDEX IF NOT EXISTS idx_my_profile_cancel_token
  ON my_profile (deletion_cancel_token)
  WHERE deletion_cancel_token IS NOT NULL;

-- 2. INVENTAIRE RATTACHÉ AU COMPTE ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION erasure_inventory(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r          record;
  n          bigint;
  a_user     boolean;
  a_contact  boolean;
  resultat   jsonb := '{}'::jsonb;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'erasure_inventory : identifiant nul';
  END IF;

  -- FERMETURE TRANSITIVE sur les clés étrangères depuis auth.users, propagée par la SEULE arête CASCADE
  -- (confdeltype = 'c'), anti-cycle. Restreinte au schéma public : auth.* tombe par la jointure au catalogue.
  FOR r IN
    WITH RECURSIVE g AS (
      SELECT c.conrelid AS tbl, c.confdeltype AS dtype, ARRAY[c.confrelid, c.conrelid] AS chemin
      FROM pg_constraint c
      WHERE c.contype = 'f' AND c.confrelid = 'auth.users'::regclass
      UNION ALL
      SELECT c.conrelid, c.confdeltype, g.chemin || c.conrelid
      FROM pg_constraint c
      JOIN g ON c.confrelid = g.tbl
      WHERE c.contype = 'f' AND g.dtype = 'c' AND NOT c.conrelid = ANY (g.chemin)
    )
    SELECT DISTINCT cl.relname AS tbl
    FROM g
    JOIN pg_class     cl ON cl.oid = g.tbl
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public'
    ORDER BY cl.relname
  LOOP
    SELECT bool_or(column_name = 'user_id'), bool_or(column_name = 'contact_id')
      INTO a_user, a_contact
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = r.tbl;

    IF a_user THEN
      EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1', r.tbl)
        INTO n USING p_user_id;
    ELSIF a_contact THEN
      EXECUTE format(
        'SELECT count(*) FROM public.%I x JOIN public.contacts k ON k.id = x.contact_id WHERE k.user_id = $1',
        r.tbl) INTO n USING p_user_id;
    ELSE
      RAISE EXCEPTION
        'erasure_inventory : table publique % de la fermeture sans user_id ni contact_id — inventaire incomplet, « zéro résidu » ne voudrait rien dire', r.tbl;
    END IF;

    resultat := resultat || jsonb_build_object(r.tbl, n);
  END LOOP;

  IF resultat = '{}'::jsonb THEN
    RAISE EXCEPTION 'erasure_inventory : fermeture transitive vide — le calcul du catalogue est cassé';
  END IF;

  RETURN resultat;
END $$;

-- (b) ACCÈS : EXECUTE au seul service_role. REVOKE à PUBLIC compris (un droit tenu via PUBLIC survit à un REVOKE
--     ciblé anon/authenticated). Puis assertion de l'effet réel, comme en 104/105 — sinon la fermeture serait feinte.
REVOKE ALL     ON FUNCTION erasure_inventory(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION erasure_inventory(uuid) TO service_role;

DO $$
BEGIN
  IF has_function_privilege('anon',          'erasure_inventory(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'erasure_inventory(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'erasure_inventory reste exécutable par anon/authenticated — la révocation (PUBLIC ?) n''a pas pris';
  END IF;
  IF NOT has_function_privilege('service_role', 'erasure_inventory(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role ne peut pas exécuter erasure_inventory : la passe de vérification serait impossible';
  END IF;
END $$;

-- Auto-enregistrement (convention applied_migrations : colonne `filename`, nom COMPLET, insert CONDITIONNEL).
INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-106-effacement-jeton-et-inventaire.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations
  WHERE filename = 'supabase-migration-106-effacement-jeton-et-inventaire.sql'
);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────────────────────────────
-- VÉRIFICATION (après application, lecture seule) :
-- SELECT erasure_inventory('00000000-0000-0000-0000-000000000000');   -- toutes les tables de la fermeture à 0
-- SELECT has_function_privilege('authenticated','erasure_inventory(uuid)','EXECUTE');  -- attendu : f
-- SELECT has_function_privilege('service_role','erasure_inventory(uuid)','EXECUTE');   -- attendu : t
