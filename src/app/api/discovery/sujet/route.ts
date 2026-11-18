import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { declarerSujet, ReponseInvalideError } from "@/lib/discovery/open-v3/service";

// « JE VEUX EXPLORER CE SUJET » — et son retrait.
//
// Les questions de la branche « causes » sont sensibles : un score ne les ouvre pas. Elles
// s'ouvrent quand la personne en fait la démarche. Cette route est le SEUL endroit où cette
// démarche s'écrit, et elle ne s'écrit que par un POST de la personne connectée :
//   · pas de GET, pas de paramètre d'URL — un lien reçu dans une notification ne peut pas
//     valoir consentement ;
//   · le client est celui de l'UTILISATEUR (RLS) ; aucun client privilégié ;
//   · la personne concernée est toujours l'appelant : le corps ne porte aucun identifiant de
//     compte, il n'y a donc rien à falsifier.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { branche?: unknown; choisi?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }
  if (typeof body.branche !== "string" || typeof body.choisi !== "boolean") {
    return NextResponse.json({ error: "branche (texte) et choisi (vrai/faux) requis" }, { status: 400 });
  }
  try {
    const r = await declarerSujet(supabase as never, { userId: user.id, branche: body.branche, choisi: body.choisi });
    return NextResponse.json({ ok: true, etat: r.etat });
  } catch (e) {
    if (e instanceof ReponseInvalideError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[discovery/sujet] écriture impossible", e);
    return NextResponse.json({ error: "le choix n'a pas pu être enregistré" }, { status: 503 });
  }
}
