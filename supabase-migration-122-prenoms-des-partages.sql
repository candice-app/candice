-- Migration 122 — LES PRÉNOMS DE « PARTAGER MA FICHE », SANS CLIENT PRIVILÉGIÉ (19 nov., 18h54).
--
-- POURQUOI. La page /moi/partage lisait le prénom des personnes avec qui l'on partage sa fiche avec
-- le client `service_role` (auth.admin.getUserById). Ce n'était pas une fuite démontrée : la page ne
-- demandait que des identifiants tirés des consentements de l'appelant. Mais rien, dans la base, ne
-- bornait cette lecture : la borne n'existait que dans le code de la page. Cette fonction la met dans
-- la base.
--
-- PÉRIMÈTRE, justifié ligne par ligne :
--   · QUI : la personne connectée seulement (auth.uid()) ; anon n'a pas le droit d'exécuter ;
--   · QUOI : le PRÉNOM seul (premier mot du nom déclaré) — ni courriel, ni nom complet, ni identifiant
--     d'une autre personne que celle de la ligne ;
--   · DE QUI : uniquement l'autre partie d'un partage de fiche (kind = 'profile_view') dont
--     l'appelant est le titulaire (pilote_id = auth.uid()), en attente ou actif — exactement les lignes
--     que la page affiche. Un partage refusé ou retiré ne rend plus de prénom.
-- ADDITIVE : une fonction. Rejouable. RETOUR ARRIÈRE : DROP FUNCTION ; la page affiche alors
-- « Quelqu'un » (repli existant), sans erreur.
-- À APPLIQUER PAR ESTELLE sur la base vivante — jamais par un agent.

BEGIN;

CREATE OR REPLACE FUNCTION public.prenoms_de_mes_partages()
RETURNS TABLE (consent_id uuid, prenom text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT k.id,
         nullif(split_part(coalesce(u.raw_user_meta_data->>'full_name', ''), ' ', 1), '')
    FROM public.contact_consents k
    JOIN auth.users u ON u.id = CASE WHEN k.status = 'pending' THEN k.requested_by ELSE k.proche_user_id END
   WHERE auth.uid() IS NOT NULL
     AND k.pilote_id = auth.uid()
     AND k.kind = 'profile_view'
     AND k.status IN ('pending', 'active');
$$;

REVOKE ALL ON FUNCTION public.prenoms_de_mes_partages() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prenoms_de_mes_partages() TO authenticated;

INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-122-prenoms-des-partages.sql'
WHERE NOT EXISTS (SELECT 1 FROM applied_migrations WHERE filename = 'supabase-migration-122-prenoms-des-partages.sql');

COMMIT;

NOTIFY pgrst, 'reload schema';

-- VÉRIFICATION (lecture seule) :
--   select proname, prosecdef from pg_proc where proname = 'prenoms_de_mes_partages';
