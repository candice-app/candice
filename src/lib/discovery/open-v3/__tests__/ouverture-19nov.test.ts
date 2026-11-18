import { describe, it, expect } from 'vitest';
import { analyserCondition, evaluerCondition, type EtatDiscovery } from '../conditions';
import { prochainesQuestions } from '../selection';
import { BANQUE, question } from '../banque';
import { ALIAS_BRANCHES, branchesDuDomaineJournal } from '../branches';
import { DEPENDANCES } from '../dependances';
import { REMPLACEMENTS, coexistence, poolDe } from '../coexistence';
import { cleOption } from '../cle-option';

// CE QUE LES DIX PROFILS ONT MONTRÉ, LE 18 NOVEMBRE AU SOIR. Chaque test porte une cause
// trouvée en faisant répondre des personnages, pas un nombre de questions à atteindre.

const vide: EtatDiscovery = {
  tags: new Map(), nePasCreuser: new Set(), branchesOuvertes: new Set(),
  niveauParBranche: new Map(), dejaPosees: new Set(), attributsConnus: new Set(),
  sansAlcool: false, contextesConnus: new Set(), contextesActifs: new Set(),
  aliasBranches: ALIAS_BRANCHES,
};
const etat = (p: Partial<EtatDiscovery>): EtatDiscovery => ({ ...vide, ...p });
const verdict = (id: string, e: EtatDiscovery) => {
  const q = question(id)!;
  return evaluerCondition(analyserCondition(q.condition_emission), e, { branche: q.branche, dependance: DEPENDANCES.get(id) });
};
/** L'état de quelqu'un qui a coché une catégorie de l'inscription, tel que `lireEtat` le construit. */
const aCoche = (id: string, ...branches: string[]) => etat({
  tags: new Map([[`INTEREST.${id}`, 'positive']]), branchesOuvertes: new Set([id, ...branches]),
  niveauParBranche: new Map([id, ...branches].map((b) => [b, 'A' as const])),
});

describe('« Art & culture » coché : la cause était un nom, pas une absence de connaissance', () => {
  it('la condition nomme « art, musées et expositions », le journal écrit « art » — la question s’ouvre', () => {
    expect(question('art.0128')!.condition_emission).toBe('Intérêt art, musées et expositions sélectionné ou détecté');
    expect(verdict('art.0128', aCoche('art'))).toBe('ouvrir');
  });
  it('sans rien de coché, elle reste fermée', () => {
    expect(verdict('art.0128', vide)).toBe('fermer');
  });
  it('un autre domaine coché ne l’ouvre pas', () => {
    expect(verdict('art.0128', aCoche('sport'))).toBe('fermer');
  });
});

describe('« Voyage » coché : la condition était lue comme un contexte de vie', () => {
  it('« Voyage, week-end ou hôtellerie actifs » est une liste de domaines, pas un contexte', () => {
    const c = analyserCondition('Voyage, week-end ou hôtellerie actifs').clauses[0];
    expect(c).toEqual({ type: 'domaines_actifs', noms: ['voyage', 'week-end', 'hotellerie'] });
  });
  it('un des domaines suffit', () => {
    expect(verdict('travel.0052', aCoche('voyage', 'travel2'))).toBe('ouvrir');
  });
  it('aucun domaine actif, et un nom que rien ne rattache (« week-end ») : NON RÉSOLU, pas « fermé »', () => {
    expect(verdict('travel.0052', vide)).toBe('indecidable');
  });
  it('« Achat concret » reste un contexte de vie, inconnu du moteur : non résolu', () => {
    expect(analyserCondition('Achat concret').clauses[0]).toEqual({ type: 'contexte', libelle: 'achat concret' });
    expect(evaluerCondition(analyserCondition('Achat concret'), aCoche('voyage'), { branche: 'travel2' })).toBe('indecidable');
  });
});

describe('un intérêt lu dans un texte libre ouvre la branche de la banque', () => {
  it('le domaine du journal est traduit vers celui de la banque', () => {
    expect(branchesDuDomaineJournal('books_literature')).toEqual(expect.arrayContaining(['reading', 'reading2']));
    expect(branchesDuDomaineJournal('books literature')).toEqual(expect.arrayContaining(['reading', 'reading2']));
    expect(branchesDuDomaineJournal('sport_fitness')).toEqual(expect.arrayContaining(['sport', 'sportp']));
  });
  it('un domaine sans correspondance sûre n’ouvre rien — y compris la parentalité', () => {
    expect(branchesDuDomaineJournal('architecture')).toEqual([]);
    expect(branchesDuDomaineJournal('family_parenting')).toEqual([]);
  });
});

