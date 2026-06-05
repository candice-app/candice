// Discovery Engine — section 26 (Lot 3)
// Two modes: drip (1 triggered question) and full (guided session by section).
// JSON validated + deterministic fallback. Never re-asks answered questions.

import Anthropic from '@anthropic-ai/sdk';

// ── Types ────────────────────────────────────────────────────────────────────

export interface QuestionOption { label: string; value: string; }

export interface DiscoveryQuestion {
  id: string;
  question_key: string;
  dimension: string;
  subdimension: string | null;
  question_text: string;
  question_type: 'chips_single' | 'chips_multi' | 'text';
  options: QuestionOption[] | null;
  sort_order: number;
}

export interface NextQuestionResult {
  question: DiscoveryQuestion;
  sessionId: string;
  sectionLabel: string;
  progress: { current: number; total: number } | null;
}

// ── Dimension → section label map ────────────────────────────────────────────

export const DIMENSION_LABELS: Record<string, string> = {
  attention:  '❤️ Langage d\'attention',
  gifts:      '🎁 Cadeaux',
  style:      '👗 Style',
  brands:     '🛍 Marques',
  food:       '🍽 Restaurants',
  fragrance:  '🌸 Parfums',
  travel:     '✈️ Voyages',
  hobbies:    '🎭 Loisirs',
  dreams:     '💭 Rêves',
  surprises:  '🎉 Surprises',
  conflicts:  '💬 Conflits',
  practical:  '🧭 Pratique',
};

// Signals that suggest a dimension to explore
const SIGNAL_DIMENSION_MAP: Record<string, string> = {
  celebration_appropriate:     'gifts',
  gift_precision_needed:       'gifts',
  premium_gift_preference:     'style',
  gastronomy_interest:         'food',
  travel_desire:               'travel',
  wellness_importance:         'fragrance',
  surprise_tolerance:          'surprises',
  direct_communication_preference: 'conflicts',
  fashion_affinity:            'style',
  reading_affinity:            'hobbies',
  music_affinity:              'hobbies',
  nature_affinity:             'travel',
  handmade_gift_preference:    'gifts',
  public_recognition_avoidance:'surprises',
};

// ── Supabase type ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupaDB = any;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getAnsweredKeys(
  supabase: SupaDB,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from('profile_completion')
    .select('question_key')
    .eq('user_id', userId)
    .is('contact_id', null)
    .eq('is_filled', true);
  return new Set((data ?? []).map((r: { question_key: string }) => r.question_key));
}

async function getAllQuestions(supabase: SupaDB): Promise<DiscoveryQuestion[]> {
  const { data } = await supabase
    .from('discovery_questions')
    .select('id, question_key, dimension, subdimension, question_text, question_type, options, sort_order')
    .eq('statut', 'active')
    .eq('target', 'self')
    .order('sort_order');
  return (data ?? []) as DiscoveryQuestion[];
}

// LLM: reformulate question in Candice voice given context (layer 3)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function personalizeQuestion(
  base: DiscoveryQuestion,
  contextHint: string,
): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system: `Tu es Candice. Reformule cette question en 1 phrase douce, chaleureuse, jamais analytique.
Garde exactement le même sens. Réponds UNIQUEMENT avec la question reformulée, sans guillemets.
Ton : ${contextHint ? `Contexte : ${contextHint}. ` : ''}Doux, précis, jamais corporate.`,
      messages: [{ role: 'user', content: base.question_text }],
    });
    const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    return text.length > 10 && text.length < 200 ? text : base.question_text;
  } catch {
    return base.question_text;
  }
}

// ── Drip mode ────────────────────────────────────────────────────────────────

