import { describe, it, expect } from 'vitest';
import { produireDepuisOption } from '../produire';
import { BANQUE } from '../banque';
import type { OptionV3, QuestionV3 } from '../banque';

// CE QUI EST ÉCRIT VIENT DU CONTRAT, ET RIEN D'AUTRE.
//
// La base n'impose AUCUNE contrainte sur `target_construct` : elle accepterait n'importe
// quelle chaîne. Une écriture hors vocabulaire ne serait donc pas rejetée — elle passerait,
// se consoliderait, et remonterait dans le portrait sous un nom que personne n'a défini,
// jusque dans les écrans de respiration. Ces tests sont le garde-fou que la base n'a pas.

const q = (p: Partial<QuestionV3> = {}): QuestionV3 => ({
  id: 'T-01', enonce: 'Question d’essai', forme: 'single', branche: 'creativity',
  niveau: 'B', condition_emission: 'Niveau B creativity', options: [], ...p,
});
const o = (p: Partial<OptionV3>): OptionV3 => ({
  rang: '1', libelle: 'Une option', voie: 'HSG_EVIDENCE', ...p,
});

describe('ce que le contrat ne dit pas n’est pas écrit', () => {
  it('une option DRIVER est refusée : le référentiel n’y porte aucun code du journal', () => {
    // « Leur affection », « leur intelligence » : ce que la personne apprécie CHEZ
    // QUELQU'UN, pas un moteur d'attention. Les écrire comme DRIVER inventerait des
    // moteurs que ni la reco ni le portrait ne comprennent.
    const p = produireDepuisOption(q(), o({ famille: 'DRIVER', attribut: 'value_sought', valeur: { __scalaire__: 'leur_affection' } }));
    expect(p.type).toBe('rien');
    if (p.type === 'rien') expect(p.motif).toBe('vocabulaire_incompatible');
  });

  it('une relation d’entité ambiguë est refusée, jamais tranchée', () => {
    const p = produireDepuisOption(q(), o({
      famille: 'ENTITY', attribut: 'desired_item',
      valeur: { relation: 'WANT_TO_TRY|WANT_TO_OWN (à résoudre depuis le verbatim)', objet: 'un_livre' },
    }));
    expect(p.type).toBe('rien');
    if (p.type === 'rien') expect(p.motif).toBe('contrat_incomplet');
  });

  it('un paramètre non résolu ferme l’écriture — « {occasion} » n’est pas une valeur', () => {
    const p = produireDepuisOption(q(), o({
      famille: 'GUARDRAIL', attribut: 'occasion_scope',
      valeur: { objet: 'occasion={occasion}', celebrer: 'interdit' },
    }));
    expect(p.type).toBe('rien');
  });

  it('les voies non émettrices ne produisent rien, et ce n’est pas un défaut', () => {
    for (const [voie, motif] of [
      ['NO_EMISSION', 'contrat_sans_emission'],
      ['ACTION_PARAMETER', 'action_interface'],
      ['DISCOVERY_STATE', 'etat_parcours'],
      ['OPEN_KNOWLEDGE', 'connaissance_ouverte'],
    ] as const) {
      const p = produireDepuisOption(q(), o({ voie }));
      expect(p.type).toBe('rien');
      if (p.type === 'rien') expect(p.motif).toBe(motif);
    }
  });
});

describe('un refus garde sa portée exacte et sa sévérité déclarée', () => {
  it('le chemin vertical ne déborde pas du domaine du refus', () => {
    const p = produireDepuisOption(
      q({ branche: 'shoe' }),
      o({ famille: 'GUARDRAIL', domaine: 'shoe', attribut: 'gift_openness', severite: 'HARD',
          valeur: { objet: 'cadeau_chaussures=refuse' }, libelle: 'Je préfère qu’on ne m’offre pas de chaussures' }),
    );
    expect(p.type).toBe('evidence');
    if (p.type !== 'evidence') return;
    // Le refus porte sur les chaussures. Il ne devient pas un refus de cadeau en général.
    expect(p.evidence.target_construct).toContain('shoe');
    expect(p.evidence.target_construct).toContain('gift_openness');
    expect(p.evidence.severity).toBe('HARD');
  });

  it('sans sévérité au contrat, le refus reste SOFT — on ne durcit jamais pour la personne', () => {
    const p = produireDepuisOption(q(), o({
      famille: 'GUARDRAIL', attribut: 'gift_antipattern', valeur: { __scalaire__: 'technique_sans_interet' },
    }));
    expect(p.type).toBe('evidence');
    if (p.type === 'evidence') expect(p.evidence.severity).toBe('SOFT');
  });
});

