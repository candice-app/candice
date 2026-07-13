// Refonte Profil V2, Phase D — Matrice de visibilité de la fiche (V2).
// SOURCE UNIQUE DE VÉRITÉ : tout rendu de fiche passe par resolveVisibility().
// Découpage validé (STOP A + GO) : socle = résumé (+tags) + podium ;
// wishlist = JAMAIS partagée aux tiers — elle ne s'exprime que fondue dans
// les idées de Candice (clôture lot V2 : section partageable retirée) ;
// art9 et adresse = never non négociable.
//
// Types de fiche (le type 'lien_public' n'existe pas : décision produit,
// un lien ne donne accès à RIEN sans compte + autorisation explicite) :
//   pilote           — ma fiche (tout visible)
//   invite_filtre    — ce que voit un proche autorisé (sections cochées, intersection)
//   contact_consulte — je consulte la fiche d'un de mes proches (analyse seulement)
//   aveugle          — le proche ne voit AUCUN contenu, message d'explication seul
//
// Valeurs : visible · third_person · socle (non décochable) · filtered_on ·
// filtered_off · hidden · never. RÈGLE D'INTERSECTION : les sections cochées
// ne peuvent JAMAIS élargir la matrice (matrice ∩ autorisations).

export type ProfileView =
  | "pilote"
  | "invite_filtre"
  | "contact_consulte"
  | "aveugle";

export type Visibility =
  | "visible"
  | "third_person"
  | "socle"
  | "filtered_on"
  | "filtered_off"
  | "hidden"
  | "never";

export type SectionKey =
  // Header
  | "header_identity"   // prénom + phrase de connaissance
  | "header_ring"       // anneau champagne
  | "header_actions"    // éditer + réglages
  | "header_ctas"       // Partager mon profil + Ma wishlist
  // Socle
  | "summary"           // résumé Fraunces + tags + analyse complète
  | "podium"            // langage d'attention (7 dimensions réelles)
  // Analyse
  | "understood"        // carrousel « Ce que Candice a compris »
  | "deep_touch"        // Ce qui te touche
  | "deep_loved"        // Ce qui te fait te sentir aimée (la plus intime)
  | "deep_pleasure"     // Ce qui pourrait te faire plaisir
  | "deep_miss"         // Ce qui tombe à côté
  | "works"             // Ce qui marche avec toi (6 intensités)
  // Mondes & univers
  | "monde_tables"
  | "monde_voyages"
  | "monde_passions"
  | "monde_gouts"
  | "territoire"        // territoire idéal (3 cartes statuées)
  | "univers"           // marques + lieux + matières + rêves + À savoir pour viser juste
  | "wishlist"          // MA wishlist — visible pilote seulement (jamais partagée aux tiers)
  // Faits pratiques
  | "facts_tailles"
  | "facts_alimentaire"
  | "facts_parfums"
  | "facts_adresse"     // existence seulement côté pilote — JAMAIS côté tiers
  | "facts_animaux"
  | "facts_dates"
  | "facts_mobilite"
  | "art9"              // santé · handicap · religion — JAMAIS partagé
  | "constraints_row"   // rangée sécurité (contact_consulte seulement)
  // Périphérie
  | "viser"             // nudges « Pour mieux viser » (pilote)
  | "bottom_ctas"       // rangée de fin de fiche (pilote)
  | "blind_message";    // message du mode aveugle

export const ALL_SECTION_KEYS: SectionKey[] = [
  "header_identity", "header_ring", "header_actions", "header_ctas",
  "summary", "podium",
  "understood", "deep_touch", "deep_loved", "deep_pleasure", "deep_miss", "works",
  "monde_tables", "monde_voyages", "monde_passions", "monde_gouts",
  "territoire", "univers", "wishlist",
  "facts_tailles", "facts_alimentaire", "facts_parfums", "facts_adresse",
  "facts_animaux", "facts_dates", "facts_mobilite", "art9", "constraints_row",
  "viser", "bottom_ctas", "blind_message",
];

