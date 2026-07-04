// POST /api/handle — enregistrer / modifier l'@identifiant de l'utilisateur connecté.
//
// - Session requise (l'identifiant appartient à my_profile de l'appelant)
// - Format validé côté serveur (mêmes règles que la contrainte SQL, migration 49)
// - Unicité garantie par l'index my_profile_handle_key : la course entre
//   vérification et écriture est rattrapée par l'erreur 23505
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { normalizeHandle, handleFormatError } from "@/lib/handle";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { handle?: string };
  const handle = normalizeHandle(body.handle ?? "");

  const formatError = handleFormatError(handle);
  if (formatError) {
    return NextResponse.json({ error: formatError }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("my_profile")
    .upsert(
      { user_id: user.id, handle, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Cet identifiant est déjà pris." }, { status: 409 });
    }
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, handle });
}
