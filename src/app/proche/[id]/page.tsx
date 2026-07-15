// Espace Proche V2 — coquille 3 onglets (Phase 2). Expérience plein écran avec sa
// propre nav (pas de V4Shell/DashboardShell). Contenus des onglets = placeholders.

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAuthClaims } from "@/utils/supabase/claims";
import EspaceProcheShell from "./EspaceProcheShell";

export default async function EspaceProchePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const claims = await getAuthClaims(supabase);
  if (!claims) redirect(`/login?next=/proche/${id}`);
  const userId = claims.sub as string;

  const [{ data: contact }, { data: profile }] = await Promise.all([
    supabase.from("contacts").select("id, name").eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("my_profile").select("practical_info").eq("user_id", userId).maybeSingle(),
  ]);
  if (!contact) notFound();

  const procheFirstName = (contact.name as string).split(" ")[0];
  const piloteFirstName =
    (profile?.practical_info as { prenom?: string } | null)?.prenom?.trim()
    || (claims.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    || "Toi";

  return (
    <EspaceProcheShell
      contactId={id}
      procheFirstName={procheFirstName}
      piloteFirstName={piloteFirstName}
    />
  );
}
