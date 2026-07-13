-- Migration 67 — Fusion du legacy contacts.gift_wishlist → carnet_envies_items.
-- JAMAIS de DROP : gift_wishlist est backfillée puis DÉPRÉCIÉE (commentaire).
-- Idempotent (NOT EXISTS sur contact_id + description).
-- État au moment de l'écriture : 0 item réel (tableaux gift_wishlist vides) —
-- le backfill migre donc 0 ligne, mais reste correct pour tout item futur/oublié.

INSERT INTO carnet_envies_items
  (contact_id, pilot_id, description, note_text, source_link, source, source_trace, statut, created_at)
SELECT
  c.id,
  c.user_id,
  COALESCE(NULLIF(TRIM(elem->>'title'), ''), '(sans titre)'),
  elem->>'note',
  elem->>'url',
  CASE WHEN NULLIF(TRIM(COALESCE(elem->>'url','')), '') IS NOT NULL THEN 'link' ELSE NULL END,
  'spotted',
  'actif',
  COALESCE((elem->>'addedAt')::timestamptz, now())
FROM contacts c
CROSS JOIN LATERAL jsonb_array_elements(c.gift_wishlist) AS elem
WHERE c.gift_wishlist IS NOT NULL
  AND jsonb_typeof(c.gift_wishlist) = 'array'
  AND NOT EXISTS (
    SELECT 1 FROM carnet_envies_items k
    WHERE k.contact_id = c.id
      AND k.description = COALESCE(NULLIF(TRIM(elem->>'title'), ''), '(sans titre)')
  );

COMMENT ON COLUMN contacts.gift_wishlist IS
  'DÉPRÉCIÉ (lot Wishlist V2, migration 67) — fusionné dans carnet_envies_items. Ne plus écrire. Conservé pour historique, jamais droppé sur données réelles.';
