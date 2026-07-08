// B.2.1 Phase 4 — Page profil pilote unifiée (fusion /moi + /moi/resultats).
// Rendu intégral par ProfileSheet (view="pilote"), fidèle à la maquette validée
// design/redisign/Candice_Maquette_Profil_REFERENCE_VALIDEE.html.
// JAMAIS de réponse brute : analyse (profile_analysis) + scores agrégés + FAITS pratiques.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import V4Shell from "@/components/layout/V4Shell";
import ProfileSheet, { type ProfileSheetData } from "@/components/profile/ProfileSheet";
import GenderModal from "@/components/profile/GenderModal";
import ResumePrompt from "@/components/questionnaire/ResumePrompt";
import LogoutButton from "./LogoutButton";
import GenerateAnalysisOnMount from "./GenerateAnalysisOnMount";
import { getAvailableDiscoverySections, type ProfileAnalysisSnapshot } from "@/lib/discovery/engine";
import {
  buildProfileSheetData,
  PROFILE_ROW_SELECT,
  ANALYSIS_ROW_SELECT,
  type ProfileRow,
  type AnalysisRow,
} from "@/lib/profile/sheet-data";

// Types, label maps, donut, complétion et faits pratiques : extraits en
// Phase 6 vers lib/profile/sheet-data.ts (réutilisés par la fiche partagée).

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MoiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileRaw }, { data: analysisRaw }] = await Promise.all([
    supabase
      .from("my_profile")
      .select(PROFILE_ROW_SELECT)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_analysis")
      .select(ANALYSIS_ROW_SELECT)
      .eq("user_id", user.id)
      .is("contact_id", null)
      .maybeSingle(),
  ]);

  const profile = profileRaw as unknown as ProfileRow | null;
  const analysis = analysisRaw as unknown as AnalysisRow | null;

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

  const analysisSnapshot: ProfileAnalysisSnapshot | null = analysis?.sections
    ? { sections: analysis.sections as Record<string, { text?: string; chips?: string[] }> }
    : null;
  // Garde unifiée (Phase B) : le même ensemble pilote le bloc « Pour affiner »
  // ET chaque CTA « Complète X » de la fiche — jamais de re-demande.
  const availableSections = await getAvailableDiscoverySections(user.id, supabase, analysisSnapshot);
  const discoveryAvailable = availableSections.size > 0;

  const data: ProfileSheetData = {
    ...buildProfileSheetData({ profile, analysis, firstName, discoveryAvailable }),
    availableSections: Array.from(availableSections),
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
