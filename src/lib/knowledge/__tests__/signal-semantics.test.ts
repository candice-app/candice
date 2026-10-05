// Lot A bis — le signal conserve la sémantique de sa famille (union discriminée).

import { describe, expect, it } from 'vitest';
import { createProfileEvidence } from '../evidence';
import type {
  EntityEvidence,
  GuardrailEvidence,
  InterestEvidence,
  PreferenceEvidence,
} from '../evidence';
import {
  consolidateEntities,
  consolidateGuardrails,
  consolidateInterests,
  consolidatePreferences,
  consolidateProfileConstruct,
} from '../consolidate';
import { asContactId, asEntityId, asSubjectId, asUserId, type KnowledgeScope } from '../identity';
import { signalKey, type Signal } from '../signal';
import { JOURNAL_VERSION_STAMP } from '../version';
import type { SourceType } from '../sources';

const scope: KnowledgeScope = { contactId: asContactId('c1'), ownerId: asUserId('u1') };
// base pour les FABRIQUES (createProfileEvidence injecte version → ne pas le passer).
const base = {
  ...scope,
  raw_information: 'v',
  confidence: 'high' as const,
  timestamp: '2026-10-02T00:00:00Z',
  stability: 'contextual' as const,
  evidence_role: 'primary' as const,
  source_type: 'onboarding_closed' as const,
};
// base pour les LITTÉRAUX d'evidence (doivent porter version eux-mêmes).
const litBase = { ...base, version: JOURNAL_VERSION_STAMP };

function interestEv(id: string, subject: string, relationship: InterestEvidence['relationship'], sourceType: SourceType): InterestEvidence {
  const subjectId = asSubjectId(subject);
  return { ...litBase, source_type: sourceType, evidence_id: id, source_id: id, target_family: 'INTEREST', subject: subjectId, subjectLabel: subject, relationship, target_construct: subjectId, strength: 'strong', context: 'leisure' };
}
function entityEv(id: string, entity: string, relation: EntityEvidence['relation'], ts: string): EntityEvidence {
  const entityId = asEntityId(entity);
  return { ...litBase, timestamp: ts, evidence_id: id, source_id: id, target_family: 'ENTITY', entity_id: entityId, entityLabel: entity, entityType: 'ENTITY_FOOD', relation, target_construct: entityId, strength: 'strong', context: 'food' };
}
function guardrailEv(id: string, code: GuardrailEvidence['target_construct'], severity: GuardrailEvidence['severity'], scopeField: GuardrailEvidence['guardrailScope']): GuardrailEvidence {
  return { ...litBase, evidence_id: id, source_id: id, target_family: 'GUARDRAIL', target_construct: code, severity, guardrailScope: scopeField, strength: 'strong', context: 'GLOBAL' };
}
function prefEv(id: string, path: PreferenceEvidence['target_construct'], value: string): PreferenceEvidence {
  return { ...litBase, evidence_id: id, source_id: id, target_family: 'PREFERENCE', target_construct: path, preferenceValue: value, strength: 'strong', context: 'GLOBAL' };
}

describe('8 — LE TEST QUI JUSTIFIE LE LOT : même concept, formulations différentes, 2 sources → 1 signal', () => {
  it('deux InterestEvidence sur le même SubjectId (labels différents, source_type différents) → 1 InterestSignal, evidenceCount 2', () => {
    // Avant la correction : deux constructs distincts, deux signaux à 1 evidence (confidence low partout).
    const a = interestEv('e1', 'photographie argentique', 'curious', 'conversation');
    const b = interestEv('e2', 'photographie argentique', 'passion', 'onboarding_closed');
    const signals = consolidateInterests(scope, [a, b]);
    expect(signals).toHaveLength(1);
    expect(signals[0].evidenceCount).toBe(2);
    expect(signals[0].family).toBe('INTEREST');
    expect(signals[0].subjectLabel).toBeTruthy();
  });
});

describe('9 — switch exhaustif imposé par le compilateur', () => {
  // Si un membre de l'union Signal était retiré, `_never: never = s` casserait le build.
  function describeFamily(s: Signal): string {
    switch (s.family) {
      case 'PROFILE':
        return 'position' in s ? 'social_energy' : 'profile';
      case 'INTEREST':
        return s.subject;
      case 'ENTITY':
        return s.entity;
      case 'PREFERENCE':
        return s.path;
      case 'BEHAVIOR':
        return s.pattern;
      case 'GUARDRAIL':
        return s.code;
      case 'AFFECTION_LANGUAGE':
        return s.modality;
      case 'NEED':
      case 'DRIVER':
      case 'CONTEXT':
        return s.construct;
      default: {
        const _never: never = s;
        return _never;
      }
    }
  }
  it('couvre chaque famille', () => {
    const s = consolidateProfileConstruct(scope, 'PROFILE_OPENNESS', []);
    expect(describeFamily(s)).toBe('profile');
  });
});

