// Refonte Profil V2, Phase B — métriques déterministes de la nouvelle fiche.
// JAMAIS décidées par le LLM (arbitrages Estelle 1, 2, 9) :
//   • computePodium : 7 dimensions RÉELLES du scoring attention, libellés
//     verrouillés, largeurs mappées depuis les buckets (jamais de score affiché).
//   • computeWorksLevels : 6 niveaux d'intensité « Ce qui marche avec toi »,
//     stables entre deux recalculs — 5 dérivent du radar déterministe validé
//     (computeStyleRadar), premium dérive de l'axe exigenceStanding.

import type { StyleRadar } from "./synthesis";
import type { FaceResult, AxisScore } from "./sheet-data";

// ── Podium (arbitrages 1 + 2) ─────────────────────────────────────────────────

export type PodiumIntensity = "dominant" | "tres_present" | "present" | "a_doser";

export interface PodiumRow {
  dim: string;              // dimension réelle du scoring (MOT, CAD_C, …)
  label: string;            // libellé verrouillé
  intensity: PodiumIntensity;
  intensityLabel: string;   // « Dominant » / « Très présent » / « Présent » / « À doser »
  width: number;            // % de barre (barème validé) — jamais affiché en chiffre
}

/** Libellés VERROUILLÉS (arbitrage 1) — jamais de dimension inventée. */
export const PODIUM_LABELS: Record<string, string> = {
  MOT:   "Mots justes",
  CAD_C: "Cadeaux choisis",
  EXP:   "Moments partagés",
  GES:   "Esthétique · qualité",
  SER:   "Actes de service",
  CAD_S: "Attentions symboliques",
  SUR:   "Surprise",
};

/** Ordre canonique d'affichage à intensité égale. */
const PODIUM_ORDER = ["MOT", "CAD_C", "EXP", "GES", "SER", "CAD_S", "SUR"];

const INTENSITY_LABELS: Record<PodiumIntensity, string> = {
  dominant:     "Dominant",
  tres_present: "Très présent",
  present:      "Présent",
  a_doser:      "À doser",
};

// Barème validé (arbitrage 2) : deux barres du même bucket peuvent partager
// une largeur, le label porte le sens.
const WIDTHS: Record<PodiumIntensity, number[]> = {
  dominant:     [96],
  tres_present: [84, 74],
  present:      [58, 46, 40],
  a_doser:      [24],
};

export function computePodium(reception: FaceResult | null): PodiumRow[] {
  if (!reception) return [];
  const bucketOf = (dim: string): PodiumIntensity =>
    reception.dominant?.includes(dim) ? "dominant"
    : reception.secondaire?.includes(dim) ? "tres_present"
    : reception.tertiaire?.includes(dim) ? "present"
    : "a_doser";

  const rows = PODIUM_ORDER.map(dim => ({ dim, intensity: bucketOf(dim) }));
  const rank: Record<PodiumIntensity, number> = { dominant: 0, tres_present: 1, present: 2, a_doser: 3 };
  rows.sort((a, b) =>
    rank[a.intensity] - rank[b.intensity]
    || PODIUM_ORDER.indexOf(a.dim) - PODIUM_ORDER.indexOf(b.dim));

  const counters: Record<PodiumIntensity, number> = { dominant: 0, tres_present: 0, present: 0, a_doser: 0 };
  return rows.map(r => {
    const widths = WIDTHS[r.intensity];
    const width = widths[Math.min(counters[r.intensity], widths.length - 1)];
    counters[r.intensity] += 1;
    return {
      dim: r.dim,
      label: PODIUM_LABELS[r.dim],
      intensity: r.intensity,
      intensityLabel: INTENSITY_LABELS[r.intensity],
      width,
    };
  });
}

// ── Ce qui marche avec toi (arbitrage 9 — niveaux déterministes) ─────────────

export type WorksKey = "beau" | "personnel" | "experientiel" | "utile" | "premium" | "surprise";
export type WorksLevel = "tres_fort" | "fort" | "a_doser";

export const WORKS_LABELS: Record<WorksKey, string> = {
  beau:         "Le beau",
  personnel:    "Le personnel",
  experientiel: "L'expérientiel",
  utile:        "L'utile",
  premium:      "Le premium",
  surprise:     "La surprise",
};

export const WORKS_LEVEL_LABELS: Record<WorksLevel, string> = {
  tres_fort: "Très fort",
  fort:      "Fort",
  a_doser:   "À doser",
};

function toLevel(score: number): WorksLevel {
  if (score >= 65) return "tres_fort";
  if (score >= 40) return "fort";
  return "a_doser";
}

/**
 * 6 niveaux stables : beau/personnel/expérientiel/utile/surprise dérivent
 * du radar déterministe (esthetique/precision/temps/utilite/surprise) ;
 * premium dérive de l'axe tempérament exigenceStanding (Simplicité ↔
 * Raffinement, -100..100).
 */
export function computeWorksLevels(
  radar: StyleRadar | null,
  temperamentAxes: Record<string, AxisScore> | null,
): Record<WorksKey, WorksLevel> | null {
  if (!radar) return null;
  const exigence = temperamentAxes?.exigenceStanding?.score ?? 0;
  const premiumScore = Math.max(0, Math.min(100, 50 + exigence * 0.35));
  return {
    beau:         toLevel(radar.esthetique),
    personnel:    toLevel(radar.precision),
    experientiel: toLevel(radar.temps),
    utile:        toLevel(radar.utilite),
    premium:      toLevel(premiumScore),
    surprise:     toLevel(radar.surprise),
  };
}
