import { describe, it, expect } from 'vitest';
import { activitePour, activitesDeclarees, QUESTIONS_D_ACTIVITE, prerequisDActivite } from '../activites';
import { question } from '../banque';
import { cleOption } from '../cle-option';
import { QUESTIONS_D_ENTITE } from '../entites';
import table from '../activites-referents.json';

// 20 nov. — principe validé par Estelle : un référent d'activité explicitement typé, rattaché au construct
// canonique et à sa provenance ; aimer ≠ pratiquer ; pratiquer ≠ niveau, équipement ou envie de progresser.
const cle = (q: string, l: string) => cleOption(question(q)!.options.find((o) => o.libelle === l)!);
const reponses = (...l: [string, string][]) => { const m = new Map<string, Set<string>>(); for (const [q, x] of l) { if (!m.has(q)) m.set(q, new Set()); m.get(q)!.add(cle(q, x)); } return m; };
const rien = new Map<string, Set<string>>();

describe('le référent d’activité : dérivé d’une réponse, typé, jamais une entité', () => {
  it('« Céramique ou poterie » à craft.0615 : un ATTRAIT, rattaché au construct de l’intérêt et à sa provenance', () => {
    const [a] = activitesDeclarees(reponses(['craft.0615', 'Céramique ou poterie']));
    expect(a).toEqual({ id: 'activite:creativity:ceramique_ou_poterie', libelle: 'la céramique ou la poterie', mode: 'attrait',
      construct: 'INTEREST.creativity.type_preference', provenance: { question: 'craft.0615', option: 'Céramique ou poterie' } });
  });
  it('un même nom regardé et pratiqué : deux référents distincts (deux constructs)', () => {
    const l = activitesDeclarees(reponses(['sportw.0532', 'Natation'], ['sportp.0504', 'Natation']));
    expect(l.map((a) => [a.id, a.mode])).toEqual([['activite:spectator_sport:natation', 'attrait'], ['activite:sport_practice:natation', 'pratique']]);
  });
  it('les questions d’activité ne sont plus des questions d’entité du journal', () => {
    for (const id of QUESTIONS_D_ACTIVITE) expect(QUESTIONS_D_ENTITE.has(id), id).toBe(false);
  });
  it('les réponses qui n’établissent rien de précis ne produisent aucun référent', () => {
    expect(activitesDeclarees(reponses(['craft.0642', 'Couture'], ['craft.0614', 'Je pratique moi-même une ou plusieurs activités créatives']))).toEqual([]);
    expect(Object.keys((table as { exclues: Record<string, string> }).exclues)).toEqual(expect.arrayContaining(['craft.0642', 'craft.0614', 'children.2065']));
  });
});

describe('le prérequis exact de chaque question', () => {
  const aime = activitesDeclarees(reponses(['craft.0615', 'Céramique ou poterie']));
  const pratique = activitesDeclarees(reponses(['sportp.0504', 'Escalade']));
  it('aimer ouvre « ce que tu aimes le plus dans… », pas le niveau, la fréquence ni « continuer comme aujourd’hui »', () => {
    expect(activitePour('activity.0281', aime, new Map())?.libelle).toBe('la céramique ou la poterie');
    for (const id of ['activity.0282', 'activity.0283', 'activity.0284']) expect(activitePour(id, aime, new Map()), id).toBeNull();
  });
  it('pratiquer ouvre « progresser… ou continuer », pas « ce que tu aimes »', () => {
    expect(activitePour('activity.0284', pratique, new Map())?.id).toBe('activite:sport_practice:escalade');
    expect(activitePour('activity.0281', pratique, new Map())).toBeNull();
  });
  it('niveau et fréquence restent FERMÉS (décision 9) : leur réouverture est une révision proposée, non appliquée', () => {
    for (const id of ['activity.0282', 'activity.0283']) {
      expect(prerequisDActivite(id), id).toBeNull();
      expect(activitePour(id, [...aime, ...pratique], new Map()), id).toBeNull();
    }
  });
  it('le matériel reste fermé : pratiquer ne démontre pas un équipement', () => {
    expect(prerequisDActivite('activity.0285')).toBeNull();
    expect(activitePour('activity.0285', [...aime, ...pratique], new Map())).toBeNull();
  });
  it('une question posée pour une activité ne l’est plus pour elle, mais l’est pour une autre', () => {
    const deux = activitesDeclarees(reponses(['sportp.0504', 'Escalade'], ['sportp.0504', 'Yoga']));
    const posees = new Map([['activity.0284', new Set(['activite:sport_practice:escalade'])]]);
    expect(activitePour('activity.0284', deux, posees)?.id).toBe('activite:sport_practice:yoga');
  });
  it('sans réponse, aucune activité : la question n’est pas proposée', () => {
    expect(activitesDeclarees(rien)).toEqual([]);
  });
});
