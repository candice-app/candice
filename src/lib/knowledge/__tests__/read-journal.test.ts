// RELECTURE DU JOURNAL — le même journal doit donner les MÊMES signaux avant écriture
// et après relecture. La projection utilisée est la VRAIE (`evidenceToRow`), pas une
// simulation : le test échouerait si la projection perdait un champ dont la consolidation
// dépend. C'est ainsi qu'on a trouvé que `source_type` et `timestamp` n'ont pas de colonne.
import { describe, expect, it } from 'vitest';
import { consolidateInterests } from '../consolidate';
import { evidenceToRow } from '../../knowledge-write/rows';
import { readJournalEvidences, JournalSourceError } from '../read-journal';
import type { Evidence, InterestEvidence } from '../evidence';
import type { AboutRef } from '../identity';

const about = { kind: 'account', id: 'u1' } as unknown as AboutRef;
const scope = { about, ownerId: 'u1' } as never;

function ev(o: { id: string; src: string; ts: string; strength?: string }): InterestEvidence {
  return {
    about, ownerId: 'u1', evidence_id: o.id, source_id: 'src-' + o.id, source_type: o.src,
    raw_information: 'photo argentique', confidence: 'low', context: 'GLOBAL',
    timestamp: o.ts, stability: 'contextual', evidence_role: 'primary',
    assertionBasis: 'self_report',
    target_family: 'INTEREST', subject: 'photo', subjectLabel: 'photo',
    target_construct: 'photo', strength: o.strength ?? 'moderate',
    version: { ontology_version: '1', hsg_version: '1' },
  } as unknown as InterestEvidence;
}

/**
 * Faux client qui HONORE réellement eq / in / order / range. Un faux client qui rend
 * toujours tout ne peut pas faire échouer un test de pagination : il prouverait seulement
 * que la boucle s'arrête à la première page.
 */
function client(evs: readonly Evidence[], sourcesConnues = true) {
  const rows = evs.map((e) => evidenceToRow(e, about) as unknown as Record<string, unknown>);
  const sources = sourcesConnues
    ? [...new Set(evs.map((e) => e.source_id))].map((id) => ({
        id, source_type: evs.find((e) => e.source_id === id)!.source_type,
        ts: evs.find((e) => e.source_id === id)!.timestamp,
      }) as Record<string, unknown>)
    : [];
  const faire = (source: Record<string, unknown>[]) => {
    let d = [...source];
    const q: Record<string, unknown> = {};
    q.eq = (c: string, v: string) => { d = d.filter((r) => String(r[c]) === String(v)); return q; };
    q.in = (c: string, v: readonly string[]) => {
      const set = new Set(v.map(String));
      d = d.filter((r) => set.has(String(r[c])));
      return q;
    };
    q.order = (c: string, o: { ascending: boolean }) => {
      d = [...d].sort((a, b) => {
        const x = String(a[c]), y = String(b[c]);
        return (x < y ? -1 : x > y ? 1 : 0) * (o.ascending ? 1 : -1);
      });
      return q;
    };
    q.range = (de: number, a: number) => { d = d.slice(de, a + 1); return q; };
    q.then = (r: (v: unknown) => unknown) => Promise.resolve(r({ data: d, error: null }));
    return q;
  };
  return { from: (t: string) => ({ select: () => faire(t === 'knowledge_sources' ? sources : rows) }) } as never;
}

const sig = (evs: readonly InterestEvidence[]) => {
  const s = consolidateInterests(scope, evs)[0];
  return { score: s.score, confidence: s.confidence, count: s.evidenceCount, maj: s.lastUpdated };
};

