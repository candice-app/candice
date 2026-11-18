import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { agirSurSituation, type ActionSituation } from "@/lib/memories/situations";

// FAIRE ÉVOLUER UNE SITUATION. Trois gestes, trois sens distincts (décision du 18 nov.) :
//   toujours_actuelle → reste vivante, revalidation dans 30 jours
//   terminee          → archivé : quitte la fiche et les recommandations, historique conservé
//   erreur            → invalidé : l'information était fausse
// Les anciens noms (`revalidate`, `resolve`) sont acceptés pour un écran pas encore rechargé.
const ACTIONS: Record<string, ActionSituation> = {
  toujours_actuelle: "toujours_actuelle", terminee: "terminee", erreur: "erreur",
  revalidate: "toujours_actuelle", resolve: "terminee",
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { id?: unknown; action?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }
  const action = typeof body.action === "string" ? ACTIONS[body.action] : undefined;
  if (typeof body.id !== "string" || !action) {
    return NextResponse.json({ error: "id et action requis" }, { status: 400 });
  }
  try {
    const ok = await agirSurSituation(supabase, { userId: user.id, id: body.id, action });
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[memories/situation/action] échec", e);
    return NextResponse.json({ error: "la mise à jour n'a pas pu être enregistrée" }, { status: 503 });
  }
}
