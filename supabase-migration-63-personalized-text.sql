-- Migration 63 — D1 CORRIGÉ (fixes perf) : la reformulation Haiku sort du
-- chemin de rendu. Les formulations personnalisées sont PRÉ-CALCULÉES en
-- tâche de fond (recalcul d'analyse / réponse précédente) et stockées ici ;
-- le rendu sert personalized_text s'il existe, sinon le texte de banque.
-- locked_text : jamais reformulé, jamais pré-calculé (inchangé).
-- Additive. RLS existante de profile_completion inchangée (users_own_completion).

ALTER TABLE profile_completion ADD COLUMN IF NOT EXISTS personalized_text TEXT;
