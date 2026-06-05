import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateProfileAnalysis } from "@/lib/profile/generateProfileAnalysis";

// Single source-of-truth analysis endpoint.
// Called fire-and-forget from QuestionnaireFlow after each part saves.
export async function POST(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await generateProfileAnalysis(user.id, null, supabase);
  return NextResponse.json(result);
}
