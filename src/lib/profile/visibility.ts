// B.2.1 Phase 3 — Matrice de visibilité de la fiche profil.
// SOURCE UNIQUE DE VÉRITÉ : tout rendu de fiche passe par resolveVisibility().
//
// Types de fiche (le type 'lien_public' n'existe pas : décision produit,
// un lien ne donne accès à RIEN sans compte + autorisation explicite) :
//   pilote           — ma fiche (tout visible)
//   invite_filtre    — ce que voit un proche autorisé (sections cochées au partage)
//   contact_consulte — je consulte la fiche d'un de mes proches (analyse seulement)
//   aveugle          — le proche ne voit AUCUN contenu, message d'explication seul
//
// Valeurs de visibilité :
//   visible      — rendu tel quel
//   third_person — rendu converti à la 3e personne
//   socle        — toujours rendu (3e pers.), NON décochable au partage
//   filtered_on  — cochable au partage, coché par défaut (rendu 3e pers.)
//   filtered_off — cochable au partage, décoché par défaut (rendu 3e pers.)
//   hidden       — jamais rendu pour ce type (mais peut l'être pour un autre)
//   never        — jamais rendu, jamais cochable, non négociable (wishlist, Art.9, adresse)
//
// RÈGLE D'INTERSECTION : les sections cochées (sharedSections) ne peuvent
// JAMAIS élargir la matrice — le partage s'applique en intersection
// (matrice ∩ autorisations), jamais en union.

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
  | "header_identity"     // prénom + sous-titre
  | "header_ring"         // anneau de complétion
  | "header_actions"      // Modifier + réglages
  | "header_share_chips"  // "Voir ma fiche partagée" / "Partager →"
  // Analyse — socle
  | "lead"                // phrase serif (summary)
  | "topchips"            // summary_chips
  | "donut"               // langage d'attention (6 dims agrégées)
  // Analyse — visualisations
  | "radar"               // style attentionnel 7 axes
  | "what_touches"        // card "Ce qui te touche"
  | "insights"            // "Ce que Candice a compris" (3 cards)
  | "temperament_axes"    // 9 axes barres
  | "temperament_modes"   // 4 modes pills
  | "lifestyle_axes"      // 6 axes barres
  // Analyse — cards thématiques
  | "gifts"
  | "restaurants"
  | "travel"
  | "hobbies"
  | "brands"
  | "style"
  | "parfums"
  | "points_fixes"
  | "avoid"
  // Faits pratiques (faits ≠ brut : affichage factuel autorisé)
  | "facts_tailles"
  | "facts_alimentaire"   // allergies + régime + alcool
  | "facts_parfums"       // rangée fact (la card analysée 'parfums' est distincte)
  | "facts_adresse"       // existence seulement, jamais le contenu
  | "facts_animaux"
  | "facts_dates"
  | "art9"                // religion · handicap · santé (CTA Compléter + Masquer)
  | "constraints_row"     // rangée sécurité (allergies + régime) — contact_consulte seul
  // Périphérie
  | "discovery"           // bloc "Pour affiner"
  | "edit_button"         // bouton "Affiner mon profil"
  | "bottom_nav"
  | "wishlist"            // JAMAIS côté tiers — ne ressort que fondue dans une idée Candice
  | "not_shared_notice"   // ligne discrète "X n'a pas tout partagé"
  | "blind_message";      // message du mode aveugle

export const ALL_SECTION_KEYS: SectionKey[] = [
  "header_identity", "header_ring", "header_actions", "header_share_chips",
  "lead", "topchips", "donut",
  "radar", "what_touches", "insights",
  "temperament_axes", "temperament_modes", "lifestyle_axes",
  "gifts", "restaurants", "travel", "hobbies",
  "brands", "style", "parfums", "points_fixes", "avoid",
  "facts_tailles", "facts_alimentaire", "facts_parfums", "facts_adresse",
  "facts_animaux", "facts_dates", "art9", "constraints_row",
  "discovery", "edit_button", "bottom_nav", "wishlist",
  "not_shared_notice", "blind_message",
];

