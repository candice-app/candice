import { describe, it, expect } from 'vitest';
import { analyserCondition, type EtatDiscovery } from '../conditions';
import { verdictDe } from '../selection';
import { BANQUE, question } from '../banque';
import { ALIAS_BRANCHES, SOUS_PARTIES } from '../correspondances';
import { cleOption } from '../cle-option';
import { analyseDe, lectureDe, NON_LUES, SELECTEURS_DE_LECTURE } from '../lectures';
import table from '../lectures-de-conditions.json';
import cibles from '../../../../../docs/discovery/etat-19nov/non-resolues-du-texte.json';

// LES LECTURES DES CONDITIONS EN PROSE (point 10 du mandat du 19 nov.). Une lecture rend une
// condition exécutable ; elle ne doit jamais ouvrir plus que le texte, ni toucher à une garde.

const vide: EtatDiscovery = {
  tags: new Map(), nePasCreuser: new Set(), branchesOuvertes: new Set(),
  niveauParBranche: new Map(), dejaPosees: new Set(), attributsConnus: new Set(),
  sansAlcool: false, contextesConnus: new Set(), contextesActifs: new Set(),
  aliasBranches: ALIAS_BRANCHES, reglesSousParties: SOUS_PARTIES, projets: new Map(), sujetsChoisis: new Set(),
};
const etat = (p: Partial<EtatDiscovery>): EtatDiscovery => ({ ...vide, ...p });
const cles = (sel: string, ...libelles: string[]) => {
  const q = question(sel)!;
  return new Set(libelles.map((l) => cleOption(q.options.find((o) => o.libelle === l)!)));
};
const ouvert = (branche: string, niveau: 'A' | 'B' | 'C' = 'B') => ({
  branchesOuvertes: new Set([branche]), niveauParBranche: new Map([[branche, niveau]]), tags: new Map([[`INTEREST.${branche}`, 'positive']]),
});
const T = table as unknown as { lectures: { question: string; lue: string; origine: string; demarche?: boolean }[]; non_lues: { question: string; statut: string; manque: string; choix?: string[] }[] };

