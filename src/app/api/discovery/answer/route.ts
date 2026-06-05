import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { recordAnswer } from "@/lib/discovery/engine";
import { generateProfileAnalysis } from "@/lib/profile/generateProfileAnalysis";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    sessionId: string;
    questionKey: string;
    answer?: string | string[] | null;
    skip?: boolean;
  };

  const { sessionId, questionKey, answer = null, skip = false } = body;

  if (!sessionId || !questionKey) {
    return NextResponse.json({ error: "sessionId et questionKey requis" }, { status: 400 });
  }

  const result = await recordAnswer(
    user.id, sessionId, questionKey, answer, skip, supabase,
  );

  // Incrémenter la fatigue sur chaque réponse (pas les skips)
  if (!skip) {
    try {
      type ProfileFatigue = { discovery_fatigue_score?: number };
      const { data: p } = await supabase
        .from("my_profile")
        .select("discovery_fatigue_score")
        .eq("user_id", user.id)
        .maybeSingle();
      const score = ((p as ProfileFatigue | null)?.discovery_fatigue_score ?? 0) + 1;
      await supabase
        .from("my_profile")
        .update({ discovery_fatigue_score: score })
        .eq("user_id", user.id);
    } catch { /* non bloquant */ }
  }

  // Invalider le cache de /moi pour que les CTAs Discovery soient recalculés
  revalidatePath('/moi');

  // Quand la session est terminée, régénérer l'analyse (fire-and-forget)
  if (result.done) {
    generateProfileAnalysis(user.id, null, supabase).catch(() => {});
  }

  return NextResponse.json(result);
}
