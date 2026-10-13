// Orchestrateur de double-écriture : journal autorité d'abord, projection après, divergence signalée.

import { describe, expect, it } from 'vitest';
import { asContactId, asUserId, contactAbout, createSourceRecord, type KnowledgeScope } from '../../knowledge';
import { DivergenceError, writeDouble } from '../double-write';
import { PersistError, type WriteClient } from '../persist';

const scope: KnowledgeScope = { about: contactAbout(asContactId('c1')), ownerId: asUserId('u1') };
const source = createSourceRecord({ ...scope, id: 'src1', sourceType: 'declared_via_relative', questionText: 'q', answerText: 'a', timestamp: '2026-10-13T00:00:00Z' });
const okClient = (): WriteClient => ({ from: () => ({ insert: async () => ({ error: null }) }) });
const failClient = (): WriteClient => ({ from: () => ({ insert: async () => ({ error: { message: 'db down' } }) }) });

describe('writeDouble — journal autorité, projection après', () => {
  it('journal OK puis projection OK : les deux écrits, dans l’ordre', async () => {
    const order: string[] = [];
    const client: WriteClient = { from: (t) => ({ insert: async () => { order.push(`journal:${t}`); return { error: null }; } }) };
    await writeDouble(client, { source }, async () => { order.push('flat'); });
    expect(order[0]).toBe('journal:knowledge_sources');
    expect(order[order.length - 1]).toBe('flat'); // projection APRÈS le journal
  });

  it('journal en échec : la projection n’est JAMAIS écrite (pas de copie sans vérité)', async () => {
    let flatCalled = false;
    await expect(
      writeDouble(failClient(), { source }, async () => { flatCalled = true; }),
    ).rejects.toBeInstanceOf(PersistError);
    expect(flatCalled).toBe(false);
  });

  it('journal OK mais projection en échec : DivergenceError (signalée, pas réconciliée)', async () => {
    const p = writeDouble(okClient(), { source }, async () => { throw new Error('colonne manquante'); });
    await expect(p).rejects.toBeInstanceOf(DivergenceError);
    await expect(p).rejects.toThrow(/divergence/i);
  });
});
