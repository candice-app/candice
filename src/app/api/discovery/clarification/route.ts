import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { clarificationsOuvertes, repondreClarification, DestinationInvalideError, type ReponseClarification } from "@/lib/discovery/open-v3/destinations-ecriture";

// LES CLARIFICATIONS — « de quel épisode parles-tu ? ».
//
// Quand une réponse libre nomme une œuvre, un épisode, un lieu ou un animal sans l'identifier,
// rien n'est écrit : une clarification est ouverte, et seule la personne la ferme.
//   · client de l'UTILISATEUR (politiques d'accès) ; aucun client privilégié ;
//   · la personne concernée est toujours l'appelant : le corps ne porte aucun identifiant de compte ;
//   · un choix n'est accepté que s'il a été PROPOSÉ par le serveur pour cette clarification.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ clarifications: await clarificationsOuvertes(supabase as never, { userId: user.id }) });
  } catch (e) {
    console.error("[discovery/clarification] lecture impossible", e);
    return NextResponse.json({ error: "les clarifications n'ont pas pu être lues" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: unknown; choix?: unknown; nom?: unknown; rattachement?: unknown; aucun?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }
  if (typeof body.id !== "string") return NextResponse.json({ error: "id (texte) attendu" }, { status: 400 });
  // Une seule forme de réponse à la fois : un choix proposé, une précision, ou l'abandon.
  const formes = [typeof body.choix === "string", typeof body.nom === "string", body.aucun === true].filter(Boolean).length;
  if (formes !== 1) return NextResponse.json({ error: "un seul de : choix, nom (+ rattachement), aucun" }, { status: 400 });
  const reponse: ReponseClarification = typeof body.choix === "string" ? { choix: body.choix }
    : typeof body.nom === "string" ? { nom: body.nom, ...(typeof body.rattachement === "string" ? { rattachement: body.rattachement } : {}) }
    : { aucun: true };
  try {
    const r = await repondreClarification(supabase as never, { userId: user.id, clarificationId: body.id, reponse });
    return NextResponse.json({ ok: true, etat: r.etat });
  } catch (e) {
    if (e instanceof DestinationInvalideError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[discovery/clarification] écriture impossible", e);
    return NextResponse.json({ error: "la précision n'a pas pu être enregistrée" }, { status: 503 });
  }
}
