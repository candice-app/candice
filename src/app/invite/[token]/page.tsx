import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import LandingInvite from "./LandingInvite";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invite_links")
    .select("pilote_name, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) notFound();
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) notFound();

  const piloteFirstName = invite.pilote_name?.split(" ")[0] ?? "Quelqu'un";

  return <LandingInvite token={token} piloteFirstName={piloteFirstName} />;
}
