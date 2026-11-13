// TRANSPORT COURRIEL — UN SEUL POINT DE CHOIX.
//
// Le choix de l'implémentation vit ICI, jamais au point d'appel : un garde `NODE_ENV`
// posé là où l'on envoie retombe au deuxième appel courriel écrit — c'est exactement la
// leçon de `cancel-deletion`, où la sûreté tenait à une discipline tenue à un seul endroit.
//
// MAIL_TRANSPORT=local → implémentation locale qui N'ÉMET RIEN et journalise les liens,
// pour que les essais puissent suivre un lien d'annulation sans appeler Resend.
/** Pièce jointe. `contenuBase64` est le contenu DÉJÀ encodé — jamais un chemin de
 *  fichier : un transport ne lit pas le disque à la place de l'appelant. */
export interface PieceJointe {
  readonly nom: string;
  readonly contenuBase64: string;
}

export interface Courriel {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  /** Facultatif. Un transport qui ne les gère pas doit LEVER, jamais les laisser tomber :
   *  un export RGPD envoyé sans son export est un courriel vide qui se croit délivré. */
  readonly pieces?: readonly PieceJointe[];
}

export interface Transport {
  readonly nom: 'resend' | 'local';
  envoyer(courriel: Courriel): Promise<void>;
}

let choisi: Transport | null = null;

/** Remplace le transport (essais uniquement). Rend la valeur précédente. */
export function _remplacerTransport(t: Transport | null): Transport | null {
  const avant = choisi;
  choisi = t;
  return avant;
}

export async function transport(): Promise<Transport> {
  if (choisi) return choisi;
  if (process.env.MAIL_TRANSPORT === 'local') {
    const { transportLocal } = await import('./transport-local');
    choisi = transportLocal();
  } else {
    const { transportResend } = await import('./transport-resend');
    choisi = transportResend();
  }
  return choisi;
}

export async function envoyerCourriel(courriel: Courriel): Promise<void> {
  await (await transport()).envoyer(courriel);
}