describe('10 — EntitySignal distingue LOVE de AVOID sans ouvrir une evidence', () => {
  it('relation courante = evidence la plus récente ; relationHistory conserve tout (point d’arrêt 3)', () => {
    const [love] = consolidateEntities(scope, [entityEv('e1', 'coriandre', 'LOVE', '2026-01-01T00:00:00Z')]);
    const [avoid] = consolidateEntities(scope, [entityEv('e2', 'coriandre', 'AVOID', '2026-01-01T00:00:00Z')]);
    expect(love.relation).toBe('LOVE');
    expect(avoid.relation).toBe('AVOID');
    // deux relations sur la même entité : la plus récente est courante, l'historique garde les deux
    const [evo] = consolidateEntities(scope, [
      entityEv('e3', 'coriandre', 'LOVE', '2026-01-01T00:00:00Z'),
      entityEv('e4', 'coriandre', 'AVOID', '2028-01-01T00:00:00Z'),
    ]);
    expect(evo.relation).toBe('AVOID'); // la plus récente
    expect(evo.relationHistory).toHaveLength(2);
    expect(evo.contradiction).toBeUndefined(); // aucune contradiction calculée sur ENTITY (point d'arrêt 3)
  });
});

describe('11 — GuardrailSignal : severity + scope ; HARD parmi des SOFT → HARD (R19)', () => {
  it('la sévérité consolidée est la plus contraignante, jamais une moyenne', () => {
    const [g] = consolidateGuardrails(scope, [
      guardrailEv('a', 'GRD_NOISE', 'SOFT', 'selection'),
      guardrailEv('b', 'GRD_NOISE', 'SOFT', 'selection'),
      guardrailEv('c', 'GRD_NOISE', 'HARD', 'execution'),
    ]);
    expect(g.severity).toBe('HARD');
    expect(g.guardrailScope).toBeTruthy();
  });
});

describe('12 — PreferenceSignal porte sa valeur ; InterestSignal porte son relationship', () => {
  it('value et relationship sont lisibles sur le signal', () => {
    const [p] = consolidatePreferences(scope, [prefEv('p1', 'PREFERENCE.food.spice', 'doux')]);
    expect(p.value).toBe('doux');
    const [i] = consolidateInterests(scope, [interestEv('i1', 'cuisine thaï', 'expert', 'conversation')]);
    expect(i.relationship).toBe('expert');
  });
});

describe('13 — signalKey déterministe et stable sur deux consolidations du même journal', () => {
  it('même journal → même clé', () => {
    const journal = [interestEv('i1', 'cuisine thaï', 'passion', 'conversation')];
    const k1 = signalKey(scope.contactId, consolidateInterests(scope, journal)[0]);
    const k2 = signalKey(scope.contactId, consolidateInterests(scope, journal)[0]);
    expect(k1).toBe(k2);
    expect(k1).toContain('INTEREST');
    expect(k1.startsWith(`${scope.contactId}::`)).toBe(true);
  });
});

describe('14 — les invariants du lot A tiennent tous', () => {
  it('value 0 refusée ; négatif sans contraryMapping refusé', () => {
    expect(() =>
      createProfileEvidence({ ...base, context: 'GLOBAL', evidence_id: 'z', source_id: 'z', target_construct: 'PROFILE_OPENNESS', value: 0 as unknown as 1 }),
    ).toThrow();
    expect(() =>
      createProfileEvidence({ ...base, context: 'GLOBAL', evidence_id: 'z', source_id: 'z', target_construct: 'APPETENCE_OBJECT', value: -1 }),
    ).toThrow();
  });
  it('receive / give jamais fusionnés : un EntitySignal AVOID ne devient pas une evidence contraire (point d’arrêt 3)', () => {
    const [g] = consolidateEntities(scope, [entityEv('e', 'durian', 'AVOID', '2026-01-01T00:00:00Z')]);
    // AVOID est une relation, pas un contraire : le score n'est pas 'low' par polarité.
    expect(g.score).not.toBe('low');
  });
});
