import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../../knowledge/__tests__/fausse-base';
import { enregistrerReponseOuverte } from '../service';
import { FAIT_ENVIE_CULINAIRE } from '../envie-culinaire';

/* 20 nov. — Revue du deuxième passage réel, point 5. Le script 34 déclarait l'envie « en panne » parce
 * qu'il n'observait que le lecteur des destinations, alors que food2.0882A a son lecteur propre. Ici :
 * chaque lecteur est observé à part, et le statut rendu par le service reste la seule source d'une panne. */
const U = '00000000-0000-4000-8000-0000000000e5';
const compteur = <T,>(rendu: () => Promise<T>) => { const c = { appels: 0, f: async () => { c.appels++; return rendu(); } }; return c; };
const panne = async (): Promise<never> => { throw new Error('modèle injoignable'); };
const verbatim = (b: ReturnType<typeof fausseBase>, q: string, t: string) => b.tables.knowledge_facts.some((f) => f.fact_type === `discovery.${q}` && f.value === t);
const envies = (b: ReturnType<typeof fausseBase>) => b.tables.knowledge_facts.filter((f) => f.fact_type === FAIT_ENVIE_CULINAIRE && !f.superseded_at);

describe('food2.0882A — le lecteur de l’envie est le sien, observé à part', () => {
  it('envie exprimée : SON lecteur est appelé une fois, celui des destinations jamais ; l’envie est écrite, le verbatim gardé', async () => {
    const b = fausseBase(); const T = 'J’ai très envie de ramen tonkotsu en ce moment.';
    const env = compteur(async () => ({ exprime_envie: true, details: ['ramen tonkotsu'], periode: 'en ce moment', contraintes_declarees: [] }));
    const dest = compteur(async () => ({ segments: [] }));
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'food2.0882A', texte: T, acteId: 'e-1', lecteur: dest.f, lecteurEnvie: env.f });
    expect(r).toMatchObject({ verbatimEcrit: true, extractionEnAttente: false, envie: { ecrite: true, luParLeModele: true } });
    expect([env.appels, dest.appels]).toEqual([1, 0]);
    expect(envies(b)).toHaveLength(1);
    expect(verbatim(b, 'food2.0882A', T)).toBe(true);
  });
  it('réponse lue sans envie : appelé, rien écrit, pas une panne', async () => {
    const b = fausseBase(); const T = 'Rien de particulier, je mange de tout.';
    const env = compteur(async () => ({ exprime_envie: false, details: [], contraintes_declarees: [] }));
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'food2.0882A', texte: T, acteId: 'e-2', lecteurEnvie: env.f });
    expect(r).toMatchObject({ verbatimEcrit: true, extractionEnAttente: false, envie: { ecrite: false, luParLeModele: true } });
    expect(env.appels).toBe(1);
    expect(envies(b)).toHaveLength(0);
    expect(verbatim(b, 'food2.0882A', T)).toBe(true);
  });
  it('absence d’envie décidée sans modèle : AUCUN appel, et ce n’est pas une panne', async () => {
    const b = fausseBase();
    const env = compteur(async () => ({ exprime_envie: true, details: ['x'], contraintes_declarees: [] }));
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'food2.0882A', texte: 'Pas en ce moment.', acteId: 'e-3', lecteurEnvie: env.f });
    expect(r).toMatchObject({ verbatimEcrit: true, extractionEnAttente: false, envie: { ecrite: false, luParLeModele: false } });
    expect(env.appels).toBe(0);
    expect(verbatim(b, 'food2.0882A', 'Pas en ce moment.')).toBe(true);
  });
  it('panne VÉRITABLE du lecteur de l’envie : lecture en attente, rien d’écrit, verbatim gardé', async () => {
    const b = fausseBase(); const T = 'J’ai très envie de ramen tonkotsu.';
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'food2.0882A', texte: T, acteId: 'e-4', lecteurEnvie: panne });
    expect(r).toMatchObject({ verbatimEcrit: true, extractionEnAttente: true });
    expect(r.envie).toBeUndefined();
    expect(envies(b)).toHaveLength(0);
    expect(verbatim(b, 'food2.0882A', T)).toBe(true);
  });
});

describe('onglet 17 — le lecteur des destinations, observé à part', () => {
  it('appelé une fois ; celui de l’envie jamais', async () => {
    const b = fausseBase();
    const env = compteur(async () => ({})); const dest = compteur(async () => ({ segments: [] }));
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie.', acteId: 'd-1', lecteur: dest.f, lecteurEnvie: env.f });
    expect(r).toMatchObject({ verbatimEcrit: true, extractionEnAttente: false });
    expect([dest.appels, env.appels]).toEqual([1, 0]);
  });
  it('panne VÉRITABLE du lecteur des destinations : lecture en attente, verbatim gardé, jamais « rien à extraire »', async () => {
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie.', acteId: 'd-2', lecteur: panne });
    expect(r).toMatchObject({ verbatimEcrit: true, extractionEnAttente: true, preuvesExtraites: 0 });
    expect(r.destinations).toBeUndefined();
    expect(verbatim(b, 'learning2.1459', 'La géologie.')).toBe(true);
  });
});
