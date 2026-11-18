import { poolDe } from '../coexistence';
import { describe, it, expect } from 'vitest';
import { BANQUE } from '../banque';
import { analyserCondition, evaluerCondition, type EtatDiscovery } from '../conditions';
import { ALIAS_BRANCHES } from '../branches';
import { branchesSurDemarche } from '../service';

// SENSIBILITÉ « MOYENNE » — décision d'Estelle, 18 nov. (révision 3 du référentiel).
// Une question qui porte cette marque s'ouvre quand la personne choisit d'explorer le sujet
// ou l'aborde d'elle-même. Un score seul ne suffit pas ; le retrait referme.
// Ces tests portent sur les 32 questions RÉELLES de la banque, une par une.

const moyennes = BANQUE.filter((q) => /sensitivity\s*:\s*MOYENNE/i.test(q.condition_emission));

/** Le terrain le plus favorable possible : toutes les branches ouvertes, au niveau le plus profond. */
const toutOuvert = (sujetsChoisis: string[] = []): EtatDiscovery => {
  const noms = new Set<string>([...ALIAS_BRANCHES.keys(), ...BANQUE.map((q) => q.branche)]);
  for (const s of ALIAS_BRANCHES.values()) for (const b of s) noms.add(b);
  return {
    tags: new Map([...noms].map((n) => [`INTEREST.${n}`, 'positive'] as const)),
    nePasCreuser: new Set(), branchesOuvertes: noms,
    niveauParBranche: new Map([...noms].map((n) => [n, 'C'] as const)),
    dejaPosees: new Set(), attributsConnus: new Set(), sansAlcool: false,
    contextesConnus: new Set(), contextesActifs: new Set(),
    // Un projet en cours partout : ce test porte sur la SENSIBILITÉ, pas sur le niveau C.
    projets: new Map([...new Set(BANQUE.map((q) => poolDe(q.branche)))].map((p) => [p, new Set(['achat' as const, 'sejour' as const])] as const)),
    sujetsChoisis: new Set(sujetsChoisis), aliasBranches: ALIAS_BRANCHES,
  };
};

describe('les 32 questions de sensibilité moyenne', () => {
  it('elles sont 32, et toutes portent le mode d’ouverture écrit par la révision 3', () => {
    expect(moyennes.length).toBe(32);
    for (const q of moyennes) {
      const c = analyserCondition(q.condition_emission);
      expect(c.sensible, q.id).toBe(true);
      expect(c.niveauSensibilite, q.id).toBe('moyenne');
      expect(c.ouvertureSurDemarche, q.id).toBe(true);
    }
  });

  it('AUCUNE ne s’ouvre sur le terrain seul, même le plus favorable', () => {
    const e = toutOuvert();
    const ouvertes = moyennes.filter((q) => evaluerCondition(analyserCondition(q.condition_emission), e, { branche: q.branche, pool: poolDe(q.branche), attributs: ['x.y'], attributsPartages: true }) === 'ouvrir');
    expect(ouvertes.map((q) => q.id)).toEqual([]);
  });

  it('la démarche pour une AUTRE branche n’en ouvre aucune', () => {
    const ouvertes = moyennes.filter((q) => {
      const autre = q.branche === 'travel2' ? 'food2' : 'travel2';
      return evaluerCondition(analyserCondition(q.condition_emission), toutOuvert([autre]), { branche: q.branche, pool: poolDe(q.branche), attributs: ['x.y'], attributsPartages: true }) === 'ouvrir';
    });
    expect(ouvertes.map((q) => q.id)).toEqual([]);
  });

  it('la démarche pour SA branche ouvre chaque question dont la condition d’origine est lisible', () => {
    const resultat = moyennes.map((q) => {
      const c = analyserCondition(q.condition_emission);
      const v = evaluerCondition(c, toutOuvert([q.branche]), { branche: q.branche, pool: poolDe(q.branche), attributs: ['x.y'], attributsPartages: true });
      return { id: q.id, v, lisible: c.lisible };
    });
    const ouvertes = resultat.filter((r) => r.v === 'ouvrir');
    const restantes = resultat.filter((r) => r.v !== 'ouvrir');
    // Celles qui ne s'ouvrent pas ne sont pas refusées par la sensibilité : leur condition
    // d'origine porte un nom de branche ou un fragment encore à résoudre (registre).
    expect(restantes.every((r) => r.v === 'indecidable')).toBe(true);
    expect(ouvertes.length).toBe(30);
    expect(restantes.map((r) => r.id).sort()).toEqual(['drinks.2106', 'joys.1893']);
  });

  it('chaque branche concernée peut recevoir la démarche', () => {
    const attendues = new Set(moyennes.map((q) => q.branche));
    for (const b of attendues) expect(branchesSurDemarche(), b).toContain(b);
  });
});
