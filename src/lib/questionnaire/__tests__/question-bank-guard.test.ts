import { describe, expect, it } from 'vitest';
import { assertUniqueFactTypes, type BankEntry } from '../question-bank-guard';
// L'import de la banque exécute la garde au chargement : si la vraie banque avait une collision, CE import
// throwerait et tout le fichier échouerait. C'est précisément l'effet voulu (garde, pas test oubliable).
import { SINGULARITY_FACT_FIELDS, PRACTICAL_FACT_FIELDS, Q17_FACT_FIELD } from '../socle-facts-fields';
// TOUS les producteurs de question_code (grep exhaustif 2 nov) — pour la couverture globale ci-dessous.
import { ONBOARDING_MAPPINGS, SOUTIEN, MOTEURS } from '../../knowledge/onboarding';
import { INCOGNITO_QUESTIONS } from '../../knowledge/onboarding-incognito';

describe('assertUniqueFactTypes — garde au chargement de la banque', () => {
  it('passe quand tous les factType sont distincts', () => {
    expect(() => assertUniqueFactTypes([
      { factType: 'singularity.a', where: 'X.a' },
      { factType: 'singularity.b', where: 'X.b' },
    ])).not.toThrow();
  });

  it('ÉCHOUE bruyamment sur une collision, en NOMMANT les deux champs', () => {
    let msg = '';
    try {
      assertUniqueFactTypes([
        { factType: 'practical.age', where: 'PRACTICAL_FACT_FIELDS.age' },
        { factType: 'practical.age', where: 'AUTRE_BANQUE.anniversaire' },
      ]);
    } catch (e) { msg = (e as Error).message; }
    expect(msg).toContain('practical.age');
    expect(msg).toContain('PRACTICAL_FACT_FIELDS.age');
    expect(msg).toContain('AUTRE_BANQUE.anniversaire');
  });

  it('la vraie banque socle se charge sans collision (la garde ne lève pas)', async () => {
    await expect(import('../socle-facts-fields')).resolves.toBeDefined();
  });
});

// ── COUVERTURE GLOBALE — aucun question_code partagé entre DEUX producteurs distincts ──
// La garde au chargement protège le PÉRIMÈTRE SUPERSÉDABLE (voies onboarding_open / extraction_inferred,
// toutes produites par la banque socle). Les deux autres producteurs de question_code écrivent des voies
// HORS de ce périmètre (mappings onboarding → onboarding_closed ; incognito → reported_by_relative + about
// contact), donc une correction self ne les supersède jamais. Ce test ferme le dernier trou : il prouve
// qu'AUCUN code ne collisionne EN PLUS entre banques (si un jour un champ socle était nommé « q2 » ou
// « I1 », il échouerait ici, en nommant les deux).
describe('couverture globale des producteurs de question_code', () => {
  it('socle + onboarding (dédupliqué) + incognito : aucune collision inter-banques', () => {
    const socle: BankEntry[] = [
      ...Object.entries(SINGULARITY_FACT_FIELDS).map(([k, s]) => ({ factType: s.factType, where: `socle:${k}` })),
      ...Object.entries(PRACTICAL_FACT_FIELDS).map(([k, s]) => ({ factType: s.factType, where: `socle:${k}` })),
      { factType: Q17_FACT_FIELD.factType, where: 'socle:q17' },
    ];
    // Les mappings d'onboarding RÉPÈTENT un questionCode par conception (une question → N options) →
    // on déduplique en UNE entrée par code distinct avant la vérif inter-banques.
    const onboardingCodes = [...new Set([
      ...ONBOARDING_MAPPINGS.map((m) => m.questionCode),
      SOUTIEN.questionCode, MOTEURS.questionCode, 'interests',
    ])];
    const onboarding: BankEntry[] = onboardingCodes.map((c) => ({ factType: c, where: `onboarding:${c}` }));
    const incognito: BankEntry[] = INCOGNITO_QUESTIONS.map((q) => ({ factType: q.code, where: `incognito:${q.code}` }));

    expect(() => assertUniqueFactTypes([...socle, ...onboarding, ...incognito])).not.toThrow();
  });
});
