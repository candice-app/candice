// RECONSTRUCTION de temperament_axes DEPUIS LE JOURNAL SEUL (via le PONT projection_bridge).
// Réplique EXACTEMENT le calcul d'axes du scoring legacy (raw/MAX_RAW*100 clampé) — le scoring legacy
// résout ses deltas par id d'option legacy, non disponible au journal ; on reconstruit donc depuis les
// deltas gravés dans le pont. ⚠ Le pont est de l'ANCIEN DICTIONNAIRE, jamais lu comme connaissance.

import type { AxisDelta } from './temperament-deltas';

const AXIS_KEYS = [
  'energieSociale', 'espaceProsimite', 'spontaneiteControle', 'communicationStyle',
  'expressiviteReserve', 'stabiliteNouveaute', 'sensibiliteDetails', 'exigenceStanding', 'rapportTemps',
] as const;
const MAX_RAW = 8; // identique au scoring legacy

export type TemperamentAxisScores = Record<string, { score: number; intensity: number }>;

/** Reconstruit les axes depuis les deltas du pont (un fragment = les deltas d'une option-réponse). */
export function reconstructTemperamentAxes(bridges: ReadonlyArray<{ deltas: readonly AxisDelta[] }>): TemperamentAxisScores {
  const acc: Record<string, { raw: number; intensity: number }> = Object.fromEntries(AXIS_KEYS.map((k) => [k, { raw: 0, intensity: 0 }]));
  for (const b of bridges) {
    for (const { axis, value } of b.deltas) {
      if (!acc[axis]) acc[axis] = { raw: 0, intensity: 0 };
      acc[axis].raw += value;
      if (value !== 0) acc[axis].intensity++;
    }
  }
  const out: TemperamentAxisScores = {};
  for (const key of AXIS_KEYS) {
    const { raw, intensity } = acc[key];
    out[key] = { score: Math.max(-100, Math.min(100, Math.round((raw / MAX_RAW) * 100))), intensity };
  }
  return out;
}
