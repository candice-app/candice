// CE QU'UN PILOTE PEUT UTILISER DU PROFIL D'UN PROCHE — donnée par donnée.
//
// CONSTAT DU 18 NOV. La recommandation lisait, avec le client privilégié et sur le seul
// identifiant que le pilote écrit lui-même sur son contact, tout le profil du compte désigné :
// allergies, régime, réponses libres. Aucun consentement n'était consulté. Et le consentement
// existant (`contact_analysis`, portée « analysis ») n'a jamais voulu dire « le pilote peut
// utiliser mes données » : il porte sur le partage de l'analyse.
//
// LA RÈGLE. Rien du profil d'un proche n'est chargé sans QUATRE conditions, toutes vérifiées
// ici, côté serveur :
//   1. un consentement `contact_analysis` ACTIF, pour CE pilote, CE contact et CE compte ;
//   2. accordé par le proche LUI-MÊME — la preuve (`granted_by`) est écrite par la base
//      (migration 112), jamais par l'appelant ; un consentement sans preuve ne vaut rien ici ;
//   3. dont la portée nomme l'usage, DONNÉE PAR DONNÉE ;
//   4. et seule la donnée nommée est lue : une allergie autorisée n'ouvre ni les autres
//      allergies, ni le régime, ni les réponses libres.
// Toute incertitude — lecture impossible, preuve absente, portée absente — rend un profil vide.

/** Portées d'usage par la recommandation. Chacune ouvre UNE famille de données, rien d'autre. */
export const USAGE_PROFIL = 'reco:profil';              // manière de recevoir / d'exprimer l'attention, tempérament, filtres relationnels
export const USAGE_REGIME = 'reco:regime';              // halal, casher
export const USAGE_ALCOOL = 'reco:alcool';              // ne boit pas
export const USAGE_MOBILITE = 'reco:mobilite';          // contraintes de mobilité
export const USAGE_REPONSES_LIBRES = 'reco:reponses_libres';
/** Une allergie se partage UNE PAR UNE : `reco:allergie:<valeur>`. Il n'existe pas de clé « toutes ». */
export const PREFIXE_USAGE_ALLERGIE = 'reco:allergie:';

const clef = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
export const usageAllergie = (allergie: string) => `${PREFIXE_USAGE_ALLERGIE}${clef(allergie)}`;

const USAGES_SIMPLES = new Set([USAGE_PROFIL, USAGE_REGIME, USAGE_ALCOOL, USAGE_MOBILITE, USAGE_REPONSES_LIBRES]);
/** Une portée d'usage bien formée. Tout le reste est refusé à l'écriture. */
export function estUsageValide(p: string): boolean {
  return USAGES_SIMPLES.has(p) || /^reco:allergie:[a-z0-9_]{1,60}$/.test(p);
}

export interface ProfilAutorise {
  readonly attention_reception: unknown | null;
  readonly attention_expression: unknown | null;
  readonly temperament_axes: unknown | null;
  readonly relational_filters: unknown | null;
  readonly vetos: { allergies?: string[]; halal?: boolean; casher?: boolean; no_alcohol?: boolean; mobility_constraints?: boolean } | null;
  readonly singularity_answers: unknown | null;
  /** Pourquoi le profil est (partiellement) vide. Sert aux traces, jamais à l'écran du pilote. */
  readonly motif: 'autorise' | 'aucun_compte' | 'aucun_consentement' | 'accord_non_etabli' | 'aucune_portee' | 'lecture_impossible';
  readonly portees: readonly string[];
}
const VIDE = (motif: ProfilAutorise['motif']): ProfilAutorise => ({
  attention_reception: null, attention_expression: null, temperament_axes: null, relational_filters: null,
  vetos: null, singularity_answers: null, motif, portees: [],
});

