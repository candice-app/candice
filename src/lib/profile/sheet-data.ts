// B.2 Phase 6 — Construction partagée des données ProfileSheet.
// Extrait de /moi (Phase 4) pour être réutilisé par la consultation d'une
// fiche partagée (invite_filtre). AUCUN changement de comportement côté /moi.
//
// stripSheetDataForView : défense en profondeur — les données des sections
// non partagées sont vidées AVANT d'atteindre ProfileSheet, la matrice de
// visibilité restant la garde de rendu.

import type { ProfileSheetData, AnalysisSection } from "@/components/profile/ProfileSheet";
import type { StyleRadar } from "@/lib/profile/synthesis";
import {
  resolveVisibility,
  type ProfileView,
  type SectionKey,
} from "@/lib/profile/visibility";

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

const ALLERGIE_FR: Record<string, string> = {
  gluten: "gluten", lactose: "lactose",
  fruits_a_coque: "fruits à coque", fruits_de_mer: "fruits de mer", autre: "autres",
};
const REGIME_FR: Record<string, string> = {
  omnivore: "omnivore", vegetarien: "végétarien", vegan: "vegan",
  halal: "halal", casher: "casher", sans_preference: "sans préférence", autre: "particulier",
};
const ALCOOL_FR: Record<string, string> = {
  je_bois: "alcool ok", ne_bois_pas: "sans alcool",
  occasionnel: "occasionnel", eviter_lieux: "évite les lieux alcool",
};
const PARFUM_FR: Record<string, string> = {
  frais: "frais", poudre: "poudré", boise: "boisé", floral: "floral",
  gourmand: "gourmand", ambre: "ambré", discret: "discret", sans_parfum: "sans parfum",
};
const DATE_TYPE_FR: Record<string, string> = {
  anniversaire: "anniv.", fete: "fête", mariage: "mariage",
  perso: "date perso", symbolique: "date symbolique",
};
const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// ─── Donut (fusion CAD_C + CAD_S en CAD) ─────────────────────────────────────

export const CENTER_LABELS: Record<string, string> = {
  MOT: "Mots", CAD: "Cadeaux", SER: "Service",
  EXP: "Moments", GES: "Détails", SUR: "Surprises",
};

export function computeDonutData(reception: FaceResult | null): { id: string; weight: number }[] {
  if (!reception) return [];
  const weights: Record<string, number> = {};
  const mergeId = (id: string) => (id === "CAD_C" || id === "CAD_S") ? "CAD" : id;
  for (const id of reception.dominant ?? []) { const m = mergeId(id); weights[m] = (weights[m] ?? 0) + 3; }
  for (const id of reception.secondaire ?? []) { const m = mergeId(id); weights[m] = (weights[m] ?? 0) + 2; }
  for (const id of reception.tertiaire ?? []) { const m = mergeId(id); weights[m] = (weights[m] ?? 0) + 1; }
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(weights)
    .map(([id, w]) => ({ id, weight: w / total }))
    .sort((a, b) => b.weight - a.weight);
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
  const label = DATE_TYPE_FR[d.type] ?? d.type;
  const [, m, day] = (d.date ?? "").split("-").map(Number);
  // Entrées legacy sans date (chantier 2.3) : signalées, jamais masquées —
  // le tap sur la rangée ouvre l'édition pour compléter.
  if (!m || !day) return `${d.label || label} — date à préciser`;
  return `${label} ${day} ${MONTHS_FR[m - 1]}`;
}

