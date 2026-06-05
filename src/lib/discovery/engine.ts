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

async function personalizeQuestion(
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