/** Applique la portée à un profil DÉJÀ lu. Pure : c'est elle que les tests éprouvent. */
export function filtrerSelonPortee(
  profil: { attention_reception?: unknown; attention_expression?: unknown; temperament_axes?: unknown; relational_filters?: unknown;
            practical_info?: { vetos?: ProfilAutorise['vetos'] } | null; singularity_answers?: unknown } | null,
  portees: readonly string[],
): ProfilAutorise {
  const p = new Set(portees.filter(estUsageValide));
  if (!profil || p.size === 0) return { ...VIDE('aucune_portee'), portees: [...p] };
  const v = profil.practical_info?.vetos ?? null;
  const vetos: NonNullable<ProfilAutorise['vetos']> = {};
  if (v) {
    // UNE ALLERGIE N'EST LUE QUE SI ELLE EST NOMMÉE. Les autres n'existent pas pour l'appelant.
    const allergies = (v.allergies ?? []).filter((a) => p.has(usageAllergie(a)));
    if (allergies.length > 0) vetos.allergies = allergies;
    if (p.has(USAGE_REGIME)) { if (v.halal) vetos.halal = true; if (v.casher) vetos.casher = true; }
    if (p.has(USAGE_ALCOOL) && v.no_alcohol) vetos.no_alcohol = true;
    if (p.has(USAGE_MOBILITE) && v.mobility_constraints) vetos.mobility_constraints = true;
  }
  const profilOuvert = p.has(USAGE_PROFIL);
  return {
    attention_reception: profilOuvert ? (profil.attention_reception ?? null) : null,
    attention_expression: profilOuvert ? (profil.attention_expression ?? null) : null,
    temperament_axes: profilOuvert ? (profil.temperament_axes ?? null) : null,
    relational_filters: profilOuvert ? (profil.relational_filters ?? null) : null,
    vetos: Object.keys(vetos).length > 0 ? vetos : null,
    singularity_answers: p.has(USAGE_REPONSES_LIBRES) ? (profil.singularity_answers ?? null) : null,
    motif: 'autorise', portees: [...p],
  };
}

/** Le type de ligne qui porte ce que le proche autorise. Distinct du partage d'analyse, qui va
 *  dans l'autre sens (migration 116) : le pilote ne lit ni n'écrit ces lignes. */
export const TYPE_USAGE = 'profile_usage';

interface ClientPrivilegie { from(table: string): any } // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Charge ce que le proche a autorisé, et rien d'autre. Le franchissement de la RLS du proche
 * est concentré dans cette fonction ; son résultat ne quitte jamais le serveur.
 */
export async function chargerProfilAutorise(
  admin: ClientPrivilegie,
  input: { piloteId: string; contactId: string; procheUserId: string | null },
): Promise<ProfilAutorise> {
  if (!input.procheUserId) return VIDE('aucun_compte');
  try {
    const { data: accord, error } = await admin.from('contact_consents')
      .select('scope, granted_by, granted_via')
      .eq('pilote_id', input.piloteId).eq('contact_id', input.contactId)
      .eq('proche_user_id', input.procheUserId).eq('kind', TYPE_USAGE).eq('status', 'active')
      .maybeSingle();
    if (error) return VIDE('lecture_impossible');
    if (!accord) return VIDE('aucun_consentement');
    // LA PREUVE : accordé par le proche lui-même, attesté par la base. Un consentement actif
    // d'avant la migration 112 n'en porte pas — il n'ouvre rien tant qu'il n'est pas reconfirmé.
    if (accord.granted_by !== input.procheUserId) return VIDE('accord_non_etabli');
    const portees = ((accord.scope as string[] | null) ?? []).filter(estUsageValide);
    if (portees.length === 0) return VIDE('aucune_portee');
    const { data: profil, error: eP } = await admin.from('my_profile')
      .select('attention_reception, attention_expression, temperament_axes, relational_filters, practical_info, singularity_answers')
      .eq('user_id', input.procheUserId).maybeSingle();
    if (eP) return VIDE('lecture_impossible');
    return filtrerSelonPortee(profil, portees);
  } catch { return VIDE('lecture_impossible'); }
}
