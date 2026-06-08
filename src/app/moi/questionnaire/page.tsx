import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import DashboardShell from "@/components/layout/DashboardShell";
import QuestionnaireFlow from "./QuestionnaireFlow";
import { MyProfile } from "@/types";

export default async function MoiQuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const inviteToken = typeof params.invite_token === "string" ? params.invite_token : null;

  let piloteFirstName: string | null = null;
  if (inviteToken) {
    const admin = createAdminClient();
    const { data: invite } = await admin
      .from("invite_links")
      .select("pilote_name")
      .eq("token", inviteToken)
      .maybeSingle();
    piloteFirstName = invite?.pilote_name?.split(" ")[0] ?? null;
  }

  const { data: existing } = await supabase
    .from("my_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = existing as MyProfile | null;

  return (
    <DashboardShell noNav>
      <Suspense>
        <QuestionnaireFlow
          userId={user.id}
          initial={profile}
          piloteFirstName={piloteFirstName ?? undefined}
        />
      </Suspense>
    </DashboardShell>
  );
}
