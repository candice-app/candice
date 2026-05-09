import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { note } = await request.json();
  if (!note?.trim()) return NextResponse.json({ error: "Note vide" }, { status: 400 });

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, relationship")
    .eq("user_id", user.id)
    .is("archived_at", null);

  const contactList = (contacts ?? []).map(c => `${c.name} (${c.id})`).join(", ");

  let contactId: string | null = null;
  let contactName: string | null = null;
  let responseText = "Noté. Je m'en souviens.";

  if ((contacts ?? []).length > 0) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Tu es Candice. L'utilisateur te dit : "${note}"

Proches disponibles : ${contactList}

Identifie si un proche est mentionné (par prénom, surnom, lien). Réponds UNIQUEMENT avec ce JSON (pas de texte avant/après) :
{"contact_id": "uuid ou null", "contact_name": "prénom ou null", "response": "Noté. Je pense à [prénom]." ou "Noté. Je m'en souviens."}`,
        }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        contactId = parsed.contact_id ?? null;
        contactName = parsed.contact_name ?? null;
        responseText = parsed.response ?? responseText;
      }
    } catch { /* fallback to default response */ }
  }

  await supabase.from("profile_notes").insert({
    user_id: user.id,
    contact_id: contactId,
    note: note.trim(),
  });

  return NextResponse.json({ response: responseText, contact_id: contactId, contact_name: contactName });
}
