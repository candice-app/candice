// Module de connaissance Candice — versions d'ontologie.
//
// Toute implémentation du Human Signal Graph porte ces versions
// (onboarding-v15-clos §Autorité, HSG §39/§40) afin que le code reste
// rattaché aux décisions conceptuelles humaines (Dictionnaire + HSG +
// consolidation-rules). Le code n'est jamais une autorité sémantique : ces
// constantes tracent la version du vocabulaire et des règles qu'il applique.

export const ONTOLOGY_VERSION = '1.0.0';
export const HSG_VERSION = '1.0.0';

/**
 * Version des SEUILS de consolidation (docs/ontologie/consolidation-rules.md).
 * Les seuils ne vivent jamais en valeurs par défaut enfouies dans consolidate.ts
 * (le code deviendrait une autorité sémantique — interdit par HSG §40) : ils
 * vivent dans ce document versionné, lus depuis un objet typé unique. Toute
 * modification d'un seuil incrémente cette version.
 */
export const CONSOLIDATION_VERSION = '1.0.0';

/**
 * Estampille de version portée par toute structure CONSOLIDÉE persistée
 * (Signal, AffectionSignalSet) : trace sous quelles règles elle a été produite,
 * donc recalculable / migrable.
 */
export interface VersionStamp {
  readonly ontology_version: string;
  readonly hsg_version: string;
  readonly consolidation_version: string;
}

export const VERSION_STAMP: VersionStamp = {
  ontology_version: ONTOLOGY_VERSION,
  hsg_version: HSG_VERSION,
  consolidation_version: CONSOLIDATION_VERSION,
};
