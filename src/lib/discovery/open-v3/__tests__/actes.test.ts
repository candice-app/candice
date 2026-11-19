import { describe, it, expect, beforeAll } from 'vitest';
import { fausseBase } from '../../../knowledge/__tests__/fausse-base';
import { enregistrerReponseFermee, enregistrerReponseOuverte, cleOption, ActeDejaEnregistreError } from '../service';
import { BANQUE } from '../banque';
import { produireDepuisOption } from '../produire';

// L'IDENTITÉ DES ACTES — une requête renvoyée ne compte pas deux fois ; deux actes distincts ne
// sont pas confondus parce que leur contenu est identique.
//
// La base est en mémoire mais elle RETIENT : `persist_journal` y absorbe les doublons comme en
// vrai, et les supersessions s'y lisent. Les mêmes cas sont rejoués par les vraies routes sur
// la pile locale (scripts/local/32-preuve-route-fermee-et-actes.mts).
const U = '00000000-0000-4000-8000-000000000001';

function fermee() {
  for (const q of BANQUE) {
    if (q.forme !== 'single' || q.options.length < 2) continue;
    if (produireDepuisOption(q, q.options[0]).type !== 'evidence') continue;
    if (produireDepuisOption(q, q.options[1]).type !== 'evidence') continue;
    return q;
  }
  throw new Error('aucune question fermée productive');
}
const q = fermee();
const A = [cleOption(q.options[0])]; const B = [cleOption(q.options[1])];
const vivantes = (b: ReturnType<typeof fausseBase>) => (b.tables.knowledge_evidences ?? []).filter((e) => e.superseded_at === null);
const sources = (b: ReturnType<typeof fausseBase>) => b.tables.knowledge_sources ?? [];
const repondre = (b: ReturnType<typeof fausseBase>, acteId: string, cles: string[], timestamp: string) =>
  enregistrerReponseFermee(b.client, { userId: U, questionId: q.id, clesOptions: cles, acteId, timestamp });

