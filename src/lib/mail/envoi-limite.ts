// Tout courriel qu'un utilisateur déclenche passe par ici : la limite est réservée dans la base,
// PUIS le courriel part. Limite atteinte ou base muette → `LimiteEnvoiError`, rien n'est envoyé.
import { envoyerCourriel, type Courriel } from './transport';
import { reserverEnvoi, LimiteEnvoiError, type TypeEnvoi } from './limites';

type ClientPrivilegie = Parameters<typeof reserverEnvoi>[0];

export async function envoyerSousLimite(
  admin: ClientPrivilegie,
  qui: { expediteur: string; type: TypeEnvoi; aSoi?: boolean },
  courriel: Courriel,
): Promise<void> {
  const r = await reserverEnvoi(admin, { expediteur: qui.expediteur, destinataire: courriel.to, type: qui.type, aSoi: qui.aSoi });
  if (!r.ok) throw new LimiteEnvoiError(r.motif);
  await envoyerCourriel(courriel);
}

export { LimiteEnvoiError };
