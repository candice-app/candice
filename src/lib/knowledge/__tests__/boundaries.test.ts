// Tests 19–23 — frontières & cadre : dérivation du statut d'assertion,
// familles interdites depuis un FACT sensible, bloc de prompt généré complet.

import { describe, expect, it } from 'vitest';
import { deriveAssertionStatus, SOURCE_TYPES } from '../sources';
import { FAMILIES_FORBIDDEN_FROM_SENSITIVE_FACT } from '../fact';
import {
  ABSOLUTE_RULES,
  buildKnowledgePromptBlock,
  closedCodeInventory,
} from '../prompt';
import { CANONICAL_FAMILIES } from '../vocabulary';

describe('Test 19 — assertionStatus dérivé de sourceType (décision 5)', () => {
  it('reported_by_relative → reported, observed_behavior → observed, le reste → declared', () => {
    expect(deriveAssertionStatus('reported_by_relative')).toBe('reported');
    expect(deriveAssertionStatus('observed_behavior')).toBe('observed');
    for (const st of SOURCE_TYPES) {
      if (st === 'reported_by_relative' || st === 'observed_behavior') continue;
      expect(deriveAssertionStatus(st)).toBe('declared');
    }
  });
  it('aucune source ne produit « inferred » (statut réservé à la consolidation)', () => {
    for (const st of SOURCE_TYPES) expect(deriveAssertionStatus(st)).not.toBe('inferred');
  });
});

describe('Test 20 — R12 : un FACT sensible ne se convertit jamais en certaines familles', () => {
  it('PROFILE / NEED / BEHAVIOR / GUARDRAIL sont interdits à la conversion automatique', () => {
    expect([...FAMILIES_FORBIDDEN_FROM_SENSITIVE_FACT].sort()).toEqual(
      ['BEHAVIOR', 'GUARDRAIL', 'NEED', 'PROFILE'].sort(),
    );
  });
});

describe('Test 21 — le bloc de prompt est généré et contient chaque code fermé', () => {
  const block = buildKnowledgePromptBlock();
  it('chaque code fermé exporté apparaît dans le bloc', () => {
    for (const code of closedCodeInventory()) {
      expect(block).toContain(code);
    }
  });
  it('le bloc porte les 10 familles', () => {
    for (const f of CANONICAL_FAMILIES) expect(block).toContain(f);
  });
});

describe('Test 22 — le bloc porte les règles absolues R1–R25', () => {
  const block = buildKnowledgePromptBlock();
  it('R1 à R25 présents', () => {
    expect(ABSOLUTE_RULES).toHaveLength(25);
    for (let i = 1; i <= 25; i++) expect(block).toContain(`R${i} —`);
  });
});

describe('Test 23 — le bloc porte les deux versions', () => {
  it('ontology + hsg versionnés dans le prompt', () => {
    const block = buildKnowledgePromptBlock();
    expect(block).toMatch(/ontology 1\.0\.0/);
    expect(block).toMatch(/hsg 1\.0\.0/);
  });
});
