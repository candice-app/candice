import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { animauxDe, declarerAnimal, DestinationInvalideError } from "@/lib/discovery/open-v3/destinations-ecriture";

// LES ANIMAUX DE LA PERSONNE — déclarés par elle, jamais déduits d'une réponse.
// Client de l'utilisateur ; l'animal appartient toujours à l'appelant ; aucun identifiant de
// compte dans le corps.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ animaux: await animauxDe(supabase as never, { userId: user.id }) }); }
  catch (e) { console.error("[discovery/animal] lecture impossible", e); return NextResponse.json({ error: "lecture impossible" }, { status: 503 }); }
}
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { nom?: unknown; espece?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }
  if (typeof body.nom !== "string" || typeof body.espece !== "string") return NextResponse.json({ error: "nom et espece (textes) attendus" }, { status: 400 });
  try {
    const r = await declarerAnimal(supabase as never, { userId: user.id, nom: body.nom, espece: body.espece });
    return NextResponse.json({ ok: true, petId: r.petId, etat: r.etat });
  } catch (e) {
    if (e instanceof DestinationInvalideError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[discovery/animal] écriture impossible", e);
    return NextResponse.json({ error: "l'animal n'a pas pu être enregistré" }, { status: 503 });
  }
}
