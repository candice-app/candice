// PROMPT — bloc de règles GÉNÉRÉ depuis vocabulary.ts + invariants.
//
// Jamais écrit à la main en commentaire : le bloc est produit par code à partir
// du vocabulaire fermé et des invariants, pour qu'il ne puisse pas diverger de
// la source. Il porte : les 10 familles + frontières, les codes fermés
// disponibles, les règles absolues R1–R25, les règles de jugement §39, et les
// deux versions (ontology + hsg). HSG §39/§40 : traduction opérationnelle des
// règles nécessitant du jugement, rattachée aux versions.

import { HSG_VERSION, ONTOLOGY_VERSION } from './version';
import {
  AFFECTION_DIRECTIONS,
  AFFECTION_LANGUAGE_CODES,
  AFFECTION_MODALITIES,
  CANONICAL_FAMILIES,
  CANONICAL_FAMILY_LABELS,
  DRIVER_CODES,
  ENTITY_RELATIONS,
  GUARDRAIL_CODES,
  GUARDRAIL_SCOPES,
  GUARDRAIL_SEVERITIES,
  INTEREST_RELATIONSHIPS,
  NEED_CODES,
  PROFILE_CONTINUUM_CODES,
  PROFILE_FUNCTIONING_CODES,
  PROFILE_ORIENTATION_CODES,
  SENSITIVITY_FACETS,
} from './vocabulary';

/** Règles absolues du HSG, transcrites de hsg-architecture.md §37 (R1–R25). */
export const ABSOLUTE_RULES: readonly string[] = [
  'R1 — UNKNOWN ≠ LOW.',
  'R2 — Absence d’evidence ≠ evidence négative.',
  'R3 — Une evidence négative nécessite une formulation réellement contraire.',
  'R4 — Pas d’axes bipolaires implicites, sauf continuum explicitement défini.',
  'R5 — RECEIVE ≠ GIVE.',
  'R6 — Plusieurs modalités affectives peuvent être fortes simultanément.',
  'R7 — AFFECTION_LANGUAGE n’implique pas automatiquement NEED.',
  'R8 — BEHAVIOR n’implique pas automatiquement NEED.',
  'R9 — BEHAVIOR n’implique pas automatiquement PROFILE.',
  'R10 — Une préférence locale n’est pas automatiquement PROFILE.',
  'R11 — Un mot-clé ne suffit pas à produire un DRIVER.',
  'R12 — Une condition médicale/neurodéveloppementale déclarée ne produit aucun trait supposé automatiquement.',
  'R13 — Le contexte appartient à l’evidence.',
  'R14 — Une evidence située ne devient pas automatiquement GLOBAL.',
  'R15 — Un GLOBAL peut être direct ou consolidé ; les deux restent distinguables.',
  'R16 — Un FACT ne disparaît jamais parce qu’un signal en est dérivé.',
  'R17 — Une information utile n’a pas besoin de produire un signal psychologique.',
  'R18 — Une tension structurante ne se résout pas par une moyenne.',
  'R19 — Un guardrail HARD incompatible élimine la recommandation.',
  'R20 — La sévérité d’un guardrail appartient à l’evidence, pas au code.',
  'R21 — Un guardrail d’exécution n’est pas une interdiction de catégorie.',
  'R22 — Une correction explicite peut réviser une inférence antérieure.',
  'R23 — Le portrait relit les données brutes ; il n’est pas généré uniquement depuis les scores.',
  'R24 — Une nouvelle information ne crée pas automatiquement un ONTOLOGY_GAP.',
  'R25 — Ne jamais créer un nouveau construct uniquement pour remplir une case ou augmenter la couverture.',
];

/** Règles nécessitant du jugement, transcrites de hsg-architecture.md §39. */
export const JUDGMENT_RULES: readonly string[] = [
  'observation vs inférence',
  'evidence primaire vs secondaire',
  'pertinence d’un NEED',
  'distinction DRIVER / simple formulation',
  'contextualisation',
  'contradiction vs tension',
  'consolidation',
  'interprétation des réponses ouvertes',
  'portrait',
  'choix des prochaines micro-questions',
  'détection d’un véritable ONTOLOGY_GAP',
];

