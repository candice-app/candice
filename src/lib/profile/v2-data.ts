// Refonte Profil V2, Phase C — données de la nouvelle fiche pilote.
// Construit côté serveur (/moi), sérialisable, consommé par ProfileV2 (client).
// JAMAIS de brut utilisateur : analyse (profile_analysis V2) + métriques
// déterministes + FAITS pratiques.

import {
  buildFacts,
  computeCompletion,
  type ProfileRow,
  type AnalysisRow,
  type ImportantDate,
} from "./sheet-data";
import {
  computePodium,
  computeWorksLevels,
  computeKnowledge,
  type PodiumRow,
  type WorksKey,
  type WorksLevel,
} from "./v2-metrics";
import type { StyleRadar } from "./synthesis";

// ── Types V2 ──────────────────────────────────────────────────────────────────

export interface SectionV2 { text?: string; chips?: string[]; more?: string }

export interface TerritoryV2 {
  titre: string;
  phrase: string;
  cartes: Array<{ nom: string; description: string; statut: "desirable" | "eviter" }>;
}

export interface UniverseV2 {
  lieux_ambiances: string[];
  matieres: string[];
  reves_envies: string[];
  phrase: string;
}

export interface AnalysisRowV2 extends AnalysisRow {
  summary_long: string | null;
  podium_intro: string | null;
  understood_cards: Array<{ eyebrow: string; text: string }> | null;
  works_phrases: Record<string, string> | null;
  territory: TerritoryV2 | null;
  universe: UniverseV2 | null;
}

export const ANALYSIS_ROW_V2_SELECT =
  "summary, summary_third_person, summary_chips, insights, sections, modes, style_radar, entities, gender, summary_long, podium_intro, understood_cards, works_phrases, territory, universe";

export interface ViserNudge {
  key: string;              // dimension (groupe) ou question_key (répondu)
  title: string;
  subtitle: string;         // « bénéfice · n questions · durée » ou « Répondu — … »
  sectionKey: string | null;
  done: boolean;
}

/** Phrase de connaissance à 4 états (maquette gelée — anneau sans chiffre). */
export type KnowState = 1 | 2 | 3 | 4;
export const KNOW_PHRASES: Record<KnowState, { before: string; bold: string; after: string }> = {
  1: { before: "Candice ", bold: "commence", after: " à te connaître" },
  2: { before: "Candice te connaît ", bold: "bien", after: "" },
  3: { before: "Candice te connaît ", bold: "très bien", after: "" },
  4: { before: "Candice ", bold: "anticipe", after: " pour toi" },
};

export interface ProfileV2Data {
  firstName: string;
  gender: string | null;
  avatarUrl: string | null;
  knowState: KnowState;
  knowRatio: number;        // anneau — jamais affiché en chiffre

  summary: string | null;
  summaryChips: string[];
  summaryLong: string | null;

  podiumIntro: string | null;
  podium: PodiumRow[];
  insights: string[];

  understoodCards: Array<{ eyebrow: string; text: string }>;
  sections: Record<string, SectionV2>;

  worksLevels: Record<WorksKey, WorksLevel> | null;
  worksPhrases: Record<string, string>;

  territory: TerritoryV2 | null;
  universe: UniverseV2 | null;
  brandsCategorized: Array<{ name: string; category: string }>;

  facts: ReturnType<typeof buildFacts>;
  mobiliteDetail: { texte: string; intensite: string | null } | null; // sheet — jamais tronqué
  datesTotal: number;       // entrées saisies (3 états : 0 → CTA ajouter)
  datesACompleter: number;  // entrées sans date exploitable
  art9Filled: boolean;
  /** Espace sensible (point 12) — brut en mode modification uniquement,
   *  JAMAIS dans un scope de partage. */
  art9Edit: { religion: string; disability: string; health_comfort: string };
  /** Valeurs BRUTES pour les sheets d'édition (C3) — mode modification
   *  uniquement, seule exception à « jamais de brut affiché ». */
  practicalEdit: {
    adresse_livraison: string;
    taille_vetements: string;
    taille_chaussures: string;
    regime: string;
    alcool: string;
    allergies: string[];
    allergies_detail: string;
    dates_importantes: ImportantDate[];
  };