describe('réponse fermée — identité de l’acte', () => {
  it('la même requête renvoyée n’écrit rien de plus', async () => {
    const b = fausseBase();
    const r1 = await repondre(b, 'lot-1', A, '2026-11-19T08:00:00.000Z');
    const avant = JSON.stringify(b.tables);
    const r2 = await repondre(b, 'lot-1', A, '2026-11-19T08:00:05.000Z');
    expect(r2).toMatchObject({ dejaFaite: true, preuvesEcrites: 0, sourceId: r1.sourceId, timestamp: '2026-11-19T08:00:00.000Z' });
    expect(JSON.stringify(b.tables)).toBe(avant);
    expect(sources(b)).toHaveLength(1);
  });

  it('double clic simultané : une source, les preuves une fois, toutes vivantes', async () => {
    const b = fausseBase();
    const [r1, r2] = await Promise.all([repondre(b, 'lot-1', A, '2026-11-19T08:00:00.000Z'), repondre(b, 'lot-1', A, '2026-11-19T08:00:00.010Z')]);
    expect(r1.sourceId).toBe(r2.sourceId);
    expect(sources(b)).toHaveLength(1);
    const n = (b.tables.knowledge_evidences ?? []).length;
    expect(n).toBe(r1.preuvesEcrites || r2.preuvesEcrites);
    expect(vivantes(b)).toHaveLength(n);
  });

  it('le même acte avec une AUTRE réponse est refusé, et rien ne bouge', async () => {
    const b = fausseBase();
    await repondre(b, 'lot-1', A, '2026-11-19T08:00:00.000Z');
    const avant = JSON.stringify(b.tables);
    await expect(repondre(b, 'lot-1', B, '2026-11-19T08:00:05.000Z')).rejects.toThrow(ActeDejaEnregistreError);
    expect(JSON.stringify(b.tables)).toBe(avant);
  });

  it('A → B → A : trois actes, le dernier A est vivant, et lui seul', async () => {
    const b = fausseBase();
    const a1 = await repondre(b, 'lot-1', A, '2026-11-19T08:00:00.000Z');
    const b1 = await repondre(b, 'lot-2', B, '2026-11-19T09:00:00.000Z');
    const a2 = await repondre(b, 'lot-3', A, '2026-11-19T10:00:00.000Z');
    expect(new Set([a1.sourceId, b1.sourceId, a2.sourceId]).size).toBe(3);
    expect(sources(b)).toHaveLength(3);
    expect(new Set(vivantes(b).map((e) => e.source_id))).toEqual(new Set([a2.sourceId]));
    // Les deux premiers restent lisibles dans l'historique, marqués remplacés par le dernier.
    for (const e of b.tables.knowledge_evidences.filter((x) => x.source_id === b1.sourceId)) expect(e.superseded_by).toBe(a2.sourceId);
  });

  it('renvoi du dernier A après A → B → A : rien ne change', async () => {
    const b = fausseBase();
    await repondre(b, 'lot-1', A, '2026-11-19T08:00:00.000Z');
    await repondre(b, 'lot-2', B, '2026-11-19T09:00:00.000Z');
    const a2 = await repondre(b, 'lot-3', A, '2026-11-19T10:00:00.000Z');
    const avant = JSON.stringify(b.tables);
    const encore = await repondre(b, 'lot-3', A, '2026-11-19T10:00:07.000Z');
    expect(encore).toMatchObject({ dejaFaite: true, sourceId: a2.sourceId });
    expect(JSON.stringify(b.tables)).toBe(avant);
  });

  it('renvoi du PREMIER A après A → B : il ne ressuscite pas — B reste le dernier mot', async () => {
    const b = fausseBase();
    const a1 = await repondre(b, 'lot-1', A, '2026-11-19T08:00:00.000Z');
    const b1 = await repondre(b, 'lot-2', B, '2026-11-19T09:00:00.000Z');
    const avant = JSON.stringify(b.tables);
    const encore = await repondre(b, 'lot-1', A, '2026-11-19T09:30:00.000Z');
    expect(encore).toMatchObject({ dejaFaite: true, sourceId: a1.sourceId });
    expect(JSON.stringify(b.tables)).toBe(avant);
    expect(new Set(vivantes(b).map((e) => e.source_id))).toEqual(new Set([b1.sourceId]));
  });

  it('une réponse ultérieure IDENTIQUE à une ancienne est un acte à part entière', async () => {
    const b = fausseBase();
    const a1 = await repondre(b, 'lot-1', A, '2026-11-19T08:00:00.000Z');
    const a2 = await repondre(b, 'lot-2', A, '2026-11-20T08:00:00.000Z');
    expect(a2.dejaFaite).toBeUndefined();
    expect(a2.sourceId).not.toBe(a1.sourceId);
    expect(a2.preuvesEcrites).toBe(a1.preuvesEcrites);
    // Elle ne s'additionne pas à l'ancienne : une seule conviction vivante, la plus récente.
    expect(new Set(vivantes(b).map((e) => e.source_id))).toEqual(new Set([a2.sourceId]));
  });

  it('deux actes DISTINCTS arrivés en même temps : un seul dernier mot, le même pour les deux', async () => {
    const b = fausseBase();
    const [x, y] = await Promise.all([repondre(b, 'lot-1', A, '2026-11-19T08:00:00.000Z'), repondre(b, 'lot-2', B, '2026-11-19T08:00:00.500Z')]);
    expect(sources(b)).toHaveLength(2);
    expect(new Set(vivantes(b).map((e) => e.source_id))).toEqual(new Set([y.sourceId]));
    void x;
  });

  it('une réponse dont aucune option n’émet reste un acte : son renvoi est reconnu', async () => {
    const qa = BANQUE.find((x) => x.forme === 'single' && x.options.some((o) => produireDepuisOption(x, o).type === 'rien'));
    if (!qa) return;
    const o = qa.options.find((x) => produireDepuisOption(qa, x).type === 'rien')!;
    const b = fausseBase();
    const r1 = await enregistrerReponseFermee(b.client, { userId: U, questionId: qa.id, clesOptions: [cleOption(o)], acteId: 'lot-1' });
    const r2 = await enregistrerReponseFermee(b.client, { userId: U, questionId: qa.id, clesOptions: [cleOption(o)], acteId: 'lot-1' });
    expect(r1.dejaFaite).toBeUndefined();
    expect(r2.dejaFaite).toBe(true);
    expect(sources(b)).toHaveLength(1);
  });

  it('un acte sans identité est refusé', async () => {
    const b = fausseBase();
    await expect(repondre(b, '  ', A, '2026-11-19T08:00:00.000Z')).rejects.toThrow();
    expect(b.ecritures).toHaveLength(0);
  });
});