export function buildFacts(pi: ProfileRow["practical_info"]): ProfileSheetData["facts"] {
  if (!pi) return {};
  const tailles = [pi.taille_vetements, pi.taille_chaussures].filter(Boolean).join(" · ");
  const allergies = (pi.allergies ?? []).filter(a => a !== "aucune").map(a => ALLERGIE_FR[a] ?? a).join(", ");
  const regimeAlcool = [
    pi.regime ? (REGIME_FR[pi.regime] ?? pi.regime) : null,
    pi.alcool ? (ALCOOL_FR[pi.alcool] ?? pi.alcool) : null,
  ].filter(Boolean).join(" · ");
  const parfumsAimes = (pi.parfums ?? []).map(p => PARFUM_FR[p] ?? p).join(", ");
  const odeurs = pi.odeurs_detestees?.trim();
  const parfums = [
    parfumsAimes || null,
    odeurs ? (odeurs.length > 26 ? odeurs.slice(0, 26) + "…" : odeurs) : null,
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
  const mobilite = mobiliteTexte
    ? `${mobiliteTexte.length > 30 ? mobiliteTexte.slice(0, 30) + "…" : mobiliteTexte}${pi.mobilite_intensite ? ` · ${INTENSITE_FR[pi.mobilite_intensite] ?? pi.mobilite_intensite}` : ""}`
    : undefined;
  const allergiesFull = [
    allergies || null,
    pi.allergies_detail?.trim() || null,
  ].filter(Boolean).join(" — ");
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

// ─── Assemblage ───────────────────────────────────────────────────────────────

export function buildProfileSheetData(args: {
  profile: ProfileRow;
  analysis: AnalysisRow | null;
  firstName: string;
  discoveryAvailable: boolean;
}): ProfileSheetData {
  const { profile, analysis, firstName, discoveryAvailable } = args;
  const completion = computeCompletion(profile);
  const donutData = computeDonutData(profile.attention_reception);

  return {
    firstName,
    knowledgeLabel: completion.label,
    completionRatio: completion.ratio,
    gender: analysis?.gender ?? profile.grammatical_gender,

    summary: analysis?.summary ?? null,
    summaryThirdPerson: analysis?.summary_third_person ?? null,
    summaryChips: analysis?.summary_chips ?? [],
    insights: analysis?.insights ?? [],
    sections: analysis?.sections ?? {},
    modes: analysis?.modes ?? null,
    styleRadar: analysis?.style_radar ?? null,
    entities: analysis?.entities ?? null,

    donutData,
    donutCenterLabel: CENTER_LABELS[donutData[0]?.id ?? ""] ?? "",
    temperamentAxes: profile.temperament_axes,
    lifestyleAxes: profile.lifestyle_axes,

    facts: buildFacts(profile.practical_info),
    art9Filled: !!(profile.religion || profile.disability || profile.health_comfort),

    discoveryAvailable,
  };
}

// ─── Strip par visibilité (défense en profondeur) ────────────────────────────

/** Sections analysées portées par data.sections (clé = SectionKey). */
const ANALYSIS_SECTION_KEYS: SectionKey[] = [
  "what_touches", "gifts", "restaurants", "travel", "hobbies",
  "brands", "style", "parfums", "points_fixes", "avoid",
];

/**
 * Vide toute donnée dont la section n'est pas rendue pour (view, sharedSections).
 * La matrice reste la garde de rendu — ceci garantit qu'une donnée non
 * partagée ne quitte JAMAIS le serveur, même en cas de régression du rendu.
 */
export function stripSheetDataForView(
  data: ProfileSheetData,
  view: ProfileView,
  sharedSections?: SectionKey[],
): ProfileSheetData {
  const shown = (s: SectionKey) => resolveVisibility(view, s, sharedSections).shown;

  const sections: Record<string, AnalysisSection> = {};
  for (const key of ANALYSIS_SECTION_KEYS) {
    if (shown(key) && data.sections[key]) sections[key] = data.sections[key];
  }

  return {
    ...data,
    completionRatio: shown("header_ring") ? data.completionRatio : 0,
    summary: shown("lead") ? data.summary : null,
    summaryThirdPerson: shown("lead") ? data.summaryThirdPerson : null,
    summaryChips: shown("topchips") ? data.summaryChips : [],
    donutData: shown("donut") ? data.donutData : [],
    donutCenterLabel: shown("donut") ? data.donutCenterLabel : "",
    styleRadar: shown("radar") ? data.styleRadar : null,
    insights: shown("insights") ? data.insights : [],
    temperamentAxes: shown("temperament_axes") ? data.temperamentAxes : null,
    modes: shown("temperament_modes") ? data.modes : null,
    lifestyleAxes: shown("lifestyle_axes") ? data.lifestyleAxes : null,
    entities: shown("brands") ? data.entities : null,
    sections,
    facts: {
      tailles: shown("facts_tailles") ? data.facts.tailles : undefined,
      allergies: shown("facts_alimentaire") ? data.facts.allergies : undefined,
      regimeAlcool: shown("facts_alimentaire") ? data.facts.regimeAlcool : undefined,
      parfums: shown("facts_parfums") ? data.facts.parfums : undefined,
      adresseRenseignee: shown("facts_adresse") ? data.facts.adresseRenseignee : undefined,
      animaux: shown("facts_animaux") ? data.facts.animaux : undefined,
      datesCles: shown("facts_dates") ? data.facts.datesCles : undefined,
      mobilite: shown("facts_mobilite") ? data.facts.mobilite : undefined,
    },
    art9Filled: shown("art9") ? data.art9Filled : false,
    constraints: shown("constraints_row") ? data.constraints : undefined,
    discoveryAvailable: shown("discovery") ? data.discoveryAvailable : false,
  };
}