describe('la table est exhaustive et sans double emploi', () => {
  it('chaque question non résolue par le texte a exactement une issue : lecture, hypothèse ou motif', () => {
    const lues = T.lectures.map((l) => l.question), nonLues = T.non_lues.map((l) => l.question);
    expect(new Set(lues).size).toBe(lues.length);
    expect(lues.filter((i) => nonLues.includes(i))).toEqual([]);
    const presentes = (cibles as { questions: string[] }).questions.filter((i) => question(i));
    expect([...lues, ...nonLues].sort()).toEqual([...presentes].sort());
  });
  it('une hypothèse porte des choix ; une absence de lecture porte ce qui manque', () => {
    for (const n of NON_LUES) {
      expect(n.manque.length).toBeGreaterThan(10);
      if (n.statut === 'hypothese') expect(n.choix?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('une lecture n’ouvre jamais plus que le texte', () => {
  it('toute lecture établie est comprise, et décidable quand la personne a tout apporté', () => {
    const noms = new Set<string>([...ALIAS_BRANCHES.keys(), ...BANQUE.map((q) => q.branche)]);
    for (const s of ALIAS_BRANCHES.values()) for (const b of s) noms.add(b);
    const tout = etat({
      tags: new Map([...noms].map((n) => [`INTEREST.${n}`, 'positive'] as const)), branchesOuvertes: noms,
      niveauParBranche: new Map([...noms].map((n) => [n, 'C'] as const)), sujetsChoisis: new Set(BANQUE.map((q) => q.branche)),
      projets: new Map(BANQUE.map((q) => [q.branche, new Set(['achat', 'sejour', 'cadeau', 'occasion', 'sortie', 'apprentissage', 'attention', 'experience'] as const)] as const)),
      optionsChoisies: new Map([...SELECTEURS_DE_LECTURE].map((s) => [s, new Set(question(s)!.options.map(cleOption))] as const)),
    });
    const indecidables = T.lectures.filter((l) => verdictDe(question(l.question)!, tout) === 'indecidable').map((l) => l.question);
    expect(indecidables).toEqual([]);
  });
  it('le niveau écrit par le référentiel est conservé par la lecture', () => {
    for (const l of T.lectures) {
      const n = l.origine.match(/^Niveau ([ABC])\b/)?.[1];
      if (!n) continue;
      const garde = analyseDe(question(l.question)!).clauses.some((c) => c.type === 'niveau' && c.niveau === n);
      expect({ q: l.question, garde }).toEqual({ q: l.question, garde: true });
    }
  });
  it('une sous-partie lue reste attachée à la branche de sa question (niveau, branche ouverte, ou réponse à une question de la même branche)', () => {
    // Relevé en rejouant Yasmina : « Sous-branche : voyage et décalage (si voyage actif) » (Sommeil) avait été
    // lue « voyage ouvert » — la question du sommeil en voyage partait à quelqu'un sans la branche Sommeil.
    const garde = (id: string) => {
      const q = question(id)!;
      // Les groupes se cumulent (ET) : il suffit qu'UN groupe ancre chacune de ses alternatives.
      return analyseDe(q).groupes.some((g) => g.every((alt) => alt.some((c) =>
        (c.type === 'niveau' && c.branche === q.branche) || (c.type === 'branche_ouverte' && c.branche === q.branche)
        || (c.type === 'reponse' && question(c.selecteur)!.branche === q.branche) || c.type === 'contexte'))) ;
    };
    const sousParties = T.lectures.filter((l) => /^(Sous-branche|Axe|Territoire|Cartouche)/.test(l.origine));
    expect(sousParties.length).toBeGreaterThan(30);
    expect(sousParties.filter((l) => !garde(l.question) && !/^Cartouche/.test(l.origine)).map((l) => l.question)).toEqual([]);
  });
  it('« Achat concret, budget engagé » n’est pas lu « Achat concret » : retirer la restriction ouvrirait plus', () => {
    for (const id of ['bags.0390', 'watch.0330', 'live.0496', 'fashion2.1105']) {
      expect(lectureDe(id)).toBeUndefined();
      expect(NON_LUES.find((n) => n.question === id)?.statut).toBe('hypothese');
    }
  });
});

describe('les renvois numérotés s’ouvrent sur la bonne réponse, et seulement elle', () => {
  const q = question('live.0486')!; // « Si festivals appréciés (0475) »
  it('sans réponse à live.0475 : la question attend', () => {
    expect(verdictDe(q, etat(ouvert('live')))).toBe('fermer');
  });
  it('« Concert » coché : fermée', () => {
    expect(verdictDe(q, etat({ ...ouvert('live'), optionsChoisies: new Map([['live.0475', cles('live.0475', 'Concert')]]) }))).toBe('fermer');
  });
  it('« Festival » coché : ouverte', () => {
    expect(verdictDe(q, etat({ ...ouvert('live'), optionsChoisies: new Map([['live.0475', cles('live.0475', 'Concert', 'Festival')]]) }))).toBe('ouvrir');
  });
  it('une catégorie de sac : « Cabas » n’ouvre pas la question du sac à dos', () => {
    const e = etat({ ...ouvert('bags'), optionsChoisies: new Map([['bags.0360', cles('bags.0360', 'Un cabas')]]) });
    expect(verdictDe(question('bags.0378')!, e)).toBe('ouvrir');
    expect(verdictDe(question('bags.0379')!, e)).toBe('fermer');
  });
  it('un refus à la question source ferme : « Je préfère qu’on ne m’offre pas de bijoux »', () => {
    const refus = question('jewelry.0291')!.options.find((o) => /ne m’offre pas/.test(o.libelle))!;
    const e = (k: string) => etat({ ...ouvert('jewelry', 'A'), optionsChoisies: new Map([['jewelry.0291', new Set([k])]]) });
    expect(verdictDe(question('jewelry.0292')!, e(cleOption(refus)))).toBe('fermer');
    expect(verdictDe(question('jewelry.0292')!, e(cleOption(question('jewelry.0291')!.options[0])))).toBe('ouvrir');
  });
  it('les chiens et les chats : la question du chien ne va pas à qui n’a qu’un chat', () => {
    const avec = (...l: string[]) => etat({ ...ouvert('pets', 'C'), projets: new Map([['pets', new Set(['cadeau'] as const)]]), optionsChoisies: new Map([['pets.0392', cles('pets.0392', ...l)]]) });
    expect(verdictDe(question('pets.0404')!, avec('Chat'))).toBe('fermer');
    expect(verdictDe(question('pets.0405')!, avec('Chat'))).toBe('ouvrir');
    expect(verdictDe(question('pets.0404')!, avec('Plusieurs espèces'))).toBe('fermer');
  });
  it('une lecture écrite au niveau C exige toujours une préparation en cours', () => {
    const q2 = question('craft.0647')!; // « Niveau C Pratiquant »
    const pratique = etat({ ...ouvert('craft', 'C'), optionsChoisies: new Map([['craft.0614', cles('craft.0614', 'Je pratique moi-même une ou plusieurs activités créatives')]]) });
    expect(verdictDe(q2, pratique)).toBe('fermer');
    expect(verdictDe(q2, { ...pratique, projets: new Map([['craft', new Set(['achat'] as const)]]) })).toBe('ouvrir');
    const souhait = { ...pratique, optionsChoisies: new Map([['craft.0614', cles('craft.0614', 'J’aimerais apprendre ou reprendre une pratique')]]), projets: new Map([['craft', new Set(['achat'] as const)]]) };
    expect(verdictDe(q2, souhait)).toBe('fermer');
  });
});

describe('une question sensible garde sa garde', () => {
  const q = question('causes.1936')!; // océans — sensitivity HIGH, ouverture sur démarche
  const repondu = { optionsChoisies: new Map([['causes.1918', cles('causes.1918', 'La protection des océans')]]) };
  it('la lecture recopie la marque et la consigne à l’identique', () => {
    const l = lectureDe('causes.1936')!;
    expect(l.lue.slice(0, l.lue.indexOf('║'))).toBe(l.origine.slice(0, l.origine.indexOf('║')));
    const a = analyseDe(q), o = analyserCondition(q.condition_emission);
    expect([a.sensible, a.ouvertureSurDemarche, a.niveauSensibilite]).toEqual([o.sensible, o.ouvertureSurDemarche, o.niveauSensibilite]);
  });
  it('la bonne réponse sans la démarche : fermée', () => {
    expect(verdictDe(q, etat({ ...ouvert('causes'), ...repondu }))).toBe('fermer');
  });
  it('la démarche sans la bonne réponse : fermée', () => {
    expect(verdictDe(q, etat({ ...ouvert('causes'), sujetsChoisis: new Set(['causes']) }))).toBe('fermer');
  });
  it('la démarche ET la bonne réponse : ouverte', () => {
    expect(verdictDe(q, etat({ ...ouvert('causes'), sujetsChoisis: new Set(['causes']), ...repondu }))).toBe('ouvrir');
  });
  it('aucune lecture n’est posée sur une question sensible fermée par principe', () => {
    for (const l of T.lectures) {
      const o = analyserCondition(question(l.question)!.condition_emission);
      if (o.sensible) expect({ q: l.question, demarche: o.ouvertureSurDemarche }).toEqual({ q: l.question, demarche: true });
    }
  });
});

describe('une question dont l’énoncé présume plus que la condition reste fermée', () => {
  it('« Dans la céramique, qu’est-ce qui t’attire ? » n’a pas de lecture : elle attend le choix d’Estelle', () => {
    for (const id of ['CRE-15', 'CRE-18', 'CHS-13']) expect(NON_LUES.find((n) => n.question === id)?.statut).toBe('hypothese');
  });
});
