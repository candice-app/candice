// Phase D — vues TIERCES de la fiche V2.
// 1) stripProfileV2Data : défense en profondeur — les données des sections
//    non partagées sont vidées AVANT de quitter le serveur (la matrice reste
//    la garde de rendu).
// 2) thirdPersonV2 : conversion 3e personne de tous les textes (le pilote
//    lit « tu », le tiers lit « elle/il »).

import { resolveVisibility, type ProfileView, type SectionKey } from "./visibility";
import type { ProfileV2Data, SectionV2 } from "./v2-data";

// ── 3e personne (reprise du transform validé, source unique) ─────────────────

export function to3rdPerson(text: string, gender?: string | null): string {
  const p = gender === "feminine" ? "elle" : "il";
  return text
    .replace(/\btu sembles?\b/gi, `${p} semble`)
    .replace(/\btu es\b/gi, `${p} est`)
    .replace(/\btu as\b/gi, `${p} a`)
    .replace(/\btu apprécies?\b/gi, `${p} apprécie`)
    .replace(/\btu aimes?\b/gi, `${p} aime`)
    .replace(/\btu préfères?\b/gi, `${p} préfère`)
    .replace(/\btu cherches?\b/gi, `${p} cherche`)
    .replace(/\btu exprimes?\b/gi, `${p} exprime`)
    .replace(/\btu voyages?\b/gi, `${p} voyage`)
    .replace(/\btu rêves?\b/gi, `${p} rêve`)
    .replace(/\btu te sens\b/gi, `${p} se sent`)
    .replace(/\btu te\b/gi, `${p} se`)
    .replace(/\btu\b/gi, p)
    .replace(/\bton\b/gi, "son").replace(/\bta\b/gi, "sa").replace(/\btes\b/gi, "ses")
    .replace(/\btoi\b/gi, p === "elle" ? "elle" : "lui")
    .replace(/\bchez toi\b/gi, `chez ${p === "elle" ? "elle" : "lui"}`);
}

const tp = (s: string | null | undefined, g: string | null): string | null =>
  s ? to3rdPerson(s, g) : (s ?? null);

const tpSection = (s: SectionV2 | undefined, g: string | null): SectionV2 | undefined =>
  s ? { ...s, text: tp(s.text, g) ?? undefined, more: tp(s.more, g) ?? undefined } : s;

export function thirdPersonV2(data: ProfileV2Data): ProfileV2Data {
  const g = data.gender;
  const sections: Record<string, SectionV2> = {};
  for (const [k, v] of Object.entries(data.sections)) {
    const t = tpSection(v, g);
    if (t) sections[k] = t;
  }
  return {
    ...data,
    summary: tp(data.summary, g),
    summaryLong: tp(data.summaryLong, g),
    podiumIntro: tp(data.podiumIntro, g),
    insights: data.insights.map(i => to3rdPerson(i, g)),
    understoodCards: data.understoodCards.map(c => ({ ...c, text: to3rdPerson(c.text, g) })),
    sections,
    worksPhrases: Object.fromEntries(
      Object.entries(data.worksPhrases).map(([k, v]) => [k, to3rdPerson(v, g)]),
    ),
    territory: data.territory
      ? { ...data.territory, phrase: to3rdPerson(data.territory.phrase, g) }
      : null,
    universe: data.universe
      ? { ...data.universe, phrase: to3rdPerson(data.universe.phrase, g) }
      : null,
  };
}

// ── Strip par visibilité (V2) ─────────────────────────────────────────────────

const SECTION_TO_ANALYSIS: Partial<Record<SectionKey, string>> = {
  deep_touch: "what_touches",
  deep_loved: "feels_loved",
  deep_pleasure: "gifts",
  deep_miss: "avoid",
  monde_tables: "restaurants",
  monde_voyages: "travel",
  monde_passions: "hobbies",
  monde_gouts: "style",
};

export function stripProfileV2Data(
  data: ProfileV2Data,
  view: ProfileView,
  sharedSections?: SectionKey[],
): ProfileV2Data {
  const shown = (s: SectionKey) => resolveVisibility(view, s, sharedSections).shown;

  const sections: Record<string, SectionV2> = {};
  for (const [key, analysisKey] of Object.entries(SECTION_TO_ANALYSIS)) {
    if (shown(key as SectionKey) && data.sections[analysisKey]) {
      sections[analysisKey] = data.sections[analysisKey];
    }
  }
  // points_fixes vit dans le module univers (« À savoir pour viser juste »)
  if (shown("univers") && data.sections.points_fixes) sections.points_fixes = data.sections.points_fixes;

  return {
    ...data,
    knowRatio: shown("header_ring") ? data.knowRatio : 0,
    summary: shown("summary") ? data.summary : null,
    summaryChips: shown("summary") ? data.summaryChips : [],
    summaryLong: shown("summary") ? data.summaryLong : null,
    podiumIntro: shown("podium") ? data.podiumIntro : null,
    podium: shown("podium") ? data.podium : [],
    insights: shown("podium") ? data.insights : [],
    understoodCards: shown("understood") ? data.understoodCards : [],
    sections,
    worksLevels: shown("works") ? data.worksLevels : null,
    worksPhrases: shown("works") ? data.worksPhrases : {},
    territory: shown("territoire") ? data.territory : null,
    universe: shown("univers") ? data.universe : null,
    brandsCategorized: shown("univers") ? data.brandsCategorized : [],
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
    mobiliteDetail: shown("facts_mobilite") ? data.mobiliteDetail : null,
    art9Filled: shown("art9") ? data.art9Filled : false,
    art9Edit: shown("art9") ? data.art9Edit : { religion: "", disability: "", health_comfort: "" },
    practicalEdit: view === "pilote" ? data.practicalEdit : {
      adresse_livraison: "", taille_vetements: "", taille_chaussures: "",
      regime: "", alcool: "", allergies: [], allergies_detail: "", dates_importantes: [],
    },
    nudges: shown("viser") ? data.nudges : [],
  };
}