describe('réponse ouverte — le verbatim avant tout appel au modèle, et l’identité de l’acte', () => {
  const ouverte = BANQUE.find((x) => x.forme === 'open' && x.id !== 'food2.0882A' && (x.inferences_interdites || x.options.some((o) => o.inferences_interdites)))!;
  beforeAll(() => {
    // Aucun modèle joignable : la lecture échoue, et c'est le cas qu'on veut éprouver.
    process.env.ANTHROPIC_API_KEY = 'cle-de-test'; process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
  });
  const ecrire = (b: ReturnType<typeof fausseBase>, acteId: string, texte: string, timestamp: string) =>
    enregistrerReponseOuverte(b.client, { userId: U, questionId: ouverte.id, texte, acteId, timestamp });

  it('modèle en panne : la phrase est au journal, et la lecture est dite EN ATTENTE, jamais réussie', async () => {
    const b = fausseBase();
    const r = await ecrire(b, 'lot-1', 'J’aime les matins calmes.', '2026-11-19T08:00:00.000Z');
    expect(r).toMatchObject({ verbatimEcrit: true, extractionEnAttente: true, preuvesExtraites: 0 });
    expect(b.tables.knowledge_facts).toHaveLength(1);
    expect(b.tables.knowledge_facts[0].value).toBe('J’aime les matins calmes.');
    // La première écriture est celle du verbatim : aucune écriture ne le précède.
    expect(b.ecritures[0]).toMatchObject({ op: 'rpc' });
    expect(b.tables.knowledge_sources.map((s) => s.source_type)).toEqual(['discovery_open']);
  }, 20_000);

  it('la même requête renvoyée : pas de second verbatim', async () => {
    const b = fausseBase();
    const r1 = await ecrire(b, 'lot-1', 'J’aime les matins calmes.', '2026-11-19T08:00:00.000Z');
    const avant = JSON.stringify(b.tables);
    const r2 = await ecrire(b, 'lot-1', 'J’aime les matins calmes.', '2026-11-19T08:00:09.000Z');
    expect(r2).toMatchObject({ dejaFaite: true, verbatimEcrit: false, verbatimSourceId: r1.verbatimSourceId });
    expect(JSON.stringify(b.tables)).toBe(avant);
  }, 20_000);

  it('une nouvelle réponse remplace l’ancienne : un seul verbatim vivant', async () => {
    const b = fausseBase();
    const r1 = await ecrire(b, 'lot-1', 'J’aime les matins calmes.', '2026-11-19T08:00:00.000Z');
    const r2 = await ecrire(b, 'lot-2', 'En fait, plutôt les soirées.', '2026-11-19T09:00:00.000Z');
    const vivants = b.tables.knowledge_facts.filter((f) => f.superseded_at === null);
    expect(vivants.map((f) => f.source)).toEqual([r2.verbatimSourceId]);
    expect(b.tables.knowledge_facts.find((f) => f.source === r1.verbatimSourceId)!.superseded_by).toBe(r2.verbatimSourceId);
  }, 20_000);

  it('le même acte avec un autre texte est refusé', async () => {
    const b = fausseBase();
    await ecrire(b, 'lot-1', 'J’aime les matins calmes.', '2026-11-19T08:00:00.000Z');
    await expect(ecrire(b, 'lot-1', 'Autre chose.', '2026-11-19T08:00:09.000Z')).rejects.toThrow(ActeDejaEnregistreError);
  }, 20_000);
});
