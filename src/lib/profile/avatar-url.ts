// P1.6 STOP C — memo serveur des URL signées d'avatar (bucket privé).
// Une URL STABLE entre deux rendus = le navigateur garde l'image en cache ;
// re-signer à chaque rendu changeait l'URL et re-téléchargeait l'image.
// TTL 50 min < expiration 1 h. Par instance serverless — suffisant.

import { createAdminClient } from "@/utils/supabase/admin";
import { estDansLEspaceDe } from "@/lib/storage/chemins";

const TTL_MS = 50 * 60 * 1000;
const cache = new Map<string, { url: string; exp: number }>();

/** Durée d'un lien signé remis à son PROPRIÉTAIRE (sa propre photo, sur ses propres écrans). */
export const DUREE_LIEN_PROPRIETAIRE_S = 3600;
/**
 * Durée d'un lien signé remis à UN TIERS (la photo de quelqu'un qui partage sa fiche).
 * Un lien signé ne se révoque pas : une fois émis, il ouvre le fichier jusqu'à son échéance,
 * même si le partage a été retiré entre-temps. On borne donc cette fenêtre à cinq minutes, et
 * on signe un lien neuf à chaque affichage (jamais le lien d'une heure du propriétaire).
 */
export const DUREE_LIEN_TIERS_S = 300;

export async function getSignedAvatarUrl(
  path: string | null | undefined,
  proprietaireId: string,
  options: { pourUnTiers?: boolean } = {},
): Promise<string | null> {
  // `avatar_path` est une colonne que chacun écrit : on ne signe que le fichier de son propriétaire.
  if (!path || !estDansLEspaceDe(path, proprietaireId)) return null;
  if (options.pourUnTiers) {
    const { data } = await createAdminClient().storage.from("avatars").createSignedUrl(path, DUREE_LIEN_TIERS_S);
    return data?.signedUrl ?? null;
  }
  const hit = cache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;

  const { data } = await createAdminClient()
    .storage.from("avatars").createSignedUrl(path, DUREE_LIEN_PROPRIETAIRE_S);
  if (!data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, exp: Date.now() + TTL_MS });
  return data.signedUrl;
}

/** À l'upload d'une nouvelle photo : invalider pour signer la nouvelle. */
export function invalidateAvatarUrl(path: string): void {
  cache.delete(path);
}
