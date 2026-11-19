import { NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { generateProfileAnalysis } from "@/lib/profile/generateProfileAnalysis";
import { rejouerLecturesEnAttente } from "@/lib/discovery/open-v3/service";
import { traiterReponse } from "@/lib/discovery/open-v3/reponse";

// RECEVOIR UNE RÉPONSE DU DISCOVERY.
//
// La route ne décide rien : `traiterReponse` vérifie le lot signé, la question, la forme, le
// parcours et les conditions AVANT toute écriture, puis écrit dans l'ordre journal →
// progression → avancée. Ce que le navigateur affirme (liste de questions, position) n'est
// plus lu : seul le lot signé par le serveur dit ce qui a été proposé.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { jeton?: unknown; questionKey?: unknown; answer?: unknown; skip?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "requête illisible" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "requête illisible" }, { status: 400 });

  const issue = await traiterReponse(supabase, {
    userId: user.id, jeton: body.jeton, questionKey: body.questionKey, answer: body.answer, skip: body.skip === true,
  });
  if (!issue.ok) return NextResponse.json({ error: issue.message, motif: issue.motif }, { status: issue.status });

  // ── LES LECTURES RESTÉES EN ATTENTE (panne du modèle lors d'une réponse précédente, ou de
  //    celle-ci) sont rejouées APRÈS la réponse, hors du chemin de la personne. Sans doublon :
  //    une lecture déjà faite n'est jamais refaite (voir rejouerLecturesEnAttente).
  after(async () => {
    try { await rejouerLecturesEnAttente(supabase as never, { userId: user.id, max: 3 }); }
    catch (e) { console.error("[discovery/answer] rejeu des lectures impossible", e); }
  });

  // La fatigue compte les ACTES, pas les requêtes : une requête renvoyée ne compte pas deux fois.
  if (issue.nouvelActe) {
    try {
      const { data: p } = await supabase.from("my_profile").select("discovery_fatigue_score").eq("user_id", user.id).maybeSingle();
      const score = ((p as { discovery_fatigue_score?: number } | null)?.discovery_fatigue_score ?? 0) + 1;
      const { error } = await supabase.from("my_profile").update({ discovery_fatigue_score: score }).eq("user_id", user.id);
      if (error) console.error("[discovery/answer] my_profile update discovery_fatigue_score", error.message);
    } catch { /* non bloquant */ }
  }

  // Invalider le cache de /moi pour que les appels Discovery soient recalculés
  revalidatePath("/moi");

  // Quand le parcours est terminé par un acte nouveau, régénérer l'analyse (hors chemin).
  if (issue.done && issue.nouvelActe) {
    generateProfileAnalysis(user.id, null, supabase).catch(() => {});
  }

  return NextResponse.json({ next: issue.next, done: issue.done });
}
