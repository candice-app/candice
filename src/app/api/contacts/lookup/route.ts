import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// RECHERCHE D'UN COMPTE PAR COURRIEL OU TÉLÉPHONE — SUPPRIMÉE (décision du 18 nov.).
//
// Cette route disait à n'importe quel compte connecté si une adresse ou un numéro appartenait
// à un utilisateur de Candice, et rendait son identifiant. Pour le lancement, on passe par
// l'invitation : la personne se rattache elle-même à la fiche en l'acceptant, et c'est son
// acceptation qui confirme le lien.
//
// La route reste, pour qu'un écran ancien encore ouvert ne casse pas ; elle répond toujours la
// même chose, sans rien lire : la réponse ne dépend d'aucune adresse.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ found: false });
}
