// B.2.1 Phase 4 — Page profil pilote unifiée (fusion /moi + /moi/resultats).
// Rendu intégral par ProfileSheet (view="pilote"), fidèle à la maquette validée
// design/redisign/Candice_Maquette_Profil_REFERENCE_VALIDEE.html.
// JAMAIS de réponse brute : analyse (profile_analysis) + scores agrégés + FAITS pratiques.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import V4Shell from "@/components/layout/V4Shell";
import ProfileSheet, { type ProfileSheetData, type AnalysisSection } from "@/components/profile/ProfileSheet";
import GenderModal from "@/components/profile/GenderModal";
import ResumePrompt from "@/components/questionnaire/ResumePrompt";
import LogoutButton from "./LogoutButton";
import GenerateAnalysisOnMount from "./GenerateAnalysisOnMount";
import { getAvailableDiscoverySections, type ProfileAnalysisSnapshot } from "@/lib/discovery/engine";
import type { StyleRadar } from "@/lib/profile/synthesis";

// ─── Types du profil (colonnes agrégées — jamais de brut affiché) ─────────────

interface FaceResult { dominant: string[]; secondaire: string[]; tertiaire: string[] }
interface AxisScore { score: number; intensity: number }
interface ImportantDate { type: string; label: string; date: string }

interface ProfileRow {
  grammatical_gender: string | null;
  attention_reception: FaceResult | null;
  temperament_axes: Record<string, AxisScore> | null;
  lifestyle_axes: Record<string, AxisScore> | null;
  singularity_answers: Record<string, unknown> | null;
  practical_info: {
    prenom?: string;
    allergies?: string[]; regime?: string; alcool?: string;
    taille_vetements?: string; taille_chaussures?: string;
    parfums?: string[]; odeurs_detestees?: string;
    adresse_livraison?: string; animaux?: string;
    dates_importantes?: ImportantDate[];
  } | null;
  religion: string | null;
  disability: string | null;
  health_comfort: string | null;
}

interface AnalysisRow {
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

const CENTER_LABELS: Record<string, string> = {
  MOT: "Mots", CAD: "Cadeaux", SER: "Service",
  EXP: "Moments", GES: "Détails", SUR: "Surprises",
};

function computeDonutData(reception: FaceResult | null): { id: string; weight: number }[] {
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

function computeCompletion(p: ProfileRow | null): { ratio: number; label: string } {
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

// ─── Faits pratiques ──────────────────────────────────────────────────────────

function formatDateCle(d: ImportantDate): string {
  const label = DATE_TYPE_FR[d.type] ?? d.type;
  const [, m, day] = d.date.split("-").map(Number);
  if (!m || !day) return d.label || label;
  return `${label} ${day} ${MONTHS_FR[m - 1]}`;
}

function buildFacts(pi: ProfileRow["practical_info"]): ProfileSheetData["facts"] {
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
  return {
    tailles: tailles || undefined,
    allergies: allergies || undefined,
    regimeAlcool: regimeAlcool || undefined,
    parfums: parfums || undefined,
    adresseRenseignee: !!pi.adresse_livraison?.trim(),
    animaux: pi.animaux?.trim() || undefined,
    datesCles,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MoiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileRaw }, { data: analysisRaw }] = await Promise.all([
    supabase
      .from("my_profile")
      .select("grammatical_gender, attention_reception, temperament_axes, lifestyle_axes, singularity_answers, practical_info, religion, disability, health_comfort")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_analysis")
      .select("summary, summary_third_person, summary_chips, insights, sections, modes, style_radar, entities, gender")
      .eq("user_id", user.id)
      .is("contact_id", null)
      .maybeSingle(),
  ]);

  const profile = profileRaw as ProfileRow | null;
  const analysis = analysisRaw as AnalysisRow | null;

  // ── État vide : pas encore de profil ──────────────────────────────────────
  if (!profile) {
    return (
      <V4Shell active="profile">
        <div style={{ textAlign: "center", padding: "64px 24px" }}>
          <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.7 }}>
            Réponds à quelques questions — tes proches pourront consulter ta fiche pour mieux prendre soin de toi.
          </p>
          <ResumePrompt userId={user.id} />
        </div>
        <FooterLinks />
      </V4Shell>
    );
  }

  const showGenderModal = !profile.grammatical_gender;
  const needsAnalysis = !!profile.attention_reception && !analysis;

  const firstName =
    profile.practical_info?.prenom?.trim()
    || user.user_metadata?.full_name?.split(" ")[0]
    || "Mon profil";

  const completion = computeCompletion(profile);
  const donutData = computeDonutData(profile.attention_reception);

  const analysisSnapshot: ProfileAnalysisSnapshot | null = analysis?.sections
    ? { sections: analysis.sections as Record<string, { text?: string; chips?: string[] }> }
    : null;
  const discoveryAvailable =
    (await getAvailableDiscoverySections(user.id, supabase, analysisSnapshot)).size > 0;

  const data: ProfileSheetData = {
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

  return (
    <V4Shell active="profile">
      {showGenderModal && <GenderModal userId={user.id} />}
      {needsAnalysis && <GenerateAnalysisOnMount />}

      <ProfileSheet view="pilote" data={data} />

      <div style={{ padding: "0 18px 120px" }}>
        <FooterLinks />
      </div>
    </V4Shell>
  );
}

function FooterLinks() {
  return (
    <div style={{ borderTop: "0.5px solid var(--line)", marginTop: 8, paddingTop: 4, paddingBottom: 16 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 300, color: "var(--ink-2)", textDecoration: "none", padding: "12px 0", borderBottom: "0.5px solid var(--line)" }}>
        <span>Retour au site</span>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
      </Link>
      <LogoutButton />
    </div>
  );
}
