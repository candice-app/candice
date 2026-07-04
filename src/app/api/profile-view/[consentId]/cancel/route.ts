// POST /api/profile-view/[consentId]/cancel — X annule SA demande en attente.
// DELETE via client utilisateur (policy viewer_cancel_own_pending_request,
// migration 50) : uniquement sa propre demande, uniquement 'pending'.

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
    .delete()
    .eq("id", consentId)
    .eq("kind", "profile_view")
    .eq("requested_by", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
