// SUPERSESSION (décision 27 oct) — marqueur explicite : une ligne corrigée est REMPLACÉE, exclue de TOUTE
// restitution (préséance, FACTs, et HISTORIQUE — fate b des trois sorts : corrigé = nulle part).
import { describe, expect, it, vi } from 'vitest';
import { supersedeSources, liveSelfSourceIdsForQuestion } from '../../knowledge-write/supersede';
import { readResolvedEvidences } from '../preseance';
import { readSocleFacts, type TagsReadClient } from '../../questionnaire/breath-tags';

// ── Identification des anciennes sources : portée (question stable + même déclarant + même voie) ──
describe('liveSelfSourceIdsForQuestion — portée de la supersession', () => {
  const lookup = (rows: unknown[]) => ({ from: () => ({ select: () => ({ match: async () => ({ data: rows, error: null }) }) }) });

  // vide_jusqu_a_7bis — AUCUN écrivain ne crée de ligne côte-à-côte aujourd'hui (voie sans producteur,
  // sources.ts:48) : ce vert prouve le filtre unitaire, pas une réalité de prod. De plus, cette primitive
  // (liveSelfSourceIdsForQuestion) est DÉPRÉCIÉE et meurt avec son lot. À rejouer/retirer en 7bis.
  it('⚠ CÔTE À CÔTE (cas Julie) — vide_jusqu_a_7bis : une correction du pilote ne supersède JAMAIS la source d\'un tiers', async () => {
    const rows = [
      { id: 'self-verbatim', rapporteur: null, source_type: 'onboarding_open' },      // pilote, texte libre
      { id: 'self-extract',  rapporteur: null, source_type: 'extraction_inferred' },  // pilote, inférence
      { id: 'julie',         rapporteur: 'julie-id', source_type: 'reported_by_relative' }, // Julie SUR le pilote
    ];
    const ids = await liveSelfSourceIdsForQuestion(lookup(rows) as never,
      { ownerId: 'u', aboutKind: 'account', aboutId: 'u', questionCode: 'singularity.adore_faire' });
    expect(ids.sort()).toEqual(['self-extract', 'self-verbatim']); // Julie ABSENTE
    expect(ids).not.toContain('julie');
  });

  it('corrections SUCCESSIVES : toutes les versions self vivantes sont visées (la 2ᵉ supersède l\'originale ET la 1ʳᵉ)', async () => {
    const rows = [
      { id: 'v0', rapporteur: null, source_type: 'onboarding_open' },
      { id: 'v1', rapporteur: null, source_type: 'onboarding_open' }, // 1ʳᵉ correction
      { id: 'e0', rapporteur: null, source_type: 'extraction_inferred' },
    ];
    const ids = await liveSelfSourceIdsForQuestion(lookup(rows) as never,
      { ownerId: 'u', aboutKind: 'account', aboutId: 'u', questionCode: 'singularity.adore_faire' });
    expect(ids.sort()).toEqual(['e0', 'v0', 'v1']);
  });

  it('autre VOIE (conversationnel) : exclu — une correction d\'onboarding ne supersède pas un autre canal', async () => {
    const rows = [
      { id: 'onb', rapporteur: null, source_type: 'onboarding_open' },
      { id: 'conv', rapporteur: null, source_type: 'conversation' }, // même personne, AUTRE voie
    ];
    const ids = await liveSelfSourceIdsForQuestion(lookup(rows) as never,
      { ownerId: 'u', aboutKind: 'account', aboutId: 'u', questionCode: 'singularity.adore_faire' });
    expect(ids).toEqual(['onb']);
  });

  it('DEUX QUESTIONS, DEUX factTypes : corriger l\'une n\'effleure PAS l\'autre (preuve point 1)', async () => {
    // Faux client qui RESPECTE le filtre question_code (comme .match en SQL).
    const db = [
      { id: 'A-verb', rapporteur: null, source_type: 'onboarding_open', question_code: 'singularity.adore_faire' },
      { id: 'A-extr', rapporteur: null, source_type: 'extraction_inferred', question_code: 'singularity.adore_faire' },
      { id: 'B-verb', rapporteur: null, source_type: 'onboarding_open', question_code: 'singularity.evite_deteste' },
    ];
    const matchClient = { from: () => ({ select: () => ({ match: async (q: Record<string, string>) => ({ data: db.filter((r) => r.question_code === q.question_code), error: null }) }) }) };
    const ids = await liveSelfSourceIdsForQuestion(matchClient as never,
      { ownerId: 'u', aboutKind: 'account', aboutId: 'u', questionCode: 'singularity.adore_faire' });
    expect(ids.sort()).toEqual(['A-extr', 'A-verb']); // seulement la question corrigée
    expect(ids).not.toContain('B-verb'); // l'autre question, intacte
  });

  it('clé VIDE → throw (jamais de requête sur null qui apparierait tout)', async () => {
    await expect(liveSelfSourceIdsForQuestion(lookup([]) as never,
      { ownerId: 'u', aboutKind: 'account', aboutId: 'u', questionCode: '' })).rejects.toThrow(/questionCode vide/);
  });
});

