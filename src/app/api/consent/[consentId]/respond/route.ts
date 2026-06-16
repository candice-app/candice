// PATCH /api/consent/[consentId]/respond
// Deux cas d'usage :
//   B (proche) répond :  body { action: 'accept' | 'reject' }
//   A (pilote) révoque : body { action: 'revoke' }
// La route vérifie l'identité du caller avant toute modification.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Action = "accept" | "reject" | "revoke";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ consentId: string }> }
) {
  const { consentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json() as { action: Action };
  if (!["accept", "reject", "revoke"].includes(action)) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  // Charger le consent — la RLS garantit que seul A ou B peut lire ce row
  const { data: consent } = await supabase
    .from("contact_consents")
    .select("id, pilote_id, proche_user_id, status")
    .eq("id", consentId)
    .maybeSingle();

  if (!consent) return NextResponse.json({ error: "Consentement introuvable" }, { status: 404 });

  const isA = consent.pilote_id      === user.id;
  const isB = consent.proche_user_id === user.id;

  // Permissions : A ne peut que révoquer ; B ne peut qu'accepter ou refuser
  if (action === "revoke"          && !isA) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if ((action === "accept" || action === "reject") && !isB) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Vérifications d'état cohérentes
  if (action === "accept" && consent.status !== "pending") {
    return NextResponse.json({ error: "Ce consentement ne peut plus être accepté" }, { status: 409 });
  }
  if (action === "reject" && consent.status !== "pending") {
    return NextResponse.json({ error: "Ce consentement ne peut plus être refusé" }, { status: 409 });
  }
  if (action === "revoke" && consent.status !== "active") {
    return NextResponse.json({ error: "Seul un consent actif peut être révoqué" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, string> = { responded_at: now };

  if (action === "accept") {
    updates.status       = "active";
    updates.consented_at = now;
  } else if (action === "reject") {
    updates.status = "rejected";
  } else {
    updates.status = "revoked";
  }

  const { error } = await supabase
    .from("contact_consents")
    .update(updates)
    .eq("id", consentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
