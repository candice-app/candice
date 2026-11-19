import { describe, it, expect } from 'vitest';
import { analyserCondition, SITUATIONS_DE_VIE, type EtatDiscovery } from '../conditions';
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
    // Résolues par le texte, et relues par une décision du 19 nov. : CRE-17 (D4, la céramique), les
    // questions « axe X » de la Réussite (D5, l'axe choisi à success.1711).
    const axes = BANQUE.filter((q) => /^Niveau B Réussite — axe /.test(q.condition_emission) && !analyserCondition(q.condition_emission).sensible).map((q) => q.id);
    expect(axes.length).toBeGreaterThan(20);
    // 20 nov. : conditions que le texte « résolvait » en apparence mais que le moteur ne savait pas
    // rattacher (un nom de domaine, une écriture « Niveau C <branche> : … ») — désormais lues ou consignées.
    const raccordees20nov = ['food.0030', 'food.0049', 'aesthetic.1971', 'drinks.2103', 'remembrance.1994', 'sensory2.1489', 'philoconso.1629'];
    const ajouteesParDecision = ['CRE-17', 'CRE-11', ...axes, ...raccordees20nov];   // CRE-11 : activée le 19 nov. (18h54)
    expect([...lues, ...nonLues].sort()).toEqual([...presentes, ...ajouteesParDecision].sort());
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
      situations: new Map(SITUATIONS_DE_VIE.map((x) => [x, true] as const)),
      entiteParQuestion: new Map(T.lectures.map((l) => [l.question, { id: 'e', libelle: 'X' }] as const)),
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

describe('D4 : une question qui présume une pratique, un usage ou un goût exige le signal correspondant', () => {
  const choisi = (sel: string, ...l: string[]) => [sel, cles(sel, ...l)] as const;
  const creation = { ...ouvert('craft'), tags: new Map([['INTEREST.creativity', 'positive'], ['INTEREST.craft', 'positive']]) };
  it('un intérêt pour la création ne suffit pas à présumer la céramique', () => {
    for (const id of ['CRE-15', 'CRE-16']) expect(verdictDe(question(id)!, etat(creation)), id).toBe('fermer');
    const peinture = etat({ ...creation, optionsChoisies: new Map([choisi('craft.0615', 'Peinture')]) });
    expect(verdictDe(question('CRE-15')!, peinture)).toBe('fermer');
  });
  it('« Céramique ou poterie » ouvre « qu’est-ce qui t’attire » ; « créer » et « pratiquer » exigent en plus l’envie de pratiquer', () => {
    const ceramique = etat({ ...creation, optionsChoisies: new Map([choisi('craft.0615', 'Céramique ou poterie')]) });
    expect(verdictDe(question('CRE-15')!, ceramique)).toBe('ouvrir');
    expect(verdictDe(question('CRE-16')!, etat({ ...ceramique, optionsChoisies: new Map([...ceramique.optionsChoisies!, choisi('craft.0614', 'J’aime surtout regarder et découvrir')]) }))).toBe('fermer');
    expect(verdictDe(question('CRE-16')!, etat({ ...ceramique, optionsChoisies: new Map([...ceramique.optionsChoisies!, choisi('craft.0614', 'J’aimerais apprendre ou reprendre une pratique')]) }))).toBe('ouvrir');
  });
  it('les chaussures ne suffisent pas à présumer le port de talons', () => {
    const chaussures = { ...ouvert('shoes', 'C'), tags: new Map([['INTEREST.shoe', 'positive']]), projets: new Map([['shoes', new Set(['achat'] as const)]]) };
    const q = question('CHS-13')!;
    const avec = (l: string) => etat({ ...chaussures, branchesOuvertes: new Set(['shoes', q.branche]), projets: new Map([['shoes', new Set(['achat'] as const)], [q.branche, new Set(['achat'] as const)]]), optionsChoisies: new Map([choisi('shoes.0341', l)]) });
    expect(verdictDe(q, etat(chaussures))).toBe('fermer');
    expect(verdictDe(q, avec('Du plat uniquement'))).toBe('fermer');
    expect(verdictDe(q, avec('Je préfère éviter les talons'))).toBe('fermer');
    expect(verdictDe(q, avec('Un talon moyen'))).toBe('ouvrir');
  });
  it('les gardes du texte sont recopiées : « ne plus creuser » ferme toujours', () => {
    const ceramique = etat({ ...creation, optionsChoisies: new Map([choisi('craft.0615', 'Céramique ou poterie')]), nePasCreuser: new Set(['creativity']) });
    expect(verdictDe(question('CRE-15')!, ceramique)).toBe('fermer');
  });
});

