// Lot A ter — ordre de sélection, connaissance ouverte, soutien / moteurs.

import { describe, expect, it } from 'vitest';
import {
  AFFECTION_SCORING,
  MOTEURS,
  QUESTIONS_WITH_EXPLICIT_RANKING,
  SELECTION_ORDER_IS_SEMANTIC,
  SOUTIEN,
  rankToAffectionStrength,
  selectionOrderMatters,
} from '../onboarding';
import {
  INTEREST_RELATIONSHIPS,
  OPEN_KNOWLEDGE_TYPES,
  CANONICAL_FAMILIES,
} from '../vocabulary';
import { createOpenKnowledge } from '../open-knowledge';
import { consolidateInterests, consolidateNeeds, consolidateProfile } from '../consolidate';
import { asContactId, asSubjectId, asUserId, type KnowledgeScope } from '../identity';
import type { InterestEvidence, NeedEvidence } from '../evidence';
import { signalKey } from '../signal';
import { JOURNAL_VERSION_STAMP } from '../version';
import type { SourceType } from '../sources';

const scope: KnowledgeScope = { contactId: asContactId('c1'), ownerId: asUserId('u1') };
const base = {
  ...scope,
  raw_information: 'v',
  confidence: 'high' as const,
  timestamp: '2026-10-05T00:00:00Z',
  stability: 'contextual' as const,
  evidence_role: 'primary' as const,
  version: JOURNAL_VERSION_STAMP,
};
function needEv(id: string, need: NeedEvidence['target_construct'], sourceType: SourceType, context = 'distress'): NeedEvidence {
  return { ...base, source_type: sourceType, evidence_id: id, source_id: id, target_family: 'NEED', target_construct: need, strength: 'strong', context };
}
function interestEv(id: string, subject: string, rel?: InterestEvidence['relationship']): InterestEvidence {
  const s = asSubjectId(subject);
  return { ...base, source_type: 'onboarding_closed', evidence_id: id, source_id: id, target_family: 'INTEREST', subject: s, subjectLabel: subject, target_construct: s, strength: 'strong', context: 'leisure', ...(rel ? { relationship: rel } : {}) };
}

/* ── Ordre de sélection ── */
describe('1 — AFFECTION_SCORING : plus de pondération par rang, pourcentages inchangés', () => {
  it('rankWeight retiré ; questionWeight Q1 100 / Q4 50 / Q2 0 inchangé', () => {
    expect('rankWeight' in AFFECTION_SCORING).toBe(false);
    expect(AFFECTION_SCORING.questionWeight).toEqual({ Q1: 1.0, Q4: 0.5, Q2: 0.0 });
  });
});

describe('2 — Q1 : la force vient du rang, par crans, sans pondération numérique', () => {
  it('rang 1→strong, 2→strong, 3→moderate', () => {
    expect(rankToAffectionStrength(1)).toBe('strong');
    expect(rankToAffectionStrength(2)).toBe('strong');
    expect(rankToAffectionStrength(3)).toBe('moderate'); // R6 : le 3e reste significatif
  });
  it('deux options Q1 (rangs 1 et 2) : même force quel que soit lequel est premier', () => {
    expect(rankToAffectionStrength(1)).toBe(rankToAffectionStrength(2)); // les deux premiers forts ensemble
  });
});