export const VISIBILITY_MATRIX: Record<ProfileView, Record<SectionKey, Visibility>> = {
  pilote: {
    header_identity: "visible", header_ring: "visible", header_actions: "visible", header_ctas: "visible",
    summary: "visible", podium: "visible",
    understood: "visible", deep_touch: "visible", deep_loved: "visible",
    deep_pleasure: "visible", deep_miss: "visible", works: "visible",
    monde_tables: "visible", monde_voyages: "visible", monde_passions: "visible", monde_gouts: "visible",
    territoire: "visible", univers: "visible",
    wishlist: "hidden",           // vit sur son propre écran (/moi/wishlist)
    facts_tailles: "visible", facts_alimentaire: "visible", facts_parfums: "visible",
    facts_adresse: "visible",     // « renseignée » seulement — jamais le contenu
    facts_animaux: "visible", facts_dates: "visible", facts_mobilite: "visible",
    art9: "visible", constraints_row: "hidden",
    viser: "visible", bottom_ctas: "visible", blind_message: "hidden",
  },

  invite_filtre: {
    header_identity: "visible",   // prénom du partageur, sous-titre adapté
    header_ring: "hidden", header_actions: "hidden", header_ctas: "hidden",
    summary: "socle", podium: "socle",  // SOCLE = résumé + tags + podium (validé)
    understood: "filtered_on",
    deep_touch: "filtered_on",
    deep_loved: "filtered_off",   // la plus intime — décochée par défaut (arbitrage)
    deep_pleasure: "filtered_on",
    deep_miss: "filtered_on",     // la plus utile pour bien viser
    works: "filtered_on",
    monde_tables: "filtered_on", monde_voyages: "filtered_on",
    monde_passions: "filtered_on", monde_gouts: "filtered_on",
    territoire: "filtered_on", univers: "filtered_on",
    wishlist: "never",            // jamais partagée — ne ressort que fondue dans les idées
    facts_tailles: "filtered_off", facts_alimentaire: "filtered_off",
    facts_parfums: "filtered_off", facts_adresse: "never",
    facts_animaux: "filtered_off", facts_dates: "filtered_off", facts_mobilite: "filtered_off",
    art9: "never", constraints_row: "hidden",
    viser: "hidden", bottom_ctas: "hidden", blind_message: "hidden",
  },

  contact_consulte: {
    header_identity: "visible",
    header_ring: "hidden", header_actions: "hidden", header_ctas: "hidden",
    summary: "third_person", podium: "visible",
    understood: "third_person",
    deep_touch: "third_person", deep_loved: "third_person",
    deep_pleasure: "third_person", deep_miss: "third_person",
    works: "visible",
    monde_tables: "third_person", monde_voyages: "third_person",
    monde_passions: "third_person", monde_gouts: "third_person",
    territoire: "third_person", univers: "third_person",
    wishlist: "never",            // la wishlist du proche ne ressort que fondue dans les idées
    facts_tailles: "hidden", facts_alimentaire: "hidden", facts_parfums: "hidden",
    facts_adresse: "never", facts_animaux: "hidden", facts_dates: "hidden", facts_mobilite: "hidden",
    art9: "never",
    constraints_row: "visible",   // sécurité : allergies + régime + mobilité
    viser: "hidden", bottom_ctas: "hidden", blind_message: "hidden",
  },

  aveugle: {
    header_identity: "hidden",    // header neutre « Fiche protégée »
    header_ring: "never", header_actions: "never", header_ctas: "never",
    summary: "never", podium: "never",
    understood: "never", deep_touch: "never", deep_loved: "never",
    deep_pleasure: "never", deep_miss: "never", works: "never",
    monde_tables: "never", monde_voyages: "never", monde_passions: "never", monde_gouts: "never",
    territoire: "never", univers: "never", wishlist: "never",
    facts_tailles: "never", facts_alimentaire: "never", facts_parfums: "never",
    facts_adresse: "never", facts_animaux: "never", facts_dates: "never", facts_mobilite: "never",
    art9: "never", constraints_row: "never",
    viser: "never", bottom_ctas: "never",
    blind_message: "visible",     // seul contenu du mode aveugle
  },
};

// ─── Résolution ───────────────────────────────────────────────────────────────

export interface ResolvedVisibility {
  /** La section doit-elle être rendue ? */
  shown: boolean;
  /** Le texte doit-il être converti à la 3e personne ? */
  thirdPerson: boolean;
  /**
   * Section cochable (filtered_on/off) refusée au partage → placeholder
   * « non partagé » à son emplacement exact (invite_filtre).
   * Jamais true pour hidden/never : on ne révèle pas leur existence.
   */
  notShared: boolean;
}

/**
 * RÈGLE D'INTERSECTION : sharedSections ne peut qu'RESTREINDRE dans les
 * limites de la matrice. Une section 'never'/'hidden' reste invisible même
 * cochée. Une section 'socle' reste visible même décochée.
 */
export function resolveVisibility(
  view: ProfileView,
  section: SectionKey,
  sharedSections?: SectionKey[],
): ResolvedVisibility {
  const v = VISIBILITY_MATRIX[view][section];

  switch (v) {
    case "visible":
      return { shown: true, thirdPerson: false, notShared: false };
    case "third_person":
      return { shown: true, thirdPerson: true, notShared: false };
    case "socle":
      return { shown: true, thirdPerson: true, notShared: false };
    case "filtered_on":
    case "filtered_off": {
      const chosen = sharedSections
        ? sharedSections.includes(section)
        : v === "filtered_on";
      return { shown: chosen, thirdPerson: true, notShared: !chosen };
    }
    case "hidden":
    case "never":
      return { shown: false, thirdPerson: false, notShared: false };
  }
}

/** Sections proposables comme cases à cocher sur l'écran de partage. */
export function checkableSections(view: ProfileView): SectionKey[] {
  return ALL_SECTION_KEYS.filter(k => {
    const v = VISIBILITY_MATRIX[view][k];
    return v === "filtered_on" || v === "filtered_off";
  });
}

/** Sections du socle (toujours partagées, non décochables). */
export function socleSections(view: ProfileView): SectionKey[] {
  return ALL_SECTION_KEYS.filter(k => VISIBILITY_MATRIX[view][k] === "socle");
}