describe('D2 : une situation de vie n’est jamais déduite, seulement déclarée', () => {
  const daily = { branchesOuvertes: new Set(['daily2', 'relation2', 'children', 'work2']), niveauParBranche: new Map([['daily2', 'B'], ['relation2', 'B'], ['children', 'B'], ['work2', 'B']] as const),
    tags: new Map([['INTEREST.children', 'positive'], ['INTEREST.work2', 'positive'], ['INTEREST.daily2', 'positive']]) };
  const couple = ['relation2.0787', 'relation2.0790', 'daily2.1130'], enfants = ['daily2.1134', 'daily2.1136'], domicile = ['daily2.1138'], pro = ['relation2.0803'];
  it('situation non lue : indécidable ; lue mais non déclarée : fermée — même avec la branche Enfants et le travail ouverts', () => {
    for (const id of [...couple, ...enfants, ...domicile, ...pro]) {
      expect(verdictDe(question(id)!, etat(daily)), id).toBe('indecidable');
      expect(verdictDe(question(id)!, etat({ ...daily, situations: new Map() })), id).toBe('fermer');
    }
  });
  it('voyager « avec mes enfants » n’ouvre pas « Famille et enfants au quotidien »', () => {
    const e = etat({ ...daily, situations: new Map(), optionsChoisies: new Map([['travel2.0890', cles('travel2.0890', 'Avec mes enfants')]]) });
    for (const id of enfants) expect(verdictDe(question(id)!, e), id).toBe('fermer');
  });
  it('chaque situation déclarée n’ouvre que ses questions', () => {
    const e = etat({ ...daily, situations: new Map([['couple', true]]) });
    for (const id of couple) expect(verdictDe(question(id)!, e), id).toBe('ouvrir');
    for (const id of [...enfants, ...domicile, ...pro]) expect(verdictDe(question(id)!, e), id).toBe('fermer');
  });
  it('« aucune de ces situations » ferme tout ; la question sensible du couple reste fermée par principe', () => {
    const non = etat({ ...daily, situations: new Map(SITUATIONS_DE_VIE.map((x) => [x, false] as const)) });
    for (const id of [...couple, ...enfants, ...domicile, ...pro]) expect(verdictDe(question(id)!, non), id).toBe('fermer');
    const oui = etat({ ...daily, situations: new Map([['couple', true]]) });
    expect(verdictDe(question('daily2.1133')!, oui)).not.toBe('ouvrir');
  });
  it('le niveau B de la question est gardé', () => {
    const e = etat({ ...daily, niveauParBranche: new Map([['daily2', 'A'], ['relation2', 'A']] as const), situations: new Map([['couple', true]]) });
    for (const id of couple) expect(verdictDe(question(id)!, e), id).toBe('fermer');
  });
});

