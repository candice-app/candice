import { describe, it, expect } from 'vitest';
import { phrasesDuJournal, contraintesPratiquesDe } from '../phrases-du-journal';
import type { Portrait } from '@/lib/knowledge/portrait';

// UNE ABSENCE NE PRODUIT AUCUNE PHRASE.
//
// L'ancien répertoire écrivait « équilibre entre proximité et autonomie » dès que l'axe
// tombait entre -30 et +30 — donc aussi quand il valait 0 parce que RIEN n'avait été
// renseigné. Candice affirmait un équilibre chez quelqu'un dont elle ne savait rien, et la
// phrase était indiscernable d'un équilibre réellement constaté.
//
// Ces tests tiennent la règle dans l'autre sens aussi : ce que le journal DIT doit sortir.
// Un module qui ne dit jamais rien serait prudent et inutile.

const MODALITES = ['WORDS', 'SERVICES', 'PERSONALIZED_GIFT', 'SYMBOLIC_GIFT',
                   'QUALITY_TIME', 'MICRO_ATTENTIONS', 'SURPRISE'] as const;
const vecteurVide = () =>
  Object.fromEntries(MODALITES.map((m) => [m, { score: 'unknown', evidenceCount: 0, confidence: 'none' }]));

const portrait = (p: Record<string, unknown> = {}): Portrait => ({
  scope: { about: { kind: 'account', id: 'u' }, ownerId: 'u' },
  nbPreuves: 0,
  profile: [], interests: [], entities: [], preferences: [], behaviors: [],
  guardrails: [], needs: [], drivers: [], contexts: [],
  affection: { receive: vecteurVide(), give: vecteurVide() },
  ...p,
} as unknown as Portrait);

const sig = (score: string, n = 1, direction?: string) =>
  ({ score, evidenceCount: n, confidence: 'medium', ...(direction ? { direction } : {}) });

describe('un portrait vide ne fait écrire aucune phrase', () => {
  it('toutes les listes sont vides — aucun « équilibre » affirmé par défaut', () => {
    const p = phrasesDuJournal(portrait());
    expect(p.touche).toEqual([]);
    expect(p.eviter).toEqual([]);
    expect(p.styleRelationnel).toEqual([]);
    expect(p.communication).toEqual([]);
    expect(p.attentionsIdeales).toEqual([]);
    expect(p.attentionsAEviter).toEqual([]);
    expect(p.gouts).toEqual([]);
    expect(p.nbPreuves).toBe(0);
  });

  it('aucune phrase ne contient le mot « équilibre »', () => {
    // La phrase fautive de l'ancien répertoire, nommément : elle ne doit pouvoir sortir
    // d'aucune combinaison de données absentes.
    const toutes = Object.values(phrasesDuJournal(portrait())).flat().join(' ');
    expect(toutes.toLowerCase()).not.toContain('équilibre');
  });
});

