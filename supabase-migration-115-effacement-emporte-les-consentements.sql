-- Migration 115 — Effacer un compte emporte les consentements dont il est partie
--
-- DÉFAUT CORRIGÉ (introduit par la migration 112, constaté le 18 nov. en rejouant les preuves)
--
--   `proche_user_id`, `granted_by` et `requested_by` sont déclarés ON DELETE SET NULL. Effacer un
--   compte déclenche donc une MISE À JOUR de chaque consentement où il figure. Or la garde posée
--   par la 112 refuse qu'on modifie les parties d'un consentement — et la suppression d'un compte
--   par le service d'authentification n'est pas reconnue comme une écriture « serveur ».
--   Conséquence : l'effacement d'un compte qui est LECTEUR ou PROCHE dans le consentement de
--   quelqu'un d'autre ÉCHOUE (« le type et les parties d'un consentement ne se modifient pas »).
--   Reproduit sur la pile locale avec la fonction exacte de la 112.
--
--   En production, la table est vide au 18 nov. : le défaut n'a encore touché personne. Il
--   toucherait le premier effacement de compte ayant un consentement.
--
-- CORRECTION
--
--   Un consentement dont une partie n'existe plus n'a plus d'objet : il est supprimé avec elle
--   (ON DELETE CASCADE), comme c'est déjà le cas pour `pilote_id`. Plus aucune mise à jour n'est
--   déclenchée par un effacement.
--
-- Indépendante du code : applicable seule, sur la version actuellement en ligne. Rejouable.

BEGIN;

DO $$
DECLARE
  c record;
  v_attendues constant text[] := ARRAY['proche_user_id', 'granted_by', 'requested_by'];
  v_vues text[] := '{}';
BEGIN
  -- PÉRIMÈTRE CONTRÔLÉ. On ne touche qu'aux trois colonnes attendues. Une clé étrangère vers
  -- auth.users sur une AUTRE colonne, et qui ne serait pas déjà en cascade, n'était pas prévue :
  -- la migration s'arrête et la nomme, plutôt que de la modifier sans l'avoir examinée.
  FOR c IN
    SELECT con.conname, att.attname, con.confdeltype, array_length(con.conkey, 1) AS nb
      FROM pg_constraint con
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
     WHERE con.conrelid = 'public.contact_consents'::regclass
       AND con.contype = 'f'
       AND con.confrelid = 'auth.users'::regclass
     ORDER BY con.conname
  LOOP
    IF c.nb <> 1 THEN
      RAISE EXCEPTION 'Migration 115 interrompue : clé étrangère composite inattendue (%).', c.conname;
    END IF;
    IF c.attname = 'pilote_id' THEN
      IF c.confdeltype <> 'c' THEN
        RAISE EXCEPTION 'Migration 115 interrompue : pilote_id devait déjà être en cascade (%, action %).', c.conname, c.confdeltype;
      END IF;
      CONTINUE;
    END IF;
    IF NOT (c.attname = ANY (v_attendues)) THEN
      RAISE EXCEPTION 'Migration 115 interrompue : clé étrangère vers auth.users sur une colonne non prévue (% sur %).', c.conname, c.attname;
    END IF;
    v_vues := v_vues || c.attname::text;
    IF c.confdeltype = 'c' THEN
      RAISE NOTICE '115 : % (%) déjà en cascade — inchangée.', c.conname, c.attname;
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.contact_consents DROP CONSTRAINT %I', c.conname);
    EXECUTE format('ALTER TABLE public.contact_consents ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', c.conname, c.attname);
    RAISE NOTICE '115 : % (%) passée de « % » à cascade.', c.conname, c.attname, c.confdeltype;
  END LOOP;
  IF NOT (v_attendues <@ v_vues) THEN
    RAISE EXCEPTION 'Migration 115 interrompue : clé(s) étrangère(s) attendue(s) absente(s) — trouvées : %.', v_vues;
  END IF;
END $$;

COMMIT;

-- CONTRÔLE AVANT ET APRÈS (lecture seule) — la même requête, lancée avant puis après :
--   select conname, confdeltype::text as action,
--          (select md5(prosrc) from pg_proc where proname = 'garde_contact_consents') as fonction,
--          (select count(*) from public.contact_consents) as lignes
--     from pg_constraint
--    where conrelid = 'public.contact_consents'::regclass and contype = 'f' order by 1;
--   AVANT  : contact_id c · granted_by n · pilote_id c · proche_user_id n · requested_by n
--   APRÈS  : c partout. « fonction » et « lignes » identiques avant et après : la 115 ne touche
--            ni à la garde, ni à une seule ligne.