describe('une sous-partie ne s’ouvre que sur la réponse qui la désigne', () => {
  const crea = aCoche('craft');
  const cle = (qid: string, libelle: string) => cleOption(question(qid)!.options.find((o) => o.libelle === libelle)!);
  it('la branche ouverte ne suffit pas : « céramique » attend d’avoir été choisie', () => {
    expect(question('craft.0638')!.condition_emission).toContain('(0615)');
    expect(verdict('craft.0638', crea)).toBe('fermer');
    expect(verdict('craft.0639', crea)).toBe('fermer');                 // la suivante hérite de la dépendance
  });
  it('une autre réponse à la question de tri ne l’ouvre pas', () => {
    const e = etat({ ...crea, optionsChoisies: new Map([['craft.0615', new Set([cle('craft.0615', 'Reliure ou papeterie')])]]) });
    expect(verdict('craft.0638', e)).toBe('fermer');
  });
  it('la bonne réponse l’ouvre', () => {
    const e = etat({ ...crea, optionsChoisies: new Map([['craft.0615', new Set([cle('craft.0615', 'Céramique ou poterie')])]]) });
    expect(verdict('craft.0638', e)).toBe('ouvrir');
    expect(verdict('craft.0639', e)).toBe('ouvrir');
  });
  it('« Pratiquant » ne se rapproche d’aucune option avec certitude : non résolu, pas ouvert', () => {
    expect(DEPENDANCES.get('craft.0619')).toMatchObject({ selecteur: 'craft.0614', resolu: false });
    expect(verdict('craft.0619', crea)).toBe('indecidable');
  });
  it('chaque dépendance résolue désigne une question et des options qui existent', () => {
    for (const [id, d] of DEPENDANCES) {
      expect(question(id), id).toBeDefined();
      if (!d.resolu) continue;
      const cles = new Set(question(d.selecteur)!.options.map(cleOption));
      for (const c of d.cles) expect(cles.has(c), `${id} → ${d.selecteur} ${c}`).toBe(true);
    }
  });
});

describe('deux générations d’une branche : un seul pool, la nouvelle d’abord (onglet 13)', () => {
  const voyage = aCoche('voyage', 'travel', 'travel2');
  it('une question remplacée n’est plus proposée d’initiative', () => {
    expect(REMPLACEMENTS.get('travel.0053')).toEqual({ nouvelle: 'travel2.0888', decision: 'NEW_PRIMARY' });
    expect(coexistence('travel.0053', voyage, true)).toEqual({ poser: false, motif: 'remplacee' });
    const ids = prochainesQuestions(voyage, { combien: 5000, parBranche: 5000 }).choix.map((c) => c.question.id);
    expect(ids).not.toContain('travel.0053');
    expect(ids).toContain('travel2.0888');
  });
  it('une question « distincte et conditionnée » attend la nouvelle, une facette inconnue, et ne la suit pas', () => {
    expect(REMPLACEMENTS.get('travel.0051')?.decision).toBe('KEEP_DISTINCT_CONDITIONED');
    expect(coexistence('travel.0051', voyage, true)).toEqual({ poser: false, motif: 'nouvelle_pas_encore_posee' });
    const posee = { ...voyage, dejaPosees: new Set(['travel2.0886']) };
    expect(coexistence('travel.0051', { ...posee, dernierePosee: 'travel2.0886' }, true)).toEqual({ poser: false, motif: 'a_la_suite' });
    expect(coexistence('travel.0051', posee, false)).toEqual({ poser: false, motif: 'facette_deja_connue' });
    expect(coexistence('travel.0051', posee, null)).toEqual({ poser: false, motif: 'facette_indeterminee' });
    expect(coexistence('travel.0051', posee, true)).toEqual({ poser: true });
  });
  it('les deux générations comptent pour une seule branche dans un lot', () => {
    expect(poolDe('travel')).toBe(poolDe('travel2'));
    const lot = prochainesQuestions(voyage, { combien: 10, parBranche: 2 }).choix.map((c) => poolDe(c.question.branche));
    expect(lot.filter((p) => p === poolDe('travel')).length).toBeLessThanOrEqual(2);
  });
  it('chaque question nommée par l’onglet existe dans la banque, sauf celles qu’elle a retirées', () => {
    const absentes = [...REMPLACEMENTS].filter(([a, r]) => !question(a) || !question(r.nouvelle)).map(([a]) => a);
    expect(absentes).toEqual(['series.0094']);
  });
});

