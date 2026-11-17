import { describe, it, expect } from 'vitest';
import { analyserCondition, evaluerCondition, peutPoser, type EtatDiscovery } from '../conditions';

// UNE CONDITION QU'ON NE SAIT PAS LIRE FERME LA QUESTION. Jamais l'inverse.
//
// Une question Discovery arrive seule, au milieu d'autre chose, et elle suppose un terrain.
// « Quelle céramique t'attire ? » posée à quelqu'un qui n'a jamais parlé de céramique
// affirme que Candice a compris quelque chose qu'elle n'a pas compris. Ces tests existent
// pour que personne ne transforme un jour `indecidable` en « on tente ».

const etatVide: EtatDiscovery = {
  tags: new Map(),
  nePasCreuser: new Set(),
  branchesOuvertes: new Set(),
  niveauParBranche: new Map(),
  dejaPosees: new Set(),
  attributsConnus: new Set(),
  sansAlcool: false,
  contextesConnus: new Set(),
  contextesActifs: new Set(),
};
const etat = (p: Partial<EtatDiscovery>): EtatDiscovery => ({ ...etatVide, ...p });
const ctx = { branche: 'creativity' };

describe('ce qui n’est pas compris ne s’ouvre pas', () => {
  it('une condition en prose pure est indécidable, donc non posée', () => {
    const c = analyserCondition('Quand la personne est prête à en parler');
    expect(c.lisible).toBe(false);
    expect(evaluerCondition(c, etatVide, ctx)).toBe('indecidable');
    expect(peutPoser(c, etatVide, ctx)).toBe(false);
  });

  it('une seule clause incomprise suffit à fermer, même si les autres disent oui', () => {
    const c = analyserCondition('`INTEREST.creativity=positive` ; ET quelque chose d’inédit');
    const e = etat({ tags: new Map([['INTEREST.creativity', 'positive']]) });
    expect(evaluerCondition(c, e, ctx)).toBe('indecidable');
    expect(peutPoser(c, e, ctx)).toBe(false);
  });

  it('les fragments incompris sont nommés tels quels, pas rapprochés du plus proche voisin', () => {
    const c = analyserCondition('Quand la lune est haute');
    expect(c.inconnues).toEqual(['Quand la lune est haute']);
  });
});

describe('les questions sensibles ne s’ouvrent jamais sur un score', () => {
  // Deuil, conflit, spiritualité, nostalgie. Elles ne sont pas interdites : elles ne
  // s'ouvrent pas toutes seules parce qu'un calcul de pertinence les a trouvées utiles.
  for (const texte of [
    'Branche Spiritualité ouverte — sensitivity: HIGH',
    'Niveau S. ⚠⚠ SOUS-BRANCHE SENSIBLE — Perte, deuil et événements difficiles.',
    'Branche Conflit & Réparation ouverte — sensitivity: HIGH',
  ]) {
    it(`« ${texte.slice(0, 44)}… » ferme`, () => {
      const c = analyserCondition(texte);
      expect(c.sensible).toBe(true);
      expect(evaluerCondition(c, etatVide, ctx)).toBe('fermer');
    });
  }

  it('une condition sensible ferme même quand tout le reste est satisfait', () => {
    const c = analyserCondition('`INTEREST.resonance=positive` ; ET sensitivity: HIGH');
    const e = etat({ tags: new Map([['INTEREST.resonance', 'positive']]) });
    expect(evaluerCondition(c, e, ctx)).toBe('fermer');
  });
});

