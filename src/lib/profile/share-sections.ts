// B.2 Phase 6 — Libellés et regroupements des sections cochables au partage.
// Source de vérité des clés : checkableSections("invite_filtre") (matrice).
// Un item peut porter plusieurs clés (tempérament = axes + modes : un seul
// choix utilisateur, les deux clés suivent).

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
      { keys: ["radar"],                                  label: "Style attentionnel" },
      { keys: ["what_touches"],                           label: "Ce qui te touche" },
      { keys: ["insights"],                               label: "Ce que Candice a compris" },
      { keys: ["temperament_axes", "temperament_modes"],  label: "Tempérament" },
      { keys: ["lifestyle_axes"],                         label: "Art de vivre" },
    ],
  },
  {
    title: "Univers",
    items: [
      { keys: ["gifts"],        label: "Cadeaux qui visent juste" },
      { keys: ["restaurants"],  label: "Tables" },
      { keys: ["travel"],       label: "Voyages" },
      { keys: ["hobbies"],      label: "Passions" },
      { keys: ["brands"],       label: "Marques & lieux" },
      { keys: ["style"],        label: "Goûts esthétiques" },
      { keys: ["parfums"],      label: "Parfums" },
      { keys: ["points_fixes"], label: "Points fixes" },
      { keys: ["avoid"],        label: "À éviter" },
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

/** Nettoie un scope stocké → sections cochables valides uniquement. */
export function sanitizeScope(scope: string[] | null | undefined): SectionKey[] {
  const checkable = new Set<string>(checkableSections("invite_filtre"));
  return (scope ?? []).filter((s): s is SectionKey => checkable.has(s));
}
