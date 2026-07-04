// B.2 Phase 6 — X consulte la fiche que Y a partagée avec lui.
// Accès UNIQUEMENT via un consent profile_view ACTIF (RLS proche_read_own_consents).
// Rendu par ProfileSheet : view="invite_filtre" + sharedSections (intersection),
// ou view="aveugle" ('blind' ∈ scope) — message verrouillé seul.
// Les données non partagées sont vidées côté serveur (stripSheetDataForView)
// AVANT de construire la page : elles ne quittent jamais le serveur.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import V4Shell from "@/components/layout/V4Shell";
import ProfileSheet, { type ProfileSheetData } from "@/components/profile/ProfileSheet";
import {
  buildProfileSheetData,
  stripSheetDataForView,
  PROFILE_ROW_SELECT,
  ANALYSIS_ROW_SELECT,
  type ProfileRow,
  type AnalysisRow,
} from "@/lib/profile/sheet-data";
import { sanitizeScope, SCOPE_BLIND } from "@/lib/profile/share-sections";

export default async function FichePartageePage({
  params,
}: {
  params: Promise<{ consentId: string }>;
}) {
  const { consentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/fiche/${consentId}`);

  // Le consent doit me concerner en tant que demandeur, et être ACTIF
  const { data: consent } = await supabase
    .from("contact_consents")
    .select("id, status, pilote_id, scope")
    .eq("id", consentId)
    .eq("kind", "profile_view")
    .eq("proche_user_id", user.id)
    .maybeSingle();

  if (!consent || consent.status !== "active") {
    return (
      <V4Shell active="people">
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--ink)", lineHeight: 1.4, marginBottom: 10 }}>
            {consent?.status === "revoked" ? "Ce partage a été retiré." : "Fiche non disponible."}
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 20 }}>
            {consent?.status === "revoked"
              ? "La personne a retiré son partage — sa fiche n'est plus visible."
              : "Ce lien ne correspond à aucune fiche partagée avec toi."}
          </p>
          <Link href="/recherche" style={{ fontSize: 13, fontWeight: 600, color: "var(--pine)", textDecoration: "none", display: "inline-flex", minHeight: 44, alignItems: "center" }}>
            Retour à la recherche →
          </Link>
        </div>
      </V4Shell>
    );
  }

  // Identité minimale du partageur (prénom + genre grammatical pour la 3e pers.)
  const admin = createAdminClient();
  const [{ data: { user: sharer } }, { data: sharerProfileRaw }] = await Promise.all([
    admin.auth.admin.getUserById(consent.pilote_id),
    admin.from("my_profile").select(PROFILE_ROW_SELECT).eq("user_id", consent.pilote_id).maybeSingle(),
  ]);
  const sharerProfile = sharerProfileRaw as unknown as ProfileRow | null;
  const firstName =
    sharerProfile?.practical_info?.prenom?.trim()
    || (sharer?.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    || "Cette personne";

  const scope = (consent.scope ?? []) as string[];
  const isBlind = scope.includes(SCOPE_BLIND);

  // ── Mode aveugle : AUCUNE donnée de fiche ne quitte le serveur ────────────
  if (isBlind || !sharerProfile) {
    const blindData: ProfileSheetData = {
      firstName,
      knowledgeLabel: "",
      completionRatio: 0,
      gender: sharerProfile?.grammatical_gender ?? null,
      summary: null, summaryThirdPerson: null, summaryChips: [],
      insights: [], sections: {}, modes: null, styleRadar: null, entities: null,
      donutData: [], donutCenterLabel: "",
      temperamentAxes: null, lifestyleAxes: null,
      facts: {}, art9Filled: false,
      discoveryAvailable: false,
    };
    return (
      <V4Shell active="people">
        <ProfileSheet view="aveugle" data={blindData} />
      </V4Shell>
    );
  }

  // ── Mode invite_filtre : intersection matrice ∩ scope ────────────────────
  const sharedSections = sanitizeScope(scope);

  const { data: analysisRaw } = await admin
    .from("profile_analysis")
    .select(ANALYSIS_ROW_SELECT)
    .eq("user_id", consent.pilote_id)
    .is("contact_id", null)
    .maybeSingle();
  const analysis = analysisRaw as unknown as AnalysisRow | null;

  const fullData = buildProfileSheetData({
    profile: sharerProfile,
    analysis,
    firstName,
    discoveryAvailable: false,
  });
  const data = stripSheetDataForView(
    { ...fullData, knowledgeLabel: "Fiche partagée avec toi" },
    "invite_filtre",
    sharedSections,
  );

  return (
    <V4Shell active="people">
      <ProfileSheet view="invite_filtre" data={data} sharedSections={sharedSections} />
    </V4Shell>
  );
}
