// SUPERSESSION (décision 27 oct) — marqueur explicite : une ligne corrigée est REMPLACÉE, exclue de TOUTE
// restitution (préséance, FACTs, et HISTORIQUE — fate b des trois sorts : corrigé = nulle part).
import { describe, expect, it, vi } from 'vitest';
import { supersedeSources } from '../../knowledge-write/supersede';
import { readResolvedEvidences } from '../preseance';
import { readSocleFacts, type TagsReadClient } from '../../questionnaire/breath-tags';

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
