// POST /api/share-link/claim — le destinataire connecté réclame un lien.
// Utilisé par le flux d'inscription (register?share_token=...). Le visiteur
// déjà connecté passe par /rejoindre/[token] (claim serveur direct).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { claimShareLink } from "@/lib/share-links";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { token?: string };
  const result = await claimShareLink(body.token ?? "", user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === "self" ? 400 : 404 });
  }
  return NextResponse.json({ consentId: result.consentId });
}
