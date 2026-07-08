// B.2 Phase 6 — Construction partagée des données ProfileSheet.
// Extrait de /moi (Phase 4) pour être réutilisé par la consultation d'une
// fiche partagée (invite_filtre). AUCUN changement de comportement côté /moi.
//
// stripSheetDataForView : défense en profondeur — les données des sections
// non partagées sont vidées AVANT d'atteindre ProfileSheet, la matrice de
// visibilité restant la garde de rendu.

import type { StyleRadar } from "./synthesis";

export interface AnalysisSection { text?: string; chips?: string[] }

/** Faits pratiques affichables (jamais de brut hors mode modification). */
export interface PracticalFacts {
  tailles?: string;
  allergies?: string;
  regimeAlcool?: string;
  parfums?: string;
  adresseRenseignee?: boolean;
  animaux?: string;
  datesCles?: string;
  mobilite?: string;
}

// ─── Types du profil (colonnes agrégées — jamais de brut affiché) ─────────────

export interface FaceResult { dominant: string[]; secondaire: string[]; tertiaire: string[] }
export interface AxisScore { score: number; intensity: number }
export interface ImportantDate { type: string; label: string; date: string }

export interface ProfileRow {
  grammatical_gender: string | null;
  attention_reception: FaceResult | null;
  temperament_axes: Record<string, AxisScore> | null;
  lifestyle_axes: Record<string, AxisScore> | null;
  singularity_answers: Record<string, unknown> | null;
  practical_info: {
    prenom?: string;
    allergies?: string[]; regime?: string; alcool?: string;
    allergies_detail?: string;
    taille_vetements?: string; taille_chaussures?: string;
    parfums?: string[]; odeurs_detestees?: string;
    adresse_livraison?: string; animaux?: string;
    dates_importantes?: ImportantDate[];
    mobilite_sante?: string; mobilite_intensite?: string;
  } | null;
  religion: string | null;
  disability: string | null;
  health_comfort: string | null;
}

export interface AnalysisRow {
  summary: string | null;
  summary_third_person: string | null;
  summary_chips: string[] | null;
  insights: string[] | null;
  sections: Record<string, AnalysisSection> | null;
  modes: { conflit?: string; stress?: string; decision?: string; canal?: string } | null;
  style_radar: StyleRadar | null;
  entities: { brands?: string[]; places?: string[] } | null;
  gender: string | null;
}

/** Colonnes à sélectionner sur my_profile pour construire une fiche. */
export const PROFILE_ROW_SELECT =
  "grammatical_gender, attention_reception, temperament_axes, lifestyle_axes, singularity_answers, practical_info, religion, disability, health_comfort";

/** Colonnes à sélectionner sur profile_analysis pour construire une fiche. */
export const ANALYSIS_ROW_SELECT =
  "summary, summary_third_person, summary_chips, insights, sections, modes, style_radar, entities, gender";

// ─── Label maps (faits pratiques) ─────────────────────────────────────────────

// V3.4 — niveau de langue : JAMAIS d'abréviation, majuscule initiale sur
// les valeurs, jamais de troncature « … » (le détail complet vit en sheet).
const ALLERGIE_FR: Record<string, string> = {
  gluten: "gluten", lactose: "lactose",
  fruits_a_coque: "fruits à coque", fruits_de_mer: "fruits de mer", autre: "autres",
};
const REGIME_FR: Record<string, string> = {
  omnivore: "Omnivore", vegetarien: "Végétarien", vegan: "Vegan",
  halal: "Halal", casher: "Casher", sans_preference: "Sans préférence", autre: "Particulier",
};
const ALCOOL_FR: Record<string, string> = {
  je_bois: "Alcool accepté", ne_bois_pas: "Sans alcool",
  occasionnel: "Alcool occasionnel", eviter_lieux: "Éviter les lieux centrés alcool",
};
const PARFUM_FR: Record<string, string> = {
  frais: "frais", poudre: "poudré", boise: "boisé", floral: "floral",
  gourmand: "gourmand", ambre: "ambré", discret: "discret", sans_parfum: "sans parfum",
};
const DATE_TYPE_FR: Record<string, string> = {
  anniversaire: "Anniversaire", fete: "Fête", mariage: "Mariage",
  perso: "Date perso", symbolique: "Date symbolique",
};
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Coupe à la frontière de mot, sans jamais d'« … » — résumé digne,
 *  le détail complet reste accessible (sheet). */
