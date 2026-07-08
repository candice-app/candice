// Chantier 2.2 — Garde générale : une question Discovery dont la donnée
// correspondante existe déjà en fiche est considérée « répondue » et ne
// réapparaît jamais dans les listes « à compléter » (sauf modification
// explicite par l'utilisateur via le questionnaire).
//
// Cause corrigée : getAnsweredKeys ne lisait que profile_completion (rempli
// uniquement en répondant VIA Discovery) — une donnée saisie au questionnaire
// (ex. parfums dans practical_info) laissait la question ressortir.

export interface ProfileDataSnapshot {
  practical_info: {
    allergies?: string[];
    regime?: string;
    alcool?: string;
    mobilite_sante?: string;
    parfums?: string[];
    odeurs_detestees?: string;
    couleurs_matieres?: string;
    dates_importantes?: Array<{ date?: string }>;
  } | null;
  singularity_answers: {
    adore_faire?: string;
    marques_lieux?: string;
    cadeaux_non?: string;
    envies_reves?: string;
    interests?: { items?: Array<{ id: string; rank: number }> };
  } | null;
  relational_filters: {
    q17Text?: string;
  } | null;
  discovery_answers: Record<string, unknown> | null;
}

const has = (s: string | undefined | null): boolean => !!s && s.trim().length > 2;

// question_key → prédicat « la donnée existe déjà en fiche »
const GUARDS: Record<string, (p: ProfileDataSnapshot) => boolean> = {
  // Banque parfums Phase B (migration 53) : si parfums/odeurs déjà
  // renseignés (questionnaire OU legacy fragrance.family), seules les
  // questions MANQUANTES sont posées.
  "fragrance.families": p =>
    (p.practical_info?.parfums?.length ?? 0) > 0
    || !!p.discovery_answers?.["fragrance.families"]
    || !!p.discovery_answers?.["fragrance.family"],

  "fragrance.scent_deal_breakers": p =>
    has(p.practical_info?.odeurs_detestees)
    || !!p.discovery_answers?.["fragrance.scent_deal_breakers"],

  "fragrance.perfume_risk": p =>
    !!p.discovery_answers?.["fragrance.perfume_risk"],

  "practical.constraints": p =>
    (p.practical_info?.allergies?.filter(a => a !== "aucune").length ?? 0) > 0
    || has(p.practical_info?.regime)
    || has(p.practical_info?.alcool)
    || has(p.practical_info?.mobilite_sante),

  // Découpage chantier 3.2 (migration 48) — mêmes données sous-jacentes,
  // + réponses à l'ancienne question fusionnée.
  "practical.dietary": p =>
    (p.practical_info?.allergies?.filter(a => a !== "aucune").length ?? 0) > 0
    || has(p.practical_info?.regime)
    || has(p.practical_info?.alcool)
    || !!p.discovery_answers?.["practical.constraints"]
    || !!p.discovery_answers?.["practical.dietary"],

  "practical.mobility": p =>
    has(p.practical_info?.mobilite_sante)
    || !!p.discovery_answers?.["practical.mobility"],

  "practical.important_dates": p =>
    (p.practical_info?.dates_importantes?.length ?? 0) > 0,

  "style.clothing": p => has(p.practical_info?.couleurs_matieres),

  "brands.favorites": p => has(p.singularity_answers?.marques_lieux),

  "hobbies.main": p =>
    has(p.singularity_answers?.adore_faire)
    || (p.singularity_answers?.interests?.items?.length ?? 0) > 0,

  "dreams.current": p => has(p.singularity_answers?.envies_reves),

  "gifts.to_avoid": p =>
    has(p.singularity_answers?.cadeaux_non) || has(p.relational_filters?.q17Text),
};

/** true si la donnée que collecte cette question existe déjà en fiche. */
export function questionDataPresent(
  questionKey: string,
  snapshot: ProfileDataSnapshot | null,
): boolean {
  if (!snapshot) return false;
  const guard = GUARDS[questionKey];
  return guard ? guard(snapshot) : false;
}

export const GUARDED_QUESTION_KEYS = Object.keys(GUARDS);
