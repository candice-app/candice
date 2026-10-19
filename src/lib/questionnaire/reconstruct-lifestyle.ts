// RECONSTRUCTION DEPUIS LE JOURNAL SEUL (via le PONT projection_bridge) des deux projections qu'alimente
// le domaine lifestyle :
//   1. lifestyle_axes (6 axes)         — deltas target 'lifestyle', pool brut ÷ MAX_RAW × 100 clampé.
//   2. temperament_axes APRÈS lifestyle — base tempérament + suppléances cross-domaine (target 'temperament').
//
// ⚠ ÉTANCHÉITÉ : le lifestyle écrit dans temperament_axes (suppléances). On réplique EXACTEMENT la
// séquence legacy de QuestionnaireFlow, y compris sa DOUBLE-APPLICATION : mergeTemperamentSupplements est
// appelé une 1ʳᵉ fois au step4 (sur les suppléances des questions step4 actives : q14/q4a/q4c) puis une
// 2ᵉ fois au step5 (sur le RE-CALCUL de TOUTES les réponses : step4 + q18/q19). Les suppléances step4 sont
// donc comptées deux fois — comportement de la projection déployée, reproduit fidèlement (.6/.7).
//
// Le pont est de l'ANCIEN DICTIONNAIRE, jamais lu comme connaissance (hsg §47quater).

import type { AxisDelta } from './temperament-deltas';
import type { LifestyleBridgeDelta } from './lifestyle-deltas';
import { reconstructTemperamentAxes, type TemperamentAxisScores } from './reconstruct-temperament';

const LIFESTYLE_AXIS_KEYS = [
  'foodie', 'premiumSimplicite', 'experienceObjet', 'esthetiqueFonctionnel', 'aventureConfort', 'authenticiteLuxe',
] as const;
const MAX_RAW = 8; // identique au scoring lifestyle

export type LifestyleAxisScores = Record<string, { score: number; intensity: number }>;

const clamp = (n: number) => Math.max(-100, Math.min(100, n));

/** Reconstruit lifestyle_axes depuis les deltas 'lifestyle' du pont (pool brut, recalcul plein = pas de double-app). */
export function reconstructLifestyleAxes(bridges: ReadonlyArray<{ deltas: readonly LifestyleBridgeDelta[] }>): LifestyleAxisScores {
  const acc: Record<string, { raw: number; intensity: number }> = Object.fromEntries(LIFESTYLE_AXIS_KEYS.map((k) => [k, { raw: 0, intensity: 0 }]));
  for (const b of bridges) {
    for (const d of b.deltas) {
      if (d.target !== 'lifestyle') continue;
      if (!acc[d.axis]) acc[d.axis] = { raw: 0, intensity: 0 };
      acc[d.axis].raw += d.value;
      if (d.value !== 0) acc[d.axis].intensity++;
    }
  }
  const out: LifestyleAxisScores = {};
  for (const key of LIFESTYLE_AXIS_KEYS) {
    const { raw, intensity } = acc[key];
    out[key] = { score: clamp(Math.round((raw / MAX_RAW) * 100)), intensity };
  }
  return out;
}

/** Somme brute par axe des suppléances tempérament, filtrée par un prédicat sur le questionCode. */
function sumSupplements(bridges: ReadonlyArray<{ deltas: readonly LifestyleBridgeDelta[] }>, keep: (q: string) => boolean): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const b of bridges) {
    for (const d of b.deltas) {
      if (d.target !== 'temperament' || !keep(d.q)) continue;
      acc[d.axis] = (acc[d.axis] ?? 0) + d.value;
    }
  }
  return acc;
}

/** Réplique EXACTEMENT mergeTemperamentSupplements (lifestyle/scoring.ts) — frozen, donc répliqué, pas importé. */
function mergeSupplements(existing: TemperamentAxisScores, supplements: Record<string, number>): TemperamentAxisScores {
  const merged: TemperamentAxisScores = { ...existing };
  for (const [axis, rawDelta] of Object.entries(supplements)) {
    const prev = merged[axis];
    if (!prev) continue; // n'alimente QUE des axes tempérament existants
    merged[axis] = {
      score: clamp(prev.score + Math.round((rawDelta / 8) * 100)),
      intensity: prev.intensity + (rawDelta !== 0 ? 1 : 0),
    };
  }
  return merged;
}

/**
 * Reconstruit temperament_axes APRÈS câblage lifestyle, en rejouant la double-application legacy.
 * @param temperamentBridges deltas du PONT tempérament (domaine q5–q11) — base.
 * @param lifestyleBridges   deltas du PONT lifestyle (portent target + questionCode q).
 * @param step4QuestionCodes questions lifestyle ACTIVES rendues au step4 (merge n°1).
 */
export function reconstructTemperamentAxesAfterLifestyle(
  temperamentBridges: ReadonlyArray<{ deltas: readonly AxisDelta[] }>,
  lifestyleBridges: ReadonlyArray<{ deltas: readonly LifestyleBridgeDelta[] }>,
  step4QuestionCodes: ReadonlySet<string>,
): TemperamentAxisScores {
  const base = reconstructTemperamentAxes(temperamentBridges);
  const s4 = sumSupplements(lifestyleBridges, (q) => step4QuestionCodes.has(q)); // merge step4
  const sAll = sumSupplements(lifestyleBridges, () => true); // merge step5 = re-somme TOUTES les réponses
  return mergeSupplements(mergeSupplements(base, s4), sAll);
}
