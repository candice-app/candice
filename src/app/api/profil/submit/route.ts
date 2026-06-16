import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  // 4.3c — data_source toujours 'pilot_input' : les données saisies ici appartiennent
  // au Pilote A et ne doivent JAMAIS être copiées vers my_profile d'un proche B.
  const { contactId, userId, ...responses } = body;

  if (!contactId || !userId) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  // 4.3c — forcer data_source = 'pilot_input' : le client ne peut pas changer ce champ
  const safeResponses = { ...responses, data_source: "pilot_input" };

  const supabase = createAdminClient();

  // Verify contact exists before writing
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
      .insert({ contact_id: contactId, user_id: userId, ...safeResponses });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
