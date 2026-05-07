import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function IdeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell>
      <div style={{ textAlign: "center", padding: "64px 24px" }}>
        <h1 className="page-title" style={{ marginBottom: 8 }}>Idées à venir</h1>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", maxWidth: 280, margin: "0 auto" }}>
          Des inspirations personnalisées par occasion, saison et profil. Bientôt disponible.
        </p>
      </div>
    </DashboardShell>
  );
}
