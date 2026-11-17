#!/usr/bin/env python3
"""/moi/discovery SERT LA BANQUE OPEN V3.

L'ancienne banque vit dans `discovery_questions`, en base : 71 questions, dont les réponses
n'entraient jamais dans le journal. On cesse de la servir. Ses lignes en base et le code qui
les lit tombent séparément — un seul geste ne doit pas casser deux choses à la fois.

CE QUI NE CHANGE PAS : la forme servie à l'écran. `DiscoveryFlow` reçoit exactement la même
structure, pour que le branchement ne soit pas aussi une refonte d'interface. Ce qui change,
c'est d'où viennent les questions et où vont les réponses.

ÉCHOUE FERMÉ : chaque motif attendu exactement une fois.
"""
import pathlib, sys

F = pathlib.Path.home() / "mnt" / "candice" / "src/app/moi/discovery/page.tsx"
src = F.read_text(encoding="utf-8")


def remplacer(avant, apres, quoi):
    global src
    n = src.count(avant)
    if n != 1:
        sys.exit(f"ÉCHEC — {quoi} : {n} occurrence(s), 1 attendue. Rien n'est écrit.")
    src = src.replace(avant, apres, 1)
    print(f"  · {quoi}")


remplacer(
    'import { getNextMicroQuestion, type ProfileAnalysisSnapshot } from "@/lib/discovery/engine";',
    'import { prochainesQuestionsPour } from "@/lib/discovery/open-v3/service";\n'
    'import type { NextQuestionResult } from "@/lib/discovery/engine";',
    "import du service OPEN V3",
)

remplacer(
    """  // Fetch analysis snapshot for trigger evaluation
  const { data: analysisRow } = await supabase
    .from("profile_analysis")
    .select("sections")
    .eq("user_id", userId)
    .is("contact_id", null)
    .maybeSingle();

  const analysis: ProfileAnalysisSnapshot | null = analysisRow?.sections
    ? { sections: analysisRow.sections as Record<string, { text?: string; chips?: string[] }> }
    : null;

  const initial = await getNextMicroQuestion(
    userId,
    supabase,
    analysis,
    mode,
    sectionKey ?? undefined,
  );""",
    """  // ── LES QUESTIONS VIENNENT DE LA BANQUE OPEN V3, et l'état qui décide de leur
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
  };""",
    "service OPEN V3 au rendu",
)

F.write_text(src, encoding="utf-8")
print("OK — /moi/discovery sert la banque OPEN V3.")
