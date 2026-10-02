// Tests 10–18 — consolidation : convergence sans addition de points, divergences,
// tension, BEHAVIOR non globalisé, corrections, vecteurs affectifs séparés.

import { describe, expect, it } from 'vitest';
import { createProfileEvidence } from '../evidence';
import type {
  AffectionEvidence,
  BehaviorEvidence,
  DirectionalEvidence,
  Evidence,
} from '../evidence';
import {
  asStructuralTension,
  consolidateAffection,
  consolidateBehavior,
  consolidateProfileConstruct,
  describeAffectionAsymmetry,
  reviseWithCorrection,
} from '../consolidate';
import { defaultSignal } from '../signal';
import { affectionCode } from '../vocabulary';

const base = {
  raw_information: 'v',
  confidence: 'high' as const,
  timestamp: '2026-10-02T00:00:00Z',
  stability: 'contextual' as const,
  evidence_role: 'primary' as const,
  source_type: 'onboarding_closed' as const,
};

function profileEv(
  overrides: Partial<Parameters<typeof createProfileEvidence>[0]> & {
    source_id: string;
    evidence_id: string;
    target_construct: Parameters<typeof createProfileEvidence>[0]['target_construct'];
    value: Parameters<typeof createProfileEvidence>[0]['value'];
    context: string;
  },
): DirectionalEvidence {
  return createProfileEvidence({ ...base, ...overrides });
}

describe('Test 10 — construct sans evidence : UNKNOWN, jamais LOW (R1)', () => {
  it('défaut = unknown / none / 0', () => {
    const s = consolidateProfileConstruct('PROFILE_OPENNESS', []);
    expect(s).toEqual(defaultSignal('PROFILE_OPENNESS'));
    expect(s.score).toBe('unknown');
    expect(s.confidence).toBe('none');
  });
});

