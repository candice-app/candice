import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { computeProfileSynthesis } from "@/lib/profile/synthesis";
import { runSynthesisAI } from "@/lib/profile/synthesisAI";
import type { FaceResult } from "@/lib/attention/scoring";
import type { RelationalFilters } from "@/lib/lifestyle/scoring";

// Called fire-and-forget from QuestionnaireFlow after each part is saved.
// Reads the freshest profile data from DB, computes synthesis, persists.
export async function POST(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("my_profile")
    .select("attention_reception, attention_expression, temperament_axes, temperament_modes, lifestyle_axes, relational_filters, practical_info, singularity_answers")
    .eq("user_id", user.id)
    .maybeSingle();

  // Minimum requirement: attention vectors (from step 1)
  if (!profile?.attention_reception || !profile?.attention_expression) {
    return NextResponse.json({ success: false, reason: "insufficient_data" });
  }

  const facts = computeProfileSynthesis({
    reception:         profile.attention_reception as FaceResult,
    expression:        profile.attention_expression as FaceResult,
    temperamentAxes:   (profile.temperament_axes as Record<string, { score: number; intensity: number }> | null) ?? null,
    temperamentModes:  (profile.temperament_modes as Record<string, { label: string; intensity: number } | null> | null) ?? null,
    lifestyleAxes:     (profile.lifestyle_axes as Record<string, { score: number; intensity: number }> | null) ?? null,
    relationalFilters: (profile.relational_filters as RelationalFilters | null) ?? null,
    practicalInfo:     (profile.practical_info as { vetos?: { no_alcohol?: boolean; halal?: boolean; casher?: boolean; mobility_constraints?: boolean; allergies?: string[] } } | null) ?? null,
    singularity:       (profile.singularity_answers as Record<string, string> | null) ?? null,
  });

  const narrative = await runSynthesisAI(facts);

  await supabase
    .from("my_profile")
    .update({
      profile_synthesis:    narrative,
      synthesis_computed_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