describe('ce que le journal dit, les phrases le disent', () => {
  it('une modalité reçue établie produit la phrase correspondante', () => {
    const p = phrasesDuJournal(portrait({
      nbPreuves: 3,
      affection: { receive: { ...vecteurVide(), QUALITY_TIME: sig('high', 3) }, give: vecteurVide() },
    }));
    expect(p.touche.join(' ')).toContain('temps partagé');
    expect(p.attentionsIdeales.length).toBeGreaterThan(0);
  });

  it('un garde-fou déclaré devient une chose à éviter, dans ses termes', () => {
    const p = phrasesDuJournal(portrait({
      nbPreuves: 1,
      guardrails: [{ code: 'GRD_PUBLIC_EXPOSURE', ...sig('high') }],
    }));
    expect(p.eviter.join(' ')).toContain('devant du monde');
  });

  it('un comportement constaté est NOMMÉ, pas interprété', () => {
    const p = phrasesDuJournal(portrait({
      nbPreuves: 1,
      behaviors: [{ behaviorContext: 'conflict_response', pattern: 'avoid_conflict', ...sig('high') }],
    }));
    // Le motif tel qu'il est, lisible — aucune conclusion ajoutée sur ce que ça « révèle ».
    expect(p.communication.join(' ')).toContain('avoid conflict');
    expect(p.communication.join(' ')).not.toMatch(/donc|cela signifie|révèle/i);
  });

  it('un trait seulement PRÉSENT ne devient pas un trait MARQUANT', () => {
    const faible = phrasesDuJournal(portrait({ nbPreuves: 1, profile: [{ construct: 'PROFILE_EXACTINGNESS', ...sig('low', 1, 'positive') }] }));
    const fort = phrasesDuJournal(portrait({ nbPreuves: 5, profile: [{ construct: 'PROFILE_EXACTINGNESS', ...sig('high', 5, 'positive') }] }));
    expect(faible.touche.join(' ')).not.toContain("qualité d'exécution");
    expect(fort.touche.join(' ')).toContain("qualité d’exécution");
  });

  it('une direction négative dit le contraire, elle ne disparaît pas', () => {
    const pos = phrasesDuJournal(portrait({ nbPreuves: 2, profile: [{ construct: 'IMPORTANCE_AESTHETIC', ...sig('high', 2, 'positive') }] }));
    const neg = phrasesDuJournal(portrait({ nbPreuves: 2, profile: [{ construct: 'IMPORTANCE_AESTHETIC', ...sig('high', 2, 'negative') }] }));
    expect(pos.gouts.join(' ')).toContain('sensible au beau');
    expect(neg.gouts.length).toBeGreaterThan(0);
    expect(neg.gouts.join(' ')).toContain('peu sensible');
  });

  it('l’énergie sociale aux extrémités parle ; au milieu, elle se taît', () => {
    const seule = phrasesDuJournal(portrait({ nbPreuves: 1, profile: [{ construct: 'SOCIAL_ENERGY', position: 0, evidenceCount: 1, score: 'high', confidence: 'high' }] }));
    expect(seule.styleRelationnel.join(' ')).toContain('intérieure');
    const milieu = phrasesDuJournal(portrait({ nbPreuves: 1, profile: [{ construct: 'SOCIAL_ENERGY', position: 2, evidenceCount: 1, score: 'high', confidence: 'high' }] }));
    // Position centrale CONNUE : on n'en tire aucune phrase plutôt que d'inventer un milieu.
    expect(milieu.styleRelationnel).toEqual([]);
  });
});

describe('les entités évitées remontent telles quelles', () => {
  it('une entité AVOID est nommée dans les attentions à éviter', () => {
    const p = phrasesDuJournal(portrait({
      nbPreuves: 1,
      entities: [{ entity: 'fleurs_coupees', entityLabel: 'fleurs coupées', entityType: 'unknown',
                   relation: 'AVOID', relationHistory: [], ...sig('high') }],
    }));
    expect(p.attentionsAEviter).toContain('fleurs coupées');
  });

  it('une entité AIMÉE n’y figure pas', () => {
    const p = phrasesDuJournal(portrait({
      nbPreuves: 1,
      entities: [{ entity: 'dammann', entityLabel: 'Dammann Frères', entityType: 'brand',
                   relation: 'LOVE', relationHistory: [], ...sig('high') }],
    }));
    expect(p.attentionsAEviter).not.toContain('Dammann Frères');
  });
});

describe('les contraintes pratiques ne passent pas par les phrases', () => {
  it('elles sont construites depuis les vetos, structurellement', () => {
    const c = contraintesPratiquesDe({ vetos: { allergies: ['arachide', 'lactose'], halal: true } });
    expect(c.join(' ')).toContain('arachide');
    expect(c.some((x) => x.includes('régime'))).toBe(true);
  });

  it('aucune contrainte de santé n’apparaît dans les phrases de la fiche', () => {
    // La fiche est partageable. Ces informations vivent dans `constraints`, qui n'est pas
    // dans le select partagé — et jamais dans la prose.
    const p = phrasesDuJournal(portrait({
      nbPreuves: 1,
      guardrails: [{ code: 'GRD_PUBLIC_EXPOSURE', ...sig('high') }],
    }));
    const toutes = Object.values(p).flat().join(' ').toLowerCase();
    for (const mot of ['allergie', 'arachide', 'lactose', 'halal', 'casher', 'mobilité', 'santé']) {
      expect(toutes, `« ${mot} » dans les phrases de la fiche`).not.toContain(mot);
    }
  });

  it('sans vetos, aucune contrainte — pas de liste vide déguisée en « rien à signaler »', () => {
    expect(contraintesPratiquesDe(null)).toEqual([]);
    expect(contraintesPratiquesDe({})).toEqual([]);
  });
});
