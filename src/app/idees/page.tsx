import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import V4Shell from "@/components/layout/V4Shell";

export default async function IdeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <V4Shell active="cal">
      <div style={{ padding: "12px 20px 120px", fontFamily: "var(--font-sans)" }}>
        <h2 style={{
          fontFamily: "var(--font-serif)", fontSize: 26, margin: "6px 0 12px",
          color: "var(--ink)", letterSpacing: "-.012em",
        }}>
          Agenda
        </h2>
        <div style={{ textAlign: "center", padding: "48px 0 24px" }}>
          <p style={{ fontSize: 15, color: "var(--ink2)", lineHeight: 1.7, maxWidth: 300, margin: "0 auto" }}>
            Des inspirations personnalisées par occasion, saison et profil. Bientôt disponible.
          </p>
        </div>
      </div>
    </V4Shell>
  );
}