export const VISIBILITY_MATRIX: Record<ProfileView, Record<SectionKey, Visibility>> = {
  pilote: {
    header_identity:    "visible",
    header_ring:        "visible",
    header_actions:     "visible",
    header_share_chips: "visible",
    lead:               "visible",
    topchips:           "visible",
    donut:              "visible",
    radar:              "visible",
    what_touches:       "visible",
    insights:           "visible",
    temperament_axes:   "visible",
    temperament_modes:  "visible",
    lifestyle_axes:     "visible",
    gifts:              "visible",
    restaurants:        "visible",
    travel:             "visible",
    hobbies:            "visible",
    brands:             "visible",
    style:              "visible",
    parfums:            "visible",
    points_fixes:       "visible",
    avoid:              "visible",
    facts_tailles:      "visible",
    facts_alimentaire:  "visible",
    facts_parfums:      "visible",
    facts_adresse:      "visible", // « renseignée ✓ » seulement — jamais le contenu
    facts_animaux:      "visible",
    facts_dates:        "visible",
    art9:               "visible", // CTA « Compléter → » + bouton « Masquer »
    constraints_row:    "hidden",  // redondant : facts_alimentaire couvre
    discovery:          "visible",
    edit_button:        "visible",
    bottom_nav:         "visible",
    wishlist:           "hidden",  // vit sur son propre écran, pas sur la fiche
    not_shared_notice:  "hidden",
    blind_message:      "hidden",
  },

  invite_filtre: {
    header_identity:    "visible", // prénom du partageur, sous-titre adapté
    header_ring:        "hidden",
    header_actions:     "hidden",
    header_share_chips: "hidden",
    lead:               "socle",   // SOCLE : toujours partagé, non décochable
    topchips:           "socle",
    donut:              "socle",   // décision Estelle : le donut fait partie du socle
    radar:              "filtered_on",
    what_touches:       "filtered_on",
    insights:           "filtered_on",
    temperament_axes:   "filtered_off", // intime
    temperament_modes:  "filtered_off",
    lifestyle_axes:     "filtered_on",
    gifts:              "filtered_on",
    restaurants:        "filtered_on",
    travel:             "filtered_on",
    hobbies:            "filtered_on",
    brands:             "filtered_on",
    style:              "filtered_on",
    parfums:            "filtered_on",
    points_fixes:       "filtered_off", // le plus intime : peurs, rêves, fiertés
    avoid:              "filtered_on",  // la plus utile pour bien viser
    facts_tailles:      "filtered_off", // fait sensible
    facts_alimentaire:  "filtered_off",
    facts_parfums:      "filtered_off",
    facts_adresse:      "never",
    facts_animaux:      "filtered_off",
    facts_dates:        "filtered_off",
    art9:               "never",   // réglage éventuel = lot RGPD dédié
    constraints_row:    "hidden",
    discovery:          "hidden",
    edit_button:        "hidden",
    bottom_nav:         "hidden",
    wishlist:           "never",   // JAMAIS — fondue dans une idée Candice sans nommer la source
    not_shared_notice:  "visible", // ligne discrète, jamais la liste de ce qui manque
    blind_message:      "hidden",
  },

  contact_consulte: {
    header_identity:    "visible", // prénom du proche
    header_ring:        "hidden",
    header_actions:     "hidden",
    header_share_chips: "hidden",
    lead:               "third_person",
    topchips:           "visible",
    donut:              "visible",
    radar:              "visible",
    what_touches:       "third_person",
    insights:           "third_person",
    temperament_axes:   "visible",
    temperament_modes:  "visible",
    lifestyle_axes:     "visible",
    gifts:              "third_person",
    restaurants:        "third_person",
    travel:             "third_person",
    hobbies:            "third_person",
    brands:             "third_person",
    style:              "third_person",
    parfums:            "third_person",
    points_fixes:       "third_person",
    avoid:              "third_person",
    facts_tailles:      "hidden",  // consommé par le moteur, pas affiché
    facts_alimentaire:  "hidden",
    facts_parfums:      "hidden",
    facts_adresse:      "never",
    facts_animaux:      "hidden",
    facts_dates:        "hidden",
    art9:               "never",
    constraints_row:    "visible", // sécurité : allergies + régime, pour ne pas se planter hors moteur
    discovery:          "hidden",
    edit_button:        "hidden",
    bottom_nav:         "visible", // dans l'app du pilote
    wishlist:           "never",   // la wishlist du proche n'apparaît que fondue dans les idées
    not_shared_notice:  "hidden",
    blind_message:      "hidden",
  },

  aveugle: {
    header_identity:    "hidden",  // header neutre « Fiche protégée »
    header_ring:        "never",
    header_actions:     "never",
    header_share_chips: "never",
    lead:               "never",
    topchips:           "never",
    donut:              "never",
    radar:              "never",
    what_touches:       "never",
    insights:           "never",
    temperament_axes:   "never",
    temperament_modes:  "never",
    lifestyle_axes:     "never",
    gifts:              "never",
    restaurants:        "never",
    travel:             "never",
    hobbies:            "never",
    brands:             "never",
    style:              "never",
    parfums:            "never",
    points_fixes:       "never",
    avoid:              "never",
    facts_tailles:      "never",
    facts_alimentaire:  "never",
    facts_parfums:      "never",
    facts_adresse:      "never",
    facts_animaux:      "never",
    facts_dates:        "never",
    art9:               "never",
    constraints_row:    "never",
    discovery:          "never",
    edit_button:        "never",
    bottom_nav:         "never",
    wishlist:           "never",
    not_shared_notice:  "never",
    blind_message:      "visible", // seul contenu du mode aveugle
  },
};

