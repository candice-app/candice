// Lot A bis — traçabilité double sens, agrégation, historique, structured_open_knowledge.

import { describe, expect, it } from 'vitest';
import { createProfileEvidence } from '../evidence';
import type { InterestEvidence } from '../evidence';
import {
  attachEvidenceToSource,
  attachFactToSource,
  attachOpenKnowledgeToSource,
  createSourceRecord,
} from '../sources';
import { attachEvidenceToFact, createFact } from '../fact';
import { createOpenKnowledge } from '../open-knowledge';
import { createExtractionRecord } from '../extraction';
import { consolidateInterests, consolidateProfileConstruct } from '../consolidate';
import { assessOntologyGap } from '../gaps';
import { asContactId, contactAbout, asEntityId, asSubjectId, asUserId, type KnowledgeScope } from '../identity';
import type { SignalSnapshot } from '../snapshot';
import { signalKey } from '../signal';
import { JOURNAL_VERSION_STAMP } from '../version';
import type { SourceType } from '../sources';

const scope: KnowledgeScope = { about: contactAbout(asContactId('c1')), ownerId: asUserId('u1') };
const base = {
  ...scope,
  raw_information: 'v',
  confidence: 'high' as const,
  timestamp: '2026-10-02T00:00:00Z',
  stability: 'contextual' as const,
  evidence_role: 'primary' as const,
  source_type: 'onboarding_closed' as const,
};
const litBase = { ...base, version: JOURNAL_VERSION_STAMP };
function interestEv(id: string, source_id: string, sourceType: SourceType, subject: string): InterestEvidence {
  const subjectId = asSubjectId(subject);
  return { ...litBase, evidence_id: id, source_id, source_type: sourceType, target_family: 'INTEREST', subject: subjectId, subjectLabel: subject, relationship: 'passion', target_construct: subjectId, strength: 'strong', context: 'leisure' };
}

describe('19 — depuis une source, on retrouve ses evidences, ses FACT et son OpenKnowledge', () => {
  it('les trois liens inverses sont alimentés (HSG §47)', () => {
    let src = createSourceRecord({ ...scope, id: 'src1', sourceType: 'onboarding_open', questionText: 'q', rawText: 'r', timestamp: base.timestamp });
    const e = interestEv('e1', 'src1', 'onboarding_open', 'photographie argentique');
    src = attachEvidenceToSource(src, e);
    src = attachFactToSource(src, 'f1');
    src = attachOpenKnowledgeToSource(src, 'ok1');
    expect(src.producedEvidenceIds).toContain('e1');
    expect(src.producedFactIds).toContain('f1');
    expect(src.producedOpenKnowledgeIds).toContain('ok1');
    // idempotent (aucun doublon)
    expect(attachEvidenceToSource(src, e).producedEvidenceIds).toEqual(['e1']);
  });
  it('depuis un FACT, le lien inverse vers l’evidence est alimenté, verbatim intact', () => {
    const f0 = createFact({ ...scope, fact_id: 'f1', fact_type: 'bio', value: 'Tokyo 2014-2018', source: 'src1', timestamp: base.timestamp, confidence: 'high' });
    const f1 = attachEvidenceToFact(f0, { evidence_id: 'e1' });
    expect(f1.evidence_ids).toContain('e1');
    expect(f1.value).toBe('Tokyo 2014-2018'); // R16 : verbatim intact
  });
});

describe('20 — depuis un signal consolidé, on retrouve toutes les sources qui le soutiennent', () => {
  it('signal.evidenceIds → evidences → source_id', () => {
    const journal = [
      interestEv('e1', 's1', 'conversation', 'cuisine thaï'),
      interestEv('e2', 's2', 'onboarding_closed', 'cuisine thaï'),
    ];
    const [sig] = consolidateInterests(scope, journal);
    const supportingSources = new Set(
      sig.evidenceIds.map((eid) => journal.find((e) => e.evidence_id === eid)!.source_id),
    );
    expect(supportingSources).toEqual(new Set(['s1', 's2']));
  });
});

