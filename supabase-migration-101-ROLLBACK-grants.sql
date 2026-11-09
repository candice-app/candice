-- RETOUR ARRIÈRE de la migration 101 — restaure l'état EXACT des grants d'avant fermeture.
--
-- À NE LANCER QUE pour annuler la 101 (si la fermeture casse quelque chose). Ce fichier n'est PAS une
-- migration forward : il ne s'enregistre pas dans applied_migrations, il en retire au contraire la ligne
-- de la 101 pour que le journal reflète la réalité après annulation.
--
-- ÉTAT RESTAURÉ (relevé en base avant la 101, le 2026-11-09) :
--   • 3 lookup_*                : PUBLIC, anon, authenticated, postgres, service_role  (EXECUTE)
--   • 4 reserve_* / confirm_*   : anon, authenticated, postgres, service_role          (EXECUTE)  ← PAS de PUBLIC
-- postgres (propriétaire) et les rôles non révoqués n'ont jamais bougé ; on ne réaccorde donc QUE ce que
-- la 101 a retiré, à l'identique — PUBLIC pour les lookups, rien de plus pour les reserve/confirm.

-- ─── Famille 1 : les 3 lookup_* — réaccorde PUBLIC, anon, authenticated ────────────────────────────
GRANT EXECUTE ON FUNCTION public.lookup_candice_user_by_email(text)  TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_candice_user_by_email(text)  TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_candice_user_by_email(text)  TO authenticated;

GRANT EXECUTE ON FUNCTION public.lookup_candice_user_by_phone(text)  TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_candice_user_by_phone(text)  TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_candice_user_by_phone(text)  TO authenticated;

GRANT EXECUTE ON FUNCTION public.lookup_candice_user_by_handle(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_candice_user_by_handle(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_candice_user_by_handle(text) TO authenticated;

-- ─── Famille 2 : les 4 reserve_* / confirm_* — réaccorde anon, service_role (PAS PUBLIC) ───────────
GRANT EXECUTE ON FUNCTION public.reserve_reco_item(uuid, integer)              TO anon;
GRANT EXECUTE ON FUNCTION public.reserve_reco_item(uuid, integer)              TO service_role;

GRANT EXECUTE ON FUNCTION public.reserve_wishlist_item(uuid, integer)          TO anon;
GRANT EXECUTE ON FUNCTION public.reserve_wishlist_item(uuid, integer)          TO service_role;

GRANT EXECUTE ON FUNCTION public.confirm_reco_purchase(uuid, text, integer)     TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_reco_purchase(uuid, text, integer)     TO service_role;

GRANT EXECUTE ON FUNCTION public.confirm_wishlist_purchase(uuid, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_wishlist_purchase(uuid, text, integer) TO service_role;

-- Retire la trace de la 101 du journal (annulation réelle).
DELETE FROM applied_migrations WHERE filename = 'supabase-migration-101-fermeture-grants-definer.sql';
