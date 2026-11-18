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
    const e = etat({ tags: new Map([['interest.resonance', 'positive']]) });
    expect(evaluerCondition(c, e, ctx)).toBe('fermer');
  });
});

describe('les portes mécaniques', () => {
  it('un intérêt absent ferme — l’absence n’est pas un « non », c’est l’absence de terrain', () => {
    const c = analyserCondition('Intérêt céramique sélectionné ou détecté');
    expect(c.lisible).toBe(true);
    expect(evaluerCondition(c, etatVide, ctx)).toBe('fermer');
    expect(evaluerCondition(c, etat({ tags: new Map([['INTEREST.ceramique', 'positive']]) }), ctx)).toBe('ouvrir');
  });

  it('un refus de creuser ferme le domaine', () => {
    const c = analyserCondition('`DO_NOT_PROBE.creativity!=true`');
    expect(evaluerCondition(c, etatVide, ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etat({ nePasCreuser: new Set(['creativity']) }), ctx)).toBe('fermer');
  });

  it('un niveau non atteint ferme ; atteint ou dépassé, ouvre', () => {
    const c = analyserCondition('Niveau B Hôtellerie');
    expect(evaluerCondition(c, etatVide, ctx)).toBe('fermer');
    expect(evaluerCondition(c, etat({ niveauParBranche: new Map([['hotellerie', 'A']]) }), ctx)).toBe('fermer');
    expect(evaluerCondition(c, etat({ niveauParBranche: new Map([['hotellerie', 'B']]) }), ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etat({ niveauParBranche: new Map([['hotellerie', 'C']]) }), ctx)).toBe('ouvrir');
  });

  it('« AXE 1 — … — niveau B » est la même porte, écrite dans l’autre sens', () => {
    const c = analyserCondition('AXE 2 — Comment j’aime célébrer les autres — niveau B');
    expect(c.lisible).toBe(true);
    expect(evaluerCondition(c, etat({ niveauParBranche: new Map([['axe 2 — comment j’aime celebrer les autres', 'B']]) }), ctx)).toBe('ouvrir');
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
  it('un « OU » est évalué comme un OU : une seule alternative suffit', () => {
    // Décision du 18 nov. La première version exigeait les deux, « par prudence » : la
    // question ne s'ouvrait à peu près jamais. Ce test tenait l'ancien comportement.
    const c = analyserCondition('`INTEREST.a=positive` OU `INTEREST.b=positive`');
    expect(c.contientDisjonction).toBe(true);
    expect(evaluerCondition(c, etat({ tags: new Map([['INTEREST.a', 'positive']]) }), ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etat({ tags: new Map([['INTEREST.b', 'positive']]) }), ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etat({ tags: new Map([['INTEREST.a', 'positive'], ['INTEREST.b', 'positive']]) }), ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etatVide, ctx)).toBe('fermer');
  });

  it('un paramètre entre accolades n’est pas comparé à une constante', () => {
    const c = analyserCondition('`CONTEXT.celebration.current_occasion={occasion}`');
    expect(c.lisible).toBe(false); // on ne fait pas semblant de savoir ce que vaut {occasion}
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18 NOV. — LE SENS EXACT DES EXPRESSIONS. Un cas qui ouvre et un cas qui ferme pour
// chaque forme, pris sur des conditions RÉELLES du référentiel.
// ─────────────────────────────────────────────────────────────────────────────
describe('alternatives : la forme réelle du référentiel', () => {
  const REELLE = 'Tags ENTRANTS — ouvrir si  `INTEREST.creativity=positive` (direct, confirmé ou renforcé par une réponse antérieure) OU `PREFERENCE.creativity.practice_frequency.present=true` — produit par CRE-08 ; ET `DO_NOT_PROBE.creativity!=true` ; ET information manquante ; ET score de pertinence suffisant';
  const c = analyserCondition(REELLE);
  const ctxA = { branche: 'creativity', attribut: 'ceramics_goal' };

  it('elle est entièrement lisible : la note « — produit par CRE-08 » n’est pas une clause', () => {
    expect(c.inconnues).toEqual([]);
    expect(c.lisible).toBe(true);
    expect(c.groupes.length).toBe(4);
    expect(c.groupes[0].length).toBe(2);          // deux alternatives
  });
  it('première alternative vraie → ouvre', () => {
    expect(evaluerCondition(c, etat({ tags: new Map([['INTEREST.creativity', 'positive']]) }), ctxA)).toBe('ouvrir');
  });
  it('seconde alternative vraie, la première fausse → ouvre aussi', () => {
    expect(evaluerCondition(c, etat({ tags: new Map([['PREFERENCE.creativity.practice_frequency.present', 'true']]) }), ctxA)).toBe('ouvrir');
  });
  it('aucune alternative vraie → ferme', () => {
    expect(evaluerCondition(c, etatVide, ctxA)).toBe('fermer');
  });
  it('une alternative vraie ne dispense PAS des conditions qui suivent le point-virgule', () => {
    const e = etat({ tags: new Map([['INTEREST.creativity', 'positive']]), nePasCreuser: new Set(['creativity']) });
    expect(evaluerCondition(c, e, ctxA)).toBe('fermer');
    const e2 = etat({ tags: new Map([['INTEREST.creativity', 'positive']]), attributsConnus: new Set(['ceramics_goal']) });
    expect(evaluerCondition(c, e2, ctxA)).toBe('fermer');
  });
  it('le « OU » d’un commentaire entre parenthèses n’est pas une alternative', () => {
    const k = analyserCondition('`INTEREST.shoe=positive` (signal issu de l’onboarding OU d’une microquestion) ; ET `DO_NOT_PROBE.shoe!=true`');
    expect(k.contientDisjonction).toBe(false);
    expect(k.groupes.every((g) => g.length === 1)).toBe(true);
  });
});

describe('dans une alternative, le ET lie plus fort que le OU', () => {
  // « A OU B ET C » = A OU (B ET C)
  const c = analyserCondition('`INTEREST.food=positive` OU `CONTEXT.x.present=true` ET connaissance correspondante manquante');
  const ctxA = { branche: 'food', attribut: 'food_pleasures' };
  it('A seul ouvre, même si C est faux', () => {
    const e = etat({ tags: new Map([['INTEREST.food', 'positive']]), attributsConnus: new Set(['food_pleasures']) });
    expect(evaluerCondition(c, e, ctxA)).toBe('ouvrir');
  });
  it('B sans C ne suffit pas', () => {
    const e = etat({ tags: new Map([['CONTEXT.x.present', 'true']]), attributsConnus: new Set(['food_pleasures']) });
    expect(evaluerCondition(c, e, ctxA)).toBe('fermer');
  });
  it('B et C ensemble ouvrent', () => {
    expect(evaluerCondition(c, etat({ tags: new Map([['CONTEXT.x.present', 'true']]) }), ctxA)).toBe('ouvrir');
  });
});

describe('une alternative illisible ferme toute la condition', () => {
  it('même quand l’autre alternative est vraie', () => {
    const c = analyserCondition('`INTEREST.celebration.ritual=positive` OU `CONTEXT.celebration.current_occasion={occasion}` ET recherche de tradition');
    expect(c.lisible).toBe(false);
    const e = etat({ tags: new Map([['INTEREST.celebration.ritual', 'positive']]) });
    expect(evaluerCondition(c, e, ctx)).toBe('indecidable');
    expect(peutPoser(c, e, ctx)).toBe(false);
  });
});

describe('opérateur « != » : un cas qui ouvre, un cas qui ferme', () => {
  const c = analyserCondition('`PREFERENCE.gift.openness!=closed`');
  it('valeur différente ou absente → ouvre', () => {
    expect(evaluerCondition(c, etatVide, ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etat({ tags: new Map([['PREFERENCE.gift.openness', 'open']]) }), ctx)).toBe('ouvrir');
  });
  it('valeur égale → ferme', () => {
    expect(evaluerCondition(c, etat({ tags: new Map([['PREFERENCE.gift.openness', 'closed']]) }), ctx)).toBe('fermer');
  });
});

describe('branche ouverte : un cas qui ouvre, un cas qui ferme', () => {
  const c = analyserCondition('Branche Animaux philosophie ouverte');
  it('ouverte → ouvre ; absente → ferme', () => {
    expect(evaluerCondition(c, etat({ branchesOuvertes: new Set(['animaux philosophie']) }), ctx)).toBe('ouvrir');
    expect(evaluerCondition(c, etatVide, ctx)).toBe('fermer');
  });
});

describe('les trois niveaux de sensibilité du référentiel', () => {
  const tout = etat({
    branchesOuvertes: new Set(['changement']), niveauParBranche: new Map([['changement', 'C']]),
    tags: new Map([['INTEREST.changement', 'positive']]),
  });
  for (const niveau of ['MOYENNE', 'HIGH', 'MAXIMALE'] as const) {
    it(`« sensitivity: ${niveau} » ne s’ouvre pas sur un score, même tout satisfait`, () => {
      const c = analyserCondition(`Niveau C Changement — sensitivity: ${niveau}`);
      expect(c.sensible).toBe(true);
      expect(c.niveauSensibilite).toBe(niveau.toLowerCase());
      expect(evaluerCondition(c, tout, { branche: 'changement' })).toBe('fermer');
    });
  }
  it('la même condition SANS marque s’ouvre : c’est bien la marque qui ferme', () => {
    const c = analyserCondition('Niveau C Changement');
    expect(evaluerCondition(c, tout, { branche: 'changement' })).toBe('ouvrir');
  });
});

describe('branche « causes » : ouverture sur démarche explicite', () => {
  const MARQUE = "sensitivity: HIGH — OUVERTURE SUR DÉMARCHE EXPLICITE : la personne choisit d'explorer ce sujet ou l'aborde spontanément ; un score de pertinence seul ne l'ouvre pas. L'intérêt pour une cause ne permet de déduire aucune appartenance politique, religieuse ou associative. ║ ";
  const c = analyserCondition(MARQUE + 'Branche Causes ouverte');
  const terrain = etat({ branchesOuvertes: new Set(['causes']), tags: new Map([['INTEREST.causes', 'positive']]) });
  const ctxC = { branche: 'causes' };

  it('elle est sensible, et porte un mode d’ouverture', () => {
    expect(c.sensible).toBe(true);
    expect(c.ouvertureSurDemarche).toBe(true);
    expect(c.inconnues).toEqual([]);      // la marque n'est pas lue comme une clause
  });
  it('le terrain seul (intérêt, branche ouverte, score) NE l’ouvre PAS', () => {
    expect(evaluerCondition(c, terrain, ctxC)).toBe('fermer');
  });
  it('la démarche de la personne pour CETTE branche l’ouvre', () => {
    expect(evaluerCondition(c, { ...terrain, sujetsChoisis: new Set(['causes']) }, ctxC)).toBe('ouvrir');
  });
  it('une démarche pour une AUTRE branche ne l’ouvre pas', () => {
    expect(evaluerCondition(c, { ...terrain, sujetsChoisis: new Set(['voyage']) }, ctxC)).toBe('fermer');
  });
  it('la démarche ne dispense pas de la condition d’origine', () => {
    expect(evaluerCondition(c, etat({ sujetsChoisis: new Set(['causes']) }), ctxC)).toBe('fermer');
  });
  it('une question sensible SANS mode d’ouverture reste fermée, démarche ou non', () => {
    const k = analyserCondition('Territoire La santé : si recherche/santé coché — sensitivity: MAXIMALE');
    expect(evaluerCondition(k, { ...terrain, sujetsChoisis: new Set(['causes']) }, ctxC)).toBe('fermer');
  });
});
