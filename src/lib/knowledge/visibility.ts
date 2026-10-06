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

import type { AboutRef, UserId } from './identity';

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

/**
 * Le niveau LE PLUS RESTRICTIF d'un ensemble (rang le plus bas). Sert à la propagation
 * de visibilité d'un signal (correction 5) : un signal hérite du niveau le plus
 * restrictif parmi les FACT/evidences qui le soutiennent — un GuardrailSignal sur
 * food.allergy.* ne peut pas remonter à `exposable` si le FACT de santé est internal_only.
 * Ensemble vide → `exposable` (défaut d'un signal consolidé).
 */
export function mostRestrictive(levels: readonly ExposureLevel[]): ExposureLevel {
  return levels.reduce<ExposureLevel>(
    (lo, l) => (exposureRank(l) < exposureRank(lo) ? l : lo),
    'exposable',
  );
}

export interface VisibilityPolicy {
  /** Niveau dérivé du contenu (sensibilité, nature de l'information). */
  readonly derived: ExposureLevel;
  /** Choix explicite de l'utilisateur. Prioritaire, sous réserve du plafond ci-dessous. */
  readonly userOverride?: ExposureLevel;
  readonly reason?: string;
}

/**
 * ⚠ PLAFOND DE SENSIBILITÉ — TRANCHÉ (arbitrage lot B).
 *
 * Un contenu dont `derived === 'internal_only'` (un FACT sensible, par ex. une
 * contrainte de santé) ne peut pas être élevé au-dessus de `internal_only` par un choix
 * utilisateur — SAUF un seul cas : quand la personne décrite EST le titulaire qui
 * détient la connaissance, c.-à-d. `about.kind === 'account' && about.id === holderUserId`.
 *
 * C'est une ÉGALITÉ d'identité, jamais un drapeau `is_self` posé sur une autre table : on
 * ne lève le plafond que lorsque celui qui décrit et celui qui est décrit sont le même
 * compte. Un `account` qui n'est pas le détenteur ne lève rien ; un `contact` non plus.
 * Chacun peut décider de partager SA propre information sensible, personne ne peut décider
 * de partager celle d'un autre. Sans contexte (`ctx` absent), le plafond s'applique
 * toujours — le cas sûr par défaut.
 */
export const SENSITIVITY_CEILING: ExposureLevel = 'internal_only';

/** Contexte d'identité nécessaire pour savoir si le plafond se lève (voir ci-dessus). */
export interface ExposureContext {
  readonly about?: AboutRef;
  readonly holderUserId?: UserId;
}

/** Niveau d'exposition effectif, plafond de sensibilité appliqué. */
export function effectiveExposure(p: VisibilityPolicy, ctx?: ExposureContext): ExposureLevel {
  // Le plafond se lève UNIQUEMENT si la personne décrite est le détenteur lui-même.
  const describesSelf = ctx?.about?.kind === 'account' && ctx.about.id === ctx.holderUserId;
  if (p.derived === SENSITIVITY_CEILING && !describesSelf) return SENSITIVITY_CEILING;
  // Sinon le choix explicite de l'utilisateur prime sur le niveau dérivé.
  return p.userOverride ?? p.derived;
}

/** Politique par défaut d'une connaissance consolidée : candidate au portrait, pas encore visible. */
export const DEFAULT_EXPOSABLE: VisibilityPolicy = { derived: 'exposable' };
/** Politique d'un contenu sensible : interne, jamais exposé. */
export const INTERNAL_ONLY_POLICY: VisibilityPolicy = { derived: 'internal_only' };
