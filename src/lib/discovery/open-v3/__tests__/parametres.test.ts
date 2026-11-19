import { describe, it, expect } from 'vitest';
import { BANQUE, question } from '../banque';
import { PARAMETRES, enonceRempli, genreQuiRemplit, parametresDe, valeurDuParametre } from '../parametres';
import { analyserCondition, FRAGMENTS_DE_PROJET, PROJET_PAR_CONTEXTE, TYPES_DE_PROJET, type EtatDiscovery } from '../conditions';
import { motifDExclusion, requiertProjet, aParametre, verdictDe } from '../selection';
import { ALIAS_BRANCHES, SOUS_PARTIES } from '../correspondances';
import { poolDe } from '../coexistence';
import { lireProjet } from '../etat';

const etat = (plus: Partial<EtatDiscovery>): EtatDiscovery => ({
  tags: new Map(), nePasCreuser: new Set(), branchesOuvertes: new Set(), niveauParBranche: new Map(), dejaPosees: new Set(), attributsConnus: new Set(),
  sansAlcool: false, contextesConnus: new Set(), contextesActifs: new Set(), aliasBranches: ALIAS_BRANCHES, reglesSousParties: SOUS_PARTIES, ...plus,
});

describe('paramètres d’énoncé — une table, une source autorisée, jamais une supposition', () => {
  it('la table couvre exactement les 24 questions à paramètre, chacune avec ce qui a été consulté', () => {
    const avec = BANQUE.filter(aParametre);
    expect(avec).toHaveLength(24);
    expect(PARAMETRES.size).toBe(24);
    for (const q of avec) { const l = PARAMETRES.get(q.id)!; expect(l.parametre).toBe(parametresDe(q)[0]); expect(l.consulte.length).toBeGreaterThan(10); if (l.statut !== 'executable') expect(l.manque, q.id).toBeTruthy(); }
  });
  it('sans préparation en cours, aucune question à paramètre n’est admissible', () => {
    for (const q of BANQUE.filter(aParametre)) { expect(motifDExclusion(q, etat({ projets: new Map() })), q.id).not.toBeNull(); expect(valeurDuParametre(q, etat({ projets: new Map() })), q.id).toBeNull(); }
  });
  it('« Pour {occasion}… » : remplie par l’objet de l’occasion en cours, dans le domaine de la question', () => {
    const q = question('FOO-08')!; const pool = poolDe(q.branche);
    expect(genreQuiRemplit(q)).toBe('occasion');
    expect(requiertProjet(q)).toBe('occasion');
    const e = etat({ projets: new Map([[pool, new Set(['occasion'] as const)]]), objetsDeProjet: new Map([[`${pool}|occasion`, 'Les 40 ans de Thibaud']]) });
    expect(valeurDuParametre(q, e)).toBe('Les 40 ans de Thibaud');
    expect(enonceRempli(q, e)).toBe('Pour les 40 ans de Thibaud, qu’est-ce qui compte le plus dans le choix d’un restaurant ?');
    expect(motifDExclusion(q, e)).not.toBe('parametre_non_resolu');
    // Une occasion dans un AUTRE domaine, ou un achat dans celui-ci, ne remplit rien.
    expect(valeurDuParametre(q, etat({ objetsDeProjet: new Map([['Autre|occasion', 'x'], [`${pool}|achat`, 'y']]) }))).toBeNull();
  });
  it('une source non établie ne remplit jamais rien, quelle que soit la préparation en cours', () => {
    const q = question('brand.0268')!; const pool = poolDe(q.branche);
    const e = etat({ projets: new Map([[pool, new Set(TYPES_DE_PROJET)]]), objetsDeProjet: new Map(TYPES_DE_PROJET.map((t) => [`${pool}|${t}`, 'Hermès'] as const)) });
    expect(valeurDuParametre(q, e)).toBeNull();
    expect(motifDExclusion(q, e)).toBe('parametre_non_resolu');
    expect(() => enonceRempli(q, e)).toThrow(/sans valeur établie/);
  });
  it('un énoncé sans paramètre est rendu tel quel', () => {
    const q = BANQUE.find((x) => !aParametre(x))!;
    expect(enonceRempli(q, {})).toBe(q.enonce);
  });
});

describe('préparations en cours — les genres que le référentiel nomme', () => {
  it('chaque phrase de la table est lue comme un contexte de préparation, à l’identique seulement', () => {
    for (const [phrase, libelle] of Object.entries(FRAGMENTS_DE_PROJET)) {
      const a = analyserCondition(phrase);
      expect(a.inconnues, phrase).toEqual([]);
      expect(a.clauses).toEqual([{ type: 'contexte', libelle }]);
      expect(PROJET_PAR_CONTEXTE[libelle]).toBeTruthy();
    }
    // Une phrase qui ajoute une condition n'est PAS lue comme telle.
    for (const phrase of ['Achat concret, budget engagé', 'Achat concret multi-dates', 'Achat concret, artiste adoré identifié']) expect(analyserCondition(phrase).inconnues.length, phrase).toBeGreaterThan(0);
  });
  it('« Sortie concrète » : fermée sans sortie en cours, ouverte avec — et la réponse appartient à la sortie', () => {
    const q = question('theatre2.1384')!; const pool = poolDe(q.branche);
    expect(requiertProjet(q)).toBe('sortie');
    const base = { branchesOuvertes: new Set([q.branche]), niveauParBranche: new Map([[q.branche, 'C' as const]]) };
    expect(verdictDe(q, etat({ ...base, projets: new Map() }))).toBe('fermer');
    expect(verdictDe(q, etat({ ...base, projets: new Map([[pool, new Set(['achat'] as const)]]) }))).toBe('fermer');
    expect(verdictDe(q, etat({ ...base, projets: new Map([[pool, new Set(['sortie'] as const)]]) }))).toBe('ouvrir');
  });
  it('un fait de projet d’un genre inconnu n’est pas lu', () => {
    const p = { id: 'x', branche: 'craft', objet: 'Un vase', debut: '2026-11-19T08:00:00.000Z' };
    expect(lireProjet(JSON.stringify({ ...p, type: 'cadeau' }))).toMatchObject({ type: 'cadeau' });
    expect(lireProjet(JSON.stringify({ ...p, type: 'caprice' }))).toBeNull();
  });
});
