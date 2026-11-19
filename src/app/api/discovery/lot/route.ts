import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { proposerLot } from "@/lib/discovery/open-v3/reponse";
import { LotIndisponibleError } from "@/lib/discovery/open-v3/lot";

// LE LOT QUE LE SERVEUR PROPOSE MAINTENANT — le même calcul que la page `/moi/discovery`.
// Lecture seule : aucune session, aucune trace. Sert à reprendre un parcours sans recharger
// la page (lot expiré, question qui n'est plus d'actualité).
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mode = new URL(req.url).searchParams.get("mode") === "full" ? "full" : "quick";
  try {
    const { premiere } = await proposerLot(supabase, { userId: user.id, mode });
    return NextResponse.json({ next: premiere, done: premiere === null }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof LotIndisponibleError) console.error("[discovery/lot]", e.message);
    else console.error("[discovery/lot] proposition impossible", e);
    return NextResponse.json({ error: "les questions ne sont pas disponibles pour le moment" }, { status: 503 });
  }
}
