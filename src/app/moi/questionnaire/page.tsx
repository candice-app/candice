import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import QuestionnaireFlow from "./QuestionnaireFlow";
import { MyProfile } from "@/types";

export default async function MoiQuestionnairePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("my_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = existing as MyProfile | null;

  return (
    <DashboardShell noNav>
      <Suspense>
        <QuestionnaireFlow userId={user.id} initial={profile} />
      </Suspense>
    </DashboardShell>
  );
}