// ── Écriture : marque les 3 tables restituables, exclut la nouvelle source, bruyant sur erreur ──
describe('supersedeSources (écriture du marqueur)', () => {
  it('marque evidences + facts + open_knowledge avec superseded_at/by, sauf la nouvelle source', async () => {
    const calls: { table: string; values: Record<string, unknown>; ids: readonly string[] }[] = [];
    const client = {
      from: (table: string) => ({
        update: (values: Record<string, unknown>) => ({
          in: (_c: string, ids: readonly string[]) => ({
            is: async () => { calls.push({ table, values, ids }); return { error: null }; },
          }),
        }),
      }),
    };
    await supersedeSources(client, { oldSourceIds: ['old1', 'old2', 'new1'], newSourceId: 'new1', timestamp: '2026-10-27T00:00:00Z' });
    expect(calls.map((c) => c.table)).toEqual(['knowledge_evidences', 'knowledge_facts', 'knowledge_open_knowledge']);
    expect(calls[0].ids).toEqual(['old1', 'old2']); // 'new1' (la nouvelle source) exclue
    expect(calls[0].values).toEqual({ superseded_at: '2026-10-27T00:00:00Z', superseded_by: 'new1' });
  });

  it('aucune ancienne source (première version) → ne touche rien', async () => {
    const upd = vi.fn();
    const client = { from: () => ({ update: () => { upd(); return { in: () => ({ is: async () => ({ error: null }) }) }; } }) };
    await supersedeSources(client as never, { oldSourceIds: ['only'], newSourceId: 'only', timestamp: 't' });
    expect(upd).not.toHaveBeenCalled();
  });

  it('erreur BRUYANTE : une supersession qui échoue throw (jamais silencieuse)', async () => {
    const client = { from: () => ({ update: () => ({ in: () => ({ is: async () => ({ error: { message: 'boom' } }) }) }) }) };
    await expect(supersedeSources(client as never, { oldSourceIds: ['old'], newSourceId: 'new', timestamp: 't' })).rejects.toThrow('boom');
  });
});

// ── Lecture : une ligne supersédée n'est JAMAIS restituée (evidences + FACTs) ──
const oneEq = (rows: unknown[]) => ({ from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: rows, error: null }) }) }) });

describe('les lecteurs excluent les lignes supersédées', () => {
  it('readResolvedEvidences : une evidence supersédée est exclue, même seule sur son construct', async () => {
    const rows = [
      { target_family: 'VALUES', target_construct: 'C', strength: 'strong', rank: 1, assertion_basis: 'self_report', assertion_status: 'declared', confidence: 'high', context: 'v', created_at: '2026-01-01T00:00:00Z', superseded_at: '2026-10-27T00:00:00Z' },
      { target_family: 'VALUES', target_construct: 'D', strength: 'weak', rank: 2, assertion_basis: 'self_report', assertion_status: 'declared', confidence: 'low', context: 'v', created_at: '2026-01-02T00:00:00Z', superseded_at: null },
    ];
    const out = await readResolvedEvidences(oneEq(rows) as never, { userId: 'u' });
    expect(out.map((r) => r.target_construct)).toEqual(['D']); // C (supersédée) absente
  });

  it('readSocleFacts : un FACT supersédé est exclu de la prose', async () => {
    const rows = [
      { fact_type: 'singularity.adore_faire', value: 'ANCIEN', visibility_derived: 'exposable', assertion_status: 'explicit', superseded_at: '2026-10-27T00:00:00Z' },
      { fact_type: 'singularity.adore_faire', value: 'NOUVEAU', visibility_derived: 'exposable', assertion_status: 'explicit', superseded_at: null },
    ];
    const facts = await readSocleFacts(oneEq(rows) as unknown as TagsReadClient, 'u');
    expect(facts.map((f) => f.value)).toEqual(['NOUVEAU']); // l'ancien corrigé n'apparaît pas
  });
});

// ── HISTORIQUE : une supersédée est une CORRECTION (fate b), pas du passé daté (fate a) → PAS d'historique ──
// La restitution (readResolvedEvidences / readSocleFacts) EST ce que rend l'historique. Les deux tests
// ci-dessus prouvent qu'une supersédée n'en sort pas. On fige la règle noir sur blanc :
describe('règle HISTORIQUE (fate b)', () => {
  it('une ligne supersédée n\'est rendue par AUCUNE restitution (donc pas dans l\'historique)', async () => {
    const superseded = [{ target_family: 'VALUES', target_construct: 'X', strength: 'strong', rank: 1, assertion_basis: 'self_report', assertion_status: 'declared', confidence: 'high', context: 'v', created_at: '2026-01-01T00:00:00Z', superseded_at: '2026-10-27T00:00:00Z' }];
    const out = await readResolvedEvidences(oneEq(superseded) as never, { userId: 'u' });
    expect(out).toHaveLength(0); // corrigé = remplacé = nulle part, historique compris
  });
});