  nudges: ViserNudge[];
}

// ── Construction ─────────────────────────────────────────────────────────────

const INTENSITE_FR: Record<string, string> = {
  legere: "gêne légère", systematique: "à prendre en compte",
};

export function buildProfileV2Data(args: {
  profile: ProfileRow & { avatar_path?: string | null };
  analysis: AnalysisRowV2 | null;
  firstName: string;
  nudges: ViserNudge[];
  hasAvailableQuestions: boolean;
  /** URL signée 1 h, calculée par l'appelant EN PARALLÈLE du moteur (C2) */
  avatarUrl: string | null;
}): ProfileV2Data {
  const { profile, analysis, firstName, nudges, hasAvailableQuestions, avatarUrl } = args;

  // C1 — SOURCE UNIQUE : anneau + phrase + CTA dérivent du même calcul
  const completion = computeCompletion(profile);
  const knowledge = computeKnowledge(completion.ratio, hasAvailableQuestions);
  const knowState: KnowState = knowledge.state;

  const pi = profile.practical_info;
  const mobiliteTexte = pi?.mobilite_sante?.trim();
  const dates = pi?.dates_importantes ?? [];
  const datesACompleter = dates.filter(d => {
    const [, m, day] = (d.date ?? "").split("-").map(Number);
    return !m || !day;
  }).length;

  return {
    firstName,
    gender: analysis?.gender ?? profile.grammatical_gender,
    avatarUrl,
    knowState,
    knowRatio: knowledge.ring,

    summary: analysis?.summary ?? null,
    summaryChips: analysis?.summary_chips ?? [],
    summaryLong: analysis?.summary_long ?? null,

    podiumIntro: analysis?.podium_intro ?? null,
    podium: computePodium(profile.attention_reception),
    insights: analysis?.insights ?? [],

    understoodCards: analysis?.understood_cards ?? [],
    sections: (analysis?.sections as Record<string, SectionV2> | null) ?? {},

    worksLevels: computeWorksLevels(
      (analysis?.style_radar as StyleRadar | null) ?? null,
      profile.temperament_axes,
    ),
    worksPhrases: analysis?.works_phrases ?? {},

    territory: analysis?.territory ?? null,
    universe: analysis?.universe ?? null,
    brandsCategorized:
      ((analysis?.entities as { brands_categorized?: Array<{ name: string; category: string }> } | null)
        ?.brands_categorized ?? []).slice(0, 12),

    facts: buildFacts(pi),
    mobiliteDetail: mobiliteTexte
      ? {
          texte: mobiliteTexte, // COMPLET — jamais tronqué (le sheet l'affiche)
          intensite: pi?.mobilite_intensite ? (INTENSITE_FR[pi.mobilite_intensite] ?? pi.mobilite_intensite) : null,
        }
      : null,
    datesTotal: dates.length,
    datesACompleter,
    art9Filled: !!(profile.religion || profile.disability || profile.health_comfort),
    art9Edit: {
      religion: profile.religion ?? "",
      disability: profile.disability ?? "",
      health_comfort: profile.health_comfort ?? "",
    },
    practicalEdit: {
      adresse_livraison: pi?.adresse_livraison ?? "",
      taille_vetements: pi?.taille_vetements ?? "",
      taille_chaussures: pi?.taille_chaussures ?? "",
      regime: pi?.regime ?? "",
      alcool: pi?.alcool ?? "",
      allergies: pi?.allergies ?? [],
      allergies_detail: pi?.allergies_detail ?? "",
      dates_importantes: dates,
    },

    nudges,
  };
}
