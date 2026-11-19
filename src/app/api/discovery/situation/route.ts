import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { declarerSituations, ReponseInvalideError } from "@/lib/discovery/open-v3/service";

// « TON QUOTIDIEN » — la situation de vie que la personne déclare elle-même (décision D2).
//
// Seul endroit où cette déclaration s'écrit : un POST de la personne connectée, avec SON client
// (RLS), sans identifiant de compte dans le corps. Rien n'est déduit : ne pas cocher n'est pas dire
// non ; seule « aucune de ces situations » l'écrit. Une nouvelle déclaration remplace l'ancienne.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { coches?: unknown; aucune?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }
  if (!Array.isArray(body.coches) || !body.coches.every((x) => typeof x === "string") || typeof body.aucune !== "boolean") {
    return NextResponse.json({ error: "coches (liste de textes) et aucune (vrai/faux) requis" }, { status: 400 });
  }
  try {
    const r = await declarerSituations(supabase as never, { userId: user.id, coches: body.coches as string[], aucune: body.aucune });
    return NextResponse.json({ ok: true, etat: r.etat, situations: Object.fromEntries(r.situations) });
  } catch (e) {
    if (e instanceof ReponseInvalideError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[discovery/situation] écriture impossible", e);
    return NextResponse.json({ error: "la réponse n'a pas pu être enregistrée" }, { status: 503 });
  }
}