describe('relecture du journal — mêmes signaux avant écriture et après', () => {
  it('deux preuves de MÊME provenance', async () => {
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: '2026-11-01T00:00:00Z' }),
               ev({ id: 'e2', src: 'onboarding_closed', ts: '2026-11-02T00:00:00Z' })];
    const relu = await readJournalEvidences(client(j), { userId: 'u1' });
    expect(sig(relu as InterestEvidence[])).toEqual(sig(j));
  });

  it('deux provenances DISTINCTES — le cas qui échoue sans réhydratation', async () => {
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: '2026-11-01T00:00:00Z' }),
               ev({ id: 'e2', src: 'discovery_closed', ts: '2026-11-02T00:00:00Z' })];
    const avant = sig(j);
    expect(avant.score).toBe('high'); // deux provenances primaires indépendantes
    const relu = await readJournalEvidences(client(j), { userId: 'u1' });
    expect(sig(relu as InterestEvidence[])).toEqual(avant);
  });

  it('une preuve primaire FORTE — le chemin qui lit source_type pour la force déclarée', async () => {
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: '2026-11-01T00:00:00Z', strength: 'strong' })];
    const avant = sig(j);
    expect(avant.score).toBe('high');       // declaredStrongPrimary
    expect(avant.confidence).toBe('medium'); // une déclaration forte suffit
    const relu = await readJournalEvidences(client(j), { userId: 'u1' });
    expect(sig(relu as InterestEvidence[])).toEqual(avant);
  });

  it('une extraction forte NE donne PAS le score d’une déclaration forte', async () => {
    const j = [ev({ id: 'e1', src: 'extraction_inferred', ts: '2026-11-01T00:00:00Z', strength: 'strong' })];
    expect(sig(j).score).toBe('medium');
    const relu = await readJournalEvidences(client(j), { userId: 'u1' });
    expect(sig(relu as InterestEvidence[])).toEqual(sig(j));
  });

  it('une source absente lève, elle ne se devine pas', async () => {
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: '2026-11-01T00:00:00Z' })];
    await expect(readJournalEvidences(client(j, false), { userId: 'u1' }))
      .rejects.toBeInstanceOf(JournalSourceError);
  });
});

describe('seuil medium — le nombre ne compte que des preuves explicites', () => {
  it('trois extractions de même provenance restent à low', () => {
    const j = ['e1', 'e2', 'e3'].map((id, i) =>
      ev({ id, src: 'extraction_inferred', ts: `2026-11-0${i + 1}T00:00:00Z` }));
    expect(sig(j).confidence).toBe('low');
  });

  it('une déclaration accompagnée de trois extractions reste à low', () => {
    const j = [ev({ id: 'e0', src: 'onboarding_closed', ts: '2026-11-01T00:00:00Z' }),
               ...['e1', 'e2', 'e3'].map((id, i) =>
                 ev({ id, src: 'extraction_inferred', ts: `2026-11-0${i + 2}T00:00:00Z` }))];
    expect(sig(j).confidence).toBe('low');
  });

  it('deux déclarations d’onboarding atteignent medium', () => {
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: '2026-11-01T00:00:00Z' }),
               ev({ id: 'e2', src: 'onboarding_open', ts: '2026-11-02T00:00:00Z' })];
    expect(sig(j).confidence).toBe('medium');
  });

  it('un statut ABSENT et non résoluble ne contribue pas au seuil', () => {
    const nu = (id: string, ts: string) => {
      const e = { ...ev({ id, src: 'onboarding_closed', ts }) } as Record<string, unknown>;
      delete e.source_type;
      return e as unknown as InterestEvidence;
    };
    expect(sig([nu('e1', '2026-11-01T00:00:00Z'), nu('e2', '2026-11-02T00:00:00Z')]).confidence).toBe('low');
  });

  it('un statut absent mais RÉSOLUBLE par sourceType contribue normalement', () => {
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: '2026-11-01T00:00:00Z' }),
               ev({ id: 'e2', src: 'onboarding_open', ts: '2026-11-02T00:00:00Z' })];
    expect(j.every((e) => (e as unknown as Record<string, unknown>).assertionStatus === undefined)).toBe(true);
    expect(sig(j).confidence).toBe('medium');
  });
});