describe('D3 : hôtellerie — exploration générale et préparation d’un séjour sont distinctes', async () => {
  const { poolDe } = await import('../coexistence');
  const sejour = new Map([[poolDe('travel2'), new Set(['sejour'] as const)]]);
  const voyage = (p: Partial<EtatDiscovery> = {}) => etat({ ...ouvert('travel2', 'B'), projets: new Map(), ...p });
  const a915 = (l: string) => new Map([['travel2.0915', cles('travel2.0915', l)]]);
  const v = (id: string, e: EtatDiscovery) => verdictDe(question(id)!, e);
  it('l’orientation s’ouvre sur l’intérêt pour le voyage, ou sur un séjour en préparation — pas sur rien', () => {
    expect(v('travel2.0915', voyage())).toBe('ouvrir');
    expect(v('travel2.0915', etat({ projets: sejour }))).toBe('ouvrir');
    expect(v('travel2.0915', etat({ projets: new Map() }))).toBe('fermer');
  });
  it('« un endroit où dormir » : pas les questions de goût, mais les besoins pratiques restent posables', () => {
    const dormir = voyage({ optionsChoisies: a915('Est principalement un endroit où dormir') });
    for (const id of ['travel2.0916', 'travel2.0918', 'travel2.0923', 'travel2.0934', 'travel2.0921']) expect(v(id, dormir), id).toBe('fermer');
    for (const id of ['travel2.0919', 'travel2.0926', 'travel2.0925']) expect(v(id, dormir), id).toBe('ouvrir');
  });
  it('une place donnée à l’hébergement ouvre l’exploration générale, sans projet', () => {
    const essentielle = voyage({ optionsChoisies: a915('Est une partie essentielle de l’expérience') });
    for (const id of ['travel2.0916', 'travel2.0923', 'travel2.0934', 'travel2.0921']) expect(v(id, essentielle), id).toBe('ouvrir');
  });
  it('un séjour en préparation ouvre les questions utiles au séjour, pas les goûts généraux non déclarés', () => {
    const e = etat({ projets: sejour });
    for (const id of ['travel2.0919', 'travel2.0921', 'travel2.0926', 'travel2.0929']) expect(v(id, e), id).toBe('ouvrir');
    for (const id of ['travel2.0916', 'travel2.0923', 'travel2.0935']) expect(v(id, e), id).toBe('fermer');
  });
  it('l’intérêt général ne suffit pas aux questions de réservation', () => {
    const essentielle = voyage({ optionsChoisies: a915('Compte beaucoup'), niveauParBranche: new Map([['travel2', 'C']] as const) });
    for (const id of ['travel2.0937', 'travel2.0939', 'travel2.0941']) expect(v(id, essentielle), id).toBe('fermer');
  });
});

describe('D5 : réussite, esthétique avancée, signature de valeur', () => {
  const v = (id: string, e: EtatDiscovery) => verdictDe(question(id)!, e);
  it('l’axe coché à success.1711 ouvre ses questions, et seulement les siennes', () => {
    const e = etat({ ...ouvert('success', 'B'), optionsChoisies: new Map([['success.1711', cles('success.1711', 'La liberté')]]) });
    expect(v('success.1720', e)).toBe('ouvrir');            // axe Liberté
    expect(v('success.1716', e)).toBe('fermer');            // axe Statut
    expect(v('success.1720', etat(ouvert('success', 'B')))).toBe('fermer');
  });
  it('les restrictions sensibles s’appliquent toujours : l’axe choisi n’ouvre pas une question sensible', () => {
    const e = etat({ ...ouvert('success', 'B'), optionsChoisies: new Map([['success.1711', cles('success.1711', 'La sécurité')]]) });
    expect(v('success.1729', e)).toBe('ouvrir');
    expect(v('success.1730', e)).not.toBe('ouvrir');        // « sensitivity: HIGH — jamais communiqué au pilote »
  });
  it('success.1711 écrit un souhait de développer, pas une valeur recherchée établie', () => {
    for (const o of question('success.1711')!.options.filter((x) => x.libelle !== 'Rien de particulier')) expect(o.polarite, o.libelle).toBe('souhait');
  });
  it('esthétique « avancée » : après la question qu’elle approfondit, au niveau B — aucun seuil chiffré', () => {
    const b = ouvert('aesthetic', 'B');
    expect(v('aesthetic.1969', etat(b))).toBe('fermer');
    expect(v('aesthetic.1969', etat({ ...b, optionsChoisies: new Map([['aesthetic.1961', cles('aesthetic.1961', 'Très intemporel')]]) }))).toBe('ouvrir');
  });
  it('value.1522 « après les 6 axes » : les six questions A de la branche, toutes répondues', () => {
    const six = (n: number) => new Map(Array.from({ length: n }, (_, k) => `value.${1516 + k}`).map((id) => [id, new Set([cleOption(question(id)!.options[0])])] as const));
    expect(v('value.1522', etat({ ...ouvert('value', 'B'), optionsChoisies: six(5) }))).toBe('fermer');
    expect(v('value.1522', etat({ ...ouvert('value', 'B'), optionsChoisies: six(6) }))).toBe('ouvrir');
  });
});

