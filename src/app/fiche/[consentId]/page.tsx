// Phase D — X consulte la fiche que Y a partagée : rendu ProfileV2
// (invite_filtre / aveugle), matrice V2, intersection matrice ∩ scope.
// Les données non partagées sont vidées côté serveur (stripProfileV2Data)
// et les textes convertis à la 3e personne AVANT de quitter le serveur.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import V4Shell from "@/components/layout/V4Shell";
import ProfileV2 from "@/components/profile/v2/ProfileV2";
import {
  isQuestionnaireComplete,
  PROFILE_ROW_SELECT,
  type ProfileRow,
} from "@/lib/profile/sheet-data";
import { buildProfileV2Data, ANALYSIS_ROW_V2_SELECT, type AnalysisRowV2 } from "@/lib/profile/v2-data";
import { stripProfileV2Data, thirdPersonV2 } from "@/lib/profile/v2-tiers";
import { getSignedAvatarUrl } from "@/lib/profile/avatar-url";
import { sanitizeScope, SCOPE_BLIND } from "@/lib/profile/share-sections";
import type { WishlistItemV1 } from "@/app/moi/wishlist/WishlistClient";

export default async function FichePartageePage({
  params,
}: {
  params: Promise<{ consentId: string }>;
}) {
  const { consentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/fiche/${consentId}`);

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

  // Identité minimale du partageur + questionnaire du lecteur (garde)
  const admin = createAdminClient();
  const [{ data: { user: sharer } }, { data: sharerProfileRaw }, { data: viewerProfileRaw }] = await Promise.all([
    admin.auth.admin.getUserById(consent.pilote_id),
    admin.from("my_profile").select(`${PROFILE_ROW_SELECT}, avatar_path`).eq("user_id", consent.pilote_id).maybeSingle(),
    supabase.from("my_profile").select(PROFILE_ROW_SELECT).eq("user_id", user.id).maybeSingle(),
  ]);
  const sharerProfile = sharerProfileRaw as unknown as (ProfileRow & { avatar_path?: string | null }) | null;
  const firstName =
    sharerProfile?.practical_info?.prenom?.trim()
    || (sharer?.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    || "Cette personne";

  // Garde participation : le lecteur remplit SON questionnaire (5/5) d'abord
  if (!isQuestionnaireComplete(viewerProfileRaw as unknown as ProfileRow | null)) {
    return (
      <V4Shell active="people">
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--ink)", lineHeight: 1.4, marginBottom: 10 }}>
            {firstName} partage sa fiche avec toi.
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 20 }}>
            Remplis d&apos;abord ton questionnaire pour la découvrir — c&apos;est ce qui
            permet à Candice d&apos;être utile dans les deux sens.
          </p>
          <Link href="/moi/questionnaire" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minHeight: 44, padding: "0 18px", background: "var(--pine)", color: "#fff",
            borderRadius: 999, fontSize: 13.5, fontWeight: 600, textDecoration: "none",
          }}>
            Remplir mon questionnaire →
          </Link>
        </div>
      </V4Shell>
    );
  }

  const scope = (consent.scope ?? []) as string[];
  const isBlind = scope.includes(SCOPE_BLIND);
  const sharedSections = sanitizeScope(scope);

  // ── Mode aveugle : AUCUNE donnée de fiche ne quitte le serveur ────────────
  if (isBlind || !sharerProfile) {
    const blindData = {
      firstName,
      gender: sharerProfile?.grammatical_gender ?? null,
      avatarUrl: null, knowState: 1 as const, knowRatio: 0,
      summary: null, summaryChips: [], summaryLong: null,
      podiumIntro: null, podium: [], insights: [],
      understoodCards: [], sections: {},
      worksLevels: null, worksPhrases: {},
      territory: null, universe: null, brandsCategorized: [],
      facts: {}, mobiliteDetail: null, datesTotal: 0, datesACompleter: 0,
      art9Filled: false, art9Edit: { religion: "", disability: "", health_comfort: "" },
      practicalEdit: { adresse_livraison: "", taille_vetements: "", taille_chaussures: "", regime: "", alcool: "", allergies: [], allergies_detail: "", dates_importantes: [] },
      nudges: [],
    };
    return (
      <V4Shell active="people">
        <ProfileV2 data={blindData} view="aveugle" />
      </V4Shell>
    );
  }

  // ── invite_filtre : données + wishlist si partagée ────────────────────────
  const wishlistShared = sharedSections.includes("wishlist");
  const [{ data: analysisRaw }, avatarUrl, wishlistRaw] = await Promise.all([
    admin.from("profile_analysis").select(ANALYSIS_ROW_V2_SELECT)
      .eq("user_id", consent.pilote_id).is("contact_id", null).maybeSingle(),
    getSignedAvatarUrl(sharerProfile.avatar_path),
    wishlistShared
      ? admin.from("my_wishlist_items").select("id, title, url, note, created_at")
          .eq("user_id", consent.pilote_id).order("created_at", { ascending: false })
          .then(r => r.data)
      : Promise.resolve(null),
  ]);

  const full = buildProfileV2Data({
    profile: sharerProfile,
    analysis: analysisRaw as unknown as AnalysisRowV2 | null,
    firstName,
    nudges: [],
    hasAvailableQuestions: false,
    avatarUrl,
  });
  const data = thirdPersonV2(stripProfileV2Data(full, "invite_filtre", sharedSections));

  return (
    <V4Shell active="people">
      <ProfileV2
        data={data}
        view="invite_filtre"
        sharedSections={sharedSections}
        wishlistItems={(wishlistRaw ?? []) as WishlistItemV1[]}
      />
    </V4Shell>
  );
}
