-- Migration 29 — Discovery Engine + profile completion tracking
-- Lot 3 : Moteur de complétion (Discovery Engine)

-- ── Question bank ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discovery_questions (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  question_key    TEXT    NOT NULL UNIQUE,
  dimension       TEXT    NOT NULL,
  subdimension    TEXT,
  question_text   TEXT    NOT NULL,
  question_type   TEXT    NOT NULL CHECK (question_type IN ('chips_single','chips_multi','text')),
  options         JSONB,               -- [{label, value}] for chips questions
  trigger_key     TEXT,                -- prerequisite question_key
  target          TEXT    NOT NULL DEFAULT 'self' CHECK (target IN ('self','contact','both')),
  min_days_between INTEGER DEFAULT 30,
  sort_order      INTEGER DEFAULT 0,
  statut          TEXT    DEFAULT 'active' CHECK (statut IN ('active','paused','archived')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS: read-only for all authenticated users
ALTER TABLE discovery_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_discovery_questions" ON discovery_questions
  FOR SELECT USING (true);

-- ── Seed: question bank (French, Candice voice) ───────────────────────────────

INSERT INTO discovery_questions (question_key, dimension, subdimension, question_text, question_type, options, sort_order) VALUES

('attention.reception', 'attention', 'reception',
 'Comment tu te sens vraiment aimé·e ?',
 'chips_multi',
 '[{"label":"Par les mots","value":"MOT"},{"label":"Par les actes","value":"SER"},{"label":"Par des cadeaux","value":"CAD_C"},{"label":"Par le temps partagé","value":"EXP"},{"label":"Par les petites attentions","value":"GES"},{"label":"Par les surprises","value":"SUR"}]',
 10),

('gifts.what_works', 'gifts', 'works',
 'Quel type de cadeau te touche vraiment ?',
 'chips_multi',
 '[{"label":"Expériences","value":"experiences"},{"label":"Personnalisé","value":"personalized"},{"label":"Utile et beau","value":"practical"},{"label":"Beauté / bien-être","value":"beauty"},{"label":"Livres / culture","value":"culture"},{"label":"Fait main","value":"handmade"},{"label":"Surprise totale","value":"surprise"}]',
 20),

('gifts.to_avoid', 'gifts', 'avoid',
 'Des cadeaux ou attentions à éviter absolument ?',
 'text', NULL, 30),

('style.clothing', 'style', 'clothing',
 'Tu te décrirais avec quel style ?',
 'chips_multi',
 '[{"label":"Classique","value":"classic"},{"label":"Bohème","value":"boho"},{"label":"Minimaliste","value":"minimal"},{"label":"Chic parisien","value":"chic"},{"label":"Décontracté","value":"casual"},{"label":"Sportswear","value":"sport"},{"label":"Mode / tendance","value":"trendy"}]',
 40),

('style.colors', 'style', 'colors',
 'Tes couleurs et matières préférées pour te faire plaisir ?',
 'text', NULL, 50),

('brands.favorites', 'brands', 'favorites',
 'Des marques, enseignes ou créateurs que tu adores ?',
 'text', NULL, 60),

('food.restaurants', 'food', 'restaurants',
 'Tu préfères quel type de table ?',
 'chips_multi',
 '[{"label":"Bistrot convivial","value":"bistro"},{"label":"Gastronomique","value":"gastronomic"},{"label":"Bonne adresse décontractée","value":"casual_good"},{"label":"Cuisine du monde","value":"world"},{"label":"Végétarien / healthy","value":"veggie"},{"label":"Tout si c''est bon","value":"anything_good"}]',
 70),

('fragrance.family', 'fragrance', 'family',
 'Tu portes plutôt quel type de parfum ?',
 'chips_multi',
 '[{"label":"Fleuri","value":"floral"},{"label":"Frais / citrus","value":"fresh"},{"label":"Boisé","value":"woody"},{"label":"Oriental / Ambré","value":"oriental"},{"label":"Poudré","value":"powder"},{"label":"Gourmand","value":"gourmand"},{"label":"Discret","value":"light"},{"label":"Sans parfum","value":"none"}]',
 80),

('travel.style', 'travel', 'style',
 'Quand tu voyages, tu cherches…',
 'chips_multi',
 '[{"label":"L''aventure","value":"adventure"},{"label":"La culture","value":"culture"},{"label":"Le repos total","value":"relax"},{"label":"La nature","value":"nature"},{"label":"Les villes animées","value":"city"},{"label":"La gastronomie locale","value":"gastro"},{"label":"Le luxe discret","value":"luxury"}]',
 90),

('hobbies.main', 'hobbies', 'main',
 'Qu''est-ce qui te ressource vraiment ?',
 'text', NULL, 100),

('dreams.current', 'dreams', 'current',
 'Tu as des envies ou des rêves en ce moment ?',
 'text', NULL, 110),

('surprises.preference', 'surprises', 'preference',
 'Tu es plutôt…',
 'chips_single',
 '[{"label":"J''adore les surprises","value":"loves"},{"label":"Ça dépend du contexte","value":"depends"},{"label":"Je préfère être prévenu·e","value":"notice"},{"label":"Les surprises me stressent","value":"dislikes"}]',
 120),

('conflicts.style', 'conflicts', 'style',
 'Face à une tension, comment tu réagis ?',
 'chips_single',
 '[{"label":"J''en parle directement","value":"direct"},{"label":"J''ai besoin de recul","value":"space"},{"label":"Je préfère éviter","value":"avoids"},{"label":"Je dédramatise","value":"humor"}]',
 130),

('practical.constraints', 'practical', 'constraints',
 'Des contraintes importantes à connaître ?',
 'chips_multi',
 '[{"label":"Végétarien·ne","value":"vegetarian"},{"label":"Vegan","value":"vegan"},{"label":"Halal","value":"halal"},{"label":"Casher","value":"casher"},{"label":"Allergie alimentaire","value":"food_allergy"},{"label":"Sans alcool","value":"no_alcohol"},{"label":"Contrainte de mobilité","value":"mobility"},{"label":"Aucune","value":"none"}]',
 140)

ON CONFLICT (question_key) DO NOTHING;

-- ── Completion tracking ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_completion (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES contacts(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  is_filled    BOOLEAN DEFAULT false,
  answer_data  JSONB,               -- stores the answer value
  last_asked_at TIMESTAMPTZ,
  answered_at  TIMESTAMPTZ,
  skipped_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Unique index: one record per (user, contact_or_null, question_key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_completion_self
  ON profile_completion(user_id, question_key) WHERE contact_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_completion_contact
  ON profile_completion(user_id, contact_id, question_key) WHERE contact_id IS NOT NULL;

ALTER TABLE profile_completion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_completion" ON profile_completion
  FOR ALL USING (auth.uid() = user_id);

-- ── Discovery sessions (pause / resume for full mode) ─────────────────────────

CREATE TABLE IF NOT EXISTS discovery_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id       UUID REFERENCES contacts(id) ON DELETE CASCADE,
  mode             TEXT NOT NULL CHECK (mode IN ('quick','full')),
  pending_keys     TEXT[] DEFAULT '{}',
  current_index    INTEGER DEFAULT 0,
  status           TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  started_at       TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_sessions" ON discovery_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ── my_profile additions ──────────────────────────────────────────────────────

-- Stores {question_key: answer_value} from discovery answers
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS discovery_answers JSONB;
