-- Migration 60 — F2 : table de mesures perf TEMPORAIRE (diagnostic device
-- réel exigé avant tout fix). À SUPPRIMER (table + beacon + API) une fois
-- le diagnostic rendu et le fix validé.
--
-- Aucune donnée personnelle : chemins, durées, user-agent tronqué.
-- RLS activée SANS policy publique : seul le service_role écrit/lit.

CREATE TABLE IF NOT EXISTS perf_beacons (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind               TEXT        NOT NULL,
  path               TEXT,
  from_path          TEXT,
  nav_type           TEXT,
  ttfb_ms            INTEGER,
  dom_ms             INTEGER,
  load_ms            INTEGER,
  click_to_route_ms  INTEGER,
  route_to_paint_ms  INTEGER,
  total_ms           INTEGER,
  ua                 TEXT
);

CREATE INDEX IF NOT EXISTS idx_perf_beacons_created ON perf_beacons (created_at DESC);

ALTER TABLE perf_beacons ENABLE ROW LEVEL SECURITY;
-- Aucune policy : accès service_role uniquement.
