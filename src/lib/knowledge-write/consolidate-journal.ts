// Consolidation À LA DEMANDE (lot B, bloc 1).
//
// Le journal d'evidences est en AJOUT SEUL ; l'état consolidé en est dérivé et
// entièrement recalculable. Cette façade prend le journal recueilli JUSQU'À UN POINT
// donné du parcours et renvoie tous les signaux consolidés — c'est exactement ce dont
// le futur moteur d'analyse (Breath / portrait / analyse proche, trois projections d'un
// même moteur) aura besoin à chaque frontière.
//
// ⚠ EXPOSÉE, APPELÉE NULLE PART dans ce lot. Aucun écran Breath n'est rebranché ici :
// ils restent intacts sur leur source actuelle. On prépare l'entrée, on ne la câble pas.
// Ne mute jamais le journal ; n'écrit jamais par-dessus (dérivation pure).

import type {
  AffectionEvidence,
  AffectionSignalSet,
  BehaviorEvidence,
  ContextEvidence,
  DirectionalEvidence,
  DriverEvidence,
  EntityEvidence,
  Evidence,
  Fact,
  GuardrailEvidence,
  InterestEvidence,
  KnowledgeScope,
  NeedEvidence,
  PreferenceEvidence,
  Signal,
} from '../knowledge';
import {
  consolidateAffection,
  consolidateBehavior,
  consolidateContexts,
  consolidateDrivers,
  consolidateEntities,
  consolidateGuardrails,
  consolidateInterests,
  consolidateNeeds,
  consolidatePreferences,
  consolidateProfile,
} from '../knowledge';

export interface ConsolidatedJournal {
  /** Tous les signaux hors AFFECTION (dont PROFILE/SOCIAL_ENERGY, NEED, DRIVER, CONTEXT,
   *  BEHAVIOR, GUARDRAIL, INTEREST, ENTITY, PREFERENCE). */
  readonly signals: readonly Signal[];
  /** Deux vecteurs affectifs entièrement séparés (R5), toujours renvoyés. */
  readonly affection: AffectionSignalSet;
}

/**
 * Consolide le journal recueilli jusqu'ici pour une personne (scope). Déterministe,
 * indépendant de l'ordre des evidences. `supportingFacts` optionnel propage la
 * visibilité (un signal hérite du niveau le plus restrictif de ses FACT soutiens).
 */
export function consolidateJournal(
  scope: KnowledgeScope,
  journal: readonly Evidence[],
  opts: { supportingFacts?: readonly Fact[] } = {},
): ConsolidatedJournal {
  const by = <T extends Evidence['target_family']>(family: T) =>
    journal.filter((e) => e.target_family === family);

  const directional = by('PROFILE') as DirectionalEvidence[];
  const o = { supportingFacts: opts.supportingFacts };

  const signals: Signal[] = [
    ...consolidateProfile(scope, directional, o),
    ...consolidateNeeds(scope, by('NEED') as NeedEvidence[], o),
    ...consolidateDrivers(scope, by('DRIVER') as DriverEvidence[], o),
    ...consolidateContexts(scope, by('CONTEXT') as ContextEvidence[], o),
    ...consolidateGuardrails(scope, by('GUARDRAIL') as GuardrailEvidence[], o),
    ...consolidateInterests(scope, by('INTEREST') as InterestEvidence[], o),
    ...consolidateEntities(scope, by('ENTITY') as EntityEvidence[], o),
    ...consolidatePreferences(scope, by('PREFERENCE') as PreferenceEvidence[], o),
    ...consolidateBehavior(scope, by('BEHAVIOR') as BehaviorEvidence[], o),
  ];

  const affection = consolidateAffection(scope, by('AFFECTION_LANGUAGE') as AffectionEvidence[], {
    supportingFacts: opts.supportingFacts,
  });

  return { signals, affection };
}
