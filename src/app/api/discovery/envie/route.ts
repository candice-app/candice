import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { repondreEnvieAuCarnet, EnvieInvalideError } from "@/lib/discovery/open-v3/envie-carnet";

// « AJOUTER CETTE ENVIE À TON CARNET ? » — la réponse de la personne, et elle seule.
// Client de l'utilisateur ; aucun identifiant de compte dans le corps ; l'envie doit être la
// sienne et encore à proposer, sinon rien n'est écrit.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { envie?: unknown; ajouter?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }
  if (typeof body.envie !== "string" || typeof body.ajouter !== "boolean") return NextResponse.json({ error: "envie (texte) et ajouter (vrai/faux) attendus" }, { status: 400 });
  try {
    const r = await repondreEnvieAuCarnet(supabase as never, { userId: user.id, envieId: body.envie, ajouter: body.ajouter });
    return NextResponse.json({ ok: true, etat: r.etat });
  } catch (e) {
    if (e instanceof EnvieInvalideError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error("[discovery/envie] écriture impossible", e);
    return NextResponse.json({ error: "cela n'a pas pu être enregistré" }, { status: 503 });
  }
}