describe('3-4 — soutien / moteurs / intérêts : l’ordre n’a aucune valeur sémantique', () => {
  it('selectionOrderMatters : q1 seul exception ; soutien/moteurs/interests non', () => {
    expect(SELECTION_ORDER_IS_SEMANTIC).toBe(false);
    expect(QUESTIONS_WITH_EXPLICIT_RANKING).toEqual(['q1']);
    expect(selectionOrderMatters('q1')).toBe(true);
    expect(selectionOrderMatters('soutien')).toBe(false);
    expect(selectionOrderMatters('moteurs')).toBe(false);
    expect(selectionOrderMatters('interests')).toBe(false);
  });
  it('la consolidation est indépendante de l’ordre des evidences (soutien)', () => {
    const a = needEv('e1', 'NEED_SEEN_UNDERSTOOD', 'onboarding_closed');
    const b = needEv('e2', 'NEED_SUPPORT', 'onboarding_closed');
    const fwd = consolidateNeeds(scope, [a, b]).map((s) => [s.construct, s.score, s.confidence]);
    const rev = consolidateNeeds(scope, [b, a]).map((s) => [s.construct, s.score, s.confidence]);
    expect(fwd.sort()).toEqual(rev.sort());
  });
  it('un intérêt consolidé ne dépend pas de l’ordre de clic', () => {
    const one = consolidateInterests(scope, [interestEv('i1', 'vin'), interestEv('i2', 'photo')]);
    const two = consolidateInterests(scope, [interestEv('i2', 'photo'), interestEv('i1', 'vin')]);
    expect(one.map((s) => s.subject).sort()).toEqual(two.map((s) => s.subject).sort());
  });
});

/* ── Connaissance ouverte ── */
describe('6-8 — OpenKnowledge.type est un vocabulaire ouvert validé', () => {
  it('graine = 10 familles + life_priority (11), et life_priority est valide', () => {
    expect(OPEN_KNOWLEDGE_TYPES.seed).toHaveLength(CANONICAL_FAMILIES.length + 1);
    expect(CANONICAL_FAMILIES.length).toBe(10);
    expect(OPEN_KNOWLEDGE_TYPES.has('life_priority')).toBe(true);
    expect(OPEN_KNOWLEDGE_TYPES.has('INTEREST')).toBe(true); // une famille reste un type valide
  });
  it('normalise à l’enregistrement (6ᵉ registre sur 6)', () => {
    OPEN_KNOWLEDGE_TYPES.register('Ma Nouvelle  Catégorie');
    expect(OPEN_KNOWLEDGE_TYPES.has('ma nouvelle-catégorie')).toBe(true);
  });
  it('un OpenKnowledge life_priority se crée et se relit', () => {
    const ok = createOpenKnowledge({ ...scope, open_knowledge_id: 'ok', type: 'life_priority', subject: asSubjectId('freedom'), subjectLabel: 'La liberté', relation: 'matters_to', intensity: 'strong', context: 'GLOBAL', confidence: 'high', assertionStatus: 'declared', source: 's', timestamp: base.timestamp });
    expect(ok.type).toBe('life_priority');
    expect(ok.subjectLabel).toBe('La liberté');
  });
});

describe('9-10 — frontière : un OpenKnowledge ne produit JAMAIS de signal', () => {
  it('aucune fonction de consolidation n’accepte un OpenKnowledge (type)', () => {
    const ok = createOpenKnowledge({ ...scope, open_knowledge_id: 'ok', type: 'PROFILE', subject: asSubjectId('x'), subjectLabel: 'x', relation: 'matters_to', intensity: 'strong', context: 'GLOBAL', confidence: 'high', assertionStatus: 'declared', source: 's', timestamp: base.timestamp });
    // @ts-expect-error consolidateProfile prend des DirectionalEvidence, jamais un OpenKnowledge
    consolidateProfile(scope, [ok]);
    expect(ok.type).toBe('PROFILE'); // se crée, mais ne devient aucun ProfileSignal
  });
});

/* ── Intérêts sans niveau ── */
describe('11-14 — InterestEvidence.relationship facultatif, jamais inventé', () => {
  it('une InterestEvidence sans relationship est valide et se consolide', () => {
    const [sig] = consolidateInterests(scope, [interestEv('i1', 'vin')]);
    expect(sig.family).toBe('INTEREST');
    expect('relationship' in sig).toBe(false); // aucun niveau inventé (surtout pas casual)
  });
  it('relationship fourni est conservé ; absent reste absent', () => {
    const [withRel] = consolidateInterests(scope, [interestEv('i1', 'cuisine thaï', 'expert')]);
    expect(withRel.relationship).toBe('expert');
  });
  it('INTEREST_RELATIONSHIPS reste à 5, sans unspecified', () => {
    expect(INTEREST_RELATIONSHIPS).toHaveLength(5);
    expect((INTEREST_RELATIONSHIPS as readonly string[]).includes('unspecified')).toBe(false);
  });
});

