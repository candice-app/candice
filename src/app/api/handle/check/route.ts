// POST /api/handle/check — disponibilité d'un @identifiant.
//
// Appelé AVANT la création de compte (pas de session requise).
// Ne retourne que { available: boolean } — aucune information sur le
// détenteur éventuel. Risque d'énumération accepté (même contrat que les
// lookups migration 38) : un identifiant est semi-public par nature.
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { normalizeHandle, handleFormatError } from "@/lib/handle";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { handle?: string };
  const handle = normalizeHandle(body.handle ?? "");

  const formatError = handleFormatError(handle);
  if (formatError) {
    return NextResponse.json({ available: false, error: formatError });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("my_profile")
    .select("user_id")
    .eq("handle", handle)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
