// Le transport local n'émet RIEN. L'espion porte sur `fetch` lui-même, pas sur la fonction
// d'envoi : espionner l'envoi prouverait seulement qu'on ne l'a pas appelée.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('transport local — aucun appel sortant, liens capturés', () => {
  let fichier: string;
  let espionFetch: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fichier = join(mkdtempSync(join(tmpdir(), 'courriel-')), 'courriels.jsonl');
    vi.stubEnv('MAIL_TRANSPORT', 'local');
    vi.stubEnv('MAIL_LOCAL_FILE', fichier);
    espionFetch = vi.spyOn(globalThis, 'fetch');
    vi.resetModules();
  });
  afterEach(() => { vi.unstubAllEnvs(); espionFetch.mockRestore(); });

  it('écrit le courriel et ses liens, sans jamais appeler fetch', async () => {
    const { _remplacerTransport, envoyerCourriel } = await import('../transport');
    _remplacerTransport(null); // force la résolution par MAIL_TRANSPORT
    await envoyerCourriel({
      to: 'essai@local', subject: 'Annulation',
      html: '<a href="http://localhost:3000/api/account/cancel-deletion?t=abc">Annuler</a>',
    });
    expect(espionFetch).not.toHaveBeenCalled();
    const ligne = JSON.parse(readFileSync(fichier, 'utf8').trim());
    expect(ligne.to).toBe('essai@local');
    expect(ligne.liens).toEqual(['http://localhost:3000/api/account/cancel-deletion?t=abc']);
  });

  it('une pièce jointe : le NOM et la TAILLE sont journalisés, JAMAIS le contenu', async () => {
    const { _remplacerTransport, envoyerCourriel } = await import('../transport');
    _remplacerTransport(null);
    // Un contenu reconnaissable : s'il atterrit sur le disque, on le verra.
    const secret = Buffer.from('{"confidence":"SECRET-RGPD-NE-DOIT-PAS-FUIR"}').toString('base64');
    await envoyerCourriel({
      to: 'essai@local', subject: 'Ton export de données Candice (RGPD)',
      html: '<p>ci-joint</p>',
      pieces: [{ nom: 'candice-export-2026-11-13.json', contenuBase64: secret }],
    });
    expect(espionFetch).not.toHaveBeenCalled();
    const brut = readFileSync(fichier, 'utf8');
    // Le fichier ENTIER, pas seulement le champ attendu : une fuite passerait par n'importe où.
    expect(brut).not.toContain(secret);
    expect(brut).not.toContain('SECRET-RGPD-NE-DOIT-PAS-FUIR');
    const ligne = JSON.parse(brut.trim());
    expect(ligne.pieces).toEqual([{ nom: 'candice-export-2026-11-13.json', octets: secret.length }]);
  });

  it('un courriel SANS pièce ne fabrique pas de champ pieces', async () => {
    const { _remplacerTransport, envoyerCourriel } = await import('../transport');
    _remplacerTransport(null);
    await envoyerCourriel({ to: 'essai@local', subject: 'Simple', html: '<p>rien</p>' });
    const ligne = JSON.parse(readFileSync(fichier, 'utf8').trim());
    expect(Object.prototype.hasOwnProperty.call(ligne, 'pieces')).toBe(false);
  });

  it('le transport choisi est bien le local', async () => {
    const { _remplacerTransport, transport } = await import('../transport');
    _remplacerTransport(null);
    expect((await transport()).nom).toBe('local');
    expect(espionFetch).not.toHaveBeenCalled();
  });
});