describe('Test 11 — jamais de score low sans evidence', () => {
  it('score low exige ≥1 evidence', () => {
    const empty = consolidateProfileConstruct('PROFILE_AUTONOMY', []);
    expect(empty.score).toBe('unknown');
    const one = consolidateProfileConstruct('PROFILE_AUTONOMY', [
      profileEv({
        evidence_id: 'e',
        source_id: 's',
        target_construct: 'PROFILE_AUTONOMY',
        value: 1,
        context: 'decision',
      }),
    ]);
    expect(one.evidenceCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Test 12 — pas de faux effet de volume (§19.1)', () => {
  it('10 formulations d’une même source = 1 observation indépendante', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      profileEv({
        evidence_id: `e${i}`,
        source_id: 'sameSource',
        target_construct: 'PROFILE_RELATIONALITY',
        value: 1,
        context: 'gift',
      }),
    );
    const one = [many[0]];
    const sMany = consolidateProfileConstruct('PROFILE_RELATIONALITY', many);
    const sOne = consolidateProfileConstruct('PROFILE_RELATIONALITY', one);
    // Le volume d'une source unique ne gonfle pas le SCORE…
    expect(sMany.score).toBe(sOne.score);
    expect(sMany.score).not.toBe('high');
    // …et n'atteint JAMAIS confidence high : high exige ≥2 sources indépendantes
    // (§3/§4), or 10 formulations = 1 seule source indépendante.
    expect(sMany.confidence).not.toBe('high');
    expect(sOne.confidence).not.toBe('high');
  });
});

describe('Test 13 — GLOBAL_DIRECT vs GLOBAL_CONSOLIDATED (R15)', () => {
  it('une evidence transversale → GLOBAL_DIRECT', () => {
    const s = consolidateProfileConstruct('PROFILE_STRUCTURE', [
      profileEv({
        evidence_id: 'e',
        source_id: 's',
        target_construct: 'PROFILE_STRUCTURE',
        value: 2,
        context: 'GLOBAL',
      }),
    ]);
    expect(s.globalStatus).toBe('GLOBAL_DIRECT');
  });
  it('convergence de 3 evidences indépendantes dans 3 contextes → GLOBAL_CONSOLIDATED (§5)', () => {
    const s = consolidateProfileConstruct('PROFILE_STRUCTURE', [
      profileEv({
        evidence_id: 'e1',
        source_id: 's1',
        target_construct: 'PROFILE_STRUCTURE',
        value: 1,
        context: 'travel',
      }),
      profileEv({
        evidence_id: 'e2',
        source_id: 's2',
        target_construct: 'PROFILE_STRUCTURE',
        value: 1,
        context: 'home',
      }),
      profileEv({
        evidence_id: 'e3',
        source_id: 's3',
        target_construct: 'PROFILE_STRUCTURE',
        value: 1,
        context: 'work',
      }),
    ]);
    expect(s.globalStatus).toBe('GLOBAL_CONSOLIDATED');
  });
  it('2 evidences / 2 contextes seulement → reste LOCAL_ONLY (seuil §5 = 3)', () => {
    const s = consolidateProfileConstruct('PROFILE_STRUCTURE', [
      profileEv({
        evidence_id: 'e1',
        source_id: 's1',
        target_construct: 'PROFILE_STRUCTURE',
        value: 1,
        context: 'travel',
      }),
      profileEv({
        evidence_id: 'e2',
        source_id: 's2',
        target_construct: 'PROFILE_STRUCTURE',
        value: 1,
        context: 'home',
      }),
    ]);
    expect(s.globalStatus).toBe('LOCAL_ONLY');
  });
  it('une seule evidence locale → LOCAL_ONLY (pas de global mécanique, R14)', () => {
    const s = consolidateProfileConstruct('PROFILE_STRUCTURE', [
      profileEv({
        evidence_id: 'e',
        source_id: 's',
        target_construct: 'PROFILE_STRUCTURE',
        value: 2,
        context: 'travel',
      }),
    ]);
    expect(s.globalStatus).toBe('LOCAL_ONLY');
  });
});

describe('Test 14 — une evidence secondaire, seule, ne porte pas à high (décision 4)', () => {
  it('secondaire forte GLOBAL → ni score high ni confidence high', () => {
    const s = consolidateProfileConstruct('PROFILE_OPENNESS', [
      profileEv({
        evidence_id: 'e',
        source_id: 's',
        target_construct: 'PROFILE_OPENNESS',
        value: 2,
        context: 'GLOBAL',
        evidence_role: 'secondary',
      }),
    ]);
    expect(s.score).not.toBe('high');
    expect(s.confidence).not.toBe('high');
  });
});

describe('Test 15 — contradiction : conserver les deux, ajuster la confiance (§20.3)', () => {
  it('mêmes contexte, directions opposées → contradiction + confiance basse', () => {
    const s = consolidateProfileConstruct('APPETENCE_PREMIUM', [
      profileEv({
        evidence_id: 'e1',
        source_id: 's1',
        target_construct: 'APPETENCE_PREMIUM',
        value: 2,
        context: 'GLOBAL',
      }),
      profileEv({
        evidence_id: 'e2',
        source_id: 's2',
        target_construct: 'APPETENCE_PREMIUM',
        value: -2,
        context: 'GLOBAL',
        contraryMapping: true,
      }),
    ]);
    expect(s.contradiction).toBe(true);
    expect(s.confidence).toBe('low');
    expect(s.evidenceCount).toBe(2); // les deux conservées
    expect(s.direction).toBe('mixed');
  });
});

describe('Test 16 — tension structurante : jamais moyennée (R18)', () => {
  it('asStructuralTension renvoie les deux signaux distincts', () => {
    const spont = consolidateProfileConstruct('APPETENCE_SPONTANEITY', [
      profileEv({
        evidence_id: 'e1',
        source_id: 's1',
        target_construct: 'APPETENCE_SPONTANEITY',
        value: 2,
        context: 'GLOBAL',
      }),
    ]);
    const mastery = consolidateProfileConstruct('IMPORTANCE_MASTERY', [
      profileEv({
        evidence_id: 'e2',
        source_id: 's2',
        target_construct: 'IMPORTANCE_MASTERY',
        value: 2,
        context: 'GLOBAL',
      }),
    ]);
    const tension = asStructuralTension(spont, mastery, 'imprévu si maîtrise des paramètres clés');
    expect(tension.signals).toHaveLength(2);
    expect(tension.constructs).toEqual(['APPETENCE_SPONTANEITY', 'IMPORTANCE_MASTERY']);
    expect(tension.signals[0]).not.toEqual(tension.signals[1]);
  });
});

describe('Test 17 — BEHAVIOR jamais globalisé ; deux contextes ≠ contradiction (§12.5/§20.6)', () => {
  function behaviorEv(id: string, ctx: string, pattern: string): BehaviorEvidence {
    return {
      ...base,
      evidence_id: id,
      source_id: id,
      target_family: 'BEHAVIOR',
      behaviorContext: ctx,
      pattern,
      target_construct: `${ctx}:${pattern}`,
      strength: 'strong',
      context: 'GLOBAL',
    };
  }
  it('globalStatus toujours LOCAL_ONLY et contextes distincts = signaux distincts', () => {
    const signals = consolidateBehavior([
      behaviorEv('a', 'stress_response', 'withdraw'),
      behaviorEv('b', 'conflict_response', 'use_humor_to_defuse'),
    ]);
    expect(signals).toHaveLength(2);
    for (const s of signals) expect(s.globalStatus).toBe('LOCAL_ONLY');
  });
});

describe('Test 18 — AFFECTION : vecteurs receive/give séparés + asymétrie (R5/§20.5)', () => {
  function affEv(
    id: string,
    direction: 'receive' | 'give',
    modality: Parameters<typeof affectionCode>[1],
  ): AffectionEvidence {
    return {
      ...base,
      evidence_id: id,
      source_id: id,
      target_family: 'AFFECTION_LANGUAGE',
      direction,
      modality,
      target_construct: affectionCode(direction, modality),
      strength: 'strong',
      context: 'attention_received',
    };
  }
  it('give n’influence jamais receive', () => {
    const set = consolidateAffection([
      affEv('r', 'receive', 'WORDS'),
      affEv('g', 'give', 'SERVICES'),
    ]);
    expect(set.receive.WORDS.score).not.toBe('unknown');
    expect(set.give.WORDS.score).toBe('unknown'); // aucune evidence give/WORDS
    expect(set.receive.SERVICES.score).toBe('unknown'); // aucune evidence receive/SERVICES
    expect(set.give.SERVICES.score).not.toBe('unknown');
  });
  it('l’asymétrie receive/give est décrite comme information, pas contradiction', () => {
    const set = consolidateAffection([
      affEv('r', 'receive', 'WORDS'),
      affEv('g', 'give', 'SERVICES'),
    ]);
    const asym = describeAffectionAsymmetry(set);
    expect(asym).not.toBeNull();
    expect(asym?.note).toContain('pas une contradiction');
  });
});

describe('Correction utilisateur révise une inférence incompatible (R22/§21)', () => {
  it('une correction contraire affaiblit et marque l’inférence antérieure', () => {
    const prior = consolidateProfileConstruct('DRV_SURPRISE' as never, []); // signal de base
    const highPrior = { ...prior, score: 'high' as const, confidence: 'high' as const, direction: 'positive' as const };
    const correction: Evidence = createProfileEvidence({
      ...base,
      evidence_id: 'corr',
      source_id: 'user',
      source_type: 'user_correction',
      target_construct: 'APPETENCE_SPONTANEITY',
      value: -1,
      context: 'GLOBAL',
      contraryMapping: true,
    });
    const revised = reviseWithCorrection(highPrior, correction);
    expect(revised.confidence).toBe('low');
    expect(revised.score).toBe('low');
    expect(revised.contradiction).toBe(true);
  });
});
