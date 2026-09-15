-- Migration 77 — share_links : suppression de la policy d'énumération publique.
--
-- CONTEXTE (diagnostic lot RLS) :
--   public_read_share_links (SELECT USING true) laissait n'importe qui énumérer
--   TOUS les tokens de partage (+ sender_name). Or le token DOIT être le secret :
--   énumérer la table contournait ce secret. Oubli, pas choix produit.
--
-- SÉCURITÉ DU PARCOURS (vérifié) :
--   • share_links est LEGACY : aucun insert dans le code, 0 ligne en base.
--   • Les 3 seuls lecteurs (profil-partage/[token], api/shared-profile/complete,
--     api/questionnaire/proche-register) passent par createAdminClient()
--     (service_role, BYPASSRLS) + .eq('token', token) → NON affectés.
--   • Le parcours de partage ACTIF utilise profile_share_links (table distincte,
--     RLS owner-only) → NON touché.
--
-- CIBLE : retirer la policy permissive. Reste users_manage_share_links (owner lit
--   les siens). Anon/authenticated ne peuvent plus énumérer ; l'accès par token
--   reste possible via le service_role (routes admin). Additive.

DROP POLICY IF EXISTS public_read_share_links ON share_links;
