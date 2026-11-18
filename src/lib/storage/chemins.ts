// Les liens signés sont fabriqués avec les droits serveur : ils ouvrent n'importe quel fichier
// du dépôt. Or le chemin signé vient d'une colonne que l'utilisateur écrit lui-même
// (`photo_url`, `avatar_path`). Sans contrôle, il suffisait d'y inscrire le chemin du fichier
// d'un autre pour l'obtenir.
//
// Règle : on ne signe qu'un chemin rangé sous le dossier de son propriétaire.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Le chemin est-il un fichier du dossier de cette personne ? */
export function estDansLEspaceDe(chemin: string | null | undefined, proprietaireId: string): boolean {
  if (!chemin || !UUID.test(proprietaireId)) return false;
  if (!chemin.startsWith(`${proprietaireId}/`)) return false;
  if (chemin.includes('\\') || chemin.includes('\0') || chemin.includes('//')) return false;
  const segments = chemin.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) return false;
  return segments.length >= 2;
}

/** Un identifiant de fiche utilisable comme segment de chemin. */
export function estIdentifiant(v: string | null | undefined): v is string {
  return !!v && UUID.test(v);
}

const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const TAILLE_MAX_IMAGE = 5 * 1024 * 1024;

/** L'extension vient du TYPE du fichier, jamais de son nom ; `null` si le type n'est pas une image admise. */
export function extensionImage(type: string | null | undefined): string | null {
  return (type && EXTENSIONS[type]) || null;
}
