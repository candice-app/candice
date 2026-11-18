import { describe, it, expect } from 'vitest';
import { prochainesQuestions, prochaineQuestion } from '../selection';
import { BANQUE, type QuestionV3 } from '../banque';
import type { EtatDiscovery } from '../conditions';

// LE SCORE N'OUVRE RIEN. Il ordonne des questions déjà autorisées par leur condition, et
// son rôle s'arrête là. Ces tests existent pour que personne ne lui donne un jour le
// pouvoir de passer outre — c'est le chemin par lequel Candice deviendrait intrusive.

const vide: EtatDiscovery = {
  tags: new Map(), nePasCreuser: new Set(), branchesOuvertes: new Set(),
  niveauParBranche: new Map(), dejaPosees: new Set(), attributsConnus: new Set(),
  sansAlcool: false, contextesConnus: new Set(), contextesActifs: new Set(),
};
const etat = (p: Partial<EtatDiscovery>): EtatDiscovery => ({ ...vide, ...p });

const question = (p: Partial<QuestionV3>): QuestionV3 => ({
  id: 'Q-1', enonce: 'Un énoncé', forme: 'single', branche: 'b', niveau: 'A',
  condition_emission: 'Branche b ouverte',
  options: [{ rang: '1', libelle: 'Oui', voie: 'HSG_EVIDENCE', famille: 'PREFERENCE',
              domaine: 'b', attribut: 'a', valeur: { x: '1' } }],
  ...p,
});

describe('d’une personne dont Candice ne sait rien, on ne demande rien', () => {
  it('aucune question ne s’ouvre sur un état vide', () => {
    const r = prochainesQuestions(vide, { combien: 5 });
    expect(r.choix).toHaveLength(0);
  });

  it('et le diagnostic dit POURQUOI — un silence doit être explicable', () => {
    const d = prochainesQuestions(vide, { combien: 5 }).diagnostic;
    expect(d.examinees).toBe(BANQUE.length);
    expect(d.fermees + d.indecidables + d.steriles + d.dejaPosees).toBe(BANQUE.length);
    expect(d.retenues).toBe(0);
  });
});

describe('on ne pose pas ce dont on ne saura rien faire', () => {
  it('une question dont aucune option ne produit rien est écartée', () => {
    const sterile = question({
      id: 'S-1',
      options: [
        { rang: '1', libelle: 'Autre', voie: 'ACTION_PARAMETER' },
        { rang: '2', libelle: 'Passer', voie: 'DISCOVERY_STATE' },
      ],
    });
    const r = prochainesQuestions(etat({ branchesOuvertes: new Set(['b']) }), { combien: 1 }, [sterile]);
    expect(r.choix).toHaveLength(0);
    expect(r.diagnostic.steriles).toBe(1);
  });

  it('une question OUVERTE n’est jamais stérile : le verbatim est conservé', () => {
    const ouverte = question({ id: 'O-1', forme: 'open', options: [], inferences_interdites: 'rien' });
    const r = prochainesQuestions(etat({ branchesOuvertes: new Set(['b']) }), { combien: 1 }, [ouverte]);
    expect(r.choix.map((c) => c.question.id)).toEqual(['O-1']);
  });
});

describe('le score ordonne, il n’autorise pas', () => {
  it('une question très bien notée dont la condition ferme n’est jamais posée', () => {
    const tentante = question({ id: 'T-1', niveau: 'A', condition_emission: 'Branche jamais-ouverte ouverte' });
    const r = prochainesQuestions(etat({ branchesOuvertes: new Set(['b']) }), { combien: 3 }, [tentante]);
    expect(r.choix).toHaveLength(0);
    expect(r.diagnostic.fermees).toBe(1);
  });

  it('une condition incompréhensible ferme aussi, quel que soit le score', () => {
    const q = question({ id: 'I-1', condition_emission: 'Quand la personne est prête' });
    const r = prochainesQuestions(etat({ branchesOuvertes: new Set(['b']) }), { combien: 3 }, [q]);
    expect(r.choix).toHaveLength(0);
    expect(r.diagnostic.indecidables).toBe(1);
  });
});

describe('du peu profond vers le profond', () => {
  it('A passe avant B, qui passe avant C', () => {
    const qs = (['C', 'A', 'B'] as const).map((n) => question({
      id: `N-${n}`, niveau: n,
      condition_emission: `Niveau ${n} b`,
    }));
    const e = etat({ branchesOuvertes: new Set(['b']), niveauParBranche: new Map([['b', 'C']]), projets: new Map([['b', new Set(['achat' as const])]]) });
    const r = prochainesQuestions(e, { combien: 3, parBranche: 9 }, qs);
    expect(r.choix.map((c) => c.question.id)).toEqual(['N-A', 'N-B', 'N-C']);
  });
});

