import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { contactId, userId, ...responses } = body;

  if (!contactId || !userId) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

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
      .update({ ...responses, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("questionnaire_responses")
      .insert({ contact_id: contactId, user_id: userId, ...responses });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
