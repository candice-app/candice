// B.2.1 Phase 4 — /moi/resultats fusionné dans /moi (page profil unifiée).
// Redirection conservée pour les anciens liens/bookmarks. La génération
// d'analyse post-questionnaire vit désormais dans /moi (GenerateAnalysisOnMount).

import { redirect } from "next/navigation";

export default function ResultatsPage() {
  redirect("/moi");
}
