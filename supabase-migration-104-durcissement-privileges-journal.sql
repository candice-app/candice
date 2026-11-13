-- Migration 104 — DURCISSEMENT DES PRIVILÈGES DU JOURNAL (fermeture de la suppression DIRECTE).
--
-- ⚠ AVERTISSEMENT — À LIRE EN ENTIER, ET À NE PAS MAL CITER :
--   Cette migration ne rend PAS le journal append-only. Elle ferme la suppression DIRECTE. La porte contacts
--   reste ouverte : api/contacts/delete supprime un contact, et la cascade ON DELETE CASCADE détruit le journal
--   du proche — elle s'exécute avec les droits du propriétaire de table, donc la révocation ci-dessous ne
--   l'empêche pas. L'UPDATE reste accordé à authenticated jusqu'au lot 2.
--   Personne ne doit lire cette migration et en conclure que le journal est protégé.
--
-- PÉRIMÈTRE APPEND-ONLY = SIX TABLES :
--   knowledge_sources, knowledge_evidences, knowledge_facts, knowledge_open_knowledge,
--   knowledge_extraction_records, knowledge_signal_snapshots.
--   knowledge_signals est EXCLUE : cache consolidé écrit PAR REMPLACEMENT (UPSERT). Lui révoquer UPDATE/DELETE
--   serait un défaut en attente, qui se déclencherait le jour où la consolidation sera câblée. On protège ce
--   qu'un cache dérive, pas le cache. extraction_records et signal_snapshots sont append-only par conception et
--   dormantes (aucun écrivain aujourd'hui) : les inclure ne casse rien et ferme le trou avant qu'elles soient
--   alimentées.
--
-- CE QUE LA 104 RÉVOQUE :
--   (a) TRUNCATE, TRIGGER, REFERENCES à anon ET authenticated, sur TOUTES les tables de public. PostgREST
--       n'émet jamais de TRUNCATE, ne crée jamais de déclencheur, n'a jamais besoin de REFERENCES (DDL non
--       exposé). Contre-exemple cherché, AUCUN trouvé : aucun chemin applicatif ne peut en dépendre.
--   (b) DELETE à anon ET authenticated, sur les SIX. Prouvé qu'aucun chemin direct ne supprime dans ces tables
--       (zéro .delete()/TRUNCATE sur les 7 tables du journal dans src/scripts, hors les deletes admin du
--       roundtrip retirés en Décision 1 ; zéro DELETE FROM knowledge_* en migration/RPC) : révocation sans victime.
--   (c) TOUT à anon sur les SIX. La RLS exige auth.uid(), anon n'en a pas ; aucun chemin n'accède à ces tables
--       avant authentification ; les clients SSR opèrent sous authenticated une fois connectés.
--
-- CE QU'ELLE NE TOUCHE PAS :
--   SELECT et INSERT pour authenticated (persist_journal est SECURITY INVOKER, il écrit avec les droits de
--   l'appelant — révoquer INSERT casserait la RPC). UPDATE pour authenticated (la supersession marque
--   superseded_at côté client ; part au lot 2, en RPC SECURITY DEFINER). service_role garde tout.
--
-- TABLES CRÉÉES PLUS TARD : ce REVOKE ne couvre que l'existant à l'application. Voir la note ALTER DEFAULT
--   PRIVILEGES rendue à Estelle (non embarquée ici : décision séparée, dépendante du rôle qui exécute les
--   migrations). Convention retenue en attendant : toute future migration créant une table dans public finit
--   par un bloc de privilèges explicite (REVOKE des quatre + GRANT du strict nécessaire).
--
-- ⚠ PUBLIC : un REVOKE ... FROM anon, authenticated ne retire PAS un privilège détenu via PUBLIC (héritage, pas
--   attribution directe). Un bloc d'assertion (has_table_privilege — privilège EFFECTIF, résout PUBLIC + appartenance
--   aux rôles) vérifie l'effet réel DANS LES DEUX SENS avant le COMMIT : si un révoqué subsiste (par PUBLIC ou autre)
--   OU si un conservé a disparu (révocation trop large), la transaction LÈVE et rien ne s'applique. Ce bloc ne
--   REVOQUE rien à PUBLIC : s'il lève, Estelle décide du remède (REVOKE ciblé sur le privilège/table résiduel).
--
-- Appliquée par Estelle. Enveloppe BEGIN/COMMIT. S'auto-enregistre dans applied_migrations (dernière instruction).

BEGIN;

-- (a) TRUNCATE / TRIGGER / REFERENCES retirés à anon ET authenticated sur TOUT public.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- (b) DELETE retiré à anon ET authenticated sur les SIX tables du périmètre append-only.
REVOKE DELETE ON TABLE
  knowledge_sources,
  knowledge_evidences,
  knowledge_facts,
  knowledge_open_knowledge,
  knowledge_extraction_records,
  knowledge_signal_snapshots