// ─── Résolution ───────────────────────────────────────────────────────────────

export interface ResolvedVisibility {
  /** La section doit-elle être rendue ? */
  shown: boolean;
  /** Le texte doit-il être converti à la 3e personne ? */
  thirdPerson: boolean;
}

/**
 * Résout la visibilité effective d'une section pour un type de fiche donné.
 *
 * @param view            type de fiche
 * @param section         clé de section
 * @param sharedSections  sections cochées au partage (invite_filtre uniquement).
 *                        undefined = aucun choix enregistré → seuls socle
 *                        et filtered_on s'affichent (défauts).
 *
 * RÈGLE D'INTERSECTION : sharedSections ne peut qu'RESTREINDRE dans les limites
 * de la matrice. Une section 'never'/'hidden' reste invisible même cochée.
 * Une section 'socle' reste visible même décochée.
 */
export function resolveVisibility(
  view: ProfileView,
  section: SectionKey,
  sharedSections?: SectionKey[],
): ResolvedVisibility {
  const v = VISIBILITY_MATRIX[view][section];

  switch (v) {
    case "visible":
      return { shown: true, thirdPerson: false };
    case "third_person":
      return { shown: true, thirdPerson: true };
    case "socle":
      // Toujours visible, même si absent des sections cochées
      return { shown: true, thirdPerson: true };
    case "filtered_on":
    case "filtered_off": {
      // Intersection : la case cochée décide, dans les limites de la matrice.
      // Sans choix enregistré, les défauts s'appliquent (on/off).
      const chosen = sharedSections
        ? sharedSections.includes(section)
        : v === "filtered_on";
      return { shown: chosen, thirdPerson: true };
    }
    case "hidden":
    case "never":
      // Jamais rendu — même coché par erreur (intersection, pas union).
      return { shown: false, thirdPerson: false };
  }
}

/** Sections proposables comme cases à cocher sur l'écran de partage (Phase 5). */
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