describe('21 — chaque structure persistée porte ses dimensions d’agrégation (section 6.5)', () => {
  it('Evidence : person, famille, concept, valeur, contexte, source, timestamp, confidence, explicite/inféré, version', () => {
    const e = interestEv('e1', 's1', 'conversation', 'photo');
    for (const k of ['about', 'ownerId', 'target_family', 'target_construct', 'context', 'source_id', 'timestamp', 'confidence', 'source_type', 'version'] as const) {
      expect(e[k]).toBeDefined();
    }
  });
  it('Fact : person, type, valeur, contexte?, source, timestamp, confidence, version, visibility, lien evidences', () => {
    const f = createFact({ ...scope, fact_id: 'f', fact_type: 'bio', value: 'x', source: 's', timestamp: base.timestamp, confidence: 'high' });
    for (const k of ['about', 'ownerId', 'fact_type', 'value', 'source', 'timestamp', 'confidence', 'version', 'visibility', 'evidence_ids'] as const) {
      expect(f[k]).toBeDefined();
    }
  });
  it('OpenKnowledge : person, type, concept, relation, intensité, contexte, source, timestamp, confidence, explicite/inféré, version, visibility, evidences', () => {
    const ok = createOpenKnowledge({ ...scope, open_knowledge_id: 'ok', type: 'INTEREST', subject: asSubjectId('photo argentique'), subjectLabel: 'photo argentique', relation: 'passion', intensity: 'strong', context: 'leisure', source: 's', timestamp: base.timestamp, confidence: 'high', assertionStatus: 'explicit' });
    for (const k of ['about', 'ownerId', 'type', 'subject', 'subjectLabel', 'relation', 'intensity', 'context', 'source', 'timestamp', 'confidence', 'assertionStatus', 'version', 'visibility', 'evidence_ids'] as const) {
      expect(ok[k]).toBeDefined();
    }
  });
  it('Signal : person, famille, identité du construct, contextes, evidences, timestamp, confidence, version, visibility', () => {
    const s = consolidateInterests(scope, [interestEv('e1', 's1', 'conversation', 'photo')])[0];
    for (const k of ['about', 'ownerId', 'family', 'contexts', 'evidenceIds', 'confidence', 'version', 'visibility'] as const) {
      expect(s[k]).toBeDefined();
    }
    expect(signalKey(scope.about, s)).toContain('INTEREST');
  });
  it('ExtractionRecord : person, source, modèle, version, productions', () => {
    const x = createExtractionRecord({ ...scope, extraction_id: 'x', source_id: 's', timestamp: base.timestamp, extractor: { model: 'claude', promptVersion: 'v1' }, producedEntityIds: [asEntityId('e')] });
    for (const k of ['about', 'ownerId', 'source_id', 'extractor', 'version', 'producedEvidenceIds', 'producedOpenKnowledgeIds', 'producedEntityIds'] as const) {
      expect(x[k]).toBeDefined();
    }
  });
});

describe('22 — deux SignalSnapshot distinguent les trois causes de changement (section 6.4)', () => {
  const sig = consolidateProfileConstruct(scope, 'PROFILE_OPENNESS', [
    createProfileEvidence({ ...base, evidence_id: 'e1', source_id: 's1', target_construct: 'PROFILE_OPENNESS', value: 1, context: 'GLOBAL' }),
  ]);
  function snap(takenAt: string, signal: typeof sig): SignalSnapshot {
    return { signalKey: signalKey(scope.about, signal), takenAt, signal };
  }
  it('le modèle a changé : version du signal différente', () => {
    const a = snap('2026-01-01T00:00:00Z', sig);
    const b = snap('2027-01-01T00:00:00Z', { ...sig, version: { ...sig.version, consolidation_version: '2.0.0' } });
    expect(a.signal.version).not.toEqual(b.signal.version);
    expect(a.signalKey).toBe(b.signalKey); // même construct, même personne
  });
  it('une nouvelle evidence a augmenté la confiance : evidenceCount crû + confidence montée', () => {
    const richer = consolidateProfileConstruct(scope, 'PROFILE_OPENNESS', [
      createProfileEvidence({ ...base, evidence_id: 'e1', source_id: 's1', source_type: 'conversation', target_construct: 'PROFILE_OPENNESS', value: 1, context: 'a' }),
      createProfileEvidence({ ...base, evidence_id: 'e2', source_id: 's2', source_type: 'observed_behavior', target_construct: 'PROFILE_OPENNESS', value: 1, context: 'b' }),
      createProfileEvidence({ ...base, evidence_id: 'e3', source_id: 's3', source_type: 'reported_by_relative', target_construct: 'PROFILE_OPENNESS', value: 1, context: 'c' }),
    ]);
    const a = snap('2026-01-01T00:00:00Z', sig);
    const b = snap('2027-01-01T00:00:00Z', richer);
    expect(b.signal.evidenceCount).toBeGreaterThan(a.signal.evidenceCount);
    const rank = { none: 0, low: 1, medium: 2, high: 3 } as const;
    expect(rank[b.signal.confidence]).toBeGreaterThan(rank[a.signal.confidence]);
  });
  it('la personne a changé : mêmes evidenceIds enrichis + une evidence evolving', () => {
    const evolving = consolidateProfileConstruct(scope, 'PROFILE_OPENNESS', [
      createProfileEvidence({ ...base, evidence_id: 'e1', source_id: 's1', target_construct: 'PROFILE_OPENNESS', value: 1, context: 'GLOBAL', stability: 'evolving' }),
    ]);
    expect(evolving.stability).toBe('evolving'); // signal d'un changement de la personne
  });
});

describe('23 — structured_open_knowledge est une voie réelle (OpenKnowledge existe)', () => {
  it('assessOntologyGap répond « représentable par structured_open_knowledge » sur un cas qui l’est', () => {
    const res = assessOntologyGap({
      phenomenon: 'passion pour la photographie argentique',
      coveredBy: ['structured_open_knowledge'],
      criteria: { recurrent: false, operationallyImportant: false, needsSpecificLogic: false, notRepresentable: false },
    });
    expect(res.isGap).toBe(false);
    if (!res.isGap) expect(res.representableBy).toContain('structured_open_knowledge');
    // et la voie existe désormais : on peut fabriquer l'OpenKnowledge correspondant.
    const ok = createOpenKnowledge({ ...scope, open_knowledge_id: 'ok', type: 'INTEREST', subject: asSubjectId('photographie argentique'), subjectLabel: 'photographie argentique', relation: 'passion', intensity: 'strong', context: 'leisure', source: 's', timestamp: base.timestamp, confidence: 'high', assertionStatus: 'explicit' });
    expect(ok.subject).toBeTruthy();
  });
});