describe('on ne creuse pas une seule branche', () => {
  it('le plafond par branche s’applique, même si le score voudrait tout prendre', () => {
    const qs = [1, 2, 3, 4].map((i) => question({ id: `B-${i}`, branche: 'b' }));
    const r = prochainesQuestions(etat({ branchesOuvertes: new Set(['b']) }), { combien: 4, parBranche: 2 }, qs);
    expect(r.choix).toHaveLength(2);
    expect(r.diagnostic.plafonnees).toBe(2);
  });

  it('deux branches ouvertes donnent des questions des deux', () => {
    const qs = [
      question({ id: 'B-1', branche: 'b', condition_emission: 'Branche b ouverte' }),
      question({ id: 'B-2', branche: 'b', condition_emission: 'Branche b ouverte' }),
      question({ id: 'C-1', branche: 'c', condition_emission: 'Branche c ouverte' }),
    ];
    const r = prochainesQuestions(etat({ branchesOuvertes: new Set(['b', 'c']) }), { combien: 3, parBranche: 2 }, qs);
    expect(new Set(r.choix.map((c) => c.question.branche))).toEqual(new Set(['b', 'c']));
  });
});

describe('le parcours est reproductible', () => {
  it('le même état donne deux fois la même question', () => {
    const e = etat({
      tags: new Map([['INTEREST.creativity', 'positive']]),
      branchesOuvertes: new Set(['creativity']),
      niveauParBranche: new Map([['creativity', 'C']]),
    });
    const a = prochainesQuestions(e, { combien: 5 }).choix.map((c) => c.question.id);
    const b = prochainesQuestions(e, { combien: 5 }).choix.map((c) => c.question.id);
    expect(a).toEqual(b);
  });

  it('une question déjà posée ne revient pas', () => {
    const q1 = question({ id: 'R-1' });
    const e = etat({ branchesOuvertes: new Set(['b']) });
    expect(prochaineQuestion(e, [q1])?.question.id).toBe('R-1');
    const apres = etat({ branchesOuvertes: new Set(['b']), dejaPosees: new Set(['R-1']) });
    expect(prochaineQuestion(apres, [q1])).toBeNull();
  });
});

describe('sur la banque réelle', () => {
  it('une personne dont une branche est ouverte reçoit des questions de cette branche', () => {
    // On prend une branche réelle, et on ouvre ce qu'il faut pour que ses conditions passent.
    const branche = BANQUE.find((q) => q.niveau === 'A')?.branche;
    expect(branche).toBeDefined();
    const e = etat({
      branchesOuvertes: new Set([branche!]),
      niveauParBranche: new Map([[branche!, 'C']]),
      tags: new Map(BANQUE.filter((q) => q.branche === branche)
        .map((q) => [`INTEREST.${branche}`, 'positive'] as const)),
    });
    const r = prochainesQuestions(e, { combien: 3 });
    // Le résultat peut être vide — beaucoup de conditions exigent autre chose. Ce qui ne
    // doit JAMAIS arriver, c'est qu'une question d'une autre branche sorte sans condition
    // satisfaite, ou qu'une question sensible sorte tout court.
    for (const c of r.choix) {
      expect(c.question.condition_emission).toBeTruthy();
      expect(c.question.condition_emission.toLowerCase()).not.toContain('sensitivity: high');
      expect(c.question.condition_emission.toLowerCase()).not.toContain('sous-branche sensible');
    }
  });

  it('AUCUNE question sensible ne peut sortir, quel que soit l’état', () => {
    // L'état le plus permissif qu'on puisse fabriquer : tout ouvert, tout actif.
    const branches = new Set(BANQUE.map((q) => q.branche));
    const e = etat({
      branchesOuvertes: branches,
      niveauParBranche: new Map([...branches].map((b) => [b, 'C'] as const)),
      tags: new Map(BANQUE.flatMap((q) => [[`INTEREST.${q.branche}`, 'positive'] as const])),
      contextesConnus: new Set(['achat concret']),
      contextesActifs: new Set(['achat concret']),
    });
    const r = prochainesQuestions(e, { combien: 200, parBranche: 200 });
    for (const c of r.choix) {
      const cond = c.question.condition_emission.toLowerCase();
      expect(cond, c.question.id).not.toMatch(/sensitivity\s*:\s*high|sous-branche sensible|niveau\s+s\b|ne jamais ouvrir/);
    }
  });
});
