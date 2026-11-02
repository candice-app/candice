import { describe, expect, it } from 'vitest';
import { assertUniqueFactTypes } from '../question-bank-guard';
// L'import de la banque exécute la garde au chargement : si la vraie banque avait une collision, CE import
// throwerait et tout le fichier échouerait. C'est précisément l'effet voulu (garde, pas test oubliable).
import '../socle-facts-fields';

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
