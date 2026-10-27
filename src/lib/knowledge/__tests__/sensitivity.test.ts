// SENSIBILITÉ AU CONTENU (règle 27 oct) — une info santé/allergie/médicale/adresse, écrite dans N'IMPORTE
// QUEL champ, devient internal_only → filtrée de la prose. Le filtre regarde CE QUE DIT l'info, pas le champ.
import { describe, expect, it } from 'vitest';
import { classifyContentSensitivity } from '../sensitivity';
import { createFact } from '../fact';
import { accountAbout, asUserId } from '../identity';

const scope = { about: accountAbout(asUserId('u-test')), ownerId: asUserId('u-test') };
const mk = (value: string, sensitive = false) =>
  createFact({ ...scope, fact_id: 'f1', fact_type: 'singularity.evite_deteste', value, source: 's1',
    timestamp: '2026-10-27T00:00:00Z', confidence: 'high', ...(sensitive ? { sensitivity: { isSensitive: true } } : {}) });

describe('classifyContentSensitivity', () => {
  it('détecte santé / allergie / adresse', () => {
    expect(classifyContentSensitivity('je suis cœliaque, pas de gluten')).toBe(true);
    expect(classifyContentSensitivity('je suis allergique aux arachides')).toBe(true);
    expect(classifyContentSensitivity('je prends un traitement médical')).toBe(true);
    expect(classifyContentSensitivity("j'habite au 12 rue de la Paix")).toBe(true);
  });
  it('laisse passer le non-sensible', () => {
    expect(classifyContentSensitivity('les dîners où il faut parler fort')).toBe(false);
    expect(classifyContentSensitivity('apprendre la céramique, partir à Kyoto')).toBe(false);
    expect(classifyContentSensitivity('')).toBe(false);
  });
});

describe('createFact — sensibilité au CONTENU, pas au champ', () => {
  it('une info santé dans un champ RÉDACTIONNEL (non marqué sensible) → internal_only', () => {
    // exactement le cas Sophie : « cœliaque » glissé dans evite_deteste (champ non sensible)
    const f = mk('Les dîners bruyants. Et je suis cœliaque, pas de gluten.');
    expect(f.sensitivity?.isSensitive).toBe(true);
    expect(f.visibility.derived).toBe('internal_only'); // → filtré par readSocleFacts, absent de la prose
  });
  it('un contenu non sensible reste exposable', () => {
    const f = mk('Lire au lit le dimanche matin.');
    expect(f.visibility.derived).toBe('exposable');
  });
  it('un champ déjà marqué sensible reste internal_only', () => {
    const f = mk('n’importe quoi', true);
    expect(f.visibility.derived).toBe('internal_only');
  });
});
