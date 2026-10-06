// Lot B bloc 1 — couche d'écriture : mapping pur + consolidation à la demande.

import { describe, expect, it } from 'vitest';
import {
  asContactId,
  asSubjectId,
  asUserId,
  createProfileEvidence,
  createSourceRecord,
  JOURNAL_VERSION_STAMP,
  type GuardrailEvidence,
  type InterestEvidence,
  type KnowledgeScope,
  type NeedEvidence,
} from '../../knowledge';
import { evidenceToRow, sourceToRow } from '../rows';
import { consolidateJournal } from '../consolidate-journal';
import { persistKnowledge, PersistError, type WriteClient } from '../persist';

const scope: KnowledgeScope = { contactId: asContactId('c1'), ownerId: asUserId('u1') };
const base = {
  ...scope,
  source_id: 'src1',
  raw_information: 'verbatim brut',
  confidence: 'high' as const,
  context: 'GLOBAL',
  timestamp: '2026-10-06T00:00:00Z',
  stability: 'contextual' as const,
  evidence_role: 'primary' as const,
  source_type: 'onboarding_closed' as const,
  version: JOURNAL_VERSION_STAMP,
};

describe('sourceToRow — verbatim, identité, assertion dérivée', () => {
  it('conserve le verbatim et dérive assertion_status (jamais null)', () => {
    const src = createSourceRecord({
      ...scope,
      id: 'src1',
      sourceType: 'onboarding_open',
      questionText: 'Question exacte ?',
      rawText: 'A'.repeat(300) + ' réponse non tronquée',
      timestamp: base.timestamp,
    });
    const row = sourceToRow(src);
    expect(row.id).toBe('src1');
    expect(row.contact_id).toBe('c1');
    expect(row.user_id).toBe('u1');
    expect(row.raw_text).toBe('A'.repeat(300) + ' réponse non tronquée'); // verbatim
    expect(row.question_text).toBe('Question exacte ?');
    expect(row.assertion_status).toBe('declared'); // dérivé
    expect(row.assertion_status).not.toBeNull();
    expect(row.ts).toBe(base.timestamp);
  });
});

describe('evidenceToRow — chaque famille ne remplit QUE ses colonnes (miroir des CHECK)', () => {
  it('PROFILE : value posée, strength null, aucune colonne étrangère', () => {
    const e = createProfileEvidence({ ...base, evidence_id: 'e', target_construct: 'PROFILE_OPENNESS', value: 2 });
    const r = evidenceToRow(e);
    expect(r.value).toBe(2);
    expect(r.strength).toBeNull();
    expect(r.severity).toBeNull();
    expect(r.subject_id).toBeNull();
    expect(r.relation).toBeNull();
    // 10 dimensions d'agrégation présentes
    expect([r.contact_id, r.user_id, r.target_family, r.target_construct, r.context, r.source_id, r.assertion_status, r.ontology_version].every(Boolean)).toBe(true);
  });
  it('value XOR strength : NEED a strength, pas value', () => {
    const e: NeedEvidence = { ...base, evidence_id: 'n', target_family: 'NEED', target_construct: 'NEED_SUPPORT', strength: 'strong', context: 'distress' };
    const r = evidenceToRow(e);
    expect(r.strength).toBe('strong');
    expect(r.value).toBeNull();
  });
  it('GUARDRAIL : severity + guardrail_scope, value null', () => {
    const e: GuardrailEvidence = { ...base, evidence_id: 'g', target_family: 'GUARDRAIL', target_construct: 'GRD_PUBLIC_EXPOSURE', severity: 'HARD', guardrailScope: 'selection', strength: 'strong', context: 'surprise' };
    const r = evidenceToRow(e);
    expect(r.severity).toBe('HARD');
    expect(r.guardrail_scope).toBe('selection');
    expect(r.context).toBe('surprise');
    expect(r.value).toBeNull();
  });
  it('INTEREST : subject_id + label ; relationship null quand absent (jamais inventé)', () => {
    const e: InterestEvidence = { ...base, evidence_id: 'i', target_family: 'INTEREST', subject: asSubjectId('vin'), subjectLabel: 'Vin', target_construct: asSubjectId('vin'), strength: 'strong', context: 'leisure' };
    const r = evidenceToRow(e);
    expect(r.subject_id).toBe('vin');
    expect(r.subject_label).toBe('Vin');
    expect(r.relationship).toBeNull();
    expect(r.value).toBeNull();
  });
});

describe('persistKnowledge — source AVANT evidences, source_id identique', () => {
  it('écrit la source d’abord, puis les evidences', async () => {
    const calls: string[] = [];
    const client: WriteClient = {
      from: (t) => ({ insert: async () => { calls.push(t); return { error: null }; } }),
    };
    const src = createSourceRecord({ ...scope, id: 'src1', sourceType: 'onboarding_closed', questionText: 'q', answerText: 'a', timestamp: base.timestamp });
    const e = createProfileEvidence({ ...base, evidence_id: 'e', target_construct: 'PROFILE_OPENNESS', value: 1 });
    await persistKnowledge(client, { source: src, evidences: [e] });
    expect(calls).toEqual(['knowledge_sources', 'knowledge_evidences']); // ordre garanti
  });
  it('refuse une evidence dont le source_id diffère de la source (jamais orpheline)', async () => {
    const client: WriteClient = { from: () => ({ insert: async () => ({ error: null }) }) };
    const src = createSourceRecord({ ...scope, id: 'src1', sourceType: 'onboarding_closed', questionText: 'q', timestamp: base.timestamp });
    const bad = createProfileEvidence({ ...base, source_id: 'AUTRE', evidence_id: 'e', target_construct: 'PROFILE_OPENNESS', value: 1 });
    await expect(persistKnowledge(client, { source: src, evidences: [bad] })).rejects.toBeInstanceOf(PersistError);
  });
});

describe('consolidateJournal — à la demande, déterministe, exposée (appelée nulle part)', () => {
  const need: NeedEvidence = { ...base, evidence_id: 'n', target_family: 'NEED', target_construct: 'NEED_SUPPORT', strength: 'strong', context: 'distress' };
  const prof = createProfileEvidence({ ...base, evidence_id: 'p', target_construct: 'PROFILE_OPENNESS', value: 1 });
  it('consolide un journal partiel et renvoie signaux + vecteurs affectifs', () => {
    const { signals, affection } = consolidateJournal(scope, [need, prof]);
    expect(signals.some((s) => s.family === 'NEED')).toBe(true);
    expect(signals.some((s) => s.family === 'PROFILE')).toBe(true);
    expect(affection.receive).toBeDefined();
    expect(affection.give).toBeDefined();
  });
  it('indépendante de l’ordre des evidences', () => {
    const a = consolidateJournal(scope, [need, prof]).signals.map((s) => s.family).sort();
    const b = consolidateJournal(scope, [prof, need]).signals.map((s) => s.family).sort();
    expect(a).toEqual(b);
  });
});
