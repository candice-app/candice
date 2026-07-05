// POST /api/share-link/create — Sens 2 : Y génère un lien de partage sortant.
//
// Le choix se fait AVANT l'envoi : all (toute ma fiche) · sections (cases
// cochées, socle toujours inclus) · blind (aveugle). Le scope est figé dans
// le lien (snapshot, comme en Phase 6). Participation : questionnaire 5/5.

import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { APP_URL } from "@/lib/resend";
import { scopeForSelection, type ShareMode } from "@/lib/profile/share-sections";
import { hashShareToken } from "@/lib/share-links";
import { isQuestionnaireComplete, PROFILE_ROW_SELECT, type ProfileRow } from "@/lib/profile/sheet-data";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: myProfile } = await supabase
    .from("my_profile")
    .select(PROFILE_ROW_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!isQuestionnaireComplete(myProfile as unknown as ProfileRow | null)) {
    return NextResponse.json({ error: "questionnaire_incomplete" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { mode?: ShareMode; sections?: string[] };
  const mode = body.mode;
  if (!mode || !["all", "sections", "blind"].includes(mode)) {
    return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
  }

  // Source unique du scope (harmonisation Estelle) : zéro case cochée
  // → ['socle'], le CHECK scope ≥ 1 reste satisfait.
  const scope = scopeForSelection(mode, body.sections);

  // Le token brut n'existe qu'ici et dans l'URL retournée — seule son
  // empreinte SHA-256 est stockée (expiration : 30 jours, DEFAULT en base).
  const token = randomBytes(24).toString("base64url");

  // Insert via client utilisateur → RLS owner_manage_share_links
  const { error } = await supabase
    .from("profile_share_links")
    .insert({ owner_id: user.id, token_hash: hashShareToken(token), scope });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: `${APP_URL}/rejoindre/${token}` });
}
