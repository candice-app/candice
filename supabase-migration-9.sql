-- Phase 7: Questionnaire refonte

-- 9.1 Champ contact physique conditionnel (affiché si love_language inclut 'touch')
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS physical_contact_with TEXT;