function cutAtWord(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : s.slice(0, max)).replace(/[,;:–-]\s*$/, "").trim();
}

// ─── Complétion (5 grandes parties — jamais affichée en %) ────────────────────

export function computeCompletion(p: ProfileRow | null): { ratio: number; label: string } {
  if (!p) return { ratio: 0, label: "Candice ne te connaît pas encore" };
  const parts = [
    !!p.attention_reception,
    !!p.temperament_axes,
    !!p.lifestyle_axes,
    !!(p.singularity_answers && Object.keys(p.singularity_answers).length > 0),
    !!p.practical_info,
  ];
  const ratio = parts.filter(Boolean).length / parts.length;
  const label =
    ratio === 0 ? "Candice ne te connaît pas encore"
    : ratio < 0.4 ? "Candice commence à te connaître"
    : ratio < 0.8 ? "Candice te connaît bien"
    : "Candice te connaît vraiment bien";
  return { ratio, label };
}

/** « Questionnaire rempli » = 5/5 parties (A.3 validé). */
export function isQuestionnaireComplete(p: ProfileRow | null): boolean {
  return computeCompletion(p).ratio === 1;
}

// ─── Faits pratiques ──────────────────────────────────────────────────────────

function formatDateCle(d: ImportantDate): string {
  const label = DATE_TYPE_FR[d.type] ?? cap(d.type);
  const [, m, day] = (d.date ?? "").split("-").map(Number);
  // Entrées legacy sans date (chantier 2.3) : signalées, jamais masquées —
  // le tap sur la rangée ouvre l'édition pour compléter.
  if (!m || !day) return `${cap(d.label || label)} — date à préciser`;
  return `${label} · ${day} ${MONTHS_FR[m - 1]}`;
}

export function buildFacts(pi: ProfileRow["practical_info"]): PracticalFacts {
  if (!pi) return {};
  const tailles = [pi.taille_vetements, pi.taille_chaussures].filter(Boolean).join(" · ");
  const allergies = (pi.allergies ?? []).filter(a => a !== "aucune").map(a => ALLERGIE_FR[a] ?? a).join(", ");
  const regimeAlcool = [
    pi.regime ? (REGIME_FR[pi.regime] ?? pi.regime) : null,
    pi.alcool ? (ALCOOL_FR[pi.alcool] ?? pi.alcool) : null,
  ].filter(Boolean).join(" · ");
  const parfumsAimes = cap((pi.parfums ?? []).map(p => PARFUM_FR[p] ?? p).join(", "));
  const odeurs = pi.odeurs_detestees?.trim();
  const parfums = [
    parfumsAimes || null,
    odeurs ? cutAtWord(odeurs, 26) : null, // jamais de « … » — détail en édition
  ].filter(Boolean).join(" / ");
  const dates = pi.dates_importantes ?? [];
  const datesCles = dates.length > 0
    ? `${formatDateCle(dates[0])}${dates.length > 1 ? ` · +${dates.length - 1}` : ""}`
    : undefined;
  // Mobilité : TOUJOURS avec son intensité quand elle est connue — jamais de binaire.
  const INTENSITE_FR: Record<string, string> = {
    legere: "gêne légère", systematique: "à prendre en compte",
  };
  const mobiliteTexte = pi.mobilite_sante?.trim();
  // Résumé digne à la frontière de mot, JAMAIS d'« … » — le détail complet
  // vit dans la sheet Mobilité & confort.
  const mobilite = mobiliteTexte
    ? `${cap(cutAtWord(mobiliteTexte, 30))}${pi.mobilite_intensite ? ` · ${INTENSITE_FR[pi.mobilite_intensite] ?? pi.mobilite_intensite}` : ""}`
    : undefined;
  const allergiesFull = cap([
    allergies || null,
    pi.allergies_detail?.trim() || null,
  ].filter(Boolean).join(" — "));
  return {
    tailles: tailles || undefined,
    allergies: allergiesFull || undefined,
    regimeAlcool: regimeAlcool || undefined,
    parfums: parfums || undefined,
    adresseRenseignee: !!pi.adresse_livraison?.trim(),
    animaux: pi.animaux?.trim() || undefined,
    datesCles,
    mobilite,
  };
}

