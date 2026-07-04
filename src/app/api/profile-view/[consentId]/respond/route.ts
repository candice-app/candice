// POST /api/profile-view/[consentId]/respond — Y répond à « X veut voir ton profil ».
//
// Actions : all (toute la fiche) · sections (cases cochées) · blind (aveugle) · reject.
// Le scope stocké est TOUJOURS assaini : intersection avec les sections
// cochables de la matrice (jamais d'élargissement possible).
// L'update passe par le client UTILISATEUR (policy pilote_manage_consents).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkableSections } from "@/lib/profile/visibility";
import { sanitizeScope, SCOPE_BLIND } from "@/lib/profile/share-sections";

type Action = "all" | "sections" | "blind" | "reject";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ consentId: string }> },
) {
  const { consentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { action?: Action; sections?: string[] };
  const action = body.action;
  if (!action || !["all", "sections", "blind", "reject"].includes(action)) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  // La demande doit me concerner (je suis le partageur) et être en attente
  const { data: consent } = await supabase
    .from("contact_consents")
    .select("id, status, kind, pilote_id")
    .eq("id", consentId)
    .eq("kind", "profile_view")
    .eq("pilote_id", user.id)
    .maybeSingle();

  if (!consent) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (consent.status !== "pending") {
    return NextResponse.json({ error: "Cette demande a déjà reçu une réponse" }, { status: 409 });
  }

  const now = new Date().toISOString();
  let update: Record<string, unknown>;

  switch (action) {
    case "all":
      update = { status: "active", scope: checkableSections("invite_filtre"), responded_at: now, consented_at: now };
      break;
    case "sections":
      update = { status: "active", scope: sanitizeScope(body.sections), responded_at: now, consented_at: now };
      break;
    case "blind":
      update = { status: "active", scope: [SCOPE_BLIND], responded_at: now, consented_at: now };
      break;
    case "reject":
      update = { status: "rejected", responded_at: now };
      break;
  }

  const { error } = await supabase
    .from("contact_consents")
    .update(update)
    .eq("id", consentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
