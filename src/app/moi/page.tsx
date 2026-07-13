// B.2.1 Phase 4 — Page profil pilote unifiée (fusion /moi + /moi/resultats).
// Rendu intégral par ProfileSheet (view="pilote"), fidèle à la maquette validée
// design/redisign/Candice_Maquette_Profil_REFERENCE_VALIDEE.html.
// JAMAIS de réponse brute : analyse (profile_analysis) + scores agrégés + FAITS pratiques.

// Refonte Profil V2, Phase C — la fiche pilote est rendue par ProfileV2
// (maquette gelée). Les vues TIERCES restent sur ProfileSheet jusqu'à la
// Phase D (elles restent fonctionnelles à chaque commit).

import { redirect } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getAuthClaims } from "@/utils/supabase/claims";
import V4Shell from "@/components/layout/V4Shell";
import ProfileV2 from "@/components/profile/v2/ProfileV2";
import GenderModal from "@/components/profile/GenderModal";
import ResumePrompt from "@/components/questionnaire/ResumePrompt";
import LogoutButton from "./LogoutButton";
import GenerateAnalysisOnMount from "./GenerateAnalysisOnMount";
import {
  getDiscoveryOverview, fetchDiscoveryOverviewSources,
  type ProfileAnalysisSnapshot,
} from "@/lib/discovery/engine";
import { PROFILE_ROW_SELECT, type ProfileRow } from "@/lib/profile/sheet-data";
import { buildProfileV2Data, ANALYSIS_ROW_V2_SELECT, type AnalysisRowV2 } from "@/lib/profile/v2-data";
import { getSignedAvatarUrl } from "@/lib/profile/avatar-url";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MoiPage() {
  const supabase = await createClient();
  // Levier 2 : auth vérifiée en LOCAL (getClaims) — pas d'aller-retour réseau.
  const claims = await getAuthClaims(supabase);
  if (!claims) redirect("/login");
  const userId = claims.sub as string;

  // D3 : UNE seule passe — profil, analyse ET sources de l'overview partent
  // ensemble (l'étage séquentiel « overview après analyse » est supprimé ;
  // seul le FILTRAGE dépend de l'analyse, pas les requêtes).
  const [{ data: profileRaw }, { data: analysisRaw }, overviewSources] = await Promise.all([
    supabase
      .from("my_profile")
      .select(`${PROFILE_ROW_SELECT}, avatar_path`)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("profile_analysis")
      .select(ANALYSIS_ROW_V2_SELECT)
      .eq("user_id", userId)
      .is("contact_id", null)
      .maybeSingle(),
    fetchDiscoveryOverviewSources(userId, supabase),
  ]);

  const profile = profileRaw as unknown as (ProfileRow & { avatar_path?: string | null }) | null;
  const analysis = analysisRaw as unknown as AnalysisRowV2 | null;

  // ── État vide : pas encore de profil ──────────────────────────────────────
  if (!profile) {
    return (
      <V4Shell active="profile">
        <div style={{ textAlign: "center", padding: "64px 24px" }}>
          <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.7 }}>
            Réponds à quelques questions — tes proches pourront consulter ta fiche pour mieux prendre soin de toi.
          </p>
          <ResumePrompt userId={userId} />
        </div>
        <FooterLinks />
      </V4Shell>
    );
  }

  const showGenderModal = !profile.grammatical_gender;
  const needsAnalysis = !!profile.attention_reception && !analysis;

  const firstName =
    profile.practical_info?.prenom?.trim()
    || (claims.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    || "Mon profil";

  const analysisSnapshot: ProfileAnalysisSnapshot | null = analysis?.sections
    ? { sections: analysis.sections as Record<string, { text?: string; chips?: string[] }> }
    : null;
  // C2 : passe UNIQUE du moteur (sections + nudges), signature avatar EN
  // PARALLÈLE et MÉMOÏSÉE (P1.6 : URL stable → image en cache navigateur).
  // D3 : l'overview consomme les sources déjà chargées (zéro requête ici) ;
  // les écritures de rétro-alimentation partent APRÈS la réponse (after).
  const [{ availableSections, nudges, flushStatusWrites }, avatarUrl] = await Promise.all([
    getDiscoveryOverview(userId, supabase, analysisSnapshot, overviewSources),
    getSignedAvatarUrl(profile.avatar_path),
  ]);
  after(() => flushStatusWrites().catch(() => {}));

  const data = buildProfileV2Data({
    profile,
    analysis,
    firstName,
    nudges,
    hasAvailableQuestions: availableSections.size > 0,
    avatarUrl,
  });

  return (
    <V4Shell active="profile" noBrandBar>
      {showGenderModal && <GenderModal userId={userId} />}
      {needsAnalysis && <GenerateAnalysisOnMount />}

      <ProfileV2 data={data} />

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
