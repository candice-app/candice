import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  ALIAS_BRANCHES, SOUS_PARTIES, HYPOTHESES, LIGNES_DE_CORRESPONDANCE, JUMELLES, TAGS_ATTENDUS, PRESUMENT_L_ALCOOL,
  memeSujet, ouvertParCategorie, ouvertParDomaineJournal, libelleBranche,
} from '../correspondances';
import { BANQUE, question } from '../banque';
import { verdictDe, prochainesQuestions } from '../selection';
import type { EtatDiscovery } from '../conditions';
import ouvertures from '../ouvertures-explicites.json';

// LES CORRESPONDANCES SONT EXPLICITES, SOURCÉES, ET FIGÉES. Aucune fréquence ne décide.
const vide: EtatDiscovery = {
  tags: new Map(), nePasCreuser: new Set(), branchesOuvertes: new Set(), niveauParBranche: new Map(), dejaPosees: new Set(),
  attributsConnus: new Set(), sansAlcool: false, contextesConnus: new Set(), contextesActifs: new Set(),
  aliasBranches: ALIAS_BRANCHES, reglesSousParties: SOUS_PARTIES, projets: new Map(),
};
/** L'état de quelqu'un qui a coché cette catégorie, construit comme `lireEtat` le fait. */
function aCoche(...categories: string[]): EtatDiscovery {
  const ouvertes = new Set<string>(); const signalees = new Set<string>(); const tags = new Map<string, string>();
  for (const c of categories) {
    tags.set(`INTEREST.${c}`, 'positive'); ouvertes.add(c);
    for (const b of ALIAS_BRANCHES.get(c) ?? []) for (const v of memeSujet(b)) ouvertes.add(v);
    const o = ouvertParCategorie(c);
    for (const b of o.branches) for (const v of memeSujet(b)) ouvertes.add(v);
    for (const q of o.questions) signalees.add(q);
  }
  for (const b of ouvertes) for (const t of TAGS_ATTENDUS.get(b) ?? []) tags.set(t, 'positive');
  return { ...vide, tags, branchesOuvertes: ouvertes, questionsSignalees: signalees, niveauParBranche: new Map([...ouvertes].map((b) => [b, 'A' as const])) };
}
const ouvertesDe = (e: EtatDiscovery) => BANQUE.filter((q) => verdictDe(q, e) === 'ouvrir');
const branchesDe = (e: EtatDiscovery) => new Set(ouvertesDe(e).map((q) => q.branche));

describe('la table est explicite : chaque ligne porte sa source et sa justification', () => {
  it('aucune ligne sans source ni justification ; deux statuts seulement', () => {
    for (const l of LIGNES_DE_CORRESPONDANCE) {
      expect(l.source.length, l.nom).toBeGreaterThan(10);
      expect(l.justification.length, l.nom).toBeGreaterThan(20);
      expect(['etablie', 'hypothese']).toContain(l.statut);
    }
  });
  it('une hypothèse n’ouvre rien : elle n’est ni un alias ni une sous-partie', () => {
    expect(HYPOTHESES.length).toBeGreaterThan(0);
    for (const h of HYPOTHESES) { expect(ALIAS_BRANCHES.has(h.nom), h.nom).toBe(false); expect(SOUS_PARTIES.has(h.nom), h.nom).toBe(false); }
  });
  it('« Couple » n’est plus un autre nom de la branche Relation', () => {
    expect(ALIAS_BRANCHES.has('couple')).toBe(false);
    expect(SOUS_PARTIES.get('couple')).toMatchObject({ regle: 'non_resolue', parents: ['relation2'] });
  });
  it('un nom désigne une branche parce qu’il en est l’identifiant ou le nom officiel', () => {
    expect([...ALIAS_BRANCHES.get('esthetique')!]).toEqual(['aesthetic']);
    expect(new Set(ALIAS_BRANCHES.get('cinema'))).toEqual(new Set(['cinema', 'cinema2']));
    expect(new Set(ALIAS_BRANCHES.get('beaute'))).toEqual(new Set(['beauty', 'beauty2']));
    expect([...ALIAS_BRANCHES.get('rapport a l’argent')!]).toEqual(['money']);
  });
  it('la table figée est celle que les critères proposent pour la banque d’aujourd’hui (alarme de dérive)', () => {
    // Si le classeur change, ce test tombe : la table n'a PAS bougé, et l'écart doit être relu.
    const sortie = execFileSync('npx', ['tsx', 'scripts/discovery/proposer-correspondances.mts', '--verifier'], { encoding: 'utf8' });
    expect(sortie).toMatch(/table figée = candidats recalculés/);
  }, 60_000);
  it('une branche de la refonte s’ouvre avec la branche historique de même nom officiel', () => {
    expect([...JUMELLES.get('Chaussures')!]).toEqual(['shoes']);
    expect([...JUMELLES.get('Célébration')!]).toEqual(['celebration']);      // pas « Célébration avancée »
    expect(new Set(memeSujet('food'))).toEqual(new Set(['food', 'food2', 'Food & Gastronomie']));
  });
  it('le nom que la personne lit est le nom officiel, jamais un identifiant', () => {
    expect(libelleBranche('travel2')).toBe('Voyage & Hôtellerie');
    expect(libelleBranche('celebav')).toBe('Célébration avancée');
    expect(libelleBranche('brand')).toBeNull();
    expect(libelleBranche('THE-06')).toBeNull();
  });
});

