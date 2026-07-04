// POST /api/profile-view/[consentId]/revoke — Y retire un partage accordé.
// Update via client utilisateur (RLS pilote_manage_consents) : dès le
// passage à 'revoked', la policy de lecture de l'analyse se referme et
// /fiche/[consentId] affiche « Ce partage a été retiré ».

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ consentId: string }> },
) {
  const { consentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("contact_consents")
    .update({ status: "revoked" })
    .eq("id", consentId)
    .eq("kind", "profile_view")
    .eq("pilote_id", user.id)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Partage introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
