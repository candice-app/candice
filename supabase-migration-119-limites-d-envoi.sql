-- Migration 119 — Limites d'envoi des courriels déclenchés par un utilisateur
--
-- Un compte pouvait faire envoyer par Candice, sans aucune limite, des invitations, des rappels
-- et des relances à l'adresse de son choix. Les limites sont tenues ICI, dans la base : elles
-- survivent aux redémarrages, valent pour toutes les instances du serveur, et deux appels
-- simultanés ne peuvent pas passer tous les deux (verrou par expéditeur et par destinataire).
--
-- SEUILS RETENUS (un seul endroit : la fonction ci-dessous)
--
--   Vers une autre personne, pour un même type de courriel :
--     • même expéditeur → même destinataire : 1 par 24 h, 3 par 30 jours ;
--   Tous types confondus :
--     • un expéditeur : 20 courriels vers d'autres personnes par 24 h ;
--     • un destinataire : 5 courriels par 24 h, tous expéditeurs réunis.
--   Vers soi-même (bienvenue, export de ses données) : 3 par 24 h et par type.
--
-- L'adresse du destinataire n'est pas conservée : seule son empreinte (SHA-256) l'est, et les
-- lignes de plus de 35 jours sont supprimées au fil des appels.
--
-- Aucune session d'utilisateur ne lit ni n'écrit cette table ; la fonction n'est appelable que
-- par le serveur. Indépendante du code en ligne. À appliquer AVANT le déploiement de la branche :
-- sans elle, la branche n'envoie aucun de ces courriels (elle échoue fermée). Rejouable.

BEGIN;

CREATE TABLE IF NOT EXISTS public.envois_courriel (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  expediteur      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinataire_h  text        NOT NULL,
  type            text        NOT NULL,
  cree_le         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_envois_expediteur   ON public.envois_courriel (expediteur, cree_le DESC);
CREATE INDEX IF NOT EXISTS idx_envois_destinataire ON public.envois_courriel (destinataire_h, cree_le DESC);

ALTER TABLE public.envois_courriel ENABLE ROW LEVEL SECURITY;   -- aucune politique : fermé aux sessions
REVOKE ALL ON public.envois_courriel FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reserver_envoi(
  p_expediteur uuid, p_destinataire_h text, p_type text, p_a_soi boolean
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  -- LES SEUILS
  c_meme_dest_24h   constant integer := 1;
  c_meme_dest_30j   constant integer := 3;
  c_expediteur_24h  constant integer := 20;
  c_destinataire_24h constant integer := 5;
  c_a_soi_24h       constant integer := 3;
  n integer;
BEGIN
  IF p_expediteur IS NULL OR coalesce(p_destinataire_h, '') = '' OR coalesce(p_type, '') = '' THEN
    RETURN 'invalide';
  END IF;
  -- Un appel à la fois par expéditeur, puis par destinataire : deux requêtes simultanées se
  -- suivent, la seconde voit la réservation de la première.
  PERFORM pg_advisory_xact_lock(hashtextextended('envoi:exp:' || p_expediteur::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('envoi:dest:' || p_destinataire_h, 0));

  DELETE FROM envois_courriel WHERE cree_le < now() - interval '35 days';

  IF p_a_soi THEN
    SELECT count(*) INTO n FROM envois_courriel
     WHERE expediteur = p_expediteur AND type = p_type AND cree_le > now() - interval '24 hours';
    IF n >= c_a_soi_24h THEN RETURN 'limite_a_soi'; END IF;
  ELSE
    SELECT count(*) INTO n FROM envois_courriel
     WHERE expediteur = p_expediteur AND destinataire_h = p_destinataire_h AND type = p_type
       AND cree_le > now() - interval '24 hours';
    IF n >= c_meme_dest_24h THEN RETURN 'deja_envoye_aujourd_hui'; END IF;
    SELECT count(*) INTO n FROM envois_courriel
     WHERE expediteur = p_expediteur AND destinataire_h = p_destinataire_h AND type = p_type
       AND cree_le > now() - interval '30 days';
    IF n >= c_meme_dest_30j THEN RETURN 'limite_meme_destinataire'; END IF;
    SELECT count(*) INTO n FROM envois_courriel
     WHERE expediteur = p_expediteur AND destinataire_h <> 'soi' AND cree_le > now() - interval '24 hours';
    IF n >= c_expediteur_24h THEN RETURN 'limite_expediteur'; END IF;
    SELECT count(*) INTO n FROM envois_courriel
     WHERE destinataire_h = p_destinataire_h AND cree_le > now() - interval '24 hours';
    IF n >= c_destinataire_24h THEN RETURN 'limite_destinataire'; END IF;
  END IF;

  INSERT INTO envois_courriel (expediteur, destinataire_h, type)
  VALUES (p_expediteur, CASE WHEN p_a_soi THEN 'soi' ELSE p_destinataire_h END, p_type);
  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.reserver_envoi(uuid, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserver_envoi(uuid, text, text, boolean) TO service_role;

COMMIT;

-- VÉRIFICATION (lecture seule) :
--   select has_function_privilege('authenticated', 'public.reserver_envoi(uuid, text, text, boolean)', 'execute');  → false
--   select relrowsecurity from pg_class where oid = 'public.envois_courriel'::regclass;                          → true
