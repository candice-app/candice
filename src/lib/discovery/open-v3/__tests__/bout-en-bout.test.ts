import { fauxClientLecture } from '../../../knowledge/__tests__/faux-client';
import { describe, it, expect, vi } from 'vitest';
import { BANQUE } from '../banque';
import { prochainesQuestions } from '../selection';
import { cleOption, enregistrerReponseFermee } from '../service';
import { produireDepuisOption } from '../produire';
import type { EtatDiscovery } from '../conditions';

// L'ALLER-RETOUR : une question servie doit pouvoir être répondue, et la réponse écrite.
//
// Ce test existe à cause d'un défaut réel. Le branchement a d'abord laissé la reprise de
// session résoudre la question courante dans l'ANCIENNE table : une session de six
// questions s'arrêtait après la première, sans question suivante ni fin de session. Rien
// ne l'a signalé — ni `tsc`, ni les tests unitaires de chaque pièce prise à part, parce que
// chaque pièce allait bien. C'est la CHAÎNE qui était rompue.
//
// On éprouve donc la chaîne : ce que la sélection sert, l'enregistrement doit l'accepter.

const faux = (tables: Record<string, readonly unknown[]> = {}) => {
  const appels: { fn: string; args: Record<string, unknown> }[] = [];
  return {
    appels,
    client: {
      // Les lectures passent par un faux client qui APPLIQUE les filtres (réponses déjà
      // données à la question) ; les écritures restent espionnées.
      from: fauxClientLecture(tables).from,
      rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
        appels.push({ fn, args });
        return { data: { sources: 1, evidences: 1, facts: 0, open: 0 }, error: null };
      }),
    },
  };
};

/** L'état le plus permissif qu'on puisse fabriquer : pour que la sélection ait de quoi servir. */
function etatPermissif(): EtatDiscovery {
  const branches = new Set(BANQUE.map((q) => q.branche));
  return {
    tags: new Map(BANQUE.map((q) => [`INTEREST.${q.branche}`, 'positive'] as const)),
    nePasCreuser: new Set(),
    branchesOuvertes: branches,
    niveauParBranche: new Map([...branches].map((b) => [b, 'C'] as const)),
    dejaPosees: new Set(),
    attributsConnus: new Set(),
    sansAlcool: false,
    contextesConnus: new Set(['achat concret']),
    contextesActifs: new Set(['achat concret']),
  };
}

describe('ce que la sélection sert, l’enregistrement l’accepte', () => {
  it('chaque question servie a des options dont les clés sont reconnues au retour', async () => {
    const servies = prochainesQuestions(etatPermissif(), { combien: 40, parBranche: 40 }).choix;
    expect(servies.length).toBeGreaterThan(10); // sinon le test passerait à vide

    let eprouvees = 0;
    for (const c of servies) {
      const q = c.question;
      if (q.forme !== 'single') continue;
      // On prend une option qui produit une preuve : c'est le cas qui doit écrire.
      const opt = q.options.find((o) => produireDepuisOption(q, o).type === 'evidence');
      if (!opt) continue;
      const { client, appels } = faux();
      await enregistrerReponseFermee(client, {
        userId: '00000000-0000-4000-8000-000000000001',
        acteId: 'lot-test', questionId: q.id,
        clesOptions: [cleOption(opt)],
        timestamp: '2026-11-17T12:00:00.000Z',
      });
      // Une écriture a bien eu lieu, et elle porte quelque chose.
      expect(appels, `${q.id} n'a rien écrit`).toHaveLength(1);
      const preuves = appels[0].args.p_evidences as Record<string, unknown>[];
      expect(preuves.length, `${q.id} : zéro preuve`).toBeGreaterThan(0);
      eprouvees++;
    }
    expect(eprouvees, 'aucune question n’a pu être éprouvée de bout en bout').toBeGreaterThan(5);
  });

  it('une question servie est toujours retrouvable dans la banque par son identifiant', () => {
    // C'est l'invariant que la reprise de session enfreignait : elle cherchait la question
    // courante ailleurs que là où la sélection l'avait prise.
    const servies = prochainesQuestions(etatPermissif(), { combien: 60, parBranche: 60 }).choix;
    expect(servies.length).toBeGreaterThan(10);
    const parId = new Map(BANQUE.map((q) => [q.id, q] as const));
    for (const c of servies) {
      expect(parId.get(c.question.id), `${c.question.id} servie mais introuvable`).toBeDefined();
    }
  });

  it('une question déjà répondue ne revient pas dans le lot suivant', () => {
    const etat = etatPermissif();
    const premier = prochainesQuestions(etat, { combien: 5, parBranche: 5 }).choix.map((c) => c.question.id);
    expect(premier.length).toBeGreaterThan(0);
    const apres: EtatDiscovery = { ...etat, dejaPosees: new Set(premier) };
    const second = prochainesQuestions(apres, { combien: 5, parBranche: 5 }).choix.map((c) => c.question.id);
    for (const id of second) expect(premier).not.toContain(id);
  });
});

describe('la forme servie et la forme attendue ne divergent pas', () => {
  it('une question « single » refuse deux options, une « multi » les accepte', async () => {
    const etat = etatPermissif();
    const servies = prochainesQuestions(etat, { combien: 60, parBranche: 60 }).choix;
    const single = servies.find((c) => c.question.forme === 'single' && c.question.options.length >= 2);
    const multi = servies.find((c) => c.question.forme === 'multi' && c.question.options.length >= 2);

    if (single) {
      const q = single.question;
      const { client } = faux();
      await expect(enregistrerReponseFermee(client, {
        userId: '00000000-0000-4000-8000-000000000001',
        acteId: 'lot-test', questionId: q.id,
        clesOptions: [cleOption(q.options[0]), cleOption(q.options[1])],
      })).rejects.toThrow();
    }
    if (multi) {
      const q = multi.question;
      const productives = q.options.filter((o) => produireDepuisOption(q, o).type === 'evidence');
      if (productives.length >= 2) {
        const { client, appels } = faux();
        await enregistrerReponseFermee(client, {
          userId: '00000000-0000-4000-8000-000000000001',
          acteId: 'lot-test', questionId: q.id,
          clesOptions: productives.slice(0, 2).map(cleOption),
          timestamp: '2026-11-17T12:00:00.000Z',
        });
        const preuves = appels[0].args.p_evidences as Record<string, unknown>[];
        expect(preuves.length).toBeGreaterThanOrEqual(2);
      }
    }
    // Au moins l'une des deux formes doit avoir été trouvée, sinon ce test ne prouve rien.
    expect(Boolean(single || multi)).toBe(true);
  });
});
