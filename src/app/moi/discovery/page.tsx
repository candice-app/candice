import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAuthClaims } from "@/utils/supabase/claims";
import DashboardShell from "@/components/layout/DashboardShell";
import DiscoveryFlow from "./DiscoveryFlow";
import { prochainesQuestionsPour } from "@/lib/discovery/open-v3/service";
import type { NextQuestionResult } from "@/lib/discovery/engine";

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; section?: string }>;
}) {
  const supabase = await createClient();
  // Levier 2 : auth vérifiée en LOCAL (getClaims) — pas d'aller-retour réseau.
  const claims = await getAuthClaims(supabase);
  if (!claims) redirect("/login");
  const userId = claims.sub as string;

  const { mode: rawMode, section: sectionKey } = await searchParams;
  const mode = rawMode === "full" ? "full" : "quick";

  // ── LES QUESTIONS VIENNENT DE LA BANQUE OPEN V3, et l'état qui décide de leur
  //    ouverture vient du JOURNAL. L'ancien moteur lisait `profile_analysis.sections` pour
  //    évaluer ses déclencheurs — un texte déjà rédigé, donc une conséquence, pas une
  //    cause : on y cherchait l'autorisation de poser une question dans la prose que la
  //    question avait servi à écrire.
  //
  //    Lecture seule, aucun effet de bord : la session naît à la première réponse.
  const combien = mode === "full" ? 6 : 1;
  const { questions, diagnostic, manques } = await prochainesQuestionsPour(supabase, {
    userId, combien,
  });
  if (manques.length > 0) console.warn("[discovery] état incomplet", manques);
  // « Rien à demander » est un résultat légitime, et il doit être explicable : le
  // diagnostic dit si tout a été posé, si les conditions ferment, ou si on n'a pas su les
  // lire. Un écran vide sans trace est un défaut qu'on ne peut pas corriger.
  if (questions.length === 0) console.info("[discovery] aucune question à poser", diagnostic);

  // `sectionKey` restreint à une branche quand la page est ouverte depuis un CTA ciblé.
  const retenues = sectionKey
    ? questions.filter((q) => q.dimension === sectionKey)
    : questions;

  const initial: NextQuestionResult | null = retenues.length === 0 ? null : {
    question: {
      id: retenues[0].question_key,
      question_key: retenues[0].question_key,
      dimension: retenues[0].dimension,
      subdimension: null,
      question_text: retenues[0].question_text,
      question_type: retenues[0].question_type,
      options: retenues[0].options ? [...retenues[0].options] : null,
      sort_order: 0,
      // Texte du référentiel, revu et validé : JAMAIS reformulé par un modèle.
      locked_text: true,
    },
    sessionId: null,
    pendingKeys: retenues.map((q) => q.question_key),
    currentIndex: 0,
    mode,
    sectionLabel: retenues[0].dimension,
    progress: mode === "full" ? { current: 1, total: retenues.length } : null,
  };

  return (
    <DashboardShell>
      <div className="content-col" data-page-ready="discovery">
        {/* C4 : une section ciblée (nudge, CTA) ouvre DIRECTEMENT sa question */}
        <DiscoveryFlow initial={initial} mode={mode} skipIntro={!!sectionKey} />
      </div>
    </DashboardShell>
  );
}
