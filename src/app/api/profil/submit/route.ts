import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json();
  // 4.3c — data_source toujours 'pilot_input' : les données saisies ici appartiennent
  // au Pilote A et ne doivent JAMAIS être copiées vers my_profile d'un proche B.
  const { contactId, ...responses } = body;

  if (!contactId) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  // 4.3c — forcer data_source = 'pilot_input' : le client ne peut pas changer ce champ
  const safeResponses = { ...responses, data_source: "pilot_input" };

  // RLS on contacts (auth.uid() = user_id) enforces ownership — no admin bypass needed
  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .single();

  if (!contact) {
    return NextResponse.json({ error: "Contact introuvable." }, { status: 404 });
  }

  // Upsert: update if response already exists, insert otherwise
  const { data: existing } = await supabase
    .from("questionnaire_responses")
    .select("id")
    .eq("contact_id", contactId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("questionnaire_responses")
      .update({ ...safeResponses, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("questionnaire_responses")
      .insert({ contact_id: contactId, user_id: user.id, ...safeResponses });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
