import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import DiscoveryFlow from "./DiscoveryFlow";
import { getNextMicroQuestion, type ProfileAnalysisSnapshot } from "@/lib/discovery/engine";

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; section?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { mode: rawMode, section: sectionKey } = await searchParams;
  const mode = rawMode === "full" ? "full" : "quick";

  // Fetch analysis snapshot for trigger evaluation
  const { data: analysisRow } = await supabase
    .from("profile_analysis")
    .select("sections")
    .eq("user_id", user.id)
    .is("contact_id", null)
    .maybeSingle();

  const analysis: ProfileAnalysisSnapshot | null = analysisRow?.sections
    ? { sections: analysisRow.sections as Record<string, { text?: string; chips?: string[] }> }
    : null;

  const initial = await getNextMicroQuestion(
    user.id,
    supabase,
    analysis,
    mode,
    sectionKey ?? undefined,
  );

  return (
    <DashboardShell>
      <div className="content-col">
        {/* C4 : une section ciblée (nudge, CTA) ouvre DIRECTEMENT sa question */}
        <DiscoveryFlow initial={initial} mode={mode} skipIntro={!!sectionKey} />
      </div>
    </DashboardShell>
  );
}
