// Écriture des sections self — tampon de périmètre + forme de ligne, avec un client factice (pas de base).
import { describe, expect, it } from 'vitest';
import { storeSelfSections, type SectionStoreClient } from '../generate-sections-run';
import type { GeneratedSection } from '../generate-sections';

function fakeClient() {
  const inserted: Record<string, unknown>[] = [];
  const deleted: { key?: string }[] = [];
  const client: SectionStoreClient = {
    from() {
      return {
        delete() { const d: { key?: string } = {}; deleted.push(d); return { eq() { return { is() { return { eq(_c: string, v: string) { d.key = v; return Promise.resolve({ error: null }); } }; } }; } }; },
        insert(rows: unknown) { inserted.push(rows as Record<string, unknown>); return Promise.resolve({ error: null }); },
      };
    },
  };
  return { client, inserted, deleted };
}

const section = (over: Partial<GeneratedSection>): GeneratedSection => ({
  key: 'deep_touch', tier: 'detail', text: 'tu sembles…',
  affirmations: [{ id: 'a1', type: 'tendance', text: 'tu sembles…', evidence_ids: ['s1', 's2'] }],
  sourceEvidenceIds: ['s1', 's2'], verdict: { ok: true, omission: [], invention: [], formFault: null }, ...over,
});

describe('storeSelfSections', () => {
  it('estampille scope="self", contact_id null, et transmet l\'union en source_evidence_ids', async () => {
    const { client, inserted } = fakeClient();
    await storeSelfSections(client, 'user-1', [section({})]);
    expect(inserted).toHaveLength(1);
    const row = inserted[0];
    expect(row.scope).toBe('self');
    expect(row.contact_id).toBeNull();
    expect(row.user_id).toBe('user-1');
    expect(row.source_evidence_ids).toEqual(['s1', 's2']); // = union des affirmations (CHECK en base)
    expect(row.affirmations).toEqual([{ id: 'a1', type: 'tendance', text: 'tu sembles…', evidence_ids: ['s1', 's2'] }]);
  });

  it('supprime la ligne self existante avant d\'insérer (réécriture par section)', async () => {
    const { client, deleted } = fakeClient();
    await storeSelfSections(client, 'user-1', [section({ key: 'resume', tier: 'synthesis' })]);
    expect(deleted.some((d) => d.key === 'resume')).toBe(true);
  });
});