describe('esthétique avancée (validée le 19 nov., 18h54) : seulement sur une réponse qui rend l’approfondissement pertinent', () => {
  const b = ouvert('aesthetic', 'B');
  const v = (id: string, ref: string, l: string) => verdictDe(question(id)!, etat({ ...b, optionsChoisies: new Map([[ref, cles(ref, l)]]) }));
  it('« Je n’y ai jamais vraiment pensé » n’ouvre pas « beau ou pratique » ; « Oui, énormément » l’ouvre', () => {
    expect(v('aesthetic.1966', 'aesthetic.1965', 'Je n’y ai jamais vraiment pensé')).toBe('fermer');
    expect(v('aesthetic.1966', 'aesthetic.1965', 'Non, chaque domaine est indépendant')).toBe('fermer');
    expect(v('aesthetic.1966', 'aesthetic.1965', 'Oui, énormément')).toBe('ouvrir');
  });
  it('une condition (« Cela dépend de l’histoire de l’objet ») n’ouvre pas le prestige', () => {
    expect(v('aesthetic.1968', 'aesthetic.1956', 'Cela dépend de l’histoire de l’objet')).toBe('fermer');
    expect(v('aesthetic.1968', 'aesthetic.1956', 'Les traces du temps')).toBe('ouvrir');
  });
  it('information déjà connue : fermée', () => {
    const e = etat({ ...b, optionsChoisies: new Map([['aesthetic.1961', cles('aesthetic.1961', 'Très intemporel')]]), attributsConnus: new Set(['PREFERENCE.aesthetic.owned_item', 'aesthetic.owned_item', 'owned_item']) });
    expect(verdictDe(question('aesthetic.1969')!, e)).not.toBe('ouvrir');
  });
});

describe('D9 : une question « à propos de {X} » exige une entité déclarée, avec la relation que la question présume', async () => {
  const { entitePour } = await import('../entites');
  const { valeurDuParametre } = await import('../parametres');
  const e = (id: string, type: string, relation: string, depuis = '2026-11-01') => ({ id, libelle: id, type, relation, depuis });
  it('« veut visiter » ouvre ce qui attire dans une destination, pas ce qui a plu dans un lieu', () => {
    const j = [e('Kyoto', 'destination', 'WANT_TO_VISIT')];
    expect(entitePour('destination.0287', j, new Map())?.id).toBe('Kyoto');
    expect(entitePour('place.0273', j, new Map())).toBeNull();
  });
  it('« aime » une marque ouvre « ce que tu aimes chez » ; « veut avoir » seulement la question du rapport', () => {
    const j = [e('Patagonia', 'brand', 'WANT_TO_OWN')];
    expect(entitePour('brand.0268', j, new Map())).toBeNull();
    expect(entitePour('brand.0272', j, new Map())?.id).toBe('Patagonia');
  });
  it('aimer une activité n’établit pas une pratique : « ton niveau » reste fermé', () => {
    expect(entitePour('activity.0282', [e('escalade', 'ENTITY_HOBBY', 'LOVE')], new Map())).toBeNull();
  });
  it('progression par (question, entité) : posée pour Patagonia, elle revient pour Hermès', () => {
    const j = [e('Patagonia', 'brand', 'LOVE', '2026-11-02'), e('Hermès', 'brand', 'LIKE', '2026-11-01')];
    expect(entitePour('brand.0268', j, new Map())?.id).toBe('Patagonia');
    expect(entitePour('brand.0268', j, new Map([['brand.0268', new Set(['Patagonia'])]]))?.id).toBe('Hermès');
  });
  it('le moteur : sans entité, fermée ; avec, ouverte et remplie par son nom', () => {
    const q = question('brand.0268')!;
    expect(verdictDe(q, etat({ entiteParQuestion: new Map() }))).toBe('fermer');
    const avec = etat({ entiteParQuestion: new Map([['brand.0268', { id: 'patagonia', libelle: 'Patagonia' }]]) });
    expect(verdictDe(q, avec)).toBe('ouvrir');
    expect(valeurDuParametre(q, avec)).toBe('Patagonia');
    expect(verdictDe(q, etat({}))).toBe('indecidable');
  });
});
