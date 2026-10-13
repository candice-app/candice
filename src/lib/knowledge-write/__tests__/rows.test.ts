// Lot B bloc 1 — couche d'écriture : mapping pur + consolidation à la demande.

import { describe, expect, it } from 'vitest';
import {
  asContactId,
  contactAbout,
  asSubjectId,
  asUserId,
  createFact,
  createOpenKnowledge,
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

const scope: KnowledgeScope = { about: contactAbout(asContactId('c1')), ownerId: asUserId('u1') };
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
  assertionBasis: 'self_report' as const,
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
    expect(row.about_kind).toBe('contact');
    expect(row.about_id).toBe('c1');
    expect(row.user_id).toBe('u1');
    expect(row.raw_text).toBe('A'.repeat(300) + ' réponse non tronquée'); // verbatim
    expect(row.question_text).toBe('Question exacte ?');
    expect(row.assertion_status).toBe('explicit'); // dérivé (mapping direct)
    expect(row.assertion_status).not.toBeNull();
    expect(row.ts).toBe(base.timestamp);
  });
});

describe('evidenceToRow — chaque famille ne remplit QUE ses colonnes (miroir des CHECK)', () => {
  it('PROFILE : value posée, strength null, aucune colonne étrangère', () => {
    const e = createProfileEvidence({ ...base, evidence_id: 'e', target_construct: 'PROFILE_OPENNESS', value: 2 });
    const r = evidenceToRow(e, scope.about);
    expect(r.value).toBe(2);
    expect(r.assertion_basis).toBe('self_report'); // §2 : dérivé à la production, self partout
    expect(r.strength).toBeNull();
    expect(r.severity).toBeNull();
    expect(r.subject_id).toBeNull();
    expect(r.relation).toBeNull();
    // 10 dimensions d'agrégation présentes
    expect([r.about_kind, r.about_id, r.user_id, r.target_family, r.target_construct, r.context, r.source_id, r.assertion_status, r.ontology_version].every(Boolean)).toBe(true);
  });
  it('value XOR strength : NEED a strength, pas value', () => {
    const e: NeedEvidence = { ...base, evidence_id: 'n', target_family: 'NEED', target_construct: 'NEED_SUPPORT', strength: 'strong', context: 'distress' };
    const r = evidenceToRow(e, scope.about);
    expect(r.strength).toBe('strong');
    expect(r.value).toBeNull();
  });
  it('GUARDRAIL : severity + guardrail_scope, value null', () => {
    const e: GuardrailEvidence = { ...base, evidence_id: 'g', target_family: 'GUARDRAIL', target_construct: 'GRD_PUBLIC_EXPOSURE', severity: 'HARD', guardrailScope: 'selection', strength: 'strong', context: 'surprise' };
    const r = evidenceToRow(e, scope.about);
    expect(r.severity).toBe('HARD');
    expect(r.guardrail_scope).toBe('selection');
    expect(r.context).toBe('surprise');
    expect(r.value).toBeNull();
  });
  it('INTEREST : subject_id + label ; relationship null quand absent (jamais inventé)', () => {
    const e: InterestEvidence = { ...base, evidence_id: 'i', target_family: 'INTEREST', subject: asSubjectId('vin'), subjectLabel: 'Vin', target_construct: asSubjectId('vin'), strength: 'strong', context: 'leisure' };
    const r = evidenceToRow(e, scope.about);
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

// L'écrivain devient l'AUTORITÉ (double-écriture, décision du 13 oct : journal = vérité, colonnes
// plates = projection). Il doit être béton : FACT + OpenKnowledge écrits, about DÉRIVÉ de la source
// (un about fille divergent est écrasé), erreur propagée par table, intensity absente → NULL (mig 87).
describe('persistKnowledge — autorité : FACT/OpenKnowledge, about indivergeable, erreurs', () => {
  function recording(failOn?: string) {
    const calls: Array<{ table: string; rows: unknown }> = [];
    const client: WriteClient = {
      from: (t) => ({ insert: async (rows) => { calls.push({ table: t, rows }); return { error: t === failOn ? { message: 'boom' } : null }; } }),
    };
    return { client, calls };
  }
  const src = createSourceRecord({ ...scope, id: 'src1', sourceType: 'reported_by_relative', questionText: 'q', answerText: 'a', timestamp: base.timestamp });
  // about fille DIVERGENT (c2) : la persistance doit le remplacer par celui de la source (c1).
  const divergent = contactAbout(asContactId('c2'));
  const ok = createOpenKnowledge({ about: divergent, ownerId: asUserId('u1'), open_knowledge_id: 'ok1', type: 'support_modality', subject: asSubjectId('ecoute'), subjectLabel: 'être écouté', relation: 'appears_to_help', context: 'distress', source: 'src1', timestamp: base.timestamp, confidence: 'high', assertionStatus: 'explicit' });
  const fact = createFact({ about: divergent, ownerId: asUserId('u1'), fact_id: 'f1', fact_type: 'habit', value: 'plutôt à l’heure', source: 'src1', timestamp: base.timestamp, confidence: 'high', user_confirmed: false });

  it('écrit FACT puis OpenKnowledge, et chaque about = celui de la SOURCE (fille divergente écrasée)', async () => {
    const { client, calls } = recording();
    await persistKnowledge(client, { source: src, facts: [fact], openKnowledge: [ok] });
    expect(calls.map((c) => c.table)).toEqual(['knowledge_sources', 'knowledge_facts', 'knowledge_open_knowledge']);
    const factRow = (calls.find((c) => c.table === 'knowledge_facts')!.rows as Array<{ about_id: string }>)[0];
    const okRow = (calls.find((c) => c.table === 'knowledge_open_knowledge')!.rows as Array<{ about_id: string; intensity: string | null }>)[0];
    expect(factRow.about_id).toBe('c1'); // source, pas c2
    expect(okRow.about_id).toBe('c1');
    expect(okRow.intensity).toBeNull(); // I7 : non renseignée → NULL, jamais 'weak' (migration 87)
  });

  it('une erreur d’insert est propagée en PersistError nommant la table', async () => {
    const { client } = recording('knowledge_open_knowledge');
    await expect(persistKnowledge(client, { source: src, openKnowledge: [ok] }))
      .rejects.toThrow(/knowledge_open_knowledge/);
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
