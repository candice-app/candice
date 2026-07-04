// B.2 Phase 6 — Sens 1 : chercher quelqu'un (exact : @identifiant ou email)
// et demander à voir sa fiche. Participation obligatoire : compte +
// questionnaire rempli (5/5). On ne trouve que quelqu'un qui nous a donné
// son identifiant — pas de nom, pas de recherche floue.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import V4Shell from "@/components/layout/V4Shell";
import RechercheClient from "./RechercheClient";
import {
  isQuestionnaireComplete,
  PROFILE_ROW_SELECT,
  type ProfileRow,
} from "@/lib/profile/sheet-data";
import { SCOPE_BLIND } from "@/lib/profile/share-sections";

interface ConsentRow {
  id: string;
  pilote_id: string;
  status: string;
  scope: string[] | null;
  requested_at: string;
}

export default async function RecherchePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("my_profile")
    .select(PROFILE_ROW_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();
  const questionnaireComplete = isQuestionnaireComplete(profileRaw as unknown as ProfileRow | null);

  // Mes demandes envoyées (pending) + fiches partagées avec moi (active)
  const { data: consentsRaw } = await supabase
    .from("contact_consents")
    .select("id, pilote_id, status, scope, requested_at")
    .eq("kind", "profile_view")
    .eq("proche_user_id", user.id)
    .in("status", ["pending", "active"])
    .order("requested_at", { ascending: false });

  const consents = (consentsRaw ?? []) as ConsentRow[];
  const pending = consents.filter(c => c.status === "pending");
  const active = consents.filter(c => c.status === "active");

  // Prénom des partageurs ACTIFS uniquement (ils ont accepté — jamais pour un pending)
  const admin = createAdminClient();
  const activeWithNames = await Promise.all(active.map(async c => {
    const { data: { user: sharer } } = await admin.auth.admin.getUserById(c.pilote_id);
    const firstName = (sharer?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Quelqu'un";
    return {
      consentId: c.id,
      firstName,
      blind: (c.scope ?? []).includes(SCOPE_BLIND),
    };
  }));

  return (
    <V4Shell active="people">
      <div style={{ padding: "16px 20px 120px" }}>
        <h1 style={{
          fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 28,
          color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.2,
          margin: "12px 0 6px",
        } as React.CSSProperties}>
          Trouver quelqu&apos;un
        </h1>
        <p style={{ fontSize: 13.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 20 }}>
          Saisis l&apos;identifiant exact ou l&apos;email exact que la personne t&apos;a donné.
          Rien n&apos;est visible sans son accord explicite.
        </p>

        {questionnaireComplete ? (
          <RechercheClient />
        ) : (
          <div style={{
            background: "#fff", border: "1px solid rgba(23,62,49,.11)", borderRadius: 16,
            padding: "18px 16px", boxShadow: "0 10px 30px rgba(23,62,49,.07)",
          }}>
            <p style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500, marginBottom: 6 }}>
              Ta fiche d&apos;abord.
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 14 }}>
              Pour chercher quelqu&apos;un ou partager ta fiche, termine d&apos;abord ton questionnaire —
              c&apos;est ce qui permet à Candice d&apos;être utile des deux côtés.
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

        {/* Fiches partagées avec moi */}
        {activeWithNames.length > 0 && (
          <>
            <SectionLabel>Partagées avec toi</SectionLabel>
            {activeWithNames.map(f => (
              <Link key={f.consentId} href={`/fiche/${f.consentId}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#fff", border: "1px solid rgba(23,62,49,.11)", borderRadius: 14,
                padding: "14px 16px", marginBottom: 9, textDecoration: "none",
                boxShadow: "0 10px 30px rgba(23,62,49,.07)", minHeight: 44,
              }}>
                <span style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink)" }}>
                  {f.firstName}
                  {f.blind && (
                    <span style={{ fontSize: 11.5, fontWeight: 400, color: "var(--ink-3)", marginLeft: 8 }}>
                      fiche protégée
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pine)" }}>Voir →</span>
              </Link>
            ))}
          </>
        )}

        {/* Demandes en attente */}
        {pending.length > 0 && (
          <>
            <SectionLabel>Demandes envoyées</SectionLabel>
            {pending.map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                border: "1px dashed rgba(23,62,49,.2)", borderRadius: 14,
                padding: "13px 16px", marginBottom: 9,
              }}>
                <span style={{ fontSize: 13.5, fontWeight: 300, color: "var(--ink-2)" }}>
                  En attente de réponse
                </span>
                <span style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)" }}>
                  {new Date(p.requested_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
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
