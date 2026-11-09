-- Migration 101 — Fermeture des GRANTs sur les 7 fonctions SECURITY DEFINER exécutables par anon.
--
-- POURQUOI. Audit lecture seule des 15 fonctions du schéma public : 9 sont en SECURITY DEFINER
-- (elles tournent avec les droits du propriétaire et contournent la RLS). 7 d'entre elles sont
-- exécutables par `anon` (la clé publique) à cause des *default privileges* Supabase, qui accordent
-- EXECUTE à anon / authenticated / service_role AU MOMENT DU CREATE. Le site est en ligne : un inconnu
-- muni de la seule clé publique peut aujourd'hui appeler ces 7 fonctions directement via PostgREST,
-- en court-circuitant la garde d'authentification des routes serveur. On ferme.
--
-- LE VERROUILLAGE N'EST PAS UNIFORME — deux familles, deux appelants légitimes différents :
--
--   • Les 3 lookup_* : appelées UNIQUEMENT par des routes serveur (/api/contacts/lookup,
--     /api/profile-view/lookup) via le client admin → l'appelant légitime est `service_role`.
--     Aucune voie navigateur. On retire PUBLIC, anon ET authenticated. On garde service_role + postgres.
--
--   • Les 4 reserve_* / confirm_* : appelées depuis le NAVIGATEUR d'un proche connecté
--     (EspaceProcheShell.tsx) → l'appelant légitime est `authenticated`.
--     On retire PUBLIC, anon ET service_role. On garde authenticated + postgres.
--
-- Inverser les deux familles casserait l'ajout d'un proche (lookups) ou le bouton de réservation
-- (reserve/confirm). D'où le découpage explicite ci-dessous.
--
-- PORTÉE. Strictement corrective, additive sur les droits (REVOKE uniquement). Aucune modification de
-- corps, aucune donnée touchée. Rejouable sans erreur : révoquer un droit déjà absent est un no-op
-- silencieux en Postgres. On NE TOUCHE PAS aux 6 fonctions invoker (leur accès anon est inoffensif :
-- la RLS s'applique) — passe d'hygiène séparée, plus tard.
--
-- RETOUR ARRIÈRE. La clé qui rouvre exactement ces 7 portes est dans le fichier voisin
-- `supabase-migration-101-ROLLBACK-grants.sql` (grants restaurés à l'identique + retrait de la ligne 101
-- du journal). À ne lancer que pour annuler cette migration.

-- ─── Famille 1 : les 3 lookup_* — garder service_role + postgres ───────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.lookup_candice_user_by_email(text)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lookup_candice_user_by_email(text)  FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_candice_user_by_email(text)  FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.lookup_candice_user_by_phone(text)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lookup_candice_user_by_phone(text)  FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_candice_user_by_phone(text)  FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.lookup_candice_user_by_handle(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lookup_candice_user_by_handle(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_candice_user_by_handle(text) FROM authenticated;

-- ─── Famille 2 : les 4 reserve_* / confirm_* — garder authenticated + postgres ─────────────────────
REVOKE EXECUTE ON FUNCTION public.reserve_reco_item(uuid, integer)            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_reco_item(uuid, integer)            FROM anon;
REVOKE EXECUTE ON FUNCTION public.reserve_reco_item(uuid, integer)            FROM service_role;

REVOKE EXECUTE ON FUNCTION public.reserve_wishlist_item(uuid, integer)        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_wishlist_item(uuid, integer)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.reserve_wishlist_item(uuid, integer)        FROM service_role;

REVOKE EXECUTE ON FUNCTION public.confirm_reco_purchase(uuid, text, integer)     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirm_reco_purchase(uuid, text, integer)     FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_reco_purchase(uuid, text, integer)     FROM service_role;

REVOKE EXECUTE ON FUNCTION public.confirm_wishlist_purchase(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirm_wishlist_purchase(uuid, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_wishlist_purchase(uuid, text, integer) FROM service_role;

-- Auto-enregistrement (convention applied_migrations : colonne `filename`, nom COMPLET du fichier, insert
-- CONDITIONNEL — PAS de colonne `migration`, PAS de ON CONFLICT ; rejouable sans erreur).
INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-101-fermeture-grants-definer.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations
  WHERE filename = 'supabase-migration-101-fermeture-grants-definer.sql'
);
