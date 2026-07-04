// B.2 Phase 6 — @identifiant unique (style Instagram).
// Règles verrouillées (migration 49) : minuscules, chiffres, . et _,
// 3 à 20 caractères. Stocké en minuscules, unique sur my_profile.handle.

export const HANDLE_RE = /^[a-z0-9._]{3,20}$/;

/** Normalise une saisie utilisateur : trim, @ initial retiré, minuscules. */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

/** Message d'erreur de format, ou null si l'identifiant est valide. */
export function handleFormatError(handle: string): string | null {
  if (handle.length < 3) return "3 caractères minimum.";
  if (handle.length > 20) return "20 caractères maximum.";
  if (!HANDLE_RE.test(handle)) return "Lettres minuscules, chiffres, point et tiret bas uniquement.";
  return null;
}
