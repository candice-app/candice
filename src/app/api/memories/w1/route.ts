import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { processMemory } from "@/lib/brain/orchestrator";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { contactId, text } = body as { contactId: string; text: string };

  if (!contactId || !text?.trim())
    return NextResponse.json({ error: "contactId et text requis" }, { status: 400 });

  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!contact)
    return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });

  try {
    const result = await processMemory(text.trim(), {
      contactId,
      userId: user.id,
      source: "pilote",
      supabase,
    });

    return NextResponse.json({
      memoryId: result.memoryId,
      sanitized_summary: result.sanitized_summary,
      sentiment: result.sentiment,
      category: result.category,
      emotional_intensity: result.emotional_intensity,
      sensitivity_level: result.sensitivity_level,
      confidence_score: result.confidence_score,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Erreur de traitement" },
      { status: 500 }
    );
  }
}