describe('pagination — au-delà d’une page et au-delà d’un lot d’identifiants', () => {
  // 1 200 preuves > TAILLE_PAGE (1000) ; 250 sources > LOT_IDENTIFIANTS (200).
  // Identifiants zéro-remplis pour que l'ordre lexical soit l'ordre numérique.
  const N = 1200, SOURCES = 250;
  const journal = Array.from({ length: N }, (_, k) => {
    const e = ev({
      id: `e${String(k).padStart(5, '0')}`,
      src: 'onboarding_closed',
      ts: '2026-11-01T00:00:00Z',
    }) as unknown as Record<string, unknown>;
    e.source_id = `src-${String(k % SOURCES).padStart(5, '0')}`;
    return e as unknown as InterestEvidence;
  });

  it('rend TOUTES les preuves, sans doublon ni manquante', async () => {
    const relu = await readJournalEvidences(client(journal), { userId: 'u1' });
    expect(relu).toHaveLength(N);
    const ids = relu.map((e) => e.evidence_id);
    expect(new Set(ids).size).toBe(N);                       // aucun doublon
    expect([...ids].sort()).toEqual(journal.map((e) => e.evidence_id).sort()); // aucune manquante
  });

  it('réhydrate les 250 sources, donc plus d’un lot d’identifiants', async () => {
    const relu = await readJournalEvidences(client(journal), { userId: 'u1' });
    expect(new Set(relu.map((e) => e.source_id)).size).toBe(SOURCES);
    expect(relu.every((e) => e.source_type === 'onboarding_closed')).toBe(true);
    expect(relu.every((e) => e.timestamp === '2026-11-01T00:00:00Z')).toBe(true);
  });
});

describe('ordre temporel — instants, pas chaînes', () => {
  // « 2026-11-01T10:30:00+01:00 » vaut 09:30 UTC, donc AVANT « 2026-11-01T09:45:00Z ».
  // Comparées comme du texte, elles s'ordonnent à l'envers : « 10:30 » suit « 09:45 ».
  const decalee = '2026-11-01T10:30:00+01:00'; // 09:30 UTC
  const utc = '2026-11-01T09:45:00Z';          // 09:45 UTC — la plus récente

  it('lastUpdated désigne l’instant le plus récent, pas la chaîne la plus grande', () => {
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: decalee }),
               ev({ id: 'e2', src: 'onboarding_open', ts: utc })];
    expect(sig(j).maj).toBe(utc);
    // la fixture serait inopérante si les deux chaînes s'ordonnaient déjà correctement
    expect(decalee > utc).toBe(true);
  });

  it('le même ordre survit à la relecture', async () => {
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: decalee }),
               ev({ id: 'e2', src: 'onboarding_open', ts: utc })];
    const avant = sig(j);
    const relu = await readJournalEvidences(client(j), { userId: 'u1' });
    expect(sig(relu as InterestEvidence[])).toEqual(avant);
  });

  it('deux écritures ÉQUIVALENTES du même instant ne s’ordonnent pas au hasard', () => {
    const a = '2026-11-01T09:30:00Z', b = '2026-11-01T09:30:00.000Z';
    expect(a > b).toBe(true);           // le texte dit que « a » gagne
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: a }),
               ev({ id: 'e2', src: 'onboarding_open', ts: b })];
    // instants égaux → départage stable par evidence_id : e2 l'emporte
    expect(sig(j).maj).toBe(b);
    expect(sig([...j].reverse()).maj).toBe(b); // et l'ordre d'entrée n'y change rien
  });

  it('une preuve UNIQUE à l’horodatage illisible lève aussi', () => {
    // reduce() et sort() n'appellent pas leur comparateur sur un seul élément :
    // sans passe de validation, celle-ci traverserait en silence.
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: 'pas une date' })];
    expect(() => sig(j)).toThrow(/horodatage illisible/);
  });

  it('un horodatage illisible lève au lieu de se ranger au hasard', () => {
    const j = [ev({ id: 'e1', src: 'onboarding_closed', ts: 'pas une date' }),
               ev({ id: 'e2', src: 'onboarding_open', ts: utc })];
    expect(() => sig(j)).toThrow(/horodatage illisible/);
  });
});
