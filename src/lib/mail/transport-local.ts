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
      // ⚠ LE CONTENU DES PIÈCES N'EST JAMAIS ÉCRIT. L'export RGPD porte l'intégralité
      // des données d'une personne ; le journaliser sur le disque le ferait survivre à
      // l'envoi, en clair, hors de tout effacement. On garde le nom et la taille, de quoi
      // prouver qu'une pièce est bien partie — rien de ce qu'elle contient.
      const ligne = JSON.stringify({
        ts: new Date().toISOString(),
        to: courriel.to,
        subject: courriel.subject,
        liens: liensDe(courriel.html),
        ...(courriel.pieces?.length
          ? { pieces: courriel.pieces.map((p) => ({ nom: p.nom, octets: p.contenuBase64.length })) }
          : {}),
      });
      mkdirSync(dirname(DOSSIER_COURRIEL_LOCAL), { recursive: true });
      appendFileSync(DOSSIER_COURRIEL_LOCAL, ligne + '\n', 'utf8');
    },
  };
}