describe('les protections ne se desserrent pas', () => {
  it('un domaine général coché n’ouvre aucune question sensible', () => {
    const tout = etat({
      branchesOuvertes: new Set(BANQUE.map((q) => q.branche)), niveauParBranche: new Map(BANQUE.map((q) => [q.branche, 'C' as const])),
      tags: new Map(['art', 'voyage', 'cuisine', 'lecture', 'sport', 'musique', 'cinema'].map((d) => [`INTEREST.${d}`, 'positive'])),
    });
    const ouvertes = prochainesQuestions(tout, { combien: 5000, parBranche: 5000 }).choix.map((c) => c.question);
    expect(ouvertes.length).toBeGreaterThan(0);
    expect(ouvertes.filter((q) => analyserCondition(q.condition_emission).sensible).map((q) => q.id)).toEqual([]);
  });
  it('un domaine que la personne a écarté n’est plus proposé — sauf si elle choisit de l’explorer', () => {
    const sport = aCoche('sport');
    expect(prochainesQuestions(sport, { combien: 50 }).choix.some((c) => c.question.branche === 'sport')).toBe(true);
    const ecarte = etat({ ...sport, nePasCreuser: new Set(['sport']) });
    expect(prochainesQuestions(ecarte, { combien: 50 }).choix.some((c) => c.question.branche === 'sport')).toBe(false);
    const choisi = etat({ ...ecarte, sujetsChoisis: new Set(['sport']) });
    expect(prochainesQuestions(choisi, { combien: 50 }).choix.some((c) => c.question.branche === 'sport')).toBe(true);
  });
  it('une question déjà posée ne revient pas, même si sa condition est vraie', () => {
    const e = etat({ ...aCoche('art'), dejaPosees: new Set(['art.0128']) });
    expect(prochainesQuestions(e, { combien: 50 }).choix.map((c) => c.question.id)).not.toContain('art.0128');
  });
  it('une question retirée de la banque active n’existe pas pour le moteur', () => {
    expect(question('series.0094')).toBeUndefined();
  });
  it('« Ouverture branche X (voir onglet Branches) » reste non résolue : l’onglet n’est pas dans le classeur', () => {
    expect(verdict('craft.0614', aCoche('craft'))).toBe('indecidable');
  });
});

describe('la condition d’une sous-partie est écrite sur sa première question', () => {
  const relation = etat({ branchesOuvertes: new Set(['relation2']), niveauParBranche: new Map([['relation2', 'C' as const]]) });
  it('« Sous-branche Couple » hérite de « uniquement si un partenaire existe… » : non résolue, pas ouverte', async () => {
    const { verdictDe } = await import('../selection');
    const { TETES_DE_SOUS_PARTIE } = await import('../dependances');
    expect(question('relation2.0787')!.condition_emission).toMatch(/^Sous-branche Couple : uniquement si un partenaire existe/);
    expect(TETES_DE_SOUS_PARTIE.get('relation2.0788')).toBe('relation2.0787');
    expect(verdictDe(question('relation2.0788')!, relation)).toBe('indecidable');
    expect(verdictDe(question('relation2.0789')!, relation)).toBe('indecidable');
  });
  it('une sous-partie dont la première question ne porte que le nom suit sa branche', async () => {
    const { verdictDe } = await import('../selection');
    const { TETES_DE_SOUS_PARTIE } = await import('../dependances');
    expect(TETES_DE_SOUS_PARTIE.has('relation2.0793')).toBe(false);        // « Sous-branche Amitié »
    expect(verdictDe(question('relation2.0793')!, relation)).toBe('ouvrir');
  });
});

describe('niveau C : la règle vaut pour la question, pas seulement pour une phrase de sa condition', () => {
  it('« CRE-17 », niveau C, s’ouvrait sur le seul intérêt pour la création : il lui faut un projet', async () => {
    const { verdictDe } = await import('../selection');
    const q = question('CRE-17')!;
    expect(q.niveau).toBe('C');
    const creation = etat({ tags: new Map([['INTEREST.creativity', 'positive']]), branchesOuvertes: new Set([q.branche]) });
    expect(verdictDe(q, creation)).toBe('indecidable');                                   // projets non lus : on ne sait pas
    expect(verdictDe(q, { ...creation, projets: new Map() })).toBe('fermer');             // lus, aucun
    expect(verdictDe(q, { ...creation, projets: new Map([[q.branche, new Set(['achat' as const])]]) })).toBe('ouvrir');
  });
  it('aucune question de niveau C n’est admissible sans projet, quel que soit le reste', () => {
    const tout = etat({
      branchesOuvertes: new Set(BANQUE.map((q) => q.branche)), niveauParBranche: new Map(BANQUE.map((q) => [q.branche, 'C' as const])),
      tags: new Map([...ALIAS_BRANCHES.keys(), 'creativity', 'food', 'shoe', 'floral', 'gaming', 'humor', 'board_game', 'learning', 'watch', 'memories', 'sleep', 'live_performance', 'celebration'].map((d) => [`INTEREST.${d}`, 'positive'])),
      sujetsChoisis: new Set(BANQUE.map((q) => q.branche)), projets: new Map(),
    });
    const c = prochainesQuestions(tout, { combien: 5000, parBranche: 5000 }).choix.map((x) => x.question).filter((q) => q.niveau === 'C');
    expect(c.filter((q) => !analyserCondition(q.condition_emission).clauses.some((k) => k.type === 'tag' && k.chemin.startsWith('CONTEXT.'))).map((q) => q.id)).toEqual([]);
  });
});
