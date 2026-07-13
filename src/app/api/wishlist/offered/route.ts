// « On me l'a offert » → trace d'attention accomplie dans attention_log
// (status 'done'). Candice pourra ensuite demander la satisfaction (feedback :
// juste / a_cote / pas_le_moment) pour nourrir l'analyse relationnelle.
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId, title } = await req.json() as { contactId?: string; title?: string };
  if (!contactId || !title?.trim())
    return NextResponse.json({ error: "contactId et title requis" }, { status: 400 });

  // Vérif propriété du contact (RLS + garde explicite)
  const { data: contact } = await supabase
    .from("contacts").select("id").eq("id", contactId).eq("user_id", user.id).maybeSingle();
  if (!contact) return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });

  const now = new Date().toISOString();
  const { error } = await supabase.from("attention_log").insert({
    user_id: user.id,
    contact_id: contactId,
    attention_title: title.trim(),
    attention_type: "cadeau_recu",
    status: "done",
    proposed_at: now,
    actioned_at: now,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
