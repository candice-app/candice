import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function ProfilsPartagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/parametres" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Paramètres</span>
          </Link>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 28,
            color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.2,
            marginTop: 16, marginBottom: 4,
          } as React.CSSProperties}>
            Profils partagés
          </h1>
        </div>

        <div style={{
          padding: "32px 24px",
          borderRadius: 14,
          border: "0.5px solid var(--line)",
          background: "rgba(253,253,251,.5)",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 20,
            color: "var(--ink)", letterSpacing: "-.014em", lineHeight: 1.4,
            marginBottom: 10,
          } as React.CSSProperties}>
            Bientôt.
          </p>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}>
            Tu pourras gérer ici les fiches que tu partages et les accès que tu as donnés.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
