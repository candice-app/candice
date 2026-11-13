// TRANSPORT RESEND — l'appel sortant réel. Ce module n'est importé que lorsque le choix
// a été fait dans transport.ts ; aucun point d'appel ne le référence directement.
import type { Courriel, Transport } from './transport';

export function transportResend(): Transport {
  return {
    nom: 'resend',
    async envoyer(courriel: Courriel): Promise<void> {
      const cle = process.env.RESEND_API_KEY;
      if (!cle) throw new Error('RESEND_API_KEY absente : aucun envoi possible.');
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'Candice <bonjour@candice.app>',
          to: courriel.to, subject: courriel.subject, html: courriel.html,
        }),
      });
      if (!r.ok) throw new Error(`Resend: HTTP ${r.status} ${await r.text()}`);
    },
  };
}
