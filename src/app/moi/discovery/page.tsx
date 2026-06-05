import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import DiscoveryFlow from "./DiscoveryFlow";
import { getNextDripQuestion, createOrResumeSession } from "@/lib/discovery/engine";

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { mode: rawMode } = await searchParams;
  const mode = rawMode === "full" ? "full" : "quick";

  const initial = mode === "full"
    ? await createOrResumeSession(user.id, supabase)
    : await getNextDripQuestion(user.id, supabase);

  return (
    <DashboardShell>
      <div className="content-col">
        <DiscoveryFlow initial={initial} mode={mode} />
      </div>
    </DashboardShell>
  );
}
