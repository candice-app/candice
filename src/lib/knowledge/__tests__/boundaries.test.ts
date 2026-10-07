// Tests 19–23 — frontières & cadre : dérivation du statut d'assertion,
// familles interdites depuis un FACT sensible, bloc de prompt généré complet.

import { describe, expect, it } from 'vitest';
import { deriveAssertionStatus, isSelfDeclaredAct, SOURCE_TYPES } from '../sources';
import { FAMILIES_FORBIDDEN_FROM_SENSITIVE_FACT } from '../fact';
import {
  ABSOLUTE_RULES,
  buildKnowledgePromptBlock,
  closedCodeInventory,
} from '../prompt';
import { CANONICAL_FAMILIES } from '../vocabulary';

describe('Test 19 — assertionStatus = mécanisme producteur (explicit | inferred)', () => {
  it('tout mapping direct (producteur actuel) produit explicit, quel que soit le sourceType', () => {
    for (const st of SOURCE_TYPES) expect(deriveAssertionStatus(st)).toBe('explicit');
  });
  it('aucune source ne produit « inferred » aujourd’hui (statut réservé au futur moteur d’extraction)', () => {
    for (const st of SOURCE_TYPES) expect(deriveAssertionStatus(st)).not.toBe('inferred');
  });
  it('l’acte « déclaré de soi » vit sur l’axe sourceType : ni rapporté ni observé', () => {
    expect(isSelfDeclaredAct('onboarding_closed')).toBe(true);
    expect(isSelfDeclaredAct('user_declaration')).toBe(true);
    expect(isSelfDeclaredAct('reported_by_relative')).toBe(false);
    expect(isSelfDeclaredAct('observed_behavior')).toBe(false);
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
