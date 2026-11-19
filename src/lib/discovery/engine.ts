// Discovery Engine — section 26 (Lot 3)
// Two modes: drip (1 triggered question) and full (guided session by section).
// JSON validated + deterministic fallback. Never re-asks answered questions.

import { marquerProgression } from './completion';
import Anthropic from '@anthropic-ai/sdk';
import { questionDataPresent, type ProfileDataSnapshot } from './dataPresence';
import {
  syncStatusesWithData, blockedKeys, getQuestionStatuses,
  applyDataSync, writeSyncedStatuses, type QuestionStatus,
} from './status';

// ── Types ────────────────────────────────────────────────────────────────────


export interface QuestionOption { label: string; value: string; /** ouvre une saisie libre (décision 7) */ saisie_libre?: boolean; /** groupe exclusif (décision 6) */ groupe?: string; }

export interface DiscoveryQuestion {
  id: string;
  question_key: string;
  dimension: string;
  subdimension: string | null;
  question_text: string;
  /** D9 : l'entité dont parle la question (« À propos de : Patagonia »). */
  referent?: string;
  question_type: 'chips_single' | 'chips_multi' | 'text';
  options: QuestionOption[] | null;
  sort_order: number;
  /** A.3 : texte validé mot pour mot par Estelle → JAMAIS reformulé. */
  locked_text?: boolean;
}

export interface NextQuestionResult {
  question: DiscoveryQuestion;
  /** Levier 1 : null tant que la session n'est pas née (GET sans effet de bord).
   *  La session est créée à la PREMIÈRE réponse (route answer). */
  sessionId: string | null;
  /** Lot calculé (déterministe), présent quand sessionId est null. */
  pendingKeys?: string[];
  /** Position dans le lot au rendu (0 au départ). */
  currentIndex?: number;
  /** Mode de la session à créer à la première réponse. */
  mode?: 'quick' | 'full';
  sectionLabel: string;
  progress: { current: number; total: number } | null;
  /** Le lot signé par le serveur (open-v3/lot.ts). Le navigateur le renvoie tel quel avec
   *  chaque réponse : c'est lui, et non `pendingKeys`, qui prouve ce qui a été proposé. */
  jeton?: string;
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
const PERSONALIZATION_ACTIVE = false;

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

// ── RECEVOIR UNE RÉPONSE n'est plus ici (19 nov.). `recordAnswer`, `createDiscoverySession` et
//    `getSessionQuestion` croyaient la liste de questions envoyée par le navigateur et
//    avançaient la session d'un cran par requête. Le chemin unique est désormais
//    `open-v3/reponse.ts` : lot signé par le serveur, contrôles avant toute écriture, avancée
//    par position. Les réponses de l'ancienne banque ne sont plus acceptées.

export async function pauseSession(sessionId: string, supabase: SupaDB): Promise<void> {
  const { error } = await supabase
    .from('discovery_sessions')
    .update({ status: 'paused', last_activity_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) console.error('[discovery/engine] discovery_sessions update (pause)', error.message);
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

/**
 * Levier 1 — SÉLECTION EN LECTURE SEULE.
 * Aucune écriture : ni session, ni last_asked, ni rétro-alimentation. Le GET
 * /moi/discovery devient sans effet de bord → la page est cacheable côté client
 * (aller instantané comme le retour). La session naît à la PREMIÈRE réponse
 * (route answer, via createDiscoverySession). La rétro-alimentation des statuts
 * (donnée en fiche → answered) est calculée EN MÉMOIRE ici (garde correcte) et
 * persistée ailleurs, sur /moi (getDiscoveryOverview.flushStatusWrites).
 */
export async function getNextMicroQuestion(
  userId: string,
  supabase: SupaDB,
  analysis: ProfileAnalysisSnapshot | null,
  mode: 'quick' | 'full',
  sectionKey?: string,
): Promise<NextQuestionResult | null> {
  // Lectures parallèles — AUCUNE écriture ensuite.
  const [allQuestions, profileData, completion] = await Promise.all([
    getAllQuestionsWithTrigger(supabase),
    getProfileDataSnapshot(supabase, userId),
    getCompletionState(supabase, userId),
  ]);
  // Rétro-alimentation calculée en mémoire (pur) — la garde reste exacte.
  const { statuses } = applyDataSync(completion.statuses, profileData);
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

  // Texte servi : banque mot pour mot (reformulation coupée) — pré-calcul lu
  // depuis completion.personalized si réactivé, sans requête supplémentaire.
  const personalizedText = servedQuestionText(picks[0], completion.personalized);

  return {
    question: { ...picks[0], question_text: personalizedText },
    sessionId: null,                          // session non née — GET sans écriture
    pendingKeys: picks.map(q => q.question_key),
    currentIndex: 0,
    mode,
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
  if (!PERSONALIZATION_ACTIVE || keys.length === 0) return; // reformulation coupée
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
      const { error } = await marquerProgression(supabase, userId, q.question_key, { personalized_text: text });
      if (error) console.error('[discovery/engine] profile_completion upsert (personalized)', error.message);
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
  if (!PERSONALIZATION_ACTIVE) return; // reformulation coupée
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
