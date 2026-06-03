-- Migration 24 : table memories (W1 — Nouvelle sur un proche)
-- raw_input jamais exposé côté front (console admin uniquement).
-- sensitivity_level commande le niveau d'escalade (cf. spec section 43).

CREATE TABLE IF NOT EXISTS memories (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id        UUID        NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  pilot_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_input         TEXT        NOT NULL,
  reformulation     TEXT        NOT NULL,
  nature            TEXT        CHECK (nature IN ('positive', 'negative', 'neutre')),
  theme             TEXT,
  urgence           TEXT        CHECK (urgence IN ('faible', 'modérée', 'haute', 'critique')),
  sensitivity_level INTEGER     DEFAULT 1 CHECK (sensitivity_level BETWEEN 1 AND 4),
  statut            TEXT        DEFAULT 'actif'
                                CHECK (statut IN ('actif', 'a_revalider', 'archive', 'invalide', 'sensible')),
  source            TEXT        DEFAULT 'w1',
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_contact
  ON memories (contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_pilot
  ON memories (pilot_id, created_at DESC);

-- Index partiel pour les niveaux 3-4 — utilisé par le moteur de sécurité
CREATE INDEX IF NOT EXISTS idx_memories_sensitivity
  ON memories (sensitivity_level)
  WHERE sensitivity_level >= 3;

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_memories" ON memories
  USING  (pilot_id = auth.uid())
  WITH CHECK (pilot_id = auth.uid());