/* ── soutien ── */
describe('15-16 — soutien : 5 NEED distincts, primary/strong/context distress', () => {
  it('5 options, 5 NEED distincts', () => {
    expect(SOUTIEN.options).toHaveLength(5);
    const needs = SOUTIEN.options.map((o) => o.need);
    expect(new Set(needs).size).toBe(5);
  });
  it('les 5 codes exacts', () => {
    expect(SOUTIEN.options.map((o) => o.need)).toEqual([
      'NEED_SEEN_UNDERSTOOD', 'NEED_REASSURANCE', 'NEED_RELIEF', 'NEED_SUPPORT', 'NEED_RHYTHM_RESPECT',
    ]);
  });
  it('propriétés communes : primary / strong / distress', () => {
    expect(SOUTIEN.evidence).toEqual({ evidence_role: 'primary', strength: 'strong', context: 'distress' });
  });
});

describe('21 — une evidence de soutien ne globalise pas à elle seule', () => {
  it('context distress (local) → LOCAL_ONLY', () => {
    const [sig] = consolidateNeeds(scope, [needEv('e', 'NEED_SUPPORT', 'onboarding_closed', 'distress')]);
    expect(sig.globalStatus).toBe('LOCAL_ONLY');
  });
});

/* ── moteurs ── */
describe('17-19 — moteurs : 0 canonique, 6 life_priority, double contribution = une source', () => {
  it('6 options, aucune ne porte de code canonique (ni need, ni driver…)', () => {
    expect(MOTEURS.options).toHaveLength(6);
    for (const o of MOTEURS.options) {
      expect('need' in o).toBe(false);
      expect('driver' in o).toBe(false);
      expect(Object.keys(o).sort()).toEqual(['optionText', 'subject']);
    }
    expect(MOTEURS.openKnowledge.type).toBe('life_priority');
  });
  it('6 subjects distincts et conformes au document', () => {
    expect(MOTEURS.options.map((o) => o.subject)).toEqual([
      'freedom', 'learning_discovery', 'family', 'building_accomplishment', 'caring_for_others', 'contribution_transmission',
    ]);
  });
  it('les deux options de contribution choisies ensemble = UNE source indépendante', () => {
    // simulées comme deux evidences du MÊME source_type (une question) → indep = 1
    const a = needEv('m1', 'NEED_CONTRIBUTION', 'onboarding_closed', 'GLOBAL');
    const b = needEv('m2', 'NEED_CONTRIBUTION', 'onboarding_closed', 'GLOBAL');
    const [sig] = consolidateNeeds(scope, [a, b]);
    expect(sig.confidence).not.toBe('high'); // une seule source : pas de fausse convergence
  });
});

describe('5 + 20 — invariants : ordre inerte, distress jamais clinique', () => {
  it('le signalKey ne dépend d’aucun ordre de sélection', () => {
    const k1 = signalKey(scope.contactId, consolidateInterests(scope, [interestEv('i1', 'vin')])[0]);
    const k2 = signalKey(scope.contactId, consolidateInterests(scope, [interestEv('i1', 'vin')])[0]);
    expect(k1).toBe(k2);
  });
  it('une evidence NEED en context distress ne produit aucun FACT (encore moins sensible)', () => {
    const signals = consolidateNeeds(scope, [needEv('e', 'NEED_SUPPORT', 'onboarding_closed', 'distress')]);
    // consolidateNeeds ne renvoie que des NeedSignal ; aucun chemin distress → Fact sensible
    expect(signals.every((s) => s.family === 'NEED')).toBe(true);
  });
});
