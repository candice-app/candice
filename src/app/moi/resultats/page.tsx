import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import ResultatsClient from "./ResultatsClient";
import type { FaceResult } from "@/lib/attention/scoring";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttentionProfile = {
  attention_reception: FaceResult | null;
  attention_expression: FaceResult | null;
  attention_breath_text: string | null;
};

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: 28 }}>
        <div style={{ padding: "0 4px", marginBottom: 4 }}>
          <Link href="/moi" style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", textDecoration: "none" }}>
            ← Ma fiche
          </Link>
        </div>
        <div style={{ padding: "64px 0 24px", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: 22,
            color: "var(--ink)",
            letterSpacing: "-.016em",
            lineHeight: 1.4,
            marginBottom: 16,
          } as React.CSSProperties}>
            Candice n&apos;a pas encore eu le temps de te connaître sous cet angle.
          </p>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.7, maxWidth: 300, margin: "0 auto 32px" }}>
            Réponds à quelques questions — quelques minutes suffisent pour que Candice comprenne comment tu aimes donner et recevoir de l&apos;attention.
          </p>
          <Link href="/moi/questionnaire">
            <button className="btn-primary">Commencer le questionnaire →</button>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("my_profile")
    .select("attention_reception, attention_expression, attention_breath_text")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = data as AttentionProfile | null;

  const hasAttentionData = !!(
    profile?.attention_reception &&
    profile?.attention_expression
  );

  if (!hasAttentionData) {
    return <EmptyState />;
  }

  return (
    <ResultatsClient
      userId={user.id}
      reception={profile!.attention_reception!}
      expression={profile!.attention_expression!}
      breathText={profile!.attention_breath_text}
    />
  );
}