export async function getNextDripQuestion(
  userId: string,
  supabase: SupaDB,
): Promise<NextQuestionResult | null> {
  const [answered, allQuestions] = await Promise.all([
    getAnsweredKeys(supabase, userId),
    getAllQuestions(supabase),
  ]);

  const unanswered = allQuestions.filter(q => !answered.has(q.question_key));
  if (unanswered.length === 0) return null;

  // Drip: prefer questions triggered by existing signals
  let pick: DiscoveryQuestion | null = null;
  const { data: recentSignals } = await supabase
    .from('signals')
    .select('signal_type')
    .eq('pilot_id', userId)
    .eq('status', 'actif')
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentSignals?.length) {
    const sigTypes = new Set((recentSignals as { signal_type: string }[]).map(s => s.signal_type));
    const matchedDimension = Array.from(sigTypes)
      .map(t => SIGNAL_DIMENSION_MAP[t])
      .find(Boolean);
    if (matchedDimension) {
      pick = unanswered.find(q => q.dimension === matchedDimension) ?? null;
    }
  }

  // Fallback: first unanswered in sort order
  if (!pick) pick = unanswered[0];

  // Create ephemeral session
  const { data: session } = await supabase
    .from('discovery_sessions')
    .insert({
      user_id: userId,
      mode: 'quick',
      pending_keys: [pick.question_key],
      current_index: 0,
      status: 'active',
    })
    .select('id')
    .single();

  const sessionId: string = session?.id ?? crypto.randomUUID();

  // Mark last_asked_at
  await supabase
    .from('profile_completion')
    .upsert({
      user_id: userId,
      question_key: pick.question_key,
      last_asked_at: new Date().toISOString(),
    }, { onConflict: 'user_id,question_key' });

  // Layer 3: LLM personalization (non-blocking, fallback to base)
  const personalizedText = await personalizeQuestion(pick, '');

  return {
    question: { ...pick, question_text: personalizedText },
    sessionId,
    sectionLabel: DIMENSION_LABELS[pick.dimension] ?? pick.dimension,
    progress: null,
  };
}

// ── Full session mode ─────────────────────────────────────────────────────────

