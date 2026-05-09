-- Run this in your Supabase SQL editor at https://supabase.com/dashboard

-- Contacts table: people being profiled
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('partner', 'friend', 'family', 'colleague', 'other')),
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questionnaire responses: psychological profile + preferences
CREATE TABLE questionnaire_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 12 Psychological profile questions
  love_language TEXT,           -- words | acts | gifts | time | touch
  communication_style TEXT,     -- direct | emotional | analytical | casual
  stress_response TEXT,         -- withdraws | seeks_support | action_oriented | internalizes
  social_energy TEXT,           -- very_introverted | introverted | ambivert | extroverted | very_extroverted
  appreciation_style TEXT,      -- verbal | practical | gifts | time | physical
  conflict_resolution TEXT,     -- direct | processes_first | avoids | humor
  decision_making TEXT,         -- logic | intuition | consensus | research
  emotional_expression TEXT,    -- openly | selectively | through_actions | rarely
  core_values TEXT,             -- loyalty | growth | fun | stability
  recognition_preference TEXT,  -- public | private | personal | celebrate
  boundaries TEXT,              -- space | emotional | time | privacy
  growth_mindset TEXT,          -- experiences | structured | reflective | community

  -- Preferences
  hobbies TEXT,
  favorite_foods TEXT,
  gift_preference TEXT,         -- experiences | physical | both
  standing TEXT,                -- any_sincere | well_chosen | quality | high_standards | no_preference
  gastronomy TEXT,              -- anywhere | gourmet | fine_dining | passion | functional
  accommodation TEXT,           -- destination_only | comfortable | charming | luxury | together
  gift_style TEXT,              -- useful | listened | beautiful | valuable | experiences
  conversation_topics TEXT,
  things_to_avoid TEXT,
  best_contact_method TEXT,     -- text | call | email | in_person
  important_dates TEXT,
  additional_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cached AI suggestions
CREATE TABLE suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's own psychological profile (shareable)
CREATE TABLE my_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  love_language TEXT, communication_style TEXT, stress_response TEXT,
  social_energy TEXT, appreciation_style TEXT, conflict_resolution TEXT,
  decision_making TEXT, emotional_expression TEXT, core_values TEXT,
  recognition_preference TEXT, boundaries TEXT, growth_mindset TEXT,
  hobbies TEXT, favorite_foods TEXT, gift_preference TEXT,
  standing TEXT, gastronomy TEXT, accommodation TEXT, gift_style TEXT,
  conversation_topics TEXT, things_to_avoid TEXT, best_contact_method TEXT,
  important_dates TEXT, additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add 4 quality columns if table already exists
-- ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS standing TEXT;
-- ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS gastronomy TEXT;
-- ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS accommodation TEXT;
-- ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS gift_style TEXT;

-- Migration: add additional_notes to my_profile if table already exists
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Migration: onboarding tracking
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Migration: new profile fields (run these in Supabase SQL editor)
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS disliked_activities TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS disliked_foods TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS tactility TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS health_comfort TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS family_life TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS character_emotions TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS cannot_stand TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS few_know TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS food_allergies TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS diet TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS disability TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS postal_address TEXT;

-- Row Level Security: users only see their own data
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_contacts" ON contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_responses" ON questionnaire_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_suggestions" ON suggestions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE my_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_my_profile" ON my_profile FOR ALL USING (auth.uid() = user_id);
-- Public read allows shareable links (user_id UUID is unguessable)
CREATE POLICY "public_read_my_profile" ON my_profile FOR SELECT USING (true);

-- Points ledger: every point-earning event
CREATE TABLE user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_points" ON user_points FOR ALL USING (auth.uid() = user_id);

-- Share links: a Candice user creates a link to send to someone so they can fill their own profile
CREATE TABLE share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
-- Public read so the landing page can validate tokens without auth
CREATE POLICY "public_read_share_links" ON share_links FOR SELECT USING (true);
CREATE POLICY "users_manage_share_links" ON share_links FOR ALL USING (auth.uid() = sender_id);

-- Responses submitted by authenticated users through a share link
CREATE TABLE shared_profile_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token, user_id)
);

ALTER TABLE shared_profile_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_shared_responses" ON shared_profile_responses FOR ALL USING (auth.uid() = user_id);

-- Physical measurements — questionnaire_responses (shared profile form)
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS clothing_size TEXT;
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS shoe_size TEXT;
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS ring_size TEXT;
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS pants_size TEXT;
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS pets TEXT;

-- Physical measurements — my_profile (self profile form)
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS clothing_size TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS shoe_size TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS ring_size TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS pants_size TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS pets TEXT;

-- Profile notes: free-text notes about contacts (Candice input + check-ins)
CREATE TABLE IF NOT EXISTS profile_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profile_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile_notes" ON profile_notes FOR ALL USING (auth.uid() = user_id);
