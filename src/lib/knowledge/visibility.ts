// Politique de visibilité (lot A bis, correction 3).
//
// Une échelle ORDONNÉE unique, monotone : chaque niveau implique les précédents.
// Elle remplace les booléens dispersés (dont FactSensitivity.usableInVisibleRationale).
// Elle vit sur la couche de connaissance et d'insight — Fact, OpenKnowledge, Signal —
// JAMAIS sur les evidences ni les SourceRecord : une source brute est de la provenance
// interne par nature, lui donner un niveau laisserait croire qu'elle peut être exposée.
//
// Les trois couches VISIBLE_PROFILE / SHARED_WITH_OTHERS / PORTRAIT sont des
// projections calculées depuis cette échelle, jamais des copies stockées. Ce lot ne
// construit aucune projection.

export const EXPOSURE_LEVELS = [
  'internal_only', // connaissance interne à Candice, jamais exposée
  'exposable', // pourrait figurer au portrait, pas encore rendu visible
  'visible', // effectivement visible sur le profil
  'shared_with_relatives', // explicitement autorisé auprès des proches
] as const;
export type ExposureLevel = (typeof EXPOSURE_LEVELS)[number];

export function exposureRank(level: ExposureLevel): number {
  return EXPOSURE_LEVELS.indexOf(level);
}

export interface VisibilityPolicy {
  /** Niveau dérivé du contenu (sensibilité, nature de l'information). */
  readonly derived: ExposureLevel;
  /** Choix explicite de l'utilisateur. Prioritaire, sous réserve du plafond ci-dessous. */
  readonly userOverride?: ExposureLevel;
  readonly reason?: string;
}

/**
 * ⚠ PLAFOND DE SENSIBILITÉ — POINT D'ARRÊT 2 (NON TRANCHÉ).
 *
 * Comportement implémenté : un contenu dont `derived === 'internal_only'` (un FACT
 * sensible, par ex. une contrainte de santé concernant le proche) ne peut JAMAIS être
 * élevé au-dessus de `internal_only` par un choix utilisateur. Le `userOverride` peut
 * abaisser, jamais élever ce plancher. Un utilisateur ne rend pas partageable une
 * information de santé concernant son proche.
 *
 * Ce n'est pas écrit tel quel dans les documents : le HSG §35 dit qu'une contrainte
 * sensible n'apparaît pas dans la justification visible, il ne dit pas ce qu'un choix
 * utilisateur explicite peut en faire. En attente d'arbitrage Estelle avant que le
 * lot B n'expose quoi que ce soit.
 */
export const SENSITIVITY_CEILING: ExposureLevel = 'internal_only';

/** Niveau d'exposition effectif, plafond de sensibilité appliqué. */
export function effectiveExposure(p: VisibilityPolicy): ExposureLevel {
  // Plafond : un contenu sensible reste internal_only quel que soit l'override.
  if (p.derived === SENSITIVITY_CEILING) return SENSITIVITY_CEILING;
  // Sinon le choix explicite de l'utilisateur prime sur le niveau dérivé.
  return p.userOverride ?? p.derived;
}

/** Politique par défaut d'une connaissance consolidée : candidate au portrait, pas encore visible. */
export const DEFAULT_EXPOSABLE: VisibilityPolicy = { derived: 'exposable' };
/** Politique d'un contenu sensible : interne, jamais exposé. */
export const INTERNAL_ONLY_POLICY: VisibilityPolicy = { derived: 'internal_only' };
