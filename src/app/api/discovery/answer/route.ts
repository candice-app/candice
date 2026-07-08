import { NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { recordAnswer, precomputePersonalizationsForKeys } from "@/lib/discovery/engine";
import { generateProfileAnalysis } from "@/lib/profile/generateProfileAnalysis";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    sessionId: string;
    questionKey: string;
    answer?: string | string[] | Record<string, unknown> | null;
    skip?: boolean;
  };

  const { sessionId, questionKey, answer = null, skip = false } = body;

  if (!sessionId || !questionKey) {
    return NextResponse.json({ error: "sessionId et questionKey requis" }, { status: 400 });
  }

  const result = await recordAnswer(
    user.id, sessionId, questionKey, answer, skip, supabase,
  );

  // Chantier 3.2 — répercuter les réponses structurées dans practical_info
  // (source de vérité des faits affichés en fiche + moteur de vetos).
  if (!skip && answer && typeof answer === "object" && !Array.isArray(answer)) {
    try {
      const { data: p } = await supabase
        .from("my_profile")
        .select("practical_info")
        .eq("user_id", user.id)
        .maybeSingle();
      const pi = ((p?.practical_info as Record<string, unknown>) ?? {});

      if (questionKey === "practical.dietary") {
        const a = answer as { choices?: string[]; allergy_detail?: string };
        const choices = a.choices ?? [];
        const updated: Record<string, unknown> = { ...pi };
        if (choices.includes("vegetarian")) updated.regime = "vegetarien";
        if (choices.includes("vegan"))      updated.regime = "vegan";
        if (choices.includes("halal"))      updated.regime = "halal";
        if (choices.includes("casher"))     updated.regime = "casher";
        if (choices.includes("no_alcohol")) updated.alcool = "ne_bois_pas";
        if (choices.includes("food_allergy") && a.allergy_detail) {
          const existing = Array.isArray(pi.allergies) ? (pi.allergies as string[]) : [];
          updated.allergies = existing.includes("autre") ? existing : [...existing.filter(x => x !== "aucune"), "autre"];
          updated.allergies_detail = a.allergy_detail;
        }
        await supabase.from("my_profile").update({ practical_info: updated }).eq("user_id", user.id);
      }

      if (questionKey === "practical.mobility") {
        const a = answer as { has_constraint?: boolean; types?: string[]; detail?: string; intensity?: string };
        if (a.has_constraint) {
          const TYPE_FR: Record<string, string> = {
            marche_longue: "marche longue", escaliers: "escaliers",
            station_debout: "station debout prolongée", autre: "",
          };
          const parts = [
            ...(a.types ?? []).map(t => TYPE_FR[t] ?? t).filter(Boolean),
            a.detail?.trim() || null,
          ].filter(Boolean);
          await supabase.from("my_profile").update({
            practical_info: {
              ...pi,
              mobilite_sante: parts.join(" · "),
              mobilite_intensite: a.intensity ?? null, // 'legere' | 'systematique'
            },
          }).eq("user_id", user.id);
        }
      }
    } catch { /* non bloquant — la réponse discovery reste enregistrée */ }
  }

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

  // D1 : réponse précédente → pré-calcul EN TÂCHE DE FOND des reformulations
  // des questions suivantes de la session (jamais dans le rendu)
  const upcoming = result.upcomingKeys ?? [];
  if (upcoming.length > 0) {
    after(() => precomputePersonalizationsForKeys(user.id, supabase, upcoming, { onlyMissing: true }));
  }

  // Quand la session est terminée, régénérer l'analyse (fire-and-forget)
  if (result.done) {
    generateProfileAnalysis(user.id, null, supabase).catch(() => {});
  }

  return NextResponse.json({ next: result.next, done: result.done });
}
