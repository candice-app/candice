import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import { generateProfileAnalysis } from "@/lib/profile/generateProfileAnalysis";

const anthropic = new Anthropic();

// ── Haiku extraction ──────────────────────────────────────────────────────────

interface SituationExtraction {
  category: string;
  subcategory: string | null;
  tonality: "fragile" | "tendue" | "positive" | "neutre";
  emotional_intensity: "low" | "medium" | "high";
  probable_needs: string[];
}

async function extractSituation(rawText: string): Promise<SituationExtraction> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: `Analyse cette note sur une personne. Retourne uniquement du JSON valide :
{
  "category": "travail|santé|famille|couple|humeur|finances|deuil|autre",
  "subcategory": "string ou null",
  "tonality": "fragile|tendue|positive|neutre",
  "emotional_intensity": "low|medium|high",
  "probable_needs": ["besoin1", "besoin2"]
}
Sois factuel et bienveillant. Pas d'interprétation clinique.`,
    messages: [{ role: "user", content: rawText.slice(0, 500) }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as SituationExtraction;
}

// ── Sonnet reformulation ──────────────────────────────────────────────────────

async function reformulateSituation(
  rawText: string,
  extraction: SituationExtraction,
  contactFirstName: string,
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    system: `Tu es Candice. Tu reformules une note brute sur un proche en 1-2 phrases douces, jamais alarmistes, jamais médicales, jamais dramatiques.
Ton Candice : bienveillant, humain, nuancé. Utilise le prénom si pertinent. Ne répète pas la note brute.
Retourne uniquement la reformulation (pas de JSON, pas d'explication).`,
    messages: [{
      role: "user",
      content: `Prénom du proche : ${contactFirstName}\nNote : ${rawText}\nTonalité : ${extraction.tonality}\nCatégorie : ${extraction.category}`,
    }],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : rawText;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    contactId: string;
    contactFirstName: string;
    rawText: string;
    contactUserId?: string;
  };

  const { contactId, contactFirstName, rawText, contactUserId } = body;

  if (!contactId || !rawText?.trim()) {
    return NextResponse.json({ error: "contactId et rawText requis" }, { status: 400 });
  }

  // Extract (once) then reformulate
  const extraction = await extractSituation(rawText);
  let reformulatedText: string;
  try {
    reformulatedText = await reformulateSituation(rawText, extraction, contactFirstName);
  } catch {
    reformulatedText = rawText;
  }

  const revalidateAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inserted, error } = await supabase
    .from("memories")
    .insert({
      pilot_id: user.id,
      contact_id: contactId,
      raw_text: rawText,
      reformulated_text: reformulatedText,
      type: "situation",
      category: extraction.category,
      subcategory: extraction.subcategory ?? null,
      tonality: extraction.tonality,
      emotional_intensity: extraction.emotional_intensity,
      probable_needs: extraction.probable_needs,
      status: "active",
      source: "pilot",
      confidence: 0.8,
      revalidate_at: revalidateAt,
      sanitized_summary: reformulatedText,
      memory_type: "situation",
      sentiment: extraction.tonality,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Regenerate profile_analysis for this contact if they have a Candice account.
  // Uses admin client: reading another user's my_profile requires bypassing RLS
  // (public_read_my_profile was removed in migration 45).
  if (contactUserId) {
    const adminClient = createAdminClient();
    generateProfileAnalysis(contactUserId, null, adminClient).catch((err: unknown) => {
      console.error("[memories/situation] generateProfileAnalysis failed for contact", contactUserId, err);
    });
  }

  return NextResponse.json({ success: true, id: inserted?.id });
}
