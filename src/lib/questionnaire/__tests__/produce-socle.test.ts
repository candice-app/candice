// APPEND (décision 19 oct) : répondre deux fois crée DEUX sources/evidences, jamais d'écrasement.
// + cohérence projection↔journal (attention) : les deux sources de vérité couvrent le MÊME jeu
// d'options actives — aucune option silencieusement dans l'une et pas l'autre (condition de retrait
// du scoring legacy, hsg §47bis.3). Test récurrent à étendre à chaque domaine câblé.

import { describe, expect, it } from 'vitest';
import { ONBOARDING_MAPPINGS, accountAbout, asUserId } from '../../knowledge';
import { produceFromOption } from '../../knowledge-write/produce';
import type { WriteClient } from '../../knowledge-write/persist';
import { produceSocleAnswer } from '../produce-socle';
import { ATTENTION_DIMS } from '../attention-dims';

function recordingClient() {
  const rows: Record<string, unknown[]> = {};
  const client: WriteClient = {
    from: (t) => ({ insert: async (r) => { (rows[t] ||= []).push(...(Array.isArray(r) ? r : [r])); return { error: null }; } }),
  };
  return { client, rows };
}

describe('produceSocleAnswer — journal en APPEND', () => {
  it('deux réponses identiques → deux sources distinctes, deux evidences distinctes (jamais d’écrasement)', async () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    const run = async () => {
      const { client, rows } = recordingClient();
      await produceSocleAnswer(client, { userId, selectedOptionRefs: ['8'], timestamp: '2026-10-19T10:00:00Z' });
      return rows;
    };
    const a = await run();
    const b = await run();
    const srcA = (a['knowledge_sources'] as Array<{ id: string }>)[0].id;
    const srcB = (b['knowledge_sources'] as Array<{ id: string }>)[0].id;
    const evA = (a['knowledge_evidences'] as Array<{ id: string }>)[0].id;
    const evB = (b['knowledge_evidences'] as Array<{ id: string }>)[0].id;
    expect(srcA).not.toBe(srcB); // source FRAÎCHE par acquisition
    expect(evA).not.toBe(evB); // donc evidence distincte → les deux coexistent
  });

  it('provenance self écrite sur chaque evidence', async () => {
    const { client, rows } = recordingClient();
    await produceSocleAnswer(client, { userId: '00000000-0000-4000-8000-000000000002', selectedOptionRefs: ['8'], timestamp: '2026-10-19T10:00:00Z' });
    const ev = (rows['knowledge_evidences'] as Array<Record<string, string>>)[0];
    expect(ev.about_kind).toBe('account');
    expect(ev.assertion_basis).toBe('self_report');
    expect((rows['knowledge_sources'] as Array<Record<string, string>>)[0].source_type).toBe('onboarding_closed');
  });
});

describe('Cohérence projection ↔ journal — ATTENTION (condition de retrait du scoring legacy)', () => {
  // Les options ACTIVES du domaine attention : q1,q2,q4 (reçues) + qe (donnée).
  const activeAttn = ONBOARDING_MAPPINGS.filter((m) => ['q1', 'q2', 'q4', 'qe'].includes(m.questionCode) && m.status === 'ACTIF');

  it('chaque option active produit ≥1 evidence au journal (aucune perdue côté journal)', () => {
    const scope = { about: accountAbout(asUserId('00000000-0000-4000-8000-000000000003')), ownerId: asUserId('00000000-0000-4000-8000-000000000003') } as const;
    for (const m of activeAttn) {
      const { evidences } = produceFromOption({ ...scope, sourceId: '00000000-0000-4000-8000-00000000000a', sourceType: 'onboarding_closed', timestamp: '2026-10-19T00:00:00Z' }, m);
      expect(evidences.length, `${m.questionCode}/${m.optionRef}`).toBeGreaterThan(0);
    }
  });

  it('les deux sources couvrent le MÊME jeu d’options (journal ∩ projection) — divergence = échec', () => {
    const journalRefs = new Set(activeAttn.map((m) => m.optionRef));
    const projectionRefs = new Set(Object.keys(ATTENTION_DIMS)); // dims = projection
    // toute option du domaine attention est dans les DEUX (ni l'une sans l'autre)
    for (const r of journalRefs) expect(projectionRefs.has(r), `ref ${r} : journal mais pas projection`).toBe(true);
    for (const r of projectionRefs) expect(journalRefs.has(r), `ref ${r} : projection mais pas journal`).toBe(true);
    expect(journalRefs.size).toBe(28); // q1 7 + q2 7 + q4 7 + qe 7
  });
});