describe('ce qu’une catégorie de l’onboarding ouvre — et ce qu’elle n’ouvre pas', () => {
  it('« Bien-être » ouvre le bien-être', () => {
    // … et les sept questions historiques « Goûts sensoriels », dont la condition du classeur
    // nomme elle-même le bien-être (« Mode, décoration, voyage, restaurants, concerts ou bien-être actifs »).
    expect(branchesDe(aCoche('bienetre'))).toEqual(new Set(['wellbeing', 'sensory']));
  });
  it('« Déco & maison » ouvre la maison, ses deux générations, sans les dupliquer', () => {
    const e = aCoche('deco');
    expect(branchesDe(e)).toEqual(new Set(['home', 'home2']));
    // Un seul domaine visible : le plafond d'un lot compte les deux générations pour une.
    const lot = prochainesQuestions(e, { combien: 6 }).choix.map((c) => c.question.branche);
    expect(lot.length).toBeLessThanOrEqual(2);
  });
  it('« Ciné & séries » ouvre le cinéma ET les séries', () => {
    const b = branchesDe(aCoche('cinema'));
    for (const x of ['cinema2', 'series2']) expect(b.has(x), x).toBe(true);
  });
  it('« Vin & spiritueux » n’ouvre que la question sur le vin — pas le reste des boissons', () => {
    const e = aCoche('vin');
    expect(ouvertesDe(e).map((q) => q.id)).toEqual(['drinks.2093']);
    // Aucune réponse n'est écrite à la place de la personne : la question de tri reste à poser… ailleurs.
    expect(e.optionsChoisies).toBeUndefined();
  });
  it('« ne boit pas » ferme la question sur le vin, et elle seule parmi ce que « Vin » ouvrait', () => {
    expect(ouvertesDe({ ...aCoche('vin'), sansAlcool: true })).toEqual([]);
  });
  it('« ne boit pas » ne ferme PAS la cuisine : seules les questions qui présument l’alcool', () => {
    const avec = ouvertesDe(aCoche('cuisine')).map((q) => q.id);
    const sans = ouvertesDe({ ...aCoche('cuisine'), sansAlcool: true }).map((q) => q.id);
    expect(sans.length).toBeGreaterThan(20);
    const fermees = avec.filter((id) => !sans.includes(id));
    expect(fermees.every((id) => PRESUMENT_L_ALCOOL.has(id)), fermees.join(',')).toBe(true);
    expect(sans).toContain('food.0021');
    expect(sans).not.toContain('food.0049');
  });
  it('« Mode & beauté » ouvre la mode ; ni les sacs, ni les chaussures, ni les bijoux, ni les montres', () => {
    const b = branchesDe(aCoche('mode'));
    expect(b.has('fashion2')).toBe(true);
    for (const x of ['bags', 'shoes', 'jewelry', 'watch', 'beauty2']) expect(b.has(x), x).toBe(false);
  });
  it('« Sport » ouvre le sport pratiqué, pas le sport regardé', () => {
    const b = branchesDe(aCoche('sport'));
    expect(b.has('sportp')).toBe(true); expect(b.has('sportw')).toBe(false);
  });
  it('chaque branche qu’une catégorie écarte porte sa raison ; les arbitrages attendus sont nommés', () => {
    const cats = (ouvertures as { categories_onboarding: { id: string; non_ouvertes?: { branche: string; raison: string; a_decider?: boolean }[] }[] }).categories_onboarding;
    expect(cats).toHaveLength(13);
    const aDecider = cats.flatMap((c) => (c.non_ouvertes ?? []).filter((n) => n.a_decider).map((n) => `${c.id}→${n.branche}`));
    expect(aDecider.sort()).toEqual(['mode→beauty2', 'nature→garden', 'tech→gaming2']);
  });
  it('un domaine du journal tenu pour une hypothèse n’ouvre rien', () => {
    expect(ouvertParDomaineJournal('jewelry_watches').branches).toEqual([]);
    expect(ouvertParDomaineJournal('books_literature').branches).toEqual(['reading', 'reading2']);
    expect(ouvertParDomaineJournal('family_parenting').branches).toEqual([]);
  });
  it('AUCUNE ouverture ne crée de préférence : ouvrir, c’est seulement permettre une question', () => {
    // La table ne porte que des branches et des questions ; aucun champ de valeur, de degré ou de goût.
    const brut = JSON.stringify((ouvertures as { categories_onboarding: unknown[] }).categories_onboarding);
    expect(brut).not.toMatch(/"(valeur|intensite|polarite|preference|strength)"/);
  });
});

