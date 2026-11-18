// P1.6 STOP C — memo serveur des URL signées d'avatar (bucket privé).
// Une URL STABLE entre deux rendus = le navigateur garde l'image en cache ;
// re-signer à chaque rendu changeait l'URL et re-téléchargeait l'image.
// TTL 50 min < expiration 1 h. Par instance serverless — suffisant.

import { createAdminClient } from "@/utils/supabase/admin";
import { estDansLEspaceDe } from "@/lib/storage/chemins";

const TTL_MS = 50 * 60 * 1000;
const cache = new Map<string, { url: string; exp: number }>();

export async function getSignedAvatarUrl(path: string | null | undefined, proprietaireId: string): Promise<string | null> {
  // `avatar_path` est une colonne que chacun écrit : on ne signe que le fichier de son propriétaire.
  if (!path || !estDansLEspaceDe(path, proprietaireId)) return null;
  const hit = cache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;

  const { data } = await createAdminClient()
    .storage.from("avatars").createSignedUrl(path, 3600);
  if (!data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, exp: Date.now() + TTL_MS });
  return data.signedUrl;
}

/** À l'upload d'une nouvelle photo : invalider pour signer la nouvelle. */
export function invalidateAvatarUrl(path: string): void {
  cache.delete(path);
}
