import { describe, it, expect } from 'vitest';
import { lirePortrait } from '../portrait';

// LE FILTRE `about` EST OBLIGATOIRE, ET IL MANQUAIT.
//
// `knowledge_evidences` porte le DÉTENTEUR (`user_id`) et la PERSONNE DÉCRITE (`about_id`).
// Les preuves d'un proche ont le MÊME `user_id` que celles du pilote — c'est lui qui les
// détient — et un `about_id` différent. Lire sur le seul `user_id` rendait le journal du
// pilote ET de tous ses proches, mélangés, sans que rien ne le signale : une entité que le
// PROCHE évite pouvait apparaître sur la fiche du pilote, et une question Discovery pouvait
// s'ouvrir parce qu'un proche s'intéresse à la céramique.
//
// Ces tests observent la REQUÊTE réellement envoyée. Vérifier le résultat ne suffirait pas :
// un client d'essai qui ne renvoie que les bonnes lignes passerait quand même, et le défaut
// resterait entier en production, où c'est la base qui filtre.

const PILOTE = '00000000-0000-4000-8000-00000000aaaa';
const PROCHE = '00000000-0000-4000-8000-00000000bbbb';

/** Client d'essai qui ENREGISTRE les filtres `eq` appliqués à chaque table. */
function clientEspion(lignes: Record<string, unknown[]>) {
  const filtres: { table: string; eq: [string, string][] }[] = [];
  const faireRequete = (table: string) => {
    const eq: [string, string][] = [];
    filtres.push({ table, eq });
    const chainable: Record<string, unknown> = {};
    const resoudre = () => {
      let data = lignes[table] ?? [];
      for (const [col, val] of eq) {
        data = data.filter((r) => String((r as Record<string, unknown>)[col]) === val);
      }
      return Promise.resolve({ data, error: null });
    };
    chainable.eq = (col: string, val: string) => { eq.push([col, val]); return chainable; };
    chainable.in = () => chainable;
    chainable.is = () => chainable;
    chainable.order = () => chainable;
    chainable.range = () => resoudre();
    chainable.then = (f: (v: unknown) => unknown) => resoudre().then(f);
    return chainable;
  };
  return {
    filtres,
    client: { from: (table: string) => ({ select: () => faireRequete(table) }) },
  };
}

describe('le portrait filtre toujours sur la personne décrite', () => {
  it('la lecture des preuves porte un filtre about_id, même sans aboutId demandé', async () => {
    const { client, filtres } = clientEspion({ knowledge_evidences: [] });
    await lirePortrait(client as never, { userId: PILOTE });
    const requete = filtres.find((f) => f.table === 'knowledge_evidences');
    expect(requete, 'aucune lecture de knowledge_evidences').toBeDefined();
    const colonnes = requete!.eq.map(([c]) => c);
    expect(colonnes).toContain('user_id');
    // LE POINT DU TEST : sans ce filtre, les proches entrent dans le portrait du pilote.
    expect(colonnes, 'about_id absent de la requête').toContain('about_id');
    expect(requete!.eq.find(([c]) => c === 'about_id')![1]).toBe(PILOTE);
  });

  it('la fiche d’un proche filtre sur CE proche, pas sur le pilote', async () => {
    const { client, filtres } = clientEspion({ knowledge_evidences: [] });
    await lirePortrait(client as never, { userId: PILOTE, aboutId: PROCHE });
    const requete = filtres.find((f) => f.table === 'knowledge_evidences')!;
    expect(requete.eq.find(([c]) => c === 'about_id')![1]).toBe(PROCHE);
    // Le détenteur reste le pilote : c'est un contrôle d'accès, distinct de la personne décrite.
    expect(requete.eq.find(([c]) => c === 'user_id')![1]).toBe(PILOTE);
  });

  it('un portrait sans preuve ne prétend rien savoir', async () => {
    const { client } = clientEspion({ knowledge_evidences: [] });
    const p = await lirePortrait(client as never, { userId: PILOTE });
    expect(p.nbPreuves).toBe(0);
    expect(p.interests).toEqual([]);
    expect(p.entities).toEqual([]);
    expect(p.guardrails).toEqual([]);
    // Le scope annonce bien le compte lu, et pas autre chose.
    expect((p.scope as unknown as { about: { kind: string; id: string } }).about.id).toBe(PILOTE);
  });
});
