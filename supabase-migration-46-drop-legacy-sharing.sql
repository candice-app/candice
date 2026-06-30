-- Migration 46 — Assainissement du partage : retrait du système mort
--
-- CONTEXTE :
--   Le système profile_share_requests (migration 3) est abandonné au profit de
--   contact_consents (migration 40). Composants UI orphelins, routes API cassées
--   (écrivent 'declined' rejeté par le CHECK), reauth = façade non vérifiée serveur.
--   Décision produit : suppression code + neutralisation DB (RENAME, pas DROP).
--
-- SNAPSHOT pg_policies AVANT migration (état réel en base, drift Studio inclus) :
--   -- read_own_or_shared_profile (SELECT): (auth.uid() = user_id)
--                                            OR EXISTS(profile_share_requests
--                                                     accepté + confirmed_with_reauth)
--   -- users_own_my_profile      (ALL)   : auth.uid() = user_id
--   -- users_own_profile         (ALL)   : auth.uid() = user_id   [doublon retiré]
--
-- État final attendu sur my_profile : users_own_my_profile SEULE.
--   Vérification après application :
--     SELECT policyname, cmd, qual
--       FROM pg_policies
--      WHERE tablename = 'my_profile';
--   → doit renvoyer 1 seule ligne : users_own_my_profile / ALL / (auth.uid() = user_id)

-- 1. Nettoyer my_profile : retirer les 2 policies drift Studio
DROP POLICY IF EXISTS "read_own_or_shared_profile" ON my_profile;
DROP POLICY IF EXISTS "users_own_profile"          ON my_profile;

-- 2. Déprécier la table profile_share_requests sans la dropper (préserve la donnée
--    pour audit RGPD a posteriori). Index, policies et contraintes suivent
--    automatiquement le renommage côté PostgreSQL.
ALTER TABLE IF EXISTS profile_share_requests
  RENAME TO _deprecated_profile_share_requests;
