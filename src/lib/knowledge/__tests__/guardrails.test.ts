// Tests 27–29 — GUARDRAIL : codes canoniques groupés, severity/scope portés par
// l'evidence (R20), verticaux extensibles.

import { describe, expect, it } from 'vitest';
import {
  GUARDRAIL_CODES,
  GUARDRAIL_CODES_BY_CATEGORY,
  GUARDRAIL_SCOPES,
  GUARDRAIL_SEVERITIES,
  isGuardrailVerticalPath,
} from '../vocabulary';
import type { GuardrailEvidence } from '../evidence';
import { asContactId, contactAbout, asUserId } from '../identity';
import { JOURNAL_VERSION_STAMP } from '../version';

describe('Test 27 — codes canoniques groupés par 7 catégories', () => {
  it('7 catégories, concat = GUARDRAIL_CODES, pas de doublon', () => {
    expect(Object.keys(GUARDRAIL_CODES_BY_CATEGORY)).toHaveLength(7);
    const flat = Object.values(GUARDRAIL_CODES_BY_CATEGORY).flat();
    expect(flat).toEqual([...GUARDRAIL_CODES]);
    expect(new Set(flat).size).toBe(flat.length);
  });
});

describe('Test 28 — severity & scope appartiennent à l’evidence, pas au code (R20)', () => {
  it('le même code peut être SOFT|HARD et porter un scope distinct', () => {
    expect(GUARDRAIL_SEVERITIES).toEqual(['SOFT', 'HARD']);
    expect(GUARDRAIL_SCOPES).toEqual(['selection', 'execution', 'context']);
    const soft: GuardrailEvidence = {
      about: contactAbout(asContactId('c1')),
      ownerId: asUserId('u1'),
      evidence_id: 'g1',
      source_id: 's',
      source_type: 'onboarding_closed',
      raw_information: 'je préfère éviter',
      confidence: 'high',
      context: 'GLOBAL',
      timestamp: '2026-10-02T00:00:00Z',
      stability: 'contextual',
      evidence_role: 'primary',
      target_family: 'GUARDRAIL',
      target_construct: 'GRD_NOISE',
      severity: 'SOFT',
      guardrailScope: 'selection',
      strength: 'moderate',
      version: JOURNAL_VERSION_STAMP,
    };
    const hard: GuardrailEvidence = { ...soft, evidence_id: 'g2', severity: 'HARD', guardrailScope: 'execution' };
    expect(soft.severity).toBe('SOFT');
    expect(hard.severity).toBe('HARD');
    expect(soft.target_construct).toBe(hard.target_construct);
  });
});

describe('Test 29 — guardrails verticaux extensibles (chemins libres)', () => {
  it('reconnaît les chemins sous préfixes connus, rejette les autres', () => {
    expect(isGuardrailVerticalPath('food.allergy.nuts')).toBe(true);
    expect(isGuardrailVerticalPath('fashion.never_wear.heels')).toBe(true);
    expect(isGuardrailVerticalPath('travel')).toBe(true);
    expect(isGuardrailVerticalPath('random.path')).toBe(false);
  });
});
