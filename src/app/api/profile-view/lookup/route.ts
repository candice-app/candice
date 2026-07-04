// POST /api/profile-view/lookup — Sens 1 : chercher quelqu'un pour demander sa fiche.
//
// Recherche EXACTE uniquement : @identifiant OU email. Pas de nom, pas de flou.
// Même hygiène RGPD que /api/contacts/lookup : POST-only, session requise,
// retour = UUID + état de la relation existante, aucun PII du trouvé.
// Participation : le chercheur doit avoir compte + questionnaire rempli (5/5).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { normalizeHandle, HANDLE_RE } from "@/lib/handle";
import { isQuestionnaireComplete, PROFILE_ROW_SELECT, type ProfileRow } from "@/lib/profile/sheet-data";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Garde participation : questionnaire rempli obligatoire pour chercher
  const { data: myProfile } = await supabase
    .from("my_profile")
    .select(PROFILE_ROW_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!isQuestionnaireComplete(myProfile as unknown as ProfileRow | null)) {
    return NextResponse.json({ error: "questionnaire_incomplete" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { query?: string };
  const raw = (body.query ?? "").trim();
  if (!raw) return NextResponse.json({ found: false });

  // Détection : un « @ » en cours de chaîne = email ; sinon @identifiant
  const isEmail = raw.indexOf("@") > 0;
  const admin = createAdminClient();

  let targetId: string | null = null;
  if (isEmail) {
    const { data: rows } = await admin.rpc("lookup_candice_user_by_email", { p_email: raw.toLowerCase() });
    targetId = (rows as Array<{ proche_user_id: string }> | null)?.[0]?.proche_user_id ?? null;
  } else {
    const handle = normalizeHandle(raw);
    if (!HANDLE_RE.test(handle)) return NextResponse.json({ found: false });
    const { data: rows } = await admin.rpc("lookup_candice_user_by_handle", { p_handle: handle });
    targetId = (rows as Array<{ proche_user_id: string }> | null)?.[0]?.proche_user_id ?? null;
  }

  if (!targetId || targetId === user.id) {
    return NextResponse.json({ found: false, self: targetId === user.id });
  }

  // Relation existante (lisible via RLS : proche_read_own_consents)
  const { data: existing } = await supabase
    .from("contact_consents")
    .select("id, status")
    .eq("kind", "profile_view")
    .eq("pilote_id", targetId)
    .eq("proche_user_id", user.id)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    found: true,
    userId: targetId,
    existing: existing ? { consentId: existing.id, status: existing.status } : null,
  });
}
