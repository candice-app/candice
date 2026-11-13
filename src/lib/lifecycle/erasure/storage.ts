// SURFACE STORAGE DE L'EFFACEMENT — les trois surfaces (photos de contacts, avatar, photos de wishlist et carnet)
// vivent toutes sous le préfixe `${userId}/` de leurs godets. On ÉNUMÈRE par ce préfixe, tous godets confondus,
// RÉCURSIVEMENT : les vraies clés sont imbriquées (`${userId}/${contactId}/avatar.ext`,
// `${userId}/carnet/${contactId}/${rid}.ext`), pas à plat. Un `list` non récursif ne verrait que les dossiers de
// tête et laisserait les fichiers imbriqués orphelins — donc une fuite silencieuse au droit à l'oubli.
//
// Deux formes d'échec, et aucune n'est jamais comptée comme « zéro fichier restant » :
//   - l'exception levée ;
//   - le champ `error` du retour du client Supabase (qui ne lève pas : il rend { data, error }).
import type { SupabaseClient } from '@supabase/supabase-js';

/** Interruption pendant l'effacement Storage. Attrapée par le moteur → ECHEC_PARTIEL, jamais un achèvement menteur. */
export class StorageInterrompu extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageInterrompu';
  }
}

// POINT D'INJECTION — INERTE partout sauf sur une pile d'essai locale. (spec scripts/local/TRANSPORT-ET-INJECTION.md §2)
//
// ⚠ Number('') vaut 0 et Number.isFinite(0) vaut true : un test naïf `Number.isFinite(n) && supprimes >= n`
// déclencherait la coupure QUAND LA VARIABLE EST ABSENTE — c'est-à-dire en production. D'où trois verrous indépendants.
function coupureDEssai(): { apres: number; forme: 'exception' | 'erreur' } | null {
  // 1. VERROU D'ENVIRONNEMENT — trois conditions indépendantes, toutes requises.
  if (process.env.NODE_ENV === 'production') return null;
  if (process.env.ESSAI_PILE_LOCALE !== 'oui') return null; // opt-in explicite
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  let hote: string;
  try { hote = new URL(api).hostname; } catch { return null; } // URL illisible → inerte
  if (!['127.0.0.1', 'localhost', '::1'].includes(hote)) return null;

  // 2. VERROU DE FORME — présence, chiffres seuls, entier SÛR, strictement positif.
  const brut = process.env.ESSAI_COUPER_STORAGE_APRES?.trim();
  if (brut === undefined || !/^[0-9]+$/.test(brut)) return null;
  const n = Number(brut);
  if (!Number.isSafeInteger(n) || n <= 0) return null; // 1e20, 0, « 1.5 », « -1 » → inerte

  // 3. FORME DE L'ÉCHEC — exception, ou retour { error } sans exception.
  const forme = process.env.ESSAI_STORAGE_FORME === 'erreur' ? 'erreur' : 'exception';
  return { apres: n, forme };
}

/**
 * Liste RÉCURSIVE des objets d'un godet sous un préfixe, paginée. Un « dossier » Supabase a `id` null ; un objet a
 * `id` non null. Une erreur de listage LÈVE (jamais « zéro fichier »).
 */
async function listerRecursif(admin: SupabaseClient, godet: string, prefixe: string): Promise<string[]> {
  const chemins: string[] = [];
  const taille = 1000;
  let offset = 0;
  for (;;) {
    const { data, error } = await admin.storage.from(godet).list(prefixe, { limit: taille, offset });
    if (error) throw new StorageInterrompu(`liste ${godet}/${prefixe} : ${error.message} — une erreur n'est PAS « zéro fichier »`);
    const lot = data ?? [];
    for (const e of lot) {
      const sous = prefixe ? `${prefixe}/${e.name}` : e.name;
      if (e.id === null) chemins.push(...await listerRecursif(admin, godet, sous)); // dossier → descendre
      else chemins.push(sous);
    }
    if (lot.length < taille) break;
    offset += taille;
  }
  return chemins;
}

/**
 * DÉNOMBREMENT par godet des objets restants sous `${userId}/`, tous godets confondus. Les godets vides sont OMIS :
 * tout effacé → {}. Sert d'oracle au moteur (résidu RÉEL relu depuis Storage, pas un compteur interne). JAMAIS de
 * nom de fichier dans le retour : des nombres seulement (un nom de fichier porte souvent un nom de personne).
 */
export async function inventaireStorage(admin: SupabaseClient, userId: string): Promise<Record<string, number>> {
  const { data: godets, error } = await admin.storage.listBuckets();
  if (error) throw new StorageInterrompu(`liste des godets : ${error.message}`);
  const compte: Record<string, number> = {};
  for (const b of godets ?? []) {
    const objets = await listerRecursif(admin, b.name, userId);
    if (objets.length > 0) compte[b.name] = objets.length;
  }
  return compte;
}

/**
 * Efface tous les objets de l'utilisateur, tous godets, sous `${userId}/`. Vérifie l'exception ET le champ `error`
 * de chaque `remove`. Le point de coupure contrôlé est consulté APRÈS chaque suppression réelle. Rend `{ error }`
 * sur la forme silencieuse de la coupure (sans lever), undefined sur succès complet ; lève StorageInterrompu sur la
 * forme exception et sur tout échec réel de `remove`. N'APPELLE JAMAIS la suppression Auth : c'est l'affaire du moteur.
 */
export async function effacerStockage(admin: SupabaseClient, userId: string): Promise<{ error: unknown } | void> {
  const { data: godets, error: eg } = await admin.storage.listBuckets();
  if (eg) throw new StorageInterrompu(`liste des godets : ${eg.message}`);
  let supprimes = 0;
  for (const b of godets ?? []) {
    const objets = await listerRecursif(admin, b.name, userId);
    for (const chemin of objets) {
      const { error } = await admin.storage.from(b.name).remove([chemin]);
      if (error) throw new StorageInterrompu(`remove ${b.name} : ${error.message}`); // champ error = échec, pas « zéro »
      supprimes++;
      const c = coupureDEssai();
      if (c && supprimes >= c.apres) {
        if (c.forme === 'exception') throw new StorageInterrompu(`coupure d'essai après ${supprimes}`);
        return { error: { message: `coupure d'essai après ${supprimes}` } }; // forme silencieuse, sans exception
      }
    }
  }
}
