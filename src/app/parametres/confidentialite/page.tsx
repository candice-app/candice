import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import ConfidentialiteActions from "./ConfidentialiteActions";

export default async function ConfidentialitePage() {
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
            Confidentialité
          </h1>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6 }}>
            Tes données t&apos;appartiennent.
          </p>
        </div>

        <ConfidentialiteActions />
      </div>
    </DashboardShell>
  );
}
