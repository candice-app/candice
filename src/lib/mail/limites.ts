// LIMITES D'ENVOI — tenues par la base (migration 119), demandées ici avant chaque courriel
// qu'un utilisateur déclenche. Les seuils vivent dans la fonction `reserver_envoi`, pas ici.
//
// Échec FERMÉ : si la base ne répond pas, ou si la fonction n'existe pas encore, on n'envoie pas.
import { createHash } from 'node:crypto';

export type TypeEnvoi =
  | 'invitation' | 'rappel' | 'relance' | 'proposition_analyse' | 'demande_fiche'
  | 'invitation_acceptee' | 'fiche_complete' | 'bienvenue' | 'export';

export type MotifRefus =
  | 'deja_envoye_aujourd_hui' | 'limite_meme_destinataire' | 'limite_expediteur'
  | 'limite_destinataire' | 'limite_a_soi' | 'invalide' | 'indisponible';

interface ClientPrivilegie { rpc(nom: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }> }

/** Empreinte d'une adresse : la base ne conserve jamais l'adresse elle-même. */
export function empreinteAdresse(adresse: string): string {
  return createHash('sha256').update(adresse.trim().toLowerCase()).digest('hex');
}

/**
 * Réserve un envoi. `ok` seulement si TOUTES les limites le permettent ; la réservation est
 * faite dans le même geste, sous verrou : deux appels simultanés ne passent pas tous les deux.
 */
export async function reserverEnvoi(
  admin: ClientPrivilegie,
  envoi: { expediteur: string; destinataire: string; type: TypeEnvoi; aSoi?: boolean },
): Promise<{ ok: true } | { ok: false; motif: MotifRefus }> {
  if (!envoi.destinataire?.trim()) return { ok: false, motif: 'invalide' };
  try {
    const { data, error } = await admin.rpc('reserver_envoi', {
      p_expediteur: envoi.expediteur,
      p_destinataire_h: empreinteAdresse(envoi.destinataire),
      p_type: envoi.type,
      p_a_soi: !!envoi.aSoi,
    });
    if (error) return { ok: false, motif: 'indisponible' };
    return data === 'ok' ? { ok: true } : { ok: false, motif: (data as MotifRefus) ?? 'indisponible' };
  } catch { return { ok: false, motif: 'indisponible' }; }
}

/** Ce qu'on dit à la personne qui a déclenché l'envoi — sans rien révéler du destinataire. */
export const MESSAGE_LIMITE = "Ce message a déjà été envoyé récemment. Réessaie plus tard.";

export class LimiteEnvoiError extends Error {
  constructor(readonly motif: MotifRefus) { super(MESSAGE_LIMITE); this.name = 'LimiteEnvoiError'; }
}