/** Frontières canoniques essentielles (Dictionnaire §14). */
const FRONTIERS: readonly string[] = [
  'INTEREST ≠ PREFERENCE',
  'PREFERENCE ≠ PROFILE',
  'PROFILE ≠ BEHAVIOR',
  'BEHAVIOR ≠ NEED',
  'BEHAVIOR ≠ PREFERENCE',
  'AFFECTION_LANGUAGE ≠ NEED',
  'AFFECTION_LANGUAGE ≠ DRIVER',
  'DRIVER ≠ FORMAT',
  'GUARDRAIL ≠ PRÉFÉRENCE NÉGATIVE ORDINAIRE',
  'FACT ≠ SIGNAL PSYCHOLOGIQUE',
  'CONTEXT ≠ PROFILE',
];

/**
 * Inventaire de TOUS les codes fermés exportés par le vocabulaire.
 * Sert à la génération du bloc et au test « chaque code fermé apparaît ».
 */
export function closedCodeInventory(): string[] {
  return [
    ...CANONICAL_FAMILIES,
    ...PROFILE_FUNCTIONING_CODES,
    ...PROFILE_ORIENTATION_CODES,
    ...PROFILE_CONTINUUM_CODES,
    ...SENSITIVITY_FACETS,
    ...NEED_CODES,
    ...AFFECTION_MODALITIES,
    ...AFFECTION_DIRECTIONS,
    ...AFFECTION_LANGUAGE_CODES,
    ...DRIVER_CODES,
    ...GUARDRAIL_CODES,
    ...GUARDRAIL_SEVERITIES,
    ...GUARDRAIL_SCOPES,
    ...INTEREST_RELATIONSHIPS,
    ...ENTITY_RELATIONS,
  ];
}

function section(title: string, lines: readonly string[]): string {
  return `## ${title}\n${lines.map((l) => `- ${l}`).join('\n')}`;
}

/**
 * Génère le bloc de règles complet. Chaque code fermé exporté y figure
 * (garanti par closedCodeInventory + sections ci-dessous).
 */
export function buildKnowledgePromptBlock(): string {
  const parts: string[] = [];

  parts.push(
    `# Candice — règles de connaissance (ontology ${ONTOLOGY_VERSION}, hsg ${HSG_VERSION})`,
  );

  parts.push(
    section(
      'Les 10 familles canoniques',
      CANONICAL_FAMILIES.map((f) => `${f} — ${CANONICAL_FAMILY_LABELS[f]}`),
    ),
  );
  parts.push(section('Frontières canoniques essentielles', FRONTIERS));

  parts.push(
    section('PROFILE — dimensions de fonctionnement (fermé)', PROFILE_FUNCTIONING_CODES),
  );
  parts.push(
    section('PROFILE — orientations d’arbitrage (fermé)', PROFILE_ORIENTATION_CODES),
  );
  parts.push(
    section('PROFILE — continuum (0 réel)', PROFILE_CONTINUUM_CODES),
  );
  parts.push(section('PROFILE_SENSITIVITY — sous-facettes', SENSITIVITY_FACETS));
  parts.push(section('NEED (fermé)', NEED_CODES));
  parts.push(
    section(
      'AFFECTION_LANGUAGE (fermé : 7 modalités × 2 directions = 14)',
      [
        `modalités : ${AFFECTION_MODALITIES.join(', ')}`,
        `directions : ${AFFECTION_DIRECTIONS.join(', ')}`,
        ...AFFECTION_LANGUAGE_CODES,
      ],
    ),
  );
  parts.push(section('DRIVER (fermé)', DRIVER_CODES));
  parts.push(
    section(
      'GUARDRAIL (codes canoniques fermés ; severity/scope dans l’evidence)',
      [
        ...GUARDRAIL_CODES,
        `severity : ${GUARDRAIL_SEVERITIES.join(' | ')}`,
        `scope : ${GUARDRAIL_SCOPES.join(' | ')}`,
      ],
    ),
  );
  parts.push(section('INTEREST — relationship (fermé)', INTEREST_RELATIONSHIPS));
  parts.push(section('ENTITY — relation (fermé)', ENTITY_RELATIONS));

  parts.push(section('Règles absolues (R1–R25)', ABSOLUTE_RULES));
  parts.push(section('Règles nécessitant du jugement (§39)', JUDGMENT_RULES));

  return parts.join('\n\n');
}
