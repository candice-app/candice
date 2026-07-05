// B.2 Phase 7 — Sens 2 : partager MA fiche (lien sortant) + gestion.
// Choix AVANT envoi : toute ma fiche · sections choisies (socle inclus,
// non décochable) · aveugle. Puis gestion : partages accordés (révoquer),
// liens en attente (annuler), demandes reçues (répondre).

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import V4Shell from "@/components/layout/V4Shell";
import PartageClient from "./PartageClient";
import { RevokeShareButton, RevokeLinkButton } from "./ManageActions";
import {
  isQuestionnaireComplete,
  PROFILE_ROW_SELECT,
  type ProfileRow,
} from "@/lib/profile/sheet-data";
import { SCOPE_BLIND } from "@/lib/profile/share-sections";

export default async function PartagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/moi/partage");

  const { data: profileRaw } = await supabase
    .from("my_profile")
    .select(PROFILE_ROW_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();
  const questionnaireComplete = isQuestionnaireComplete(profileRaw as unknown as ProfileRow | null);

  // Partages accordés + demandes reçues (je suis le partageur)
  const { data: consentsRaw } = await supabase
    .from("contact_consents")
    .select("id, proche_user_id, requested_by, status, scope, consented_at, requested_at")
    .eq("kind", "profile_view")
    .eq("pilote_id", user.id)
    .in("status", ["pending", "active"])
    .order("requested_at", { ascending: false });

  const consents = (consentsRaw ?? []) as Array<{
    id: string; proche_user_id: string | null; requested_by: string | null;
    status: string; scope: string[] | null; consented_at: string | null; requested_at: string;
  }>;

  const admin = createAdminClient();
  const firstNameOf = async (userId: string | null): Promise<string> => {
    if (!userId) return "Quelqu'un";
    const { data: { user: u } } = await admin.auth.admin.getUserById(userId);
    return (u?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Quelqu'un";
  };

  const activeShares = await Promise.all(
    consents.filter(c => c.status === "active").map(async c => ({
      id: c.id,
      firstName: await firstNameOf(c.proche_user_id),
      blind: (c.scope ?? []).includes(SCOPE_BLIND),
    })),
  );
  const pendingRequests = await Promise.all(
    consents.filter(c => c.status === "pending").map(async c => ({
      id: c.id,
      firstName: await firstNameOf(c.requested_by),
    })),
  );

  // Liens générés, pas encore réclamés ni annulés
  const { data: linksRaw } = await supabase
    .from("profile_share_links")
    .select("id, scope, created_at")
    .eq("owner_id", user.id)
    .is("claimed_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  const openLinks = (linksRaw ?? []) as Array<{ id: string; scope: string[] | null; created_at: string }>;

  return (
    <V4Shell active="profile">
      <div style={{ padding: "16px 20px 120px" }}>
        <Link href="/moi" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Ma fiche</span>
        </Link>
        <h1 style={{
          fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 28,
          color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.2,
          margin: "14px 0 6px",
        } as React.CSSProperties}>
          Partager ma fiche.
        </h1>
        <p style={{ fontSize: 13.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 20 }}>
          Tu choisis ce qui est visible AVANT d&apos;envoyer le lien — et tu peux
          tout retirer à tout moment.
        </p>

        {questionnaireComplete ? (
          <PartageClient />
        ) : (
          <div style={{
            background: "#fff", border: "1px solid rgba(23,62,49,.11)", borderRadius: 16,
            padding: "18px 16px", boxShadow: "0 10px 30px rgba(23,62,49,.07)",
          }}>
            <p style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500, marginBottom: 6 }}>
              Ta fiche d&apos;abord.
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 14 }}>
              Pour partager ta fiche, termine d&apos;abord ton questionnaire —
              c&apos;est elle que tes proches découvriront.
            </p>
            <Link href="/moi/questionnaire" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minHeight: 44, padding: "0 18px", background: "var(--pine)", color: "#fff",
              borderRadius: 999, fontSize: 13.5, fontWeight: 600, textDecoration: "none",
            }}>
              Reprendre mon questionnaire →
            </Link>
          </div>
        )}

        {/* Demandes reçues */}
        {pendingRequests.length > 0 && (
          <>
            <SectionLabel>Demandes reçues</SectionLabel>
            {pendingRequests.map(r => (
              <Link key={r.id} href={`/moi/partage/demandes/${r.id}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                background: "#fff", border: "1px solid rgba(23,62,49,.11)", borderLeft: "3px solid var(--pine)",
                borderRadius: 13, padding: "14px 16px", marginBottom: 9, textDecoration: "none", minHeight: 44,
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                  {r.firstName} veut voir ton profil.
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pine)", whiteSpace: "nowrap" }}>
                  Répondre →
                </span>
              </Link>
            ))}
          </>
        )}

        {/* Partages accordés */}
        {activeShares.length > 0 && (
          <>
            <SectionLabel>Partages en cours</SectionLabel>
            {activeShares.map(s => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                background: "#fff", border: "1px solid rgba(23,62,49,.11)", borderRadius: 14,
                padding: "12px 16px", marginBottom: 9, boxShadow: "0 10px 30px rgba(23,62,49,.07)",
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                  {s.firstName}
                  <span style={{ fontSize: 11.5, fontWeight: 400, color: "var(--ink-3)", marginLeft: 8 }}>
                    {s.blind ? "aveugle" : "sections choisies"}
                  </span>
                </span>
                <RevokeShareButton consentId={s.id} firstName={s.firstName} />
              </div>
            ))}
          </>
        )}

        {/* Liens en attente */}
        {openLinks.length > 0 && (
          <>
            <SectionLabel>Liens envoyés, pas encore utilisés</SectionLabel>
            {openLinks.map(l => (
              <div key={l.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                border: "1px dashed rgba(23,62,49,.2)", borderRadius: 14,
                padding: "12px 16px", marginBottom: 9,
              }}>
                <span style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-2)" }}>
                  {(l.scope ?? []).includes(SCOPE_BLIND) ? "Aveugle" : "Sections choisies"}
                  {" · "}
                  {new Date(l.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
                <RevokeLinkButton linkId={l.id} />
              </div>
            ))}
          </>
        )}
      </div>
    </V4Shell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, margin: "26px 0 12px",
      fontSize: 11.5, letterSpacing: 1.8, textTransform: "uppercase",
      color: "var(--ink-3)", fontWeight: 700,
    }}>
      <span style={{ flex: 1, height: 1, background: "rgba(23,62,49,.06)" }} />
      {children}
      <span style={{ flex: 1, height: 1, background: "rgba(23,62,49,.06)" }} />
    </div>
  );
}
