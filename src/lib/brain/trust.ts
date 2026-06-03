// Trust Engine — section 9
// Calcule confidence_score (0-100), wording adapté, mises à jour.
// Score exact jamais exposé côté pilote (console admin uniquement).

import type { MemorySource } from './types';

// ── Base confidence par source ────────────────────────────────────────────────

const SOURCE_BASE: Record<MemorySource, number> = {
  proche_lui_même: 92,
  questionnaire:   88,
  observation:     76,
  pilote:          62,
  déduit_ia:       50,
};

export function getBaseConfidence(source: MemorySource, isIncognito = false): number {
  const base = SOURCE_BASE[source] ?? 55;
  return isIncognito ? Math.min(base, 65) : base;
}

// ── Mises à jour ──────────────────────────────────────────────────────────────

type TrustEvent =
  | 'confirmed_direct'    // confirmé par la personne → +20
  | 'confirmed_feedback'  // validé via feedback attention → +10
  | 'contradicted'        // contredit par feedback → -15
  | 'conflict'            // conflit avec un autre signal → -10
  | 'stale';              // ancien sans confirmation → -5/mois

const DELTA: Record<TrustEvent, number> = {
  confirmed_direct:   20,
  confirmed_feedback: 10,
  contradicted:      -15,
  conflict:          -10,
  stale:              -5,
};

export function adjustConfidence(current: number, event: TrustEvent): number {
  return Math.max(0, Math.min(100, current + DELTA[event]));
}

// ── Tier ──────────────────────────────────────────────────────────────────────

export function getConfidenceTier(score: number): 'strong' | 'medium' | 'weak' {
  if (score > 75) return 'strong';
  if (score >= 50) return 'medium';
  return 'weak';
}

// ── Wording (section 9) ───────────────────────────────────────────────────────
// Applique la formule Candice selon le niveau de confiance.
// summary doit déjà être en 3ème personne.

export function applyTrustWording(summary: string, score: number): string {
  const tier = getConfidenceTier(score);
  if (tier === 'strong') return summary;

  const lowered = summary.charAt(0).toLowerCase() + summary.slice(1);

  if (tier === 'medium') {
    if (/^d'après|^on dirait|^il me semble/i.test(summary)) return summary;
    return `D'après ce que tu m'as raconté, ${lowered}`;
  }

  // weak
  if (/^il est possible|^peut-être/i.test(summary)) return summary;
  return `Il est possible que ${lowered} Je manque encore d'informations pour en être certaine.`;
}

// ── Pastille UI (sans chiffre) ────────────────────────────────────────────────
// 'full' → forte, 'outline' → moyenne, 'dashed' → faible

export function getConfidencePastille(score: number): 'full' | 'outline' | 'dashed' {
  const tier = getConfidenceTier(score);
  return tier === 'strong' ? 'full' : tier === 'medium' ? 'outline' : 'dashed';
}
