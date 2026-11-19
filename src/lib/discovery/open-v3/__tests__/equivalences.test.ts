import { describe, it, expect } from 'vitest';
import type { EtatDiscovery } from '../conditions';
import { motifDExclusion, prochainesQuestions } from '../selection';
import { question } from '../banque';
import { ALIAS_BRANCHES } from '../branches';
import { SOUS_PARTIES } from '../correspondances';
import { appartenance, GROUPES_D_INTENTION } from '../equivalences';
import table from '../equivalences-d-intention.json';

// D7 (19 nov.) — « Une même intention déjà suffisamment renseignée ne doit pas être reposée par une
// autre génération. Privilégie la question canonique actuelle. Réutilise une réponse historique
// seulement lorsqu'une équivalence est établie, avec même objet et même portée. Déclare ces
// équivalences explicitement, sans simple rapprochement de libellés. »

const vide: EtatDiscovery = {
  tags: new Map(), nePasCreuser: new Set(), branchesOuvertes: new Set(),
  niveauParBranche: new Map(), dejaPosees: new Set(), attributsConnus: new Set(),
  sansAlcool: false, contextesConnus: new Set(), contextesActifs: new Set(),
  aliasBranches: ALIAS_BRANCHES, reglesSousParties: SOUS_PARTIES, projets: new Map(), sujetsChoisis: new Set(),
};
const etat = (p: Partial<EtatDiscovery>): EtatDiscovery => ({ ...vide, ...p });
const sport = (p: Partial<EtatDiscovery> = {}) => etat({
  branchesOuvertes: new Set(['sport', 'sportp']), niveauParBranche: new Map([['sport', 'A'], ['sportp', 'A']] as const),
  tags: new Map([['INTEREST.sport', 'positive'], ['INTEREST.sportp', 'positive']]), ...p,
});

describe('la table des équivalences est déclarée, justifiée et vérifiée', () => {
  it('chaque membre porte une justification écrite ; aucune question n’est dans deux groupes', () => {
    const vus = new Set<string>();
    for (const g of GROUPES_D_INTENTION) {
      expect(g.intention.length).toBeGreaterThan(5);
      for (const id of [g.canonique, ...g.membres.map((m) => m.id)]) { expect(vus.has(id), id).toBe(false); vus.add(id); expect(question(id), id).toBeTruthy(); }
      for (const m of g.membres) expect(m.justification.length, m.id).toBeGreaterThan(10);
    }
  });
  it('« identique » veut dire les mêmes options (à l’apostrophe près), vérifié au chargement', () => {
    const f = (id: string) => question(id)!.options.map((o) => o.libelle.replace(/’/g, "'"));
    for (const g of GROUPES_D_INTENTION) for (const m of g.membres) if (m.equivalence === 'identique') expect(f(m.id), m.id).toEqual(f(g.canonique));
  });
  it('les paires examinées et laissées distinctes sont écrites (objet ou portée différents)', () => {
    expect((table as { hors_table: string }).hors_table).toMatch(/food\.0021 \(place\) \/ food2\.0856 \(plaisirs\)/);
    for (const id of ['food.0021', 'art.0128', 'museum.0698', 'music2.1004']) expect(appartenance(id), id).toBeUndefined();
  });
});

describe('une question par intention', () => {
  it('Camille : « sport.0183 » et « sportp.0503 » ne sont plus servies ensemble ; la canonique actuelle passe d’abord', () => {
    const e = sport();
    expect(motifDExclusion(question('sportp.0503')!, e)).toBeNull();
    expect(motifDExclusion(question('sport.0183')!, e)).toBe('intention_canonique_d_abord');
    const lot = prochainesQuestions(e, { combien: 20, parBranche: 20 }).choix.map((c) => c.question.id);
    expect(lot.filter((id) => id === 'sport.0183' || id === 'sportp.0503')).toEqual(['sportp.0503']);
  });
  it('une fois la canonique posée, l’ancienne génération à échelle différente n’est pas reposée', () => {
    expect(motifDExclusion(question('sport.0183')!, sport({ dejaPosees: new Set(['sportp.0503']) }))).toBe('intention_canonique_d_abord');
  });
  it('une ancienne réponse IDENTIQUE renseigne l’intention : la canonique n’est pas reposée', () => {
    const e = etat({ branchesOuvertes: new Set(['games']), niveauParBranche: new Map([['games', 'A']] as const), tags: new Map([['CONTEXT.discovery.open.board_game', 'true'], ['INTEREST.games', 'positive']]), dejaPosees: new Set(['games.0946']) });
    expect(motifDExclusion(question('JDS-01')!, { ...e, dejaPosees: new Set() })).toBeNull();
    expect(motifDExclusion(question('JDS-01')!, e)).toBe('intention_renseignee');
  });
  it('une ancienne réponse à ÉCHELLE DIFFÉRENTE ne dispense pas de la canonique', () => {
    const e = sport({ dejaPosees: new Set(['sport.0183']) });
    expect(motifDExclusion(question('sportp.0503')!, e)).not.toBe('intention_renseignee');
  });
});

describe('D10 : progression par (question, préparation)', async () => {
  const { requiertProjet } = await import('../selection');
  const { poolDe } = await import('../coexistence');
  const q = question('travel2.0937')!;                       // « Pour ce séjour précis, qu'aimerais-tu surtout vivre ? »
  const pool = poolDe(q.branche);
  const base = (courant: string, posees: [string, string[]][]) => etat({
    branchesOuvertes: new Set([q.branche]), niveauParBranche: new Map([[q.branche, 'C']] as const),
    projets: new Map([[pool, new Set(['sejour'] as const)]]), dejaPosees: new Set(['travel2.0937']),
    projetsCourants: new Map([[`${pool}|sejour`, { id: courant, debut: '2026-11-19T10:00:00Z' }]]),
    poseesParProjet: new Map(posees.map(([k, v]) => [k, new Set(v)] as const)),
  });
  it('une question propre au séjour, répondue pour Lisbonne, est reposée pour Kyoto', () => {
    expect(requiertProjet(q)).toBe('sejour');
    expect(motifDExclusion(q, base('lisbonne', [['travel2.0937', ['lisbonne']]]))).toBe('deja_posee');
    expect(motifDExclusion(q, base('kyoto', [['travel2.0937', ['lisbonne']]]))).not.toBe('deja_posee');
  });
  it('une question générale n’est pas reposée à chaque nouveau projet', () => {
    const g = question('travel2.0919')!;                     // « Quel défaut peut gâcher presque tout ton séjour ? » (D3 : générale)
    expect(requiertProjet(g)).toBeNull();
    const e = { ...base('kyoto', []), dejaPosees: new Set(['travel2.0919']) };
    expect(motifDExclusion(g, e)).toBe('deja_posee');
  });
  it('sans lecture des préparations, la règle stricte tient : une fois', () => {
    const e = { ...base('kyoto', []), projetsCourants: undefined, poseesParProjet: undefined };
    expect(motifDExclusion(q, e)).toBe('deja_posee');
  });
});
