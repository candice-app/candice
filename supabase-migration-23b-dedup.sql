-- Migration 23b: deduplicate contacts (one-shot cleanup)
-- For each (user_id, normalized_name) group with more than one active row,
-- keep the most complete record (highest questionnaire score) and delete the rest.
-- Dependent rows are removed automatically via ON DELETE CASCADE.
--
-- Run ONCE after migration 23. Safe to re-run (idempotent — won't find duplicates
-- after the first execution since the idempotency index prevents new ones).

DO $$
DECLARE
  dup RECORD;
  winner UUID;
BEGIN
  FOR dup IN (
    SELECT user_id, lower(trim(name)) AS norm_name
    FROM contacts
    WHERE archived_at IS NULL
    GROUP BY user_id, lower(trim(name))
    HAVING count(*) > 1
  )
  LOOP
    -- Pick the winner: most questionnaire fields filled; tiebreak on oldest created_at
    SELECT c.id INTO winner
    FROM contacts c
    LEFT JOIN questionnaire_responses qr
      ON qr.contact_id = c.id AND qr.user_id = c.user_id
    WHERE c.user_id = dup.user_id
      AND lower(trim(c.name)) = dup.norm_name
      AND c.archived_at IS NULL
    ORDER BY (
        COALESCE(CASE WHEN qr.love_language          IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.communication_style    IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.stress_response        IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.social_energy          IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.appreciation_style     IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.conflict_resolution    IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.decision_making        IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.emotional_expression   IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.core_values            IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.hobbies                IS NOT NULL THEN 1 ELSE 0 END, 0) +
        COALESCE(CASE WHEN qr.important_dates        IS NOT NULL THEN 1 ELSE 0 END, 0)
    ) DESC,
    c.created_at ASC
    LIMIT 1;

    -- Delete all duplicates for this group except the winner
    -- (ON DELETE CASCADE removes questionnaire_responses, profile_notes,
    --  context_journal, confidences, proactive_suggestions, contextual_signals,
    --  attention_log, contact_recommendations, etc.)
    DELETE FROM contacts
    WHERE user_id = dup.user_id
      AND lower(trim(name)) = dup.norm_name
      AND archived_at IS NULL
      AND id <> winner;

    RAISE NOTICE 'Deduplicated % / % — kept %', dup.user_id, dup.norm_name, winner;
  END LOOP;
END $$;
