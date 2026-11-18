import { describe, it, expect } from 'vitest';
import { reserverEnvoi, empreinteAdresse } from '../limites';

const faux = (reponse: { data: unknown; error: { message: string } | null } | Error) => ({
  appels: [] as Record<string, unknown>[],
  rpc(_nom: string, args: Record<string, unknown>) { this.appels.push(args); return reponse instanceof Error ? Promise.reject(reponse) : Promise.resolve(reponse); },
});

describe('limites d’envoi — côté appelant', () => {
  it('l’adresse n’est jamais transmise : seule son empreinte, insensible à la casse et aux espaces', async () => {
    const c = faux({ data: 'ok', error: null });
    await reserverEnvoi(c, { expediteur: 'u', destinataire: '  Zoe@Exemple.FR ', type: 'invitation' });
    expect(JSON.stringify(c.appels)).not.toMatch(/zoe|exemple/i);
    expect(c.appels[0].p_destinataire_h).toBe(empreinteAdresse('zoe@exemple.fr'));
    expect(String(c.appels[0].p_destinataire_h)).toMatch(/^[0-9a-f]{64}$/);
  });
  it('« ok » seulement si la base dit ok', async () => {
    expect((await reserverEnvoi(faux({ data: 'ok', error: null }), { expediteur: 'u', destinataire: 'a@b.fr', type: 'rappel' })).ok).toBe(true);
    expect(await reserverEnvoi(faux({ data: 'limite_expediteur', error: null }), { expediteur: 'u', destinataire: 'a@b.fr', type: 'rappel' })).toEqual({ ok: false, motif: 'limite_expediteur' });
  });
  it('échoue FERMÉ : erreur de la base, fonction absente, exception, réponse vide', async () => {
    for (const r of [{ data: null, error: { message: 'function does not exist' } }, { data: null, error: null }, new Error('réseau')]) {
      expect((await reserverEnvoi(faux(r as never), { expediteur: 'u', destinataire: 'a@b.fr', type: 'rappel' })).ok).toBe(false);
    }
  });
  it('sans destinataire, rien', async () => expect((await reserverEnvoi(faux({ data: 'ok', error: null }), { expediteur: 'u', destinataire: '  ', type: 'rappel' })).ok).toBe(false));
});
