import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { raconter, relireRecit } from "@/lib/discovery/open-v3/entree";

// « RACONTER QUELQUE CHOSE » — l'entrée large du Discovery (décision D13).
//
// Le texte est gardé tel quel AVANT toute lecture ; la lecture est faite par l'extracteur du
// journal, côté serveur (la clé du modèle ne quitte jamais le serveur). Si elle échoue, la
// réponse le dit (`lecture: "echec"`) et la personne peut la relancer avec `recitId` : rien n'est
// annoncé qui n'a pas eu lieu. Client de l'UTILISATEUR (RLS), aucun identifiant de compte reçu.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { texte?: unknown; recitId?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }
  const aTexte = typeof body.texte === "string", aRelance = typeof body.recitId === "string";
  if (aTexte === aRelance) return NextResponse.json({ error: "un seul de : texte, recitId" }, { status: 400 });
  try {
    if (aRelance) {
      const r = await relireRecit(supabase as never, { userId: user.id, recitId: body.recitId as string });
      if (!r) return NextResponse.json({ error: "récit introuvable" }, { status: 404 });
      return NextResponse.json({ ok: true, recitId: body.recitId, lecture: r.lecture });
    }
    const r = await raconter(supabase as never, { userId: user.id, texte: body.texte as string });
    return NextResponse.json({ ok: true, recitId: r.recitId, lecture: r.lecture });
  } catch (e) {
    if (e instanceof RangeError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[discovery/recit] écriture impossible", e);
    return NextResponse.json({ error: "le texte n'a pas pu être enregistré" }, { status: 503 });
  }
}
