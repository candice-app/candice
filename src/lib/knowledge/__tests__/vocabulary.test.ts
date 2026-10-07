// Tests 1, 3, 4 — vocabulaire : chiffres de contrôle, régimes fermé/ouvert,
// libellés exhaustifs.

import { describe, expect, it } from 'vitest';
import {
  AFFECTION_DIRECTIONS,
  AFFECTION_LANGUAGE_CODES,
  AFFECTION_MODALITIES,
  BEHAVIOR_CONTEXTS,
  BEHAVIOR_PATTERNS,
  CANONICAL_FAMILIES,
  CANONICAL_FAMILY_LABELS,
  CONTEXT_CODES,
  EVIDENCE_CONTEXTS,
  isValidEvidenceContext,
  assertValidEvidenceContext,
  assertValidBehaviorContext,
  DEPRECATED_AXES,
  DRIVER_CODES,
  DRIVER_LABELS,
  ENTITY_RELATIONS,
  ENTITY_RELATION_LABELS,
  ENTITY_TYPES,
  GUARDRAIL_CODES,
  GUARDRAIL_CODES_BY_CATEGORY,
  GUARDRAIL_LABELS,
  INTEREST_PARENT_DOMAINS,
  INTEREST_RELATIONSHIPS,
  NEED_CODES,
  NEED_LABELS,
  PROFILE_CONTINUUM_CODES,
  PROFILE_FUNCTIONING_CODES,
  PROFILE_FUNCTIONING_LABELS,
  PROFILE_ORIENTATION_CODES,
  SENSITIVITY_FACETS,
  affectionCode,
  normalizeBehaviorPattern,
} from '../vocabulary';

describe('Test 1 — chiffres de contrôle du vocabulaire', () => {
  it('10 familles canoniques', () => {
    expect(CANONICAL_FAMILIES).toHaveLength(10);
  });
  it('PROFILE : 9 fonctionnements, 8 orientations, 1 continuum, 3 sous-facettes', () => {
    expect(PROFILE_FUNCTIONING_CODES).toHaveLength(9);
    expect(PROFILE_ORIENTATION_CODES).toHaveLength(8);
    expect(PROFILE_CONTINUUM_CODES).toHaveLength(1);
    expect(SENSITIVITY_FACETS).toHaveLength(3);
  });
  it('NEED : 16', () => {
    expect(NEED_CODES).toHaveLength(16);
  });
  it('AFFECTION : 7 modalités × 2 directions = 14 codes dérivés', () => {
    expect(AFFECTION_MODALITIES).toHaveLength(7);
    expect(AFFECTION_DIRECTIONS).toHaveLength(2);
    expect(AFFECTION_LANGUAGE_CODES).toHaveLength(14);
    expect(new Set(AFFECTION_LANGUAGE_CODES).size).toBe(14); // pas de doublon
  });
  it('DRIVER : 25', () => {
    expect(DRIVER_CODES).toHaveLength(25);
  });
  it('ENTITY : 21 types (ouvert), 9 relations (fermé)', () => {
    expect(ENTITY_TYPES.seed).toHaveLength(21);
    expect(ENTITY_RELATIONS).toHaveLength(9);
  });
  it('CONTEXT : 10 (famille CONTEXT, distress N’Y est PAS) ; INTEREST : 29 domaines, 5 relationships (fermé)', () => {
    expect(CONTEXT_CODES.seed).toHaveLength(10); // distress vit dans EVIDENCE_CONTEXTS, pas ici
    expect(CONTEXT_CODES.has('distress')).toBe(false);
    expect(INTEREST_PARENT_DOMAINS.seed).toHaveLength(29);
    expect(INTEREST_RELATIONSHIPS).toHaveLength(5); // inchangé, pas de 'unspecified'
  });
  it('EVIDENCE_CONTEXTS : 14 contextes locaux (13 + relationship_with_reporter, incognito §2)', () => {
    expect(EVIDENCE_CONTEXTS.seed).toHaveLength(14);
    expect(EVIDENCE_CONTEXTS.has('distress')).toBe(true);
    expect(EVIDENCE_CONTEXTS.has('conflict')).toBe(true);
    expect(EVIDENCE_CONTEXTS.has('emotional_expression')).toBe(true);
    expect(EVIDENCE_CONTEXTS.has('relationship_with_reporter')).toBe(true); // 14e
    expect(EVIDENCE_CONTEXTS.has('GLOBAL')).toBe(false); // GLOBAL n'est pas un contexte local
    expect(isValidEvidenceContext('GLOBAL')).toBe(true);
    expect(isValidEvidenceContext('stress')).toBe(true);
    expect(isValidEvidenceContext('relationship_with_reporter')).toBe(true);
    expect(isValidEvidenceContext('faute_de_frappe')).toBe(false);
  });
  it('garde-fou de production : un contexte hors vocabulaire JETTE (la coquille scinderait la consolidation)', () => {
    expect(() => assertValidEvidenceContext('stress')).not.toThrow();
    expect(() => assertValidEvidenceContext('relationship_with_reporter')).not.toThrow();
    expect(() => assertValidEvidenceContext('stress_reponse')).toThrow(); // coquille
  });
  it('garde-fou behaviorContext : registre SÉPARÉ, coquille rejetée sur les deux champs', () => {
    expect(() => assertValidBehaviorContext('stress_response')).not.toThrow();
    expect(() => assertValidBehaviorContext('conflict_response')).not.toThrow();
    expect(() => assertValidBehaviorContext('stress_responce')).toThrow(); // coquille
    // les deux vocabulaires sont distincts : un contexte local n'est pas un behaviorContext et inversement
    expect(() => assertValidBehaviorContext('stress')).toThrow(); // 'stress' = local, pas BEHAVIOR
    expect(() => assertValidEvidenceContext('stress_response')).toThrow(); // 'stress_response' = BEHAVIOR, pas local
    expect(isValidEvidenceContext('stress_response')).toBe(false);
  });
  it('DEPRECATED : 15 anciens axes', () => {
    expect(DEPRECATED_AXES).toHaveLength(15);
  });
  // POINT D'ARRÊT documenté : le chiffre de contrôle du lot attend 19 guardrails
  // canoniques. La source de vérité (Dictionnaire §8.3) n'en définit que 18.
  // Aucun 19e code n'est inventé (R25). On vérifie donc 18 — le réel.
  it('GUARDRAIL : 18 codes canoniques réels (⚠ contrôle lot = 19, voir rapport)', () => {
    expect(GUARDRAIL_CODES).toHaveLength(18);
    const fromCategories = Object.values(GUARDRAIL_CODES_BY_CATEGORY).flat();
    expect(fromCategories).toHaveLength(18);
    expect(Object.keys(GUARDRAIL_CODES_BY_CATEGORY)).toHaveLength(7);
  });
});

