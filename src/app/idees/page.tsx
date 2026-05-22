import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function IdeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: 28 }}>
        <div style={{ padding: "0 4px", marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: 35,
            color: "var(--ink)",
            letterSpacing: "-.022em",
            lineHeight: 1,
          } as React.CSSProperties}>
            Idées
          </h1>
        </div>
        <div style={{ textAlign: "center", padding: "48px 0 24px" }}>
          <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7, maxWidth: 300, margin: "0 auto" }}>
            Des inspirations personnalisées par occasion, saison et profil. Bientôt disponible.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
