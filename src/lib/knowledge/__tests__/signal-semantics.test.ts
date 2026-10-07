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
  hasActiveAvoidance,
} from '../consolidate';
import { createFact } from '../fact';
import { asContactId, contactAbout, asEntityId, asSubjectId, asUserId, type KnowledgeScope } from '../identity';
import { signalKey, type Signal } from '../signal';
import { JOURNAL_VERSION_STAMP } from '../version';
import type { SourceType } from '../sources';

const scope: KnowledgeScope = { about: contactAbout(asContactId('c1')), ownerId: asUserId('u1') };
// base pour les FABRIQUES (createProfileEvidence injecte version → ne pas le passer).
const base = {
  ...scope,
  raw_information: 'v',
  confidence: 'high' as const,
  timestamp: '2026-10-02T00:00:00Z',
  stability: 'contextual' as const,
  evidence_role: 'primary' as const,
  source_type: 'onboarding_closed' as const,
  assertionBasis: 'self_report' as const,
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
  it('relation courante = valence affective dominante ; relationHistory conserve tout', () => {
    const [love] = consolidateEntities(scope, [entityEv('e1', 'coriandre', 'LOVE', '2026-01-01T00:00:00Z')]);
    const [avoid] = consolidateEntities(scope, [entityEv('e2', 'durian', 'AVOID', '2026-01-01T00:00:00Z')]);
    expect(love.relation).toBe('LOVE');
    expect(avoid.relation).toBe('AVOID'); // pas d'affectif présent → AVOID est la relation courante
  });
});

describe('3.1 — NEUTRAL n’est JAMAIS une contradiction, il est supplanté', () => {
  it('LOVE + NEUTRAL → relation LOVE, aucune contradiction', () => {
    const [s] = consolidateEntities(scope, [
      entityEv('e1', 'café', 'NEUTRAL', '2026-01-01T00:00:00Z'),
      entityEv('e2', 'café', 'LOVE', '2026-06-01T00:00:00Z'),
    ]);
    expect(s.relation).toBe('LOVE');
    expect(s.contradiction).toBeUndefined();
    expect(s.confidence).not.toBe('low'); // NEUTRAL ne force pas la confiance à low
  });
});

describe('3.2 — LOVE+DISLIKE = contradiction ; LOVE+AVOID = tension (jamais contradiction)', () => {
  it('{LOVE} + DISLIKE → contradiction ; par PRUDENCE la valence négative gagne (même si LOVE plus récent)', () => {
    const [s] = consolidateEntities(scope, [
      entityEv('e1', 'coriandre', 'DISLIKE', '2026-01-01T00:00:00Z'),
      entityEv('e2', 'coriandre', 'LOVE', '2026-02-01T00:00:00Z'), // plus récent, mais ne gagne pas
    ]);
    expect(s.contradiction).toBe(true);
    expect(s.confidence).toBe('low');
    expect(s.relation).toBe('DISLIKE'); // prudence : ne pas recommander ce qui pourrait déplaire
    // rien n'est perdu : le LOVE reste dans l'historique, candidate à clarification
    expect(s.relationHistory.some((r) => r.relation === 'LOVE')).toBe(true);
  });
  it('{LOVE} + AVOID → PAS de contradiction ; relation=LOVE ; évitement actif préservé', () => {
    const [s] = consolidateEntities(scope, [
      entityEv('e1', 'chocolat', 'LOVE', '2026-01-01T00:00:00Z'),
      entityEv('e2', 'chocolat', 'AVOID', '2028-01-01T00:00:00Z'),
    ]);
    expect(s.contradiction).toBeUndefined(); // tension structurante, pas contradiction
    expect(s.relation).toBe('LOVE'); // valence affective dominante
    expect(hasActiveAvoidance(s)).toBe(true); // « j'adore mais j'évite » — ne se perd pas
    expect(s.relationHistory).toHaveLength(2);
  });
});

describe('correction 4 — GUARDRAIL scope consolidé = le plus restrictif (selection > execution > context)', () => {
  it('selection l’emporte, jamais remplacé par le plus récent', () => {
    const [g] = consolidateGuardrails(scope, [
      guardrailEv('a', 'GRD_NOISE', 'HARD', 'selection'),
      guardrailEv('b', 'GRD_NOISE', 'HARD', 'execution'), // plus « récent » dans la liste
      guardrailEv('c', 'GRD_NOISE', 'HARD', 'context'),
    ]);
    expect(g.guardrailScope).toBe('selection');
  });
});

describe('arbitrage guardrail — grain (code, context) : la consolidation n’élargit jamais le domaine', () => {
  it('noise@restaurant HARD + noise@concert SOFT → DEUX signaux ; le concert reste SOFT', () => {
    const restaurant = { ...guardrailEv('a', 'GRD_NOISE', 'HARD', 'context'), context: 'restaurant' };
    const concert = { ...guardrailEv('b', 'GRD_NOISE', 'SOFT', 'context'), context: 'concert' };
    const signals = consolidateGuardrails(scope, [restaurant, concert]);
    expect(signals).toHaveLength(2); // pas de fusion
    const byCtx = Object.fromEntries(signals.map((s) => [s.context, s]));
    expect(byCtx['restaurant'].severity).toBe('HARD');
    expect(byCtx['concert'].severity).toBe('SOFT'); // le HARD du restaurant n'a pas contaminé le concert
    // invariant : un GuardrailSignal porte exactement un contexte
    for (const s of signals) expect(s.contexts).toHaveLength(1);
    expect(signalKey(scope.about, byCtx['restaurant'])).not.toBe(signalKey(scope.about, byCtx['concert']));
    expect(signalKey(scope.about, byCtx['restaurant'])).toContain('GRD_NOISE@restaurant');
  });
});

describe('correction 5 — un signal hérite du niveau le plus restrictif de ses FACT soutiens', () => {
  it('un GuardrailSignal soutenu par un FACT internal_only ne reste pas exposable', () => {
    const sensitiveFact = createFact({ ...scope, fact_id: 'fh', fact_type: 'health', value: 'allergie', source: 's', timestamp: base.timestamp, confidence: 'high', sensitivity: { isSensitive: true, category: 'santé' } });
    const gev = { ...guardrailEv('g', 'GRD_NOISE', 'HARD', 'selection'), fact_id: 'fh' };
    const [g] = consolidateGuardrails(scope, [gev], { supportingFacts: [sensitiveFact] });
    expect(g.visibility.derived).toBe('internal_only'); // pas de fuite vers le portrait
    // sans FACT soutien : défaut exposable
    const [g2] = consolidateGuardrails(scope, [guardrailEv('g2', 'GRD_NOISE', 'SOFT', 'context')]);
    expect(g2.visibility.derived).toBe('exposable');
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
    const k1 = signalKey(scope.about, consolidateInterests(scope, journal)[0]);
    const k2 = signalKey(scope.about, consolidateInterests(scope, journal)[0]);
    expect(k1).toBe(k2);
    expect(k1).toContain('INTEREST');
    expect(k1.startsWith(`${scope.about.kind}:${scope.about.id}::`)).toBe(true);
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
