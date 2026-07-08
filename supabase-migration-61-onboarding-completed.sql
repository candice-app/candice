-- Migration 61 — réparation de dérive de schéma (diagnostic perf, arbitrage 1).
--
-- Le code lit ET écrit my_profile.onboarding_completed, mais la colonne
-- N'EXISTE PAS en prod : le select du dashboard échouait EN BLOC à chaque
-- visite (myProfile = null) → le tour d'accueil se montait pour tout le
-- monde, à chaque fois, et son overlay interceptait les taps ; l'écriture
-- de fin de tour échouait → boucle infinie.
--
-- Additive. Le tour lui-même est neutralisé côté code (violation DA,
-- refonte au lot Harmonisation design) — la colonne reste pour ce lot-là.

ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
