// INSTANT INDIVERGEABLE — `knowledge_sources.ts` est l'instant de référence de toutes les
// preuves de sa source. `Evidence.timestamp` n'a pas de colonne : il est dérivé en mémoire
// et reconstruit depuis la source à la relecture. Un écart réel serait donc PERDU, et les
// signaux différeraient avant écriture et après. On refuse AVANT la RPC — et ce test prouve
// que la RPC n'est pas appelée, pas seulement que l'erreur est levée.
import { describe, expect, it, vi } from 'vitest';
import { persistKnowledge, PersistError } from '../persist';
import { createSourceRecord } from '../../knowledge/sources';
import type { Evidence } from '../../knowledge';
import type { AboutRef } from '../../knowledge/identity';

const about = { kind: 'account', id: 'u1' } as unknown as AboutRef;
const T = '2026-11-01T09:30:00Z';

const source = (ts: string) => createSourceRecord({
  about, ownerId: 'u1' as never, id: 'src-1',
  sourceType: 'onboarding_closed', questionText: 'q', rawText: 'r', timestamp: ts,
});

const evidence = (ts: string): Evidence => ({
  about, ownerId: 'u1', evidence_id: 'e1', source_id: 'src-1',
  source_type: 'onboarding_closed', raw_information: 'photo', confidence: 'low',
  context: 'GLOBAL', timestamp: ts, stability: 'contextual', evidence_role: 'primary',
  assertionBasis: 'self_report', target_family: 'INTEREST', subject: 'photo',
  subjectLabel: 'photo', target_construct: 'photo', strength: 'moderate',
  version: { ontology_version: '1', hsg_version: '1' },
} as unknown as Evidence);

const clientAvecEspion = () => {
  const rpc = vi.fn().mockResolvedValue({
    data: { sources: 1, evidences: 1, facts: 0, open: 0 }, error: null,
  });
  return { client: { rpc } as never, rpc };
};

describe('persistKnowledge — l’instant d’une preuve est celui de sa source', () => {
  it('refuse un écart RÉEL, et la RPC n’est jamais appelée', async () => {
    const { client, rpc } = clientAvecEspion();
    await expect(persistKnowledge(client, {
      source: source(T),
      evidences: [evidence('2026-11-02T09:30:00Z')],
    })).rejects.toBeInstanceOf(PersistError);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('accepte deux écritures ÉQUIVALENTES du même instant', async () => {
    const { client, rpc } = clientAvecEspion();
    // même instant, millisecondes explicites
    await expect(persistKnowledge(client, {
      source: source(T),
      evidences: [evidence('2026-11-01T09:30:00.000Z')],
    })).resolves.toBe('written');
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('accepte le même instant écrit dans un autre décalage horaire', async () => {
    const { client, rpc } = clientAvecEspion();
    await expect(persistKnowledge(client, {
      source: source(T),
      evidences: [evidence('2026-11-01T10:30:00+01:00')],
    })).resolves.toBe('written');
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('refuse un instant illisible plutôt que de le laisser passer', async () => {
    const { client, rpc } = clientAvecEspion();
    await expect(persistKnowledge(client, {
      source: source(T), evidences: [evidence('pas une date')],
    })).rejects.toBeInstanceOf(PersistError);
    expect(rpc).not.toHaveBeenCalled();
  });
});
