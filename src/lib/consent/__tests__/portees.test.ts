// Retirer UN usage ne doit jamais retirer les autres : ce serait révoquer en silence des
// accords que la personne n'a pas repris.
import { describe, expect, it } from 'vitest';
import { accorder, retirer } from '../portees';

const EXCL = 'reco_exclusions';

describe('accorder', () => {
  it('ouvre une ligne active quand il n’y en avait pas', () => {
    expect(accorder(null, EXCL)).toEqual({ scope: [EXCL], status: 'active' });
  });
  it('s’ajoute aux portées existantes sans les toucher', () => {
    expect(accorder({ scope: ['analysis'], status: 'active' }, EXCL))
      .toEqual({ scope: ['analysis', EXCL], status: 'active' });
  });
  it('est idempotent : réaccorder ne duplique pas', () => {
    expect(accorder({ scope: ['analysis', EXCL], status: 'active' }, EXCL).scope)
      .toEqual(['analysis', EXCL]);
  });
});

describe('retirer — LE POINT QUI COMPTE', () => {
  it('préserve les autres accords de la MÊME ligne', () => {
    const r = retirer({ scope: ['analysis', EXCL], status: 'active' }, EXCL);
    expect(r.scope).toEqual(['analysis']);
    expect(r.status).toBe('active'); // le partage de l'analyse n'est PAS révoqué
  });

  it('révoque la ligne quand c’était la dernière portée', () => {
    // Laisser « active » avec un tableau vide donnerait un consentement qui ne consent
    // à rien — un état que personne ne saurait relire correctement.
    expect(retirer({ scope: [EXCL], status: 'active' }, EXCL))
      .toEqual({ scope: [], status: 'revoked' });
  });

  it('retirer une portée NON accordée ne révoque rien', () => {
    const avant = { scope: ['analysis'], status: 'active' as const };
    expect(retirer(avant, EXCL)).toEqual({ scope: ['analysis'], status: 'active' });
  });

  it('sans ligne du tout, le retrait est sans effet et sans erreur', () => {
    expect(retirer(null, EXCL)).toEqual({ scope: [], status: 'revoked' });
  });

  it('un aller-retour complet ne perd aucun autre accord', () => {
    let e = { scope: ['analysis'], status: 'active' as const } as import('../portees').EtatConsentement;
    e = accorder(e, EXCL);
    expect(e.scope).toContain('analysis');
    e = retirer(e, EXCL);
    expect(e.scope).toEqual(['analysis']);
    expect(e.status).toBe('active');
  });
});