export async function createOrResumeSession(
  userId: string,
  supabase: SupaDB,
): Promise<NextQuestionResult | null> {
  // Check for existing active session
  const { data: existing } = await supabase
    .from('discovery_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('contact_id', null)
    .eq('mode', 'full')
    .eq('status', 'active')
    .order('last_activity_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return getSessionQuestion(existing, supabase);
  }

  // Build new session plan: all unanswered questions in order
  const [answered, allQuestions] = await Promise.all([
    getAnsweredKeys(supabase, userId),
    getAllQuestions(supabase),
  ]);

  const pending = allQuestions
    .filter(q => !answered.has(q.question_key))
    .map(q => q.question_key);

  if (pending.length === 0) return null;

  const { data: session } = await supabase
    .from('discovery_sessions')
    .insert({
      user_id: userId,
      mode: 'full',
      pending_keys: pending,
      current_index: 0,
      status: 'active',
    })
    .select('*')
    .single();

  if (!session) return null;
  return getSessionQuestion(session, supabase);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSessionQuestion(session: any, supabase: SupaDB): Promise<NextQuestionResult | null> {
  const pendingKeys: string[] = session.pending_keys ?? [];
  const idx: number = session.current_index ?? 0;

  if (idx >= pendingKeys.length) return null;

  const currentKey = pendingKeys[idx];
  const { data: q } = await supabase
    .from('discovery_questions')
    .select('id, question_key, dimension, subdimension, question_text, question_type, options, sort_order')
    .eq('question_key', currentKey)
    .maybeSingle();

  if (!q) return null;

  const question = q as DiscoveryQuestion;
  const personalizedText = await personalizeQuestion(question, '');

  return {
    question: { ...question, question_text: personalizedText },
    sessionId: session.id as string,
    sectionLabel: DIMENSION_LABELS[question.dimension] ?? question.dimension,
    progress: { current: idx + 1, total: pendingKeys.length },
  };
}

// ── Record answer ─────────────────────────────────────────────────────────────

export async function recordAnswer(
  userId: string,
  sessionId: string,
  questionKey: string,
  answer: string | string[] | null,
  skip: boolean,
  supabase: SupaDB,
): Promise<{ next: NextQuestionResult | null; done: boolean }> {
  const now = new Date().toISOString();

  // Update profile_completion
  await supabase
    .from('profile_completion')
    .upsert({
      user_id: userId,
      question_key: questionKey,
      is_filled: !skip,
      answer_data: skip ? null : (Array.isArray(answer) ? answer : answer),
      answered_at: skip ? null : now,
      last_asked_at: now,
      skipped_count: skip ? 1 : 0,
    }, { onConflict: 'user_id,question_key' });

  // If answered (not skipped): save into my_profile.discovery_answers
  if (!skip && answer !== null) {
    const { data: profile } = await supabase
      .from('my_profile')
      .select('discovery_answers')
      .eq('user_id', userId)
      .maybeSingle();

    const existing = (profile?.discovery_answers as Record<string, unknown>) ?? {};
    await supabase
      .from('my_profile')
      .update({
        discovery_answers: { ...existing, [questionKey]: answer },
        updated_at: now,
      })
      .eq('user_id', userId);
  }

  // Advance session
  const { data: session } = await supabase
    .from('discovery_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) return { next: null, done: true };

  const pendingKeys: string[] = session.pending_keys ?? [];
  const nextIndex = (session.current_index as number) + 1;

  if (nextIndex >= pendingKeys.length) {
    // Session complete
    await supabase
      .from('discovery_sessions')
      .update({ status: 'completed', current_index: nextIndex, last_activity_at: now })
      .eq('id', sessionId);
    return { next: null, done: true };
  }

  // Advance to next
  const updated = await supabase
    .from('discovery_sessions')
    .update({ current_index: nextIndex, last_activity_at: now })
    .eq('id', sessionId)
    .select('*')
    .single();

  const next = updated.data ? await getSessionQuestion(updated.data, supabase) : null;
  return { next, done: false };
}

export async function pauseSession(sessionId: string, supabase: SupaDB): Promise<void> {
  await supabase
    .from('discovery_sessions')
    .update({ status: 'paused', last_activity_at: new Date().toISOString() })
    .eq('id', sessionId);
}

// ══════════════════════════════════════════════════════════════════════════════
// ── DISCOVERY BRAIN ──────────────────────────────────────────────────────────
// Smart question selector: evaluates triggers against profile_analysis,
// scores candidates by section gap, respects answered/fatigue state.
// ══════════════════════════════════════════════════════════════════════════════

const FULL_SESSION_MAX = 3;

export interface DiscoveryQuestionFull extends DiscoveryQuestion {
  trigger_condition: string | null;
  priority: number;
}

export interface ProfileAnalysisSnapshot {
  sections: Record<string, { text?: string; chips?: string[] }> | null;
}

// question.dimension → profile_analysis.sections key
const DIMENSION_TO_ANALYSIS_SECTION: Record<string, string> = {
  attention:  'attention',
  gifts:      'gifts',
  style:      'style',
  brands:     'brands',
  food:       'restaurants',
  fragrance:  'style',
  travel:     'travel',
  hobbies:    'hobbies',
  dreams:     'hobbies',
  surprises:  'avoid',
  conflicts:  'avoid',
};

// UI sectionKey (from moi/page.tsx buildSections) → discovery question dimensions
export const SECTION_KEY_TO_DIMENSIONS: Record<string, string[]> = {
  'attention-reception': ['attention'],
  'attention-expression': ['attention'],
  'attention-dna':        ['attention'],
  'gifts-what-works':     ['gifts'],
  'gifts-to-avoid':       ['gifts'],
  'style-clothing':       ['style'],
  'brands-favorites':     ['brands'],
  'food-restaurants':     ['food'],
  'fragrance-family':     ['fragrance'],
  'travel-style':         ['travel'],
  'hobbies-main':         ['hobbies'],
  'dreams-current':       ['dreams', 'hobbies'],
  'surprises-preference': ['surprises'],
  'conflicts-style':      ['conflicts'],
  'practical-constraints':['practical'],
};

async function getAllQuestionsWithTrigger(supabase: SupaDB): Promise<DiscoveryQuestionFull[]> {
  const { data } = await supabase
    .from('discovery_questions')
    .select('id, question_key, dimension, subdimension, question_text, question_type, options, sort_order, trigger_condition, priority')
    .eq('statut', 'active')
    .eq('target', 'self')
    .order('sort_order');
  return (data ?? []) as DiscoveryQuestionFull[];
}

function inferSectionKeyFromTrigger(cond: string): string | null {
  const c = cond.toLowerCase();
  if (/\battention\b|petite|acte\b|service\b|mots?\b/.test(c)) return 'attention';
  if (/expérience\b|experience/.test(c)) return 'attention';
  if (/cadeau|bijou\b|objet\b/.test(c)) return 'gifts';
  if (/\bstyle\b|mode\b|vêtement|matière|couleur/.test(c)) return 'style';
  if (/marque/.test(c)) return 'brands';
  if (/restaurant|gastrono|cuisine/.test(c)) return 'restaurants';
  if (/voyage|week-end|hôtel|hotel/.test(c)) return 'travel';
  if (/rêve|wishlist|envie|destination/.test(c)) return 'hobbies';
  if (/livre|lecture|bd\b|auteur|artiste|sport|bien.être|culture|concert|musique|déco|maison/.test(c)) return 'hobbies';
  if (/parfum|beauté|soin|odeur/.test(c)) return 'style';
  if (/surprise|conflit|réparation/.test(c)) return 'avoid';
  return null;
}

export function evaluateTrigger(
  question: DiscoveryQuestionFull,
  analysis: ProfileAnalysisSnapshot | null,
): boolean {
  const cond = question.trigger_condition?.trim();
  if (!cond) return true;

  const sections = analysis?.sections ?? {};

  const sectionHasContent = (key: string): boolean => {
    const s = sections[key];
    return !!(s?.text?.trim());
  };
  const sectionIsThin = (key: string): boolean => {
    const s = sections[key];
    return !(s?.text?.trim()) || (s.text?.length ?? 0) < 60;
  };

  const isAbsencePattern = /non\s*renseign|non\s*détaill|vide|incomplèt|non\s*précis/i.test(cond);
  const sectionKey = inferSectionKeyFromTrigger(cond);

  if (isAbsencePattern) {
    return sectionKey ? sectionIsThin(sectionKey) : true;
  }
  return sectionKey ? sectionHasContent(sectionKey) : true;
}

function computeGapScore(
  q: DiscoveryQuestionFull,
  analysis: ProfileAnalysisSnapshot | null,
): number {
  const sectionRef = DIMENSION_TO_ANALYSIS_SECTION[q.dimension];
  if (!sectionRef || !analysis?.sections) return 2; // max gap if no analysis
  const sec = analysis.sections[sectionRef];
  const text = sec?.text?.trim() ?? '';
  if (!text) return 2;
  if (text.length < 60) return 1;
  return 0;
}

export async function getNextMicroQuestion(
  userId: string,
  supabase: SupaDB,
  analysis: ProfileAnalysisSnapshot | null,
  mode: 'quick' | 'full',
  sectionKey?: string,
): Promise<NextQuestionResult | null> {
  const [answered, allQuestions] = await Promise.all([
    getAnsweredKeys(supabase, userId),
    getAllQuestionsWithTrigger(supabase),
  ]);

  // Unanswered + trigger passes
  let candidates = allQuestions.filter(
    q => !answered.has(q.question_key) && evaluateTrigger(q, analysis),
  );

  // If sectionKey: restrict to relevant dimensions
  if (sectionKey) {
    const dims = SECTION_KEY_TO_DIMENSIONS[sectionKey] ?? [];
    if (dims.length > 0) {
      candidates = candidates.filter(q => dims.includes(q.dimension));
    }
  }

  if (candidates.length === 0) return null;

  // Score: gap * 100 + priority, tie-break by sort_order asc
  const scored = candidates
    .map(q => ({ q, score: computeGapScore(q, analysis) * 100 + (q.priority ?? 50) }))
    .sort((a, b) => b.score - a.score || a.q.sort_order - b.q.sort_order);

  const limit = mode === 'quick' ? 1 : FULL_SESSION_MAX;
  const picks = scored.slice(0, limit).map(s => s.q);

  // Create session
  const { data: session } = await supabase
    .from('discovery_sessions')
    .insert({
      user_id: userId,
      mode,
      pending_keys: picks.map(q => q.question_key),
      current_index: 0,
      status: 'active',
    })
    .select('id')
    .single();

  if (!session) return null;

  // Mark first question as last_asked
  await supabase
    .from('profile_completion')
    .upsert(
      { user_id: userId, question_key: picks[0].question_key, last_asked_at: new Date().toISOString() },
      { onConflict: 'user_id,question_key' },
    );

  const personalizedText = await personalizeQuestion(
    picks[0],
    sectionKey ? `Section ciblée : ${DIMENSION_LABELS[picks[0].dimension] ?? picks[0].dimension}` : '',
  );

  return {
    question: { ...picks[0], question_text: personalizedText },
    sessionId: session.id as string,
    sectionLabel: DIMENSION_LABELS[picks[0].dimension] ?? picks[0].dimension,
    progress: mode === 'full' ? { current: 1, total: picks.length } : null,
  };
}

export async function getAvailableDiscoverySections(
  userId: string,
  supabase: SupaDB,
  analysis: ProfileAnalysisSnapshot | null,
): Promise<Set<string>> {
  const [answered, allQuestions] = await Promise.all([
    getAnsweredKeys(supabase, userId),
    getAllQuestionsWithTrigger(supabase),
  ]);

  const candidates = allQuestions.filter(
    q => !answered.has(q.question_key) && evaluateTrigger(q, analysis),
  );

  const available = new Set<string>();
  for (const [sk, dims] of Object.entries(SECTION_KEY_TO_DIMENSIONS)) {
    if (candidates.some(q => dims.includes(q.dimension))) {
      available.add(sk);
    }
  }
  return available;
}