FROM anon, authenticated;

-- (c) TOUT retiré à anon sur les SIX (anon n'a aucun accès légitime : la RLS exige auth.uid()).
REVOKE ALL PRIVILEGES ON TABLE
  knowledge_sources,
  knowledge_evidences,
  knowledge_facts,
  knowledge_open_knowledge,
  knowledge_extraction_records,
  knowledge_signal_snapshots
FROM anon;

-- ASSERTION DE L'EFFET RÉEL (has_table_privilege résout PUBLIC + appartenance aux rôles). Vérifie DANS LES DEUX
-- SENS : les révoqués ont disparu POUR LES DEUX RÔLES (même s'ils étaient détenus via PUBLIC), les conservés
-- (SELECT/INSERT/UPDATE authenticated) sont toujours là. Révocation incomplète OU excessive → LÈVE, rollback total.
DO $$
DECLARE
  v_table  text;
  v_role   text;
  v_priv   text;
  v_restes text := '';
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'public.knowledge_sources','public.knowledge_evidences','public.knowledge_facts',
    'public.knowledge_open_knowledge','public.knowledge_extraction_records',
    'public.knowledge_signal_snapshots']
  LOOP
    -- ce qui doit avoir disparu pour les deux rôles
    FOREACH v_role IN ARRAY ARRAY['anon','authenticated'] LOOP
      FOREACH v_priv IN ARRAY ARRAY['DELETE','TRUNCATE','TRIGGER','REFERENCES'] LOOP
        IF has_table_privilege(v_role, v_table, v_priv) THEN
          v_restes := v_restes || format('%s a ENCORE %s sur %s ; ',
                                         v_role, v_priv, v_table);
        END IF;
      END LOOP;
    END LOOP;
    -- anon ne doit plus rien avoir du tout
    FOREACH v_priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE'] LOOP
      IF has_table_privilege('anon', v_table, v_priv) THEN
        v_restes := v_restes || format('anon a ENCORE %s sur %s ; ', v_priv, v_table);
      END IF;
    END LOOP;
    -- authenticated doit AVOIR CONSERVÉ ses trois : une révocation trop large est un
    -- défaut autant qu'une révocation incomplète
    FOREACH v_priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE'] LOOP
      IF NOT has_table_privilege('authenticated', v_table, v_priv) THEN
        v_restes := v_restes || format('authenticated a PERDU %s sur %s ; ',
                                       v_priv, v_table);
      END IF;
    END LOOP;
  END LOOP;
  IF v_restes <> '' THEN
    RAISE EXCEPTION 'migration 104 — révocation incomplète ou excessive : %', v_restes;
  END IF;
END $$;

-- Auto-enregistrement (convention applied_migrations : colonne `filename`, nom COMPLET, insert CONDITIONNEL).
INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-104-durcissement-privileges-journal.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations
  WHERE filename = 'supabase-migration-104-durcissement-privileges-journal.sql'
);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────────────────────────────
-- REQUÊTE DE VÉRIFICATION (à lancer APRÈS application — lecture seule, hors transaction) :
--
-- -- 1. Ce qui reste accordé à anon/authenticated sur les SIX (attendu : authenticated = SELECT/INSERT/UPDATE,
-- --    anon = rien ; aucune ligne DELETE/TRUNCATE/TRIGGER/REFERENCES).
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
--   AND grantee IN ('anon','authenticated','PUBLIC')   -- PUBLIC inclus : un privilège peut survivre par héritage
--   AND table_name IN ('knowledge_sources','knowledge_evidences','knowledge_facts',
--                      'knowledge_open_knowledge','knowledge_extraction_records','knowledge_signal_snapshots')
-- ORDER BY table_name, grantee, privilege_type;
--
-- -- 2. Contrôle ponctuel (attendu : t,t,t,f,f pour authenticated ; tout f pour anon).
-- SELECT
--   has_table_privilege('authenticated','public.knowledge_sources','SELECT')     AS auth_select,
--   has_table_privilege('authenticated','public.knowledge_sources','INSERT')     AS auth_insert,
--   has_table_privilege('authenticated','public.knowledge_sources','UPDATE')     AS auth_update,
--   has_table_privilege('authenticated','public.knowledge_sources','DELETE')     AS auth_delete,
--   has_table_privilege('authenticated','public.knowledge_sources','TRUNCATE')   AS auth_truncate,
--   has_table_privilege('anon','public.knowledge_sources','SELECT')              AS anon_select;
--
-- -- 3. Aucune des deux rôles ne garde TRUNCATE/TRIGGER/REFERENCES nulle part dans public (attendu : 0 ligne).
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
--   AND grantee IN ('anon','authenticated','PUBLIC')   -- PUBLIC inclus : un privilège peut survivre par héritage
--   AND privilege_type IN ('TRUNCATE','TRIGGER','REFERENCES')
-- ORDER BY table_name, grantee, privilege_type;