describe('« très peu de place » n’est ni un rejet ni un refus', () => {
  it('une faible place ne ferme aucune question : elle fait passer les autres sujets d’abord', () => {
    const e = aCoche('sport', 'lecture');
    const sportAvant = ouvertesDe(e).filter((q) => q.branche === 'sport').length;
    const faible = { ...e, placeFaible: new Set(['sport']) };
    expect(ouvertesDe(faible).filter((q) => q.branche === 'sport').length).toBe(sportAvant);
    const ordre = prochainesQuestions(faible, { combien: 4, parBranche: 2 }).choix.map((c) => c.question.branche);
    const premierSport = ordre.findIndex((b) => b === 'sport' || b === 'sportp');
    const premiereLecture = ordre.findIndex((b) => b.startsWith('reading'));
    expect(premiereLecture).toBeGreaterThanOrEqual(0);
    if (premierSport >= 0) expect(premiereLecture).toBeLessThan(premierSport);
  });
  it('dans le référentiel révisé, les dix-neuf « Très peu de place » ont la même polarité, et aucune n’est un rejet', () => {
    const contrats = BANQUE.filter((q) => /^Quelle place .+ réellement dans ta vie \?$/.test(q.enonce))
      .map((q) => q.options.find((o) => o.libelle === 'Très peu de place')).filter(Boolean);
    expect(contrats).toHaveLength(19);
    expect(new Set(contrats.map((o) => o!.polarite))).toEqual(new Set(['absence_de_critere']));
  });
  it('seul un refus EXPLICITE arrête les questions d’un sujet, et il vaut pour le sujet entier', () => {
    const e = { ...aCoche('voyage'), nePasCreuser: new Set(memeSujet('travel2')) };
    expect(prochainesQuestions(e, { combien: 50, parBranche: 50 }).choix.filter((c) => c.question.branche.startsWith('travel'))).toEqual([]);
  });
});

describe('révision éditoriale : plus aucun énoncé au gabarit mal formé n’est servi', () => {
  it('les 90 énoncés corrigés se lisent ; les 5 isolés sont nommés', () => {
    expect(question('reading.0106')!.enonce).toBe('Quelle place la lecture occupe-t-elle réellement dans ta vie ?');
    expect(question('series.0086')!.enonce).toBe('Quelle place les séries occupent-elles réellement dans ta vie ?');
    expect(question('sport.0184')!.enonce).toBe('Qu’est-ce que tu recherches d’abord dans le sport et l’activité physique ?');
    const restants = BANQUE.filter((q) => /culture — |occupe-t-il réellement dans ta vie/.test(q.enonce) && !/^Quelle place (le|l’)/.test(q.enonce)).map((q) => q.id);
    expect(restants).toEqual(['consumption.0242']);
    expect(BANQUE.filter((q) => /consommation et valeur/.test(q.enonce)).map((q) => q.id).sort()).toEqual(['consumption.0242', 'consumption.0243', 'consumption.0244', 'consumption.0245', 'consumption.0246']);
  });
});
