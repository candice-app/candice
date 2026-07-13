import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAuthClaims } from "@/utils/supabase/claims";
import DashboardShell from "@/components/layout/DashboardShell";
import DiscoveryFlow from "./DiscoveryFlow";
import { getNextMicroQuestion, type ProfileAnalysisSnapshot } from "@/lib/discovery/engine";

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; section?: string }>;
}) {
  const supabase = await createClient();
  // Levier 2 : auth vérifiée en LOCAL (getClaims) — pas d'aller-retour réseau.
  const claims = await getAuthClaims(supabase);
  if (!claims) redirect("/login");
  const userId = claims.sub as string;

  const { mode: rawMode, section: sectionKey } = await searchParams;
  const mode = rawMode === "full" ? "full" : "quick";

  // Fetch analysis snapshot for trigger evaluation
  const { data: analysisRow } = await supabase
    .from("profile_analysis")
    .select("sections")
    .eq("user_id", userId)
    .is("contact_id", null)
    .maybeSingle();

  const analysis: ProfileAnalysisSnapshot | null = analysisRow?.sections
    ? { sections: analysisRow.sections as Record<string, { text?: string; chips?: string[] }> }
    : null;

  const initial = await getNextMicroQuestion(
    userId,
    supabase,
    analysis,
    mode,
    sectionKey ?? undefined,
  );

  return (
    <DashboardShell>
      <div className="content-col" data-page-ready="discovery">
        {/* C4 : une section ciblée (nudge, CTA) ouvre DIRECTEMENT sa question */}
        <DiscoveryFlow initial={initial} mode={mode} skipIntro={!!sectionKey} />
      </div>
    </DashboardShell>
  );
}
