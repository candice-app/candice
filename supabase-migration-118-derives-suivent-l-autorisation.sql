-- Migration 118 — Ce qui a été calculé avec les données d'un proche suit son autorisation
--
-- DÉCISION (Estelle, 18 nov.) : une autorisation retirée ne doit plus alimenter les nouvelles
-- recommandations, les affichages ni les contenus dérivés encore accessibles. On invalide et on
-- recalcule ; si la provenance ne permet pas de retirer seulement la contribution devenue
-- interdite, le contenu est indisponible jusqu'au recalcul. On ne supprime ni l'historique des
-- attentions réalisées, ni ce que le pilote a fourni lui-même.
--
-- CE QUE FAIT CETTE MIGRATION
--
--   1. PROVENANCE. Chaque recommandation enregistrée et chaque ligne du journal des attentions
--      note le compte du proche et les autorisations qui ont servi à la produire
--      (`proche_compte`, `portees_proche`). Vide = rien du proche n'a servi : jamais touchée.
--   2. RETRAIT. Dès qu'une autorisation d'usage est réduite, retirée ou supprimée — par la
--      route, par l'effacement du compte, par un changement du compte rattaché à la fiche —
--      la base, dans la MÊME transaction :
--        • vide les recommandations dont la provenance n'est plus couverte, et les marque
--          « à recalculer » (une recommandation est un tout : on ne sait pas en retirer une part) ;
--        • supprime du journal les idées seulement PROPOSÉES issues de ces données ;
--        • CONSERVE les attentions réalisées ou commentées par le pilote (date, type, retour,
--          note), en remplaçant leur intitulé, qui venait des données retirées.
--   3. Rien n'est laissé au code appelant : aucun chemin de retrait ne peut l'oublier.
--
-- Les lignes existantes reçoivent une provenance vide : elles ont été produites sans lecture
-- d'un profil lié (désactivée en production, et 0 fiche reliée au relevé du 18 nov.).
--
-- Indépendante du code en ligne (colonnes avec valeur par défaut). À appliquer AVANT le
-- déploiement de la branche, qui écrit la provenance. Rejouable.

BEGIN;

ALTER TABLE public.contact_recommendations
  ADD COLUMN IF NOT EXISTS portees_proche text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS proche_compte  uuid,
  ADD COLUMN IF NOT EXISTS a_recalculer   boolean NOT NULL DEFAULT false;

ALTER TABLE public.attention_log
  ADD COLUMN IF NOT EXISTS portees_proche   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS proche_compte    uuid,
  ADD COLUMN IF NOT EXISTS detail_retire_le timestamptz;

CREATE OR REPLACE FUNCTION public.purger_derives_du_proche(p_pilote uuid, p_contact uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_compte  uuid;
  v_portees text[];
BEGIN
  -- Ce qui est autorisé MAINTENANT : le compte rattaché à la fiche, et son autorisation active
  -- et prouvée. Tout le reste ne couvre plus rien.
  SELECT c.proche_user_id INTO v_compte FROM contacts c WHERE c.id = p_contact AND c.user_id = p_pilote;
  IF v_compte IS NOT NULL THEN
    SELECT cc.scope INTO v_portees
      FROM contact_consents cc
     WHERE cc.kind = 'profile_usage' AND cc.pilote_id = p_pilote AND cc.contact_id = p_contact
       AND cc.proche_user_id = v_compte AND cc.status = 'active' AND cc.granted_by = cc.proche_user_id;
  END IF;
  v_portees := coalesce(v_portees, '{}');

  UPDATE contact_recommendations r
     SET ideas = '[]'::jsonb, blind_spot = NULL, portees_proche = '{}', proche_compte = NULL, a_recalculer = true
   WHERE r.user_id = p_pilote AND r.contact_id = p_contact
     AND cardinality(r.portees_proche) > 0
     AND (r.proche_compte IS DISTINCT FROM v_compte OR NOT (r.portees_proche <@ v_portees));

  -- Idées seulement proposées : elles ne sont l'événement de personne.
  DELETE FROM attention_log a
   WHERE a.user_id = p_pilote AND a.contact_id = p_contact
     AND cardinality(a.portees_proche) > 0
     AND (a.proche_compte IS DISTINCT FROM v_compte OR NOT (a.portees_proche <@ v_portees))
     AND a.status = 'proposed' AND a.feedback IS NULL AND a.actioned_at IS NULL;

  -- Attentions réalisées, écartées ou commentées : l'événement appartient au pilote, on le garde.
  -- Seul l'intitulé, tiré des données retirées, est remplacé.
  UPDATE attention_log a
     SET attention_title = 'Une attention (détail retiré)', portees_proche = '{}', proche_compte = NULL, detail_retire_le = now()
   WHERE a.user_id = p_pilote AND a.contact_id = p_contact
     AND cardinality(a.portees_proche) > 0
     AND (a.proche_compte IS DISTINCT FROM v_compte OR NOT (a.portees_proche <@ v_portees));
END;
$$;

CREATE OR REPLACE FUNCTION public.derives_apres_consentement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF (CASE WHEN TG_OP = 'DELETE' THEN OLD.kind ELSE NEW.kind END) = 'profile_usage' THEN
    PERFORM public.purger_derives_du_proche(OLD.pilote_id, OLD.contact_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.derives_apres_changement_de_compte()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  PERFORM public.purger_derives_du_proche(NEW.user_id, NEW.id);
  RETURN NULL;
END;
$$;

-- Ces fonctions ne s'appellent pas de l'extérieur : appelées librement, la première permettrait
-- de vider les recommandations d'un autre. Les déclencheurs, eux, n'ont pas besoin de ce droit.
REVOKE ALL ON FUNCTION public.purger_derives_du_proche(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.derives_apres_consentement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.derives_apres_changement_de_compte() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_derives_apres_consentement ON public.contact_consents;
CREATE TRIGGER trg_derives_apres_consentement
  AFTER UPDATE OR DELETE ON public.contact_consents
  FOR EACH ROW EXECUTE FUNCTION public.derives_apres_consentement();

DROP TRIGGER IF EXISTS trg_derives_apres_changement_de_compte ON public.contacts;
CREATE TRIGGER trg_derives_apres_changement_de_compte
  AFTER UPDATE OF proche_user_id ON public.contacts
  FOR EACH ROW WHEN (OLD.proche_user_id IS DISTINCT FROM NEW.proche_user_id)
  EXECUTE FUNCTION public.derives_apres_changement_de_compte();

COMMIT;

-- VÉRIFICATION (lecture seule) :
--   select tgname from pg_trigger where tgname like 'trg_derives%';            → 2 lignes
--   select has_function_privilege('authenticated', 'public.purger_derives_du_proche(uuid, uuid)', 'execute');  → false
