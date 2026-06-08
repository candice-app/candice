import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import CompteActions from "./CompteActions";

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/parametres" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Paramètres</span>
          </Link>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 28,
            color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.2,
            marginTop: 16, marginBottom: 4,
          } as React.CSSProperties}>
            Mon compte
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Email — lecture seule */}
          <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 4 }}>
              Adresse e-mail
            </p>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>
              {user.email}
            </p>
          </div>

          <CompteActions />
        </div>
      </div>
    </DashboardShell>
  );
}
