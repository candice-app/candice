import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import ResultatsClient from "./ResultatsClient";
import type { FaceResult } from "@/lib/attention/scoring";
import type { RelationalFilters } from "@/lib/lifestyle/scoring";

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

export default async function ResultatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  type ProfileRow = {
    attention_reception: unknown;
    attention_expression: unknown;
    attention_breath_text: string | null;
    temperament_axes: unknown;
    temperament_modes: unknown;
    lifestyle_axes: unknown;
    relational_filters: unknown;
    practical_info: unknown;
    singularity_answers: unknown;
    updated_at: string;
  };

  const [{ data }, { data: analysisRow }] = await Promise.all([
    supabase
      .from("my_profile")
      .select("attention_reception, attention_expression, attention_breath_text, temperament_axes, temperament_modes, lifestyle_axes, relational_filters, practical_info, singularity_answers, updated_at")
      .eq("user_id", user.id)
      .maybeSingle() as unknown as Promise<{ data: ProfileRow | null; error: unknown }>,
    supabase
      .from("profile_analysis")
      .select("summary, summary_chips, sections")
      .eq("user_id", user.id)
      .is("contact_id", null)
      .maybeSingle(),
  ]);

  const hasAttentionData = !!(data?.attention_reception && data?.attention_expression);
  if (!hasAttentionData) return <EmptyState />;

  const isComplete = !!(
    data?.attention_reception &&
    data?.temperament_axes &&
    data?.lifestyle_axes &&
    data?.practical_info
  );

  const profileAnalysis = analysisRow?.summary
    ? {
        summary: analysisRow.summary as string,
        summary_chips: (analysisRow.summary_chips as string[] | null) ?? null,
        sections: (analysisRow.sections as Record<string, { text?: string; chips?: string[] }> | null) ?? null,
      }
    : null;

  return (
    <ResultatsClient
      userId={user.id}
      reception={data!.attention_reception as FaceResult}
      expression={data!.attention_expression as FaceResult}
      breathText={(data?.attention_breath_text as string | null) ?? null}
      temperamentAxes={(data?.temperament_axes as Record<string, { score: number; intensity: number }> | null) ?? null}
      temperamentModes={(data?.temperament_modes as Record<string, { label: string; intensity: number } | null> | null) ?? null}
      lifestyleAxes={(data?.lifestyle_axes as Record<string, { score: number; intensity: number }> | null) ?? null}
      relationalFilters={(data?.relational_filters as RelationalFilters | null) ?? null}
      practicalInfo={(data?.practical_info as { vetos?: { no_alcohol?: boolean; halal?: boolean; casher?: boolean; mobility_constraints?: boolean; allergies?: string[] } } | null) ?? null}
      singularity={(data?.singularity_answers as Record<string, string> | null) ?? null}
      profileAnalysis={profileAnalysis}
      needsAnalysis={!profileAnalysis}
      isComplete={isComplete}
    />
  );
}
