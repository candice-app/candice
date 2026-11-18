import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { enregistrerSituation, SituationRefusee } from "@/lib/memories/situations";

// ENREGISTRER LA SITUATION D'UN PROCHE.
//
// QUI PEUT PROVOQUER QUOI.
//   · L'appelant est la personne connectée ; tout est écrit SOUS SON IDENTITÉ, par le client
//     utilisateur, donc sous la RLS (`pilot_id = auth.uid()`). Aucun client privilégié.
//   · Le contact visé doit lui APPARTENIR : vérifié en base AVANT tout appel au modèle. Le
//     contact d'un autre compte est traité comme inexistant (404), sans écriture ni appel.
//   · La route n'agit sur AUCUN autre compte. Un `contactUserId` encore envoyé est ignoré.
//   · La note est SAUVEGARDÉE avant que le modèle soit sollicité : une panne ne la perd pas.
// Le cycle de vie (statuts V26) est dans `@/lib/memories/situations`.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { contactId?: unknown; rawText?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }

  try {
    const r = await enregistrerSituation(supabase, {
      userId: user.id,
      contactId: typeof body.contactId === "string" ? body.contactId : "",
      rawText: typeof body.rawText === "string" ? body.rawText : "",
    });
    return NextResponse.json({ success: true, id: r.id, enrichie: r.enrichie });
  } catch (e) {
    if (e instanceof SituationRefusee) return NextResponse.json({ error: e.message }, { status: e.code });
    console.error("[memories/situation] échec", e);
    return NextResponse.json({ error: "la situation n'a pas pu être enregistrée" }, { status: 503 });
  }
}
