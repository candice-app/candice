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
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conname, att.attname
      FROM pg_constraint con
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
     WHERE con.conrelid = 'public.contact_consents'::regclass
       AND con.contype = 'f'
       AND con.confrelid = 'auth.users'::regclass
       AND con.confdeltype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.contact_consents DROP CONSTRAINT %I', c.conname);
    EXECUTE format('ALTER TABLE public.contact_consents ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', c.conname, c.attname);
  END LOOP;
END $$;

COMMIT;

-- VÉRIFICATION APRÈS APPLICATION (lecture seule) — attendu : « c » sur les cinq lignes
--   select conname, confdeltype from pg_constraint
--    where conrelid = 'public.contact_consents'::regclass and contype = 'f' order by 1;
