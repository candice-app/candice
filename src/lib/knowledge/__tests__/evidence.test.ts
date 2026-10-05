// Tests 5–9 — evidence : invariants typés et garde-fous d'exécution.

import { describe, expect, it } from 'vitest';
import {
  createProfileEvidence,
  createSocialEnergyEvidence,
  isDirectionalEvidence,
  type ProfileEvidence,
} from '../evidence';
import type { EvidenceValue } from '../vocabulary';
import { asContactId, asUserId } from '../identity';

const base = {
  contactId: asContactId('c1'),
  ownerId: asUserId('u1'),
  evidence_id: 'e1',
  source_id: 's1',
  source_type: 'onboarding_closed' as const,
  raw_information: 'verbatim',
  confidence: 'high' as const,
  context: 'GLOBAL' as const,
  timestamp: '2026-10-02T00:00:00Z',
  stability: 'contextual' as const,
  evidence_role: 'primary' as const,
};

describe('Test 5 — value 0 interdite pour un construct directionnel', () => {
  it('rejette value 0 (0 n’est jamais une evidence)', () => {
    expect(() =>
      createProfileEvidence({
        ...base,
        target_construct: 'PROFILE_OPENNESS',
        value: 0 as unknown as EvidenceValue,
      }),
    ).toThrow();
  });
});

describe('Test 6 — SOCIAL_ENERGY : échelle 0..4 définitive, 0 est une extrémité réelle', () => {
  it('accepte value 0 sur le continuum (recharge solitaire, pas le milieu)', () => {
    const e = createSocialEnergyEvidence({ ...base, value: 0 });
    expect(e.value).toBe(0);
    expect(e.target_construct).toBe('SOCIAL_ENERGY');
  });
  it('accepte toute la plage ordinale 0..4 (0 = solitaire, 4 = social)', () => {
    for (const v of [0, 1, 2, 3, 4] as const) {
      const e = createSocialEnergyEvidence({ ...base, value: v });
      expect(e.value).toBe(v);
    }
  });
});

describe('Test 7 — une evidence ne porte jamais globalStatus (décision 6)', () => {
  it('aucune clé globalStatus sur l’evidence', () => {
    const e = createProfileEvidence({ ...base, target_construct: 'PROFILE_STRUCTURE', value: 2 });
    expect('globalStatus' in e).toBe(false);
    expect(e.context).toBe('GLOBAL'); // littéral de contexte, pas un statut consolidé
  });
});

describe('Test 8 — evidence négative seulement via mapping contraire explicite (R3/R4)', () => {
  it('rejette une value négative sans contraryMapping', () => {
    expect(() =>
      createProfileEvidence({ ...base, target_construct: 'APPETENCE_OBJECT', value: -1 }),
    ).toThrow();
  });
  it('accepte une value négative avec contraryMapping explicite', () => {
    const e = createProfileEvidence({
      ...base,
      target_construct: 'APPETENCE_OBJECT',
      value: -1,
      contraryMapping: true,
    });
    expect(e.value).toBe(-1);
  });
});

describe('Test 9 — discrimination par famille (value XOR strength)', () => {
  it('une evidence PROFILE porte value et pas strength', () => {
    const e: ProfileEvidence = createProfileEvidence({
      ...base,
      target_construct: 'PROFILE_OPENNESS',
      value: 1,
    });
    expect(isDirectionalEvidence(e)).toBe(true);
    expect('strength' in e).toBe(false);
    expect(e.value).toBe(1);
  });
});
