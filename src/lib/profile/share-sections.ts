// Phase D — Libellés et regroupements des sections cochables au partage (V2).
// Source de vérité des clés : checkableSections("invite_filtre") (matrice V2).

import {
  VISIBILITY_MATRIX,
  checkableSections,
  type SectionKey,
} from "./visibility";
import { estCleAllergie } from "./partage-elements";

export interface ShareItem {
  keys: SectionKey[];
  label: string;
  /** Remplacé à l'écran par une case par élément (voir SectionPicker). */
  parElement?: boolean;
}

export interface ShareGroup {
  title: string;
  items: ShareItem[];
}

export const SHARE_GROUPS: ShareGroup[] = [
  {
    title: "Analyse",
    items: [
      { keys: ["understood"],    label: "Ce que Candice a compris" },
      { keys: ["deep_touch"],    label: "Ce qui te touche" },
      { keys: ["deep_loved"],    label: "Ce qui te fait te sentir aimée" },
      { keys: ["deep_pleasure"], label: "Ce qui pourrait te faire plaisir" },
      { keys: ["deep_miss"],     label: "Ce qui tombe à côté" },
      { keys: ["works"],         label: "Ce qui marche avec toi" },
    ],
  },
  {
    title: "Mondes & univers",
    items: [
      { keys: ["monde_tables"],   label: "Tables" },
      { keys: ["monde_voyages"],  label: "Voyages" },
      { keys: ["monde_passions"], label: "Passions" },
      { keys: ["monde_gouts"],    label: "Goûts esthétiques" },
      { keys: ["territoire"],     label: "Territoire idéal" },
      { keys: ["univers"],        label: "Univers & marques" },
    ],
  },
  {
    title: "Infos pratiques",
    items: [
      { keys: ["facts_tailles"],     label: "Tailles (vêtements / chaussures)" },
      // TROIS CASES, PAS UNE. Une allergie est une donnée de santé ; un régime peut
      // dire une conviction ; l'alcool ne dit ni l'un ni l'autre. Les regrouper
      // forçait à partager les trois pour en partager une seule.
      // « Allergies » n'est plus UNE case : le sélecteur affiche une case par allergie déclarée.
      { keys: ["facts_allergies"], label: "Allergies", parElement: true },
      { keys: ["facts_regime"],    label: "Régime alimentaire" },
      { keys: ["facts_alcool"],    label: "Rapport à l'alcool" },
      { keys: ["facts_parfums"],     label: "Parfums aimés / détestés" },
      { keys: ["facts_animaux"],     label: "Animaux" },
      { keys: ["facts_dates"],       label: "Dates clés" },
      { keys: ["facts_mobilite"],    label: "Mobilité / santé" },
    ],
  },
];

/** Toutes les clés cochables couvertes par les groupes (= matrice, vérifié par test). */
export function allShareGroupKeys(): SectionKey[] {
  return SHARE_GROUPS.flatMap(g => g.items.flatMap(i => i.keys));
}

/** Clés cochées par défaut (filtered_on dans la matrice invite_filtre). */
export function defaultCheckedKeys(): SectionKey[] {
  return checkableSections("invite_filtre")
    .filter(k => VISIBILITY_MATRIX.invite_filtre[k] === "filtered_on");
}

/** Marqueur du mode aveugle dans contact_consents.scope. */
export const SCOPE_BLIND = "blind";

/**
 * Marqueur « essentiel seulement » : zéro section cochée → scope = ['socle']
 * (le CHECK ≥ 1 reste valable). Au rendu, sanitizeScope l'écarte →
 * sharedSections = [] → le socle seul s'affiche (résumé + podium).
 */
export const SCOPE_SOCLE = "socle";

/** Nettoie un scope stocké → sections cochables valides uniquement. */
export function sanitizeScope(scope: string[] | null | undefined): SectionKey[] {
  const checkable = new Set<string>(checkableSections("invite_filtre"));
  // Les allergies se partagent PAR ÉLÉMENT (`facts_allergies:<allergie>`). La clé de section
  // seule, héritée d'un ancien partage, ne vaut plus rien : elle est écartée ici.
  checkable.delete("facts_allergies");
  return (scope ?? []).filter((s): s is SectionKey => checkable.has(s) || estCleAllergie(s));
}

export type ShareMode = "all" | "sections" | "blind";

/**
 * Scope stocké pour un choix de partage — SOURCE UNIQUE pour les deux
 * gestes (réponse à une demande ET lien sortant).
 */
export function scopeForSelection(
  mode: ShareMode, sections?: string[],
  /** Les clés d'allergie que CETTE personne peut partager aujourd'hui. Une clé d'allergie
   *  absente de cette liste est écartée : on ne consent pas à partager ce qu'on n'a pas. */
  allergiesDisponibles?: readonly string[],
): string[] {
  // « Tout partager » ne comprend AUCUNE allergie : chacune se choisit, une par une.
  if (mode === "all") return checkableSections("invite_filtre").filter((k) => k !== "facts_allergies");
  if (mode === "blind") return [SCOPE_BLIND];
  const connues = allergiesDisponibles ? new Set(allergiesDisponibles) : null;
  const checked = sanitizeScope(sections).filter((k) => !estCleAllergie(k) || !connues || connues.has(k));
  return checked.length > 0 ? checked : [SCOPE_SOCLE];
}
