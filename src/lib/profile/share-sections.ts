// Phase D — Libellés et regroupements des sections cochables au partage (V2).
// Source de vérité des clés : checkableSections("invite_filtre") (matrice V2).

import {
  VISIBILITY_MATRIX,
  checkableSections,
  type SectionKey,
} from "./visibility";

export interface ShareItem {
  keys: SectionKey[];
  label: string;
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
      { keys: ["wishlist"],       label: "Ma wishlist" },
    ],
  },
  {
    title: "Infos pratiques",
    items: [
      { keys: ["facts_tailles"],     label: "Tailles (vêtements / chaussures)" },
      { keys: ["facts_alimentaire"], label: "Allergies · régime · alcool" },
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
  return (scope ?? []).filter((s): s is SectionKey => checkable.has(s));
}

export type ShareMode = "all" | "sections" | "blind";

/**
 * Scope stocké pour un choix de partage — SOURCE UNIQUE pour les deux
 * gestes (réponse à une demande ET lien sortant).
 */
export function scopeForSelection(mode: ShareMode, sections?: string[]): string[] {
  if (mode === "all") return checkableSections("invite_filtre");
  if (mode === "blind") return [SCOPE_BLIND];
  const checked = sanitizeScope(sections);
  return checked.length > 0 ? checked : [SCOPE_SOCLE];
}