describe('Test 3 — libellés exhaustifs des codes fermés', () => {
  it('chaque code fermé possède un libellé', () => {
    for (const c of PROFILE_FUNCTIONING_CODES) expect(PROFILE_FUNCTIONING_LABELS[c]).toBeTruthy();
    for (const c of NEED_CODES) expect(NEED_LABELS[c]).toBeTruthy();
    for (const c of DRIVER_CODES) expect(DRIVER_LABELS[c]).toBeTruthy();
    for (const c of GUARDRAIL_CODES) expect(GUARDRAIL_LABELS[c]).toBeTruthy();
    for (const c of ENTITY_RELATIONS) expect(ENTITY_RELATION_LABELS[c]).toBeTruthy();
    for (const c of CANONICAL_FAMILIES) expect(CANONICAL_FAMILY_LABELS[c]).toBeTruthy();
  });
  it('les 14 codes affectifs se construisent par croisement', () => {
    expect(affectionCode('receive', 'WORDS')).toBe('AFFECTION_RECEIVE_WORDS');
    expect(affectionCode('give', 'SERVICES')).toBe('AFFECTION_GIVE_SERVICES');
  });
});

describe('Test 4 — régime ouvert : registres extensibles et normalisation', () => {
  it('un domaine INTEREST inconnu peut être enregistré (R24 : pas de rejet faute de code fermé)', () => {
    expect(INTEREST_PARENT_DOMAINS.has('aquariophilie')).toBe(false);
    INTEREST_PARENT_DOMAINS.register('aquariophilie');
    expect(INTEREST_PARENT_DOMAINS.has('aquariophilie')).toBe(true);
  });
  it('le registre BEHAVIOR normalise les alias (noms HSG gagnent — décision 2)', () => {
    expect(normalizeBehaviorPattern('withdraw_seek_calm')).toBe('withdraw');
    expect(normalizeBehaviorPattern('research_thoroughly')).toBe('extensive_research');
    expect(BEHAVIOR_PATTERNS.has('withdraw_seek_calm')).toBe(true); // via normalisation
    expect(BEHAVIOR_PATTERNS.has('withdraw')).toBe(true);
  });
  it('les contextes BEHAVIOR initiaux sont au nombre de 4 et extensibles', () => {
    expect(BEHAVIOR_CONTEXTS.seed).toHaveLength(4);
    BEHAVIOR_CONTEXTS.register('grief_response');
    expect(BEHAVIOR_CONTEXTS.has('grief_response')).toBe(true);
  });
});
