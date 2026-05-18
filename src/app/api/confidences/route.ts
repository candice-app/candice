import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── POST — NLP pipeline ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const rawText = (body.text as string | undefined)?.trim();
  const inputMode = (body.input_mode as "text" | "voice" | undefined) ?? "text";
  if (!rawText) return NextResponse.json({ error: "text required" }, { status: 400 });

  const supabaseAdmin = createAdminClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

  // Load user contacts for NLP identification
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, relationship")
    .eq("user_id", user.id)
    .is("archived_at", null);

  const contactsContext = (contacts ?? [])
    .map((c: { id: string; name: string; relationship: string }) => `- ${c.name} (${c.id}) [${c.relationship}]`)
    .join("\n");

  const prompt = `Tu es Candice — un service de conciergerie relationnelle sobre et adulte.

L'utilisateur te confie quelque chose. Analyse ce message.

CONTACTS DE L'UTILISATEUR :
${contactsContext || "Aucun contact enregistré."}

MESSAGE :
"${rawText}"

DATE DU JOUR : ${today}

Réponds UNIQUEMENT avec ce JSON :
{
  "detected_subject": "contact" | "pilote" | "general",
  "contact_id": "<uuid exact du contact mentionné>" | null,
  "emotional_tone": "positive" | "negative" | "neutral" | "mixed" | "urgent",
  "profile_updates": [
    {
      "contact_id": "<uuid>" | null,
      "field_name": "hobbies" | "favorite_foods" | "conversation_topics" | "things_to_avoid" | "additional_notes" | "gift_preference",
      "new_value": "<information à mémoriser>"
    }
  ],
  "pilote_update": null | { "type": "difficult_period" | "achievement", "details": "..." },
  "candice_response": "Ta réponse naturelle en français (1-2 phrases, confirme que tu as noté)"
}

Règles :
- detected_subject = "contact" si parle d'un proche, "pilote" si de lui-même, "general" sinon
- contact_id = UUID exact de la liste ci-dessus, null sinon
- profile_updates = informations précises sur un proche à mémoriser (loisirs, goûts, dates, etc.)
- pilote_update = si l'utilisateur parle d'une période difficile ou d'un accomplissement personnel
- candice_response = sobre, sans mièvrerie, confirme que tu as retenu ce qui compte`;

  let extracted: {
    detected_subject: string;
    contact_id: string | null;
    emotional_tone: string;
    profile_updates: { contact_id: string | null; field_name: string; new_value: string }[];
    pilote_update: { type: string; details: string } | null;
    candice_response: string;
  };

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    extracted = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("[confidences] Claude error:", err);
    // Graceful fallback — store the note anyway
    extracted = {
      detected_subject: "general",
      contact_id: null,
      emotional_tone: "neutral",
      profile_updates: [],
      pilote_update: null,
      candice_response: "Noté.",
    };
  }

  // Validate contact_id exists in user's contacts
  const validContactIds = new Set((contacts ?? []).map((c: { id: string }) => c.id));
  const safeContactId = extracted.contact_id && validContactIds.has(extracted.contact_id)
    ? extracted.contact_id
    : null;

  // Insert confidence
  const { data: confidence, error: confError } = await supabaseAdmin
    .from("confidences")
    .insert({
      user_id: user.id,
      contact_id: safeContactId,
      raw_text: rawText,
      input_mode: inputMode,
      detected_subject: extracted.detected_subject,
      emotional_tone: extracted.emotional_tone,
      candice_response: extracted.candice_response,
    })
    .select("id")
    .single();

  if (confError) {
    console.error("[confidences] Insert error:", confError.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // Insert profile_updates for contact profiles (pending review)
  for (const update of extracted.profile_updates ?? []) {
    if (!update.contact_id || !validContactIds.has(update.contact_id)) continue;
    if (!update.field_name || !update.new_value) continue;

    // Read current value
    const { data: existingResp } = await supabaseAdmin
      .from("questionnaire_responses")
      .select(update.field_name)
      .eq("contact_id", update.contact_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const oldValue = existingResp ? ((existingResp as unknown) as Record<string, string | null>)[update.field_name] ?? null : null;

    await supabaseAdmin.from("profile_updates_from_confidences").insert({
      user_id: user.id,
      confidence_id: confidence.id,
      contact_id: update.contact_id,
      field_name: update.field_name,
      old_value: oldValue,
      new_value: update.new_value,
      status: "pending",
    });
  }

  // Handle pilote-level updates (applied directly, no review needed)
  if (extracted.pilote_update) {
    const { type } = extracted.pilote_update;
    if (type === "difficult_period") {
      const until = new Date();
      until.setDate(until.getDate() + 30);
      const untilStr = until.toISOString().split("T")[0];
      await supabaseAdmin
        .from("my_profile")
        .update({ pilote_difficult_period_until: untilStr })
        .eq("user_id", user.id);
    } else if (type === "achievement") {
      await supabaseAdmin
        .from("my_profile")
        .update({ pilote_last_achievement_at: today })
        .eq("user_id", user.id);
    }
  }

  const contactName = safeContactId
    ? (contacts ?? []).find((c: { id: string; name: string }) => c.id === safeContactId)?.name ?? null
    : null;

  return NextResponse.json({
    candice_response: extracted.candice_response,
    contact_id: safeContactId,
    contact_name: contactName,
  });
}

// ─── GET — paginated listing ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contact_id");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
  const offset = (page - 1) * limit;

  let query = supabase
    .from("confidences")
    .select("*, contacts(name, relationship)", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (contactId) query = query.eq("contact_id", contactId);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: "Internal error" }, { status: 500 });

  return NextResponse.json({ confidences: data ?? [], total: count ?? 0, page });
}
