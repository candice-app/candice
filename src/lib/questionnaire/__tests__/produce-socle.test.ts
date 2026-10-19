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
import { reconstructAttentionVectors, type AttentionJournalItem } from '../reconstruct-attention';
import { scoreAttention, type AttentionDim } from '../../attention/scoring';

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

describe('Cohérence projection ↔ journal — ATTENTION : ÉGALITÉ DU VECTEUR (condition de retrait)', () => {
  // optionRef actifs par question, pour composer des sélections ordonnées.
  const refs = (qc: string) => ONBOARDING_MAPPINGS.filter((m) => m.questionCode === qc && m.status === 'ACTIF').map((m) => m.optionRef);
  // une sélection = { questionCode, [refs dans l'ordre de sélection] }
  const selections = [
    { qc: 'q1', picks: [refs('q1')[0], refs('q1')[5]] }, // deux choix classés (rang 1, 2)
    { qc: 'q2', picks: [refs('q2')[0], refs('q2')[2]] },
    { qc: 'q4', picks: [refs('q4')[0]] },
    { qc: 'qe', picks: [refs('qe')[0], refs('qe')[1], refs('qe')[2]] }, // trois (rangs 1,2,3)
  ];
  const RECEPTION = new Set(['q1', 'q2', 'q4']);

  it('attention_reception/expression reconstruits DEPUIS LE JOURNAL == projection directe (vecteur égal)', () => {
    // PROJECTION DIRECTE : exactement ce que buildAnswers→scoreAttention calcule pour l'écran.
    const directAnswers = {
      reception: selections.filter((s) => RECEPTION.has(s.qc)).map((s) => s.picks.map((r) => ATTENTION_DIMS[r] as AttentionDim[])),
      expression: selections.filter((s) => !RECEPTION.has(s.qc)).map((s) => s.picks.map((r) => ATTENTION_DIMS[r] as AttentionDim[])),
    };
    const direct = scoreAttention(directAnswers);

    // JOURNAL : fragments (questionCode + dims + rang) tels que produce-socle les grave sur l'evidence.
    const journal: AttentionJournalItem[] = selections.flatMap((s) =>
      s.picks.map((r, i) => ({ questionCode: s.qc, dims: ATTENTION_DIMS[r], rank: i + 1 })),
    );
    const reconstructed = reconstructAttentionVectors(journal);

    // ÉGALITÉ DU VECTEUR — pas « couverture d'options ». Divergence = échec.
    expect(reconstructed.reception).toEqual(direct.reception);
    expect(reconstructed.expression).toEqual(direct.expression);
  });

  it('produce-socle grave bien dims + rank sur les evidences attention (le journal porte la sémantique)', async () => {
    const { client, rows } = recordingClient();
    await produceSocleAnswer(client, { userId: '00000000-0000-4000-8000-000000000004', selectedOptionRefs: [refs('q2')[0]], timestamp: '2026-10-19T10:00:00Z' });
    const ev = (rows['knowledge_evidences'] as Array<Record<string, unknown>>)[0];
    expect(ev.dims).toEqual(ATTENTION_DIMS[refs('q2')[0]]);
    expect(ev.rank).toBe(1);
  });
});
