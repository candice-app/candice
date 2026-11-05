// SUPERSESSION 3ᵉ FORME (décision Estelle 5 nov) — identité d'évènement de correction : le client tire UN
// uuid, les DEUX sources (verbatim déclaré + extraction) le portent, la supersession épargne ce qui le porte.
import { describe, expect, it, vi } from 'vitest';
import { oldSelfSourceIdsForCorrection, supersedePriorVersions } from '../../knowledge-write/supersede';

const lookup = (rows: unknown[]) => ({ from: () => ({ select: () => ({ match: async () => ({ data: rows, error: null }) }) }) });

const CID = 'corr-abc'; // identifiant de l'évènement de correction courant

describe('oldSelfSourceIdsForCorrection — épargne les sources de la correction courante', () => {
  it('supersède les anciennes versions SAUF celles portant l\'id de correction courant', async () => {
    const rows = [
      { id: 'new-verbatim', rapporteur: null, source_type: 'onboarding_open', correction_event_id: CID },     // correction courante : ÉPARGNÉE
      { id: 'new-extract', rapporteur: null, source_type: 'extraction_inferred', correction_event_id: CID },   // correction courante : ÉPARGNÉE
      { id: 'old-verbatim', rapporteur: null, source_type: 'onboarding_open', correction_event_id: 'corr-old' }, // ancienne : supersédée
      { id: 'legacy', rapporteur: null, source_type: 'onboarding_open', correction_event_id: null },           // pré-identifiant : supersédée
    ];
    const ids = await oldSelfSourceIdsForCorrection(lookup(rows) as never,
      { ownerId: 'u', aboutKind: 'account', aboutId: 'u', questionCode: 'singularity.adore_faire', correctionEventId: CID });
    expect(ids.sort()).toEqual(['legacy', 'old-verbatim']);     // les deux anciennes
    expect(ids).not.toContain('new-verbatim');                  // la correction courante NE s'auto-supersède pas
    expect(ids).not.toContain('new-extract');                   // ni l'extraction de la correction courante
  });

  // vide_jusqu_a_7bis — AUCUN écrivain ne crée aujourd'hui de ligne côte-à-côte (voie declared_via_relative /
  // reported_by_relative définie à sources.ts:48, sans producteur). Ce test garde donc un cas INATTEIGNABLE en
  // prod : il passe au vert en prouvant le filtre unitaire, pas une réalité. À REJOUER contre de vraies lignes
  // côte-à-côte quand la voie sera câblée (lot 7bis).
  it('CÔTE À CÔTE (cas Julie) — vide_jusqu_a_7bis : une source de tiers (rapporteur renseigné) n\'est jamais supersédée', async () => {
    const rows = [
      { id: 'old', rapporteur: null, source_type: 'onboarding_open', correction_event_id: 'corr-old' },
      { id: 'julie', rapporteur: 'julie-id', source_type: 'reported_by_relative', correction_event_id: null },
    ];
    const ids = await oldSelfSourceIdsForCorrection(lookup(rows) as never,
      { ownerId: 'u', aboutKind: 'account', aboutId: 'u', questionCode: 'singularity.adore_faire', correctionEventId: CID });
    expect(ids).toEqual(['old']);
    expect(ids).not.toContain('julie');
  });

  it('correctionEventId vide → throw (sinon on supersèderait les sources de la correction courante)', async () => {
    await expect(oldSelfSourceIdsForCorrection(lookup([]) as never,
      { ownerId: 'u', aboutKind: 'account', aboutId: 'u', questionCode: 'q', correctionEventId: '' })).rejects.toThrow();
  });
});

describe('supersedePriorVersions — superseded_by = source DÉCLARÉE', () => {
  it('marque les 3 tables restituables avec superseded_by = declaredSourceId', async () => {
    const rows = [
      { id: 'old-verbatim', rapporteur: null, source_type: 'onboarding_open', correction_event_id: 'corr-old' },
      { id: 'new-declared', rapporteur: null, source_type: 'onboarding_open', correction_event_id: CID },
    ];
    const updates: { table: string; values: Record<string, unknown>; ids: readonly string[] }[] = [];
    const mark = {
      from: (table: string) => ({
        update: (values: Record<string, unknown>) => ({
          in: (_c: string, ids: readonly string[]) => ({
            is: async () => { updates.push({ table, values, ids }); return { error: null }; },
          }),
        }),
      }),
    };
    await supersedePriorVersions(lookup(rows) as never, mark as never, {
      ownerId: 'u', aboutKind: 'account', aboutId: 'u', questionCode: 'singularity.adore_faire',
      correctionEventId: CID, declaredSourceId: 'new-declared', timestamp: '2026-11-05T10:00:00.000Z',
    });
    expect(updates.map((u) => u.table).sort()).toEqual(['knowledge_evidences', 'knowledge_facts', 'knowledge_open_knowledge']);
    for (const u of updates) {
      expect(u.values.superseded_by).toBe('new-declared'); // la source DÉCLARÉE, jamais l'extraction
      expect(u.ids).toEqual(['old-verbatim']);             // seulement l'ancienne version
    }
  });
});
