// Discovery Engine — section 26 (Lot 3)
// Two modes: drip (1 triggered question) and full (guided session by section).
// JSON validated + deterministic fallback. Never re-asks answered questions.

import Anthropic from '@anthropic-ai/sdk';
import { questionDataPresent, type ProfileDataSnapshot } from './dataPresence';
import {
  syncStatusesWithData, blockedKeys, getQuestionStatuses,
  applyDataSync, writeSyncedStatuses, type QuestionStatus,
} from './status';

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
  /** A.3 : texte validé mot pour mot par Estelle → JAMAIS reformulé. */
  locked_text?: boolean;
}

export interface NextQuestionResult {
  question: DiscoveryQuestion;
  sessionId: string;
  sectionLabel: string;
  progress: { current: number; total: number } | null;
}

// ── Dimension → section label map ────────────────────────────────────────────

// DA V11 : jamais d'émoji — libellés texte seuls.
export const DIMENSION_LABELS: Record<string, string> = {
  attention:  'Langage d\'attention',
  gifts:      'Cadeaux',
  style:      'Style',
  brands:     'Marques',
  food:       'Restaurants',
  fragrance:  'Parfums',
  travel:     'Voyages',
  hobbies:    'Loisirs',
  dreams:     'Rêves',
  surprises:  'Surprises',
  conflicts:  'Conflits',
  practical:  'Pratique',
};

// ── Supabase type ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupaDB = any;

// ── Helpers ──────────────────────────────────────────────────────────────────

// Chantier 2.2 — snapshot my_profile pour la garde par présence de donnée
async function getProfileDataSnapshot(
  supabase: SupaDB,
  userId: string,
): Promise<ProfileDataSnapshot | null> {
  const { data } = await supabase
    .from('my_profile')
    .select('practical_info, singularity_answers, relational_filters, discovery_answers')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as ProfileDataSnapshot | null) ?? null;
}

// Décision Estelle (revue de banque) : la reformulation IA est COUPÉE.
// Toutes les questions servent leur texte de banque MOT POUR MOT. Le
// pré-calcul D1 reste en place techniquement mais INACTIF (ce drapeau) ;
// il ne resservira que si une personnalisation à base de gabarits validés
// est réactivée ici. Passer à true réactive lecture + pré-calcul, sans
// autre changement (les textes pré-calculés sont déjà lus si présents).
const PERSONALIZATION_ACTIVE = true;

/** Texte servi : verrouillé/banque mot pour mot, sinon pré-calculé SI actif. */
function servedQuestionText(
  q: DiscoveryQuestion,
  personalized: Record<string, string> | null,
): string {
  if (q.locked_text || !PERSONALIZATION_ACTIVE || !personalized) return q.question_text;
  return personalized[q.question_key] || q.question_text;
}