describe('les portes mécaniques', () => {
  it('un intérêt absent ferme — l’absence n’est pas un « non », c’est l’absence de terrain', () => {
    const c = analyserCondition('Intérêt céramique sélectionné ou détecté');
    expect(c.lisible).toBe(true);
    expect(evaluerCondition(c, etatVide, ctx)).toBe('fermer');
    expect(evaluerCondition(c, etat({ tags: new Map([['INTEREST.céramique', 'positive']]) }), ctx)).toBe('ouvrir');
  });

  it('un refus de creuser ferme le domaine', () => {
    const c = analyserCondition('`DO_NOT_PROBE.creativity!=true`');
    expect(evaluerCondition(c, etatVide, ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etat({ nePasCreuser: new Set(['creativity']) }), ctx)).toBe('fermer');
  });

  it('un niveau non atteint ferme ; atteint ou dépassé, ouvre', () => {
    const c = analyserCondition('Niveau B Hôtellerie');
    expect(evaluerCondition(c, etatVide, ctx)).toBe('fermer');
    expect(evaluerCondition(c, etat({ niveauParBranche: new Map([['hôtellerie', 'A']]) }), ctx)).toBe('fermer');
    expect(evaluerCondition(c, etat({ niveauParBranche: new Map([['hôtellerie', 'B']]) }), ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etat({ niveauParBranche: new Map([['hôtellerie', 'C']]) }), ctx)).toBe('ouvrir');
  });

  it('« AXE 1 — … — niveau B » est la même porte, écrite dans l’autre sens', () => {
    const c = analyserCondition('AXE 2 — Comment j’aime célébrer les autres — niveau B');
    expect(c.lisible).toBe(true);
    expect(evaluerCondition(c, etat({ niveauParBranche: new Map([['axe 2 — comment j’aime célébrer les autres', 'B']]) }), ctx)).toBe('ouvrir');
  });

  it('une question alcool ne se pose jamais à quelqu’un qui ne boit pas', () => {
    const c = analyserCondition('ne jamais afficher les questions alcool si la personne ne boit pas');
    expect(evaluerCondition(c, etatVide, ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etat({ sansAlcool: true }), ctx)).toBe('fermer');
  });

  it('on ne redemande pas ce que Candice sait déjà', () => {
    const c = analyserCondition('`INTEREST.food=positive` ; ET information manquante');
    const base = { tags: new Map([['INTEREST.food', 'positive']]) };
    const avecAttribut = { branche: 'food', attribut: 'gift_format' };
    expect(evaluerCondition(c, etat(base), avecAttribut)).toBe('ouvrir');
    expect(evaluerCondition(c, etat({ ...base, attributsConnus: new Set(['gift_format']) }), avecAttribut)).toBe('fermer');
  });

  it('sans attribut nommé, « information manquante » est indécidable — on ne suppose pas le manque', () => {
    const c = analyserCondition('information manquante');
    expect(evaluerCondition(c, etatVide, { branche: 'food' })).toBe('indecidable');
  });
});

describe('un contexte inconnu n’est pas un contexte inactif', () => {
  it('un libellé que le moteur ne connaît pas rend indécidable, pas « fermé »', () => {
    const c = analyserCondition('Achat concret');
    expect(c.lisible).toBe(true);
    expect(evaluerCondition(c, etatVide, ctx)).toBe('indecidable');
  });

  it('connu et inactif ferme ; connu et actif ouvre', () => {
    const c = analyserCondition('Achat concret');
    const connus = new Set(['achat concret']);
    expect(evaluerCondition(c, etat({ contextesConnus: connus }), ctx)).toBe('fermer');
    expect(evaluerCondition(c, etat({ contextesConnus: connus, contextesActifs: connus }), ctx)).toBe('ouvrir');
  });
});

describe('la lecture est plus stricte que le texte, jamais plus permissive', () => {
  it('un « OU » est lu comme un ET, et signalé', () => {
    const c = analyserCondition('`INTEREST.a=positive` OU `INTEREST.b=positive`');
    expect(c.contientDisjonction).toBe(true);
    // Un seul des deux suffirait au texte ; il ne suffit pas ici. Moins de questions
    // posées, jamais plus.
    expect(evaluerCondition(c, etat({ tags: new Map([['INTEREST.a', 'positive']]) }), ctx)).toBe('fermer');
    expect(evaluerCondition(c, etat({ tags: new Map([['INTEREST.a', 'positive'], ['INTEREST.b', 'positive']]) }), ctx)).toBe('ouvrir');
  });

  it('un paramètre entre accolades n’est pas comparé à une constante', () => {
    const c = analyserCondition('`CONTEXT.celebration.current_occasion={occasion}`');
    expect(c.lisible).toBe(false); // on ne fait pas semblant de savoir ce que vaut {occasion}
  });
});
