import { ALL_LIFESTYLE_QUESTIONS } from './questions';
import type { LifestyleAxisKey, FilterKey, TemperamentAxisKey } from './questions';

// ─── Types ────────────────────────────────────────────────────────────────────

export type { LifestyleAxisKey, FilterKey, TemperamentAxisKey };

export interface AxisScore {
  score:     number; // -100 to +100
  intensity: number;
}

export interface LifestyleAxes {
  foodie:                AxisScore;
  premiumSimplicite:     AxisScore;
  experienceObjet:       AxisScore;
  esthetiqueFonctionnel: AxisScore;
  aventureConfort:       AxisScore;
  authenticiteLuxe:      AxisScore;
}

export interface RelationalFilters {
  antiSurprisePublique:   boolean;
  antiSurprisePlanning:   boolean;
  antiSurpriseIntime:     boolean;
  exigenceExecution:      boolean;
  ouvertSurprise:         boolean;
  besoinEcoute:           boolean;
  peurOubli:              boolean;
  besoinAir:              boolean;
  sensibiliteCritique:    boolean;
  besoinFiabilite:        boolean;
  besoinProfondeur:       boolean;
  sensibiliteChargeMetale: boolean;
  q17Text:      string;
  q17Interdits: string[];
}

export interface LifestyleResult {
  axes:                   LifestyleAxes;
  temperamentSupplements: Partial<Record<TemperamentAxisKey, number>>; // raw delta sums
  canalSupplements:       string[]; // canal votes from Q4d
  relationalFilters:      RelationalFilters;
}

export type LifestyleAnswers = Record<string, string>;

// ─── Constants ────────────────────────────────────────────────────────────────

const LIFESTYLE_AXIS_KEYS: LifestyleAxisKey[] = [
  'foodie',
  'premiumSimplicite',
  'experienceObjet',
  'esthetiqueFonctionnel',
  'aventureConfort',
  'authenticiteLuxe',
];

const FILTER_KEYS: FilterKey[] = [
  'antiSurprisePublique',
  'antiSurprisePlanning',
  'antiSurpriseIntime',
  'exigenceExecution',
  'ouvertSurprise',
  'besoinEcoute',
  'peurOubli',
  'besoinAir',
  'sensibiliteCritique',
  'besoinFiabilite',
  'besoinProfondeur',
  'sensibiliteChargeMetale',
];

// Max raw per axis: 4 lifestyle questions * 2 max = 8
const MAX_RAW = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function zeroLifestyleAxes(): Record<LifestyleAxisKey, { raw: number; intensity: number }> {
  return Object.fromEntries(LIFESTYLE_AXIS_KEYS.map(k => [k, { raw: 0, intensity: 0 }])) as Record<
    LifestyleAxisKey,
    { raw: number; intensity: number }
  >;
}

function zeroFilters(): Record<FilterKey, boolean> {
  return Object.fromEntries(FILTER_KEYS.map(k => [k, false])) as Record<FilterKey, boolean>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function scoreLifestyle(answers: LifestyleAnswers): LifestyleResult {
  const lifestyleAcc = zeroLifestyleAxes();
  const temperamentAcc: Partial<Record<TemperamentAxisKey, number>> = {};
  const filterAcc = zeroFilters();
  const canalVotes: string[] = [];

  for (const [questionId, optionId] of Object.entries(answers)) {
    const question = ALL_LIFESTYLE_QUESTIONS.find(q => q.id === questionId);
    if (!question) continue;

    const option = question.options.find(o => o.id === optionId);
    if (!option) continue;

    for (const delta of option.deltas) {
      if (delta.target === 'lifestyle') {
        lifestyleAcc[delta.axis].raw += delta.value;
        if (delta.value !== 0) lifestyleAcc[delta.axis].intensity++;
      } else if (delta.target === 'temperament') {
        temperamentAcc[delta.axis] = (temperamentAcc[delta.axis] ?? 0) + delta.value;
      } else if (delta.target === 'filter') {
        filterAcc[delta.key] = true;
      } else if (delta.target === 'canal') {
        canalVotes.push(delta.value);
      }
    }
  }

  // Normalize lifestyle axes
  const axes: LifestyleAxes = {} as LifestyleAxes;
  for (const key of LIFESTYLE_AXIS_KEYS) {
    const { raw, intensity } = lifestyleAcc[key];
    const score = Math.max(-100, Math.min(100, Math.round((raw / MAX_RAW) * 100)));
    axes[key] = { score, intensity };
  }

  const relationalFilters: RelationalFilters = {
    ...filterAcc,
    q17Text:      '',
    q17Interdits: [],
  };

  return {
    axes,
    temperamentSupplements: temperamentAcc,
    canalSupplements: canalVotes,
    relationalFilters,
  };
}

// Merge temperament supplements into an existing axes snapshot.
// Uses same normalization as temperament scoring (MAX_RAW = 8).
export function mergeTemperamentSupplements(
  existing: Record<string, { score: number; intensity: number }>,
  supplements: Partial<Record<TemperamentAxisKey, number>>,
): Record<string, { score: number; intensity: number }> {
  const merged = { ...existing };
  for (const [axis, rawDelta] of Object.entries(supplements)) {
    const prev = merged[axis] as { score: number; intensity: number } | undefined;
    if (!prev) continue;
    const increment = Math.round((rawDelta / 8) * 100);
    merged[axis] = {
      score: Math.max(-100, Math.min(100, prev.score + increment)),
      intensity: prev.intensity + (rawDelta !== 0 ? 1 : 0),
    };
  }
  return merged;
}