// LLM: reformulate question in Candice voice given context (layer 3)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** D4 : profile_completion lu UNE fois → statuts + textes pré-calculés. */
async function getCompletionState(
  supabase: SupaDB,
  userId: string,
): Promise<{ statuses: Record<string, QuestionStatus>; personalized: Record<string, string> }> {
  const { data } = await supabase
    .from('profile_completion')
    .select('question_key, status, personalized_text')
    .eq('user_id', userId)
    .is('contact_id', null);
  const statuses: Record<string, QuestionStatus> = {};
  const personalized: Record<string, string> = {};
  for (const r of (data ?? []) as Array<{ question_key: string; status: QuestionStatus; personalized_text: string | null }>) {
    statuses[r.question_key] = r.status;
    if (r.personalized_text) personalized[r.question_key] = r.personalized_text;
  }
  return { statuses, personalized };
}

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
RÈGLE ABSOLUE (C6) : question toujours CONCRÈTE, jamais lyrique ni métaphorique.
INTERDIT : « ton cœur », « ton âme », « t'appelle », « résonne », envolées poétiques.
Si tu ne peux pas améliorer sans t'éloigner du texte, rends le texte ORIGINAL tel quel.
Ton : ${contextHint ? `Contexte : ${contextHint}. ` : ''}Doux, précis, jamais corporate.`,
      messages: [{ role: 'user', content: base.question_text }],
    });
    const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    return text.length > 10 && text.length < 200 ? text : base.question_text;
  } catch {
    return base.question_text;
  }
}

// ── Chemins legacy supprimés (Refonte Profil V2, Phase B) ────────────────────
// getNextDripQuestion et createOrResumeSession servaient des questions SANS
// la garde anti-redemande (ni dataPresence ni statuts). Morts côté UI mais
// vivants via GET /api/discovery/next : neutralisés — la route renvoie 410.
// Le seul sélecteur autorisé est getNextMicroQuestion (garde complète).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSessionQuestion(session: any, supabase: SupaDB): Promise<NextQuestionResult | null> {
  const pendingKeys: string[] = session.pending_keys ?? [];
  const idx: number = session.current_index ?? 0;

  if (idx >= pendingKeys.length) return null;

  const currentKey = pendingKeys[idx];
  const { data: q } = await supabase
    .from('discovery_questions')
    .select('id, question_key, dimension, subdimension, question_text, question_type, options, sort_order, locked_text')
    .eq('question_key', currentKey)
    .maybeSingle();

  if (!q) return null;

  const question = q as DiscoveryQuestion;
  // Reformulation coupée : texte de banque mot pour mot. Si réactivée, le
  // texte pré-calculé (AUCUN appel LLM dans le rendu) est lu ici.
  let personalizedText = question.question_text;
  if (PERSONALIZATION_ACTIVE && !question.locked_text) {
    const { data: pc } = await supabase
      .from('profile_completion')
      .select('personalized_text')
      .eq('user_id', session.user_id)
      .eq('question_key', currentKey)
      .is('contact_id', null)
      .maybeSingle();
    const t = (pc as { personalized_text?: string | null } | null)?.personalized_text;
    if (t) personalizedText = t;
  }

  return {
    question: { ...question, question_text: personalizedText },
    sessionId: session.id as string,
    sectionLabel: DIMENSION_LABELS[question.dimension] ?? question.dimension,
    progress: { current: idx + 1, total: pendingKeys.length },
  };
}

// ── Record answer ─────────────────────────────────────────────────────────────

export type DiscoveryAnswer = string | string[] | Record<string, unknown> | null;

export async function recordAnswer(
  userId: string,
  sessionId: string,
  questionKey: string,
  answer: DiscoveryAnswer,
  skip: boolean,
  supabase: SupaDB,
): Promise<{ next: NextQuestionResult | null; done: boolean; upcomingKeys?: string[] }> {
  const now = new Date().toISOString();

  // Update profile_completion — status = source unique de la re-proposition
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
      status: skip ? 'skipped' : 'answered',
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
  // D1 : les clés APRÈS la question servie — à pré-calculer en tâche de fond
  // par l'appelant (route answer), jamais dans le rendu.
  return { next, done: false, upcomingKeys: pendingKeys.slice(nextIndex + 1) };
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
  benefit_label?: string | null;
  duration_label?: string | null;
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
  fragrance:  'parfums', // section dédiée depuis l'engine 2.1 (était 'style')
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
    .select('id, question_key, dimension, subdimension, question_text, question_type, options, sort_order, trigger_condition, priority, benefit_label, duration_label, locked_text')
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
  // D4 : les 3 lectures partent ENSEMBLE (questions, snapshot fiche, statuts
  // + textes pré-calculés lus en une fois) — l'étage « statuts après » disparaît.
  const [allQuestions, profileData, completion] = await Promise.all([
    getAllQuestionsWithTrigger(supabase),
    getProfileDataSnapshot(supabase, userId),
    getCompletionState(supabase, userId),
  ]);
  // Rétro-alimentation (donnée en fiche → answered) : calcul PUR + écritures
  // idempotentes (rares — zéro sur un profil déjà synchronisé) — Phase B.
  const { statuses, toSync } = applyDataSync(completion.statuses, profileData);
  await writeSyncedStatuses(supabase, userId, toSync);
  const blocked = blockedKeys(statuses);

  // Non bloquée (answered/archived) + donnée absente de la fiche + trigger passe
  let candidates = allQuestions.filter(
    q => !blocked.has(q.question_key)
      && !questionDataPresent(q.question_key, profileData)
      && evaluateTrigger(q, analysis),
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

  // D4 : création de session ET marquage last_asked en UNE passe (aucune ne
  // dépend de l'autre ; seule la session renvoie l'id nécessaire au rendu).
  const now = new Date().toISOString();
  const [{ data: session }] = await Promise.all([
    supabase
      .from('discovery_sessions')
      .insert({
        user_id: userId,
        mode,
        pending_keys: picks.map(q => q.question_key),
        current_index: 0,
        status: 'active',
      })
      .select('id')
      .single(),
    supabase
      .from('profile_completion')
      .upsert(
        { user_id: userId, question_key: picks[0].question_key, last_asked_at: now },
        { onConflict: 'user_id,question_key' },
      ),
  ]);

  if (!session) return null;

  // Texte servi : banque mot pour mot (reformulation coupée) — pré-calcul lu
  // depuis completion.personalized si réactivé, sans requête supplémentaire.
  const personalizedText = servedQuestionText(picks[0], completion.personalized);

  return {
    question: { ...picks[0], question_text: personalizedText },
    sessionId: session.id as string,
    sectionLabel: DIMENSION_LABELS[picks[0].dimension] ?? picks[0].dimension,
    progress: mode === 'full' ? { current: 1, total: picks.length } : null,
  };
}

// ── D1 CORRIGÉ : PRÉ-CALCUL des reformulations (jamais dans le rendu) ────────
// Déclencheurs (Estelle) : recalcul d'analyse (generateProfileAnalysis) et
// réponse précédente (route answer, via after()). Le rendu sert
// personalized_text s'il existe, sinon le texte de banque — affichage
// instantané. locked_text : jamais reformulé, jamais pré-calculé.
// Anti-lyrisme (C6) inchangé : même personalizeQuestion, même règle absolue.

/** Pré-calcule (et stocke) la reformulation des questions données. */
export async function precomputePersonalizationsForKeys(
  userId: string,
  supabase: SupaDB,
  keys: string[],
  opts: { onlyMissing?: boolean } = {},
): Promise<void> {
  if (keys.length === 0) return;
  try {
    const [{ data: qs }, { data: existing }] = await Promise.all([
      supabase
        .from('discovery_questions')
        .select('id, question_key, dimension, subdimension, question_text, question_type, options, sort_order, locked_text')
        .in('question_key', keys),
      supabase
        .from('profile_completion')
        .select('question_key, personalized_text')
        .eq('user_id', userId)
        .in('question_key', keys)
        .is('contact_id', null),
    ]);
    const already = new Set(
      ((existing ?? []) as Array<{ question_key: string; personalized_text: string | null }>)
        .filter(r => !!r.personalized_text)
        .map(r => r.question_key),
    );
    const targets = ((qs ?? []) as DiscoveryQuestion[]).filter(
      q => !q.locked_text && !(opts.onlyMissing && already.has(q.question_key)),
    );
    await Promise.all(targets.map(async q => {
      const text = await personalizeQuestion(q, '');
      await supabase
        .from('profile_completion')
        .upsert(
          { user_id: userId, question_key: q.question_key, personalized_text: text },
          { onConflict: 'user_id,question_key' },
        );
    }));
  } catch { /* tâche de fond — jamais bloquante, le rendu retombe sur la banque */ }
}

/**
 * Pré-calcule les reformulations des PROCHAINES questions du profil.
 * Sélection = COPIE LECTURE SEULE du filtre/score de getNextMicroQuestion
 * (le moteur de sélection reste intouché : aucune session créée, aucune
 * écriture de statut, aucun last_asked_at).
 */
export async function precomputeUpcomingPersonalizations(
  userId: string,
  supabase: SupaDB,
  analysis: ProfileAnalysisSnapshot | null,
): Promise<void> {
  try {
    const [allQuestions, profileData, stored] = await Promise.all([
      getAllQuestionsWithTrigger(supabase),
      getProfileDataSnapshot(supabase, userId),
      getQuestionStatuses(supabase, userId),
    ]);
    const { statuses } = applyDataSync(stored, profileData); // pur, zéro écriture
    const blocked = blockedKeys(statuses);
    const candidates = allQuestions.filter(
      q => !blocked.has(q.question_key)
        && !questionDataPresent(q.question_key, profileData)
        && evaluateTrigger(q, analysis),
    );
    const picks = candidates
      .map(q => ({ q, score: computeGapScore(q, analysis) * 100 + (q.priority ?? 50) }))
      .sort((a, b) => b.score - a.score || a.q.sort_order - b.q.sort_order)
      .slice(0, FULL_SESSION_MAX)
      .map(s => s.q.question_key);
    await precomputePersonalizationsForKeys(userId, supabase, picks);
  } catch { /* tâche de fond — jamais bloquante */ }
}

// ── Nudges « Pour mieux viser » (Refonte V2, Phase C) ────────────────────────
// Même garde que le sélecteur : seules les questions réellement disponibles
// produisent un nudge. Les répondues deviennent « Répondu — Modifier ma réponse ».

export interface ViserNudgeData {
  key: string;
  title: string;
  subtitle: string;
  sectionKey: string | null;
  done: boolean;
}

function dimensionToSectionKey(dimension: string): string | null {
  for (const [sk, dims] of Object.entries(SECTION_KEY_TO_DIMENSIONS)) {
    if (dims.includes(dimension)) return sk;
  }
  return null;
}

/** D3 — sources brutes de l'overview (préchargeables par la page en UNE passe). */
export interface DiscoveryOverviewSources {
  allQuestions: DiscoveryQuestionFull[];
  profileData: ProfileDataSnapshot | null;
  storedStatuses: Record<string, QuestionStatus>;
}

/** D3 — les 3 requêtes de l'overview, en parallèle (fusionnables avec celles de la page). */
export async function fetchDiscoveryOverviewSources(
  userId: string,
  supabase: SupaDB,
): Promise<DiscoveryOverviewSources> {
  const [allQuestions, profileData, storedStatuses] = await Promise.all([
    getAllQuestionsWithTrigger(supabase),
    getProfileDataSnapshot(supabase, userId),
    getQuestionStatuses(supabase, userId),
  ]);
  return { allQuestions, profileData, storedStatuses };
}

/**
 * C2 STOP C — passe UNIQUE du moteur pour /moi : sections disponibles +
 * nudges avec UN seul jeu de requêtes (questions, snapshot, statuts+sync),
 * là où deux appels séparés doublaient tout.
 * D3 — les écritures de rétro-alimentation SORTENT du rendu : l'appelant
 * doit programmer flushStatusWrites en tâche de fond (after()). Les statuts
 * retournés sont déjà à jour en mémoire — sélection et nudges identiques.
 */
export async function getDiscoveryOverview(
  userId: string,
  supabase: SupaDB,
  analysis: ProfileAnalysisSnapshot | null,
  prefetched?: DiscoveryOverviewSources,
): Promise<{
  availableSections: Set<string>;
  nudges: ViserNudgeData[];
  flushStatusWrites: () => Promise<void>;
}> {
  const { allQuestions, profileData, storedStatuses } =
    prefetched ?? await fetchDiscoveryOverviewSources(userId, supabase);
  const { statuses, toSync } = applyDataSync(storedStatuses, profileData);
  const blocked = blockedKeys(statuses);

  const candidates = allQuestions.filter(
    q => !blocked.has(q.question_key)
      && !questionDataPresent(q.question_key, profileData)
      && evaluateTrigger(q, analysis),
  );

  const availableSections = new Set<string>();
  for (const [sk, dims] of Object.entries(SECTION_KEY_TO_DIMENSIONS)) {
    if (candidates.some(q => dims.includes(q.dimension))) availableSections.add(sk);
  }

  return {
    availableSections,
    nudges: buildNudges(allQuestions, candidates, statuses, profileData),
    flushStatusWrites: () => writeSyncedStatuses(supabase, userId, toSync),
  };
}

function buildNudges(
  allQuestions: DiscoveryQuestionFull[],
  candidates: DiscoveryQuestionFull[],
  statuses: Record<string, string>,
  profileData: ProfileDataSnapshot | null,
): ViserNudgeData[] {
  // Disponibles : groupées par dimension (un nudge par thème), max 4
  const byDim = new Map<string, DiscoveryQuestionFull[]>();
  for (const q of candidates) {
    byDim.set(q.dimension, [...(byDim.get(q.dimension) ?? []), q]);
  }
  const available: ViserNudgeData[] = Array.from(byDim.entries()).slice(0, 4).map(([dim, qs]) => {
    const top = qs[0];
    const parts = [
      top.benefit_label ?? "Quelques précisions utiles",
      `${qs.length} question${qs.length > 1 ? "s" : ""}`,
      ...(top.duration_label ? [top.duration_label] : []),
    ];
    return {
      key: dim,
      title: DIMENSION_LABELS[dim] ?? dim,
      subtitle: parts.join(" · "),
      sectionKey: dimensionToSectionKey(dim),
      done: false,
    };
  });

  // Répondues récentes : « Répondu — … » (labels des options si résolubles)
  const answers = (profileData?.discovery_answers ?? {}) as Record<string, unknown>;
  const answered: ViserNudgeData[] = allQuestions
    .filter(q => statuses[q.question_key] === "answered" && q.benefit_label)
    .slice(0, 2)
    .map(q => {
      const raw = answers[q.question_key];
      const values = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
      const labels = values
        .map(v => (q.options ?? []).find(o => o.value === v)?.label)
        .filter((l): l is string => !!l)
        .slice(0, 2);
      return {
        key: q.question_key,
        title: q.subdimension === "families" ? "Familles olfactives" : (DIMENSION_LABELS[q.dimension] ?? q.dimension),
        subtitle: labels.length > 0 ? `Répondu — ${labels.join(" · ").toLowerCase()}` : "Répondu",
        sectionKey: dimensionToSectionKey(q.dimension),
        done: true,
      };
    });

  return [...available, ...answered];
}

export async function getAvailableDiscoverySections(
  userId: string,
  supabase: SupaDB,
  analysis: ProfileAnalysisSnapshot | null,
): Promise<Set<string>> {
  const [allQuestions, profileData] = await Promise.all([
    getAllQuestionsWithTrigger(supabase),
    getProfileDataSnapshot(supabase, userId),
  ]);
  const statuses = await syncStatusesWithData(supabase, userId, profileData);
  const blocked = blockedKeys(statuses);

  const candidates = allQuestions.filter(
    q => !blocked.has(q.question_key)
      && !questionDataPresent(q.question_key, profileData)
      && evaluateTrigger(q, analysis),
  );

  const available = new Set<string>();
  for (const [sk, dims] of Object.entries(SECTION_KEY_TO_DIMENSIONS)) {
    if (candidates.some(q => dims.includes(q.dimension))) {
      available.add(sk);
    }
  }
  return available;
}
