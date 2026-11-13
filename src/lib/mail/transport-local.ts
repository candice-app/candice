// TRANSPORT LOCAL — n'émet RIEN. Écrit l'objet, le destinataire et les LIENS extraits dans
// un fichier JSONL, pour que les scénarios d'essai puissent suivre un lien d'annulation.
// Aucun appel sortant : c'est la propriété que le test assère, sur `fetch` lui-même.
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Courriel, Transport } from './transport';

export const DOSSIER_COURRIEL_LOCAL = process.env.MAIL_LOCAL_FILE ?? '.local-mail/courriels.jsonl';

/** Les href d'un corps HTML, dans l'ordre d'apparition. */
export function liensDe(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

export function transportLocal(): Transport {
  return {
    nom: 'local',
    async envoyer(courriel: Courriel): Promise<void> {
      const ligne = JSON.stringify({
        ts: new Date().toISOString(),
        to: courriel.to,
        subject: courriel.subject,
        liens: liensDe(courriel.html),
      });
      mkdirSync(dirname(DOSSIER_COURRIEL_LOCAL), { recursive: true });
      appendFileSync(DOSSIER_COURRIEL_LOCAL, ligne + '\n', 'utf8');
    },
  };
}
