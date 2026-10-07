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
  it('isSelfDeclaredAct — liste blanche EXHAUSTIVE, décision explicite par sourceType', () => {
    // la décision attendue pour CHAQUE sourceType (aucune par exclusion)
    const expected: Record<string, boolean> = {
      onboarding_closed: true, onboarding_open: true, discovery_closed: true, discovery_open: true,
      conversation: true, user_declaration: true, user_correction: true, wishlist: true,
      reported_by_relative: false, observed_behavior: false,
    };
    // tout sourceType connu a une décision ET ne jette jamais (le default ne jette que pour un type non décidé)
    for (const st of SOURCE_TYPES) {
      expect(() => isSelfDeclaredAct(st)).not.toThrow();
      expect(isSelfDeclaredAct(st)).toBe(expected[st]);
    }
    // garde-fou : si un sourceType est ajouté à SOURCE_TYPES sans l'ajouter ici, ce test échoue.
    expect(Object.keys(expected).sort()).toEqual([...SOURCE_TYPES].sort());
    // un sourceType non décidé (jamais dans l'union) jette au lieu de prendre le bonus par défaut.
    expect(() => isSelfDeclaredAct('incognito_guess' as never)).toThrow();
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
