import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ouvrirProjet, cloreProjet, projetsEnCours, ReponseInvalideError } from "@/lib/discovery/open-v3/service";

// « JE PRÉPARE UN ACHAT / UN SÉJOUR » — et sa fin.
//
// Les questions de niveau C (« pour cet achat, tu préfères… ») demandent un objet nommé. Le
// seul qui existe pour le moteur est un PROJET que la personne a elle-même saisi : aimer le
// voyage ne crée pas un séjour. Cette route est le seul endroit où un projet s'écrit.
//   · POST uniquement pour écrire ; la personne concernée est toujours l'appelant — le corps
//     ne porte aucun identifiant de compte ;
//   · client de l'UTILISATEUR (RLS), aucun client privilégié ;
//   · un projet se clôt (terminé, annulé) : ses questions cessent de s'ouvrir, et ce qui a
//     été répondu reste.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ projets: await projetsEnCours(supabase as never, { userId: user.id }) });
  } catch (e) {
    console.error("[discovery/projet] lecture impossible", e);
    return NextResponse.json({ error: "les projets n'ont pas pu être lus" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { action?: unknown; type?: unknown; branche?: unknown; objet?: unknown; fin?: unknown; projetId?: unknown; motif?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }
  try {
    if (body.action === "ouvrir") {
      if ((body.type !== "achat" && body.type !== "sejour") || typeof body.branche !== "string" || typeof body.objet !== "string"
        || (body.fin !== undefined && typeof body.fin !== "string")) {
        return NextResponse.json({ error: "type (achat ou sejour), branche et objet requis" }, { status: 400 });
      }
      const r = await ouvrirProjet(supabase as never, { userId: user.id, type: body.type, branche: body.branche, objet: body.objet, ...(body.fin ? { fin: body.fin } : {}) });
      return NextResponse.json({ ok: true, projet: r.projet });
    }
    if (body.action === "clore") {
      if (typeof body.projetId !== "string" || (body.motif !== "termine" && body.motif !== "annule")) {
        return NextResponse.json({ error: "projetId et motif (termine ou annule) requis" }, { status: 400 });
      }
      const r = await cloreProjet(supabase as never, { userId: user.id, projetId: body.projetId, motif: body.motif });
      return NextResponse.json({ ok: true, etat: r.etat });
    }
    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  } catch (e) {
    if (e instanceof ReponseInvalideError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[discovery/projet] écriture impossible", e);
    return NextResponse.json({ error: "le projet n'a pas pu être enregistré" }, { status: 503 });
  }
}
