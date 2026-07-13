// Libellés wishlist / carnet — repris MOT POUR MOT des maquettes V2.
// Vocabulaire verrouillé. Ne pas reformuler.

export type Occasion =
  | "none" | "birthday" | "christmas" | "wedding_anniversary" | "valentine"
  | "mothers_day" | "fathers_day" | "naissance" | "cremaillere" | "diplome"
  | "retraite" | "just_because";

export const OCCASION_LABEL: Record<Occasion, string> = {
  none: "Sans occasion",
  birthday: "Anniversaire",
  christmas: "Noël",
  wedding_anniversary: "Anniv. de mariage",
  valentine: "Saint-Valentin",
  mothers_day: "Fête des mères",
  fathers_day: "Fête des pères",
  naissance: "Naissance",
  cremaillere: "Crémaillère",
  diplome: "Diplôme",
  retraite: "Retraite",
  just_because: "Juste pour lui faire plaisir",
};

// Ordre EXACT des pills du formulaire wishlist (maquette).
export const WISHLIST_FORM_OCCASIONS: Occasion[] = [
  "none", "birthday", "christmas", "wedding_anniversary", "valentine",
  "mothers_day", "fathers_day", "naissance", "cremaillere", "diplome",
];

// Ordre EXACT des chips de filtre wishlist (maquette) — « Toutes » géré à part.
export const WISHLIST_FILTER_OCCASIONS: Occasion[] = [
  "none", "birthday", "christmas", "wedding_anniversary", "valentine", "mothers_day",
];

// Ordre EXACT des pills du formulaire carnet (maquette).
export const CARNET_FORM_OCCASIONS: Occasion[] = [
  "none", "birthday", "christmas", "wedding_anniversary", "fathers_day", "just_because",
];

export type EnvyLevel = "dream" | "pleasure";
export const ENVY_LABEL: Record<EnvyLevel, string> = {
  dream: "J'en rêve",
  pleasure: "Petit plaisir",
};

export type CarnetSource = "heard" | "seen" | "link";
export const SOURCE_LABEL: Record<CarnetSource, string> = {
  heard: "Entendu",
  seen: "Vu",
  link: "Lien",
};
