-- Migration 55 — Refonte Profil V2, Phase C : photo de profil (avatar).
--
-- Pattern contact-photos (arbitrage Estelle 8) : bucket PRIVÉ, upload via
-- la couche serveur (service_role), URL signée 1 h générée au rendu.
-- On stocke le CHEMIN, jamais une URL. Aucune policy storage : seul le
-- service_role accède au bucket (accès médié par l'API, comme contact-photos).
--
-- Additive uniquement.

ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS avatar_path TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;
