// Module de connaissance Candice — surface publique.
//
// Fondation du Human Signal Graph (lot A, purement additif). Les documents
// docs/ontologie/*.md restent la source de vérité conceptuelle ; ce module en
// est l'implémentation exécutable versionnée (ontology_version / hsg_version).

export {
  ONTOLOGY_VERSION,
  HSG_VERSION,
  CONSOLIDATION_VERSION,
  VERSION_STAMP,
  JOURNAL_VERSION_STAMP,
  type VersionStamp,
  type JournalVersionStamp,
} from './version';

export * from './vocabulary';
export * from './sources';
export * from './fact';
export * from './evidence';
export * from './signal';
export * from './consolidate';
export * from './gaps';
export * from './prompt';
export * from './onboarding';