describe('aucune force et aucun degré ne sont inventés', () => {
  it('la force est toujours « moderate » : le référentiel ne gradue pas une case cochée', () => {
    const p = produireDepuisOption(q(), o({ famille: 'PREFERENCE', attribut: 'gift_format', valeur: { forme: 'atelier' } }));
    expect(p.type).toBe('evidence');
    if (p.type === 'evidence') expect(p.evidence.strength).toBe('moderate');
  });

  it('un intérêt n’obtient AUCUN degré d’engagement', () => {
    const p = produireDepuisOption(q(), o({ famille: 'INTEREST', attribut: 'domain_importance', valeur: { __scalaire__: 'ceramique' } }));
    expect(p.type).toBe('evidence');
    if (p.type !== 'evidence') return;
    // R1/R2 : une sélection sans niveau ne fabrique pas « casual ». L'absence est juste.
    expect(p.evidence).not.toHaveProperty('relationship');
  });
});

describe('la valeur écrite est celle du contrat, en entier et de façon stable', () => {
  it('une table à plusieurs clés est sérialisée, clés triées — deux fois la même option, la même valeur', () => {
    const opt = o({ famille: 'PREFERENCE', attribut: 'gift_openness', valeur: { ouverture: 'conditionnelle', condition: 'adequation_exacte' } });
    const a = produireDepuisOption(q(), opt);
    const b = produireDepuisOption(q(), opt);
    expect(a.type).toBe('evidence');
    if (a.type !== 'evidence' || b.type !== 'evidence') return;
    expect(a.evidence.preferenceValue).toBe(b.evidence.preferenceValue);
    expect(a.evidence.preferenceValue).toBe('condition=adequation_exacte;ouverture=conditionnelle');
  });

  it('un qualificatif sans clé est conservé, jamais collé à la clé précédente', () => {
    const p = produireDepuisOption(q(), o({
      famille: 'PREFERENCE', attribut: 'x', valeur: { a: '1', __libres__: ['un_detail'] },
    }));
    expect(p.type).toBe('evidence');
    if (p.type === 'evidence') expect(p.evidence.preferenceValue).toBe('a=1;un_detail');
  });

  it('la modalité d’affection est lue dans ses trois écritures, commentaire exclu', () => {
    for (const valeur of [
      { direction: 'receive', modality: 'WORDS' },
      { direction: 'receive', modality: 'WORDS — canal=lettre manuscrite' },
      { direction: 'receive', __libres__: ['WORDS'] },
    ]) {
      const p = produireDepuisOption(q(), o({ famille: 'AFFECTION_LANGUAGE', valeur }));
      expect(p.type, JSON.stringify(valeur)).toBe('evidence');
      if (p.type === 'evidence') {
        expect(p.evidence.modality).toBe('WORDS');
        expect(p.evidence.target_construct).toBe('AFFECTION_RECEIVE_WORDS');
      }
    }
  });

  it('un langage d’affection sans direction est refusé — recevoir et donner ne se confondent pas', () => {
    const p = produireDepuisOption(q(), o({ famille: 'AFFECTION_LANGUAGE', valeur: { modality: 'WORDS' } }));
    expect(p.type).toBe('rien');
  });
});

describe('sur la banque entière', () => {
  it('aucune preuve produite ne porte un construct vide ou douteux', () => {
    for (const qq of BANQUE) {
      for (const oo of qq.options) {
        const p = produireDepuisOption(qq, oo);
        if (p.type !== 'evidence') continue;
        expect(p.evidence.target_construct.trim().length, `${qq.id} / ${oo.libelle}`).toBeGreaterThan(0);
        expect(p.evidence.target_construct, `${qq.id} / ${oo.libelle}`).not.toContain('{');
        expect(p.evidence.target_construct, `${qq.id} / ${oo.libelle}`).not.toContain('undefined');
      }
    }
  });

  it('aucune preuve DRIVER ou NEED n’est produite tant que le vocabulaire n’est pas tranché', () => {
    const familles = new Set<string>();
    for (const qq of BANQUE) for (const oo of qq.options) {
      const p = produireDepuisOption(qq, oo);
      if (p.type === 'evidence') familles.add(p.evidence.target_family);
    }
    expect(familles.has('DRIVER')).toBe(false);
    expect(familles.has('NEED')).toBe(false);
  });

  it('chaque garde-fou produit porte une sévérité', () => {
    for (const qq of BANQUE) for (const oo of qq.options) {
      const p = produireDepuisOption(qq, oo);
      if (p.type === 'evidence' && p.evidence.target_family === 'GUARDRAIL') {
        expect(p.evidence.severity, `${qq.id} / ${oo.libelle}`).toMatch(/^(SOFT|HARD)$/);
      }
    }
  });
});
