import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    question: string;
    spoken_text: string;
    options: { value: string; label: string }[];
    max: number;
  };

  const { question, spoken_text, options, max } = body;
  if (!spoken_text || !options?.length) {
    return NextResponse.json({ matched: [] });
  }

  const optionsList = options.map((o) => `- "${o.value}": ${o.label}`).join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Tu aides à remplir un questionnaire de profil personnel.

Question posée : "${question}"
Réponse de l'utilisateur (dictée vocale) : "${spoken_text}"

Options disponibles (max ${max} à sélectionner) :
${optionsList}

Identifie quelles options correspondent le mieux à ce que l'utilisateur a dit. Réponds uniquement avec un JSON valide, sans aucun autre texte :
{"matched": ["value1", "value2"]}

Si rien ne correspond clairement, réponds : {"matched": []}`,
    }],
  });

  try {
    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const json = JSON.parse(raw) as { matched: string[] };
    const validValues = new Set(options.map((o) => o.value));
    const matched = (json.matched ?? [])
      .filter((v: string) => validValues.has(v))
      .slice(0, max);
    return NextResponse.json({ matched });
  } catch {
    return NextResponse.json({ matched: [] });
  }
}
