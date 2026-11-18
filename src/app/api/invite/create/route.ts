import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { contactId?: string };

  const piloteName: string =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "Quelqu'un";

  // La fiche visée doit être CELLE DE LA PERSONNE QUI INVITE. Sans ce contrôle, une invitation
  // pouvait viser la fiche d'un autre pilote : en l'acceptant, on rattachait son propre compte
  // à cette fiche.
  if (body.contactId) {
    const { data: fiche } = await supabase
      .from("contacts").select("id").eq("id", body.contactId).eq("user_id", user.id).maybeSingle();
    if (!fiche) return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_links")
    .insert({
      pilote_id: user.id,
      contact_id: body.contactId ?? null,
      pilote_name: piloteName,
    })
    .select("token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ token: data.token });
}
