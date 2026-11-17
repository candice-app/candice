#!/usr/bin/env python3
"""BRANCHER DISCOVERY OPEN V3 : les réponses entrent dans le journal.

CE QUI SE PASSAIT. L'ancien moteur Discovery n'écrit RIEN dans le journal — zéro occurrence
de `knowledge_` dans engine.ts. Il écrit `profile_completion` et `my_profile.discovery_answers`,
c'est-à-dire la projection. Toute réponse Discovery jamais donnée est donc invisible du HSG :
Candice posait des questions et n'apprenait rien de ce qu'elle a le droit d'affirmer ensuite.

CE QU'ON FAIT. La réponse est d'abord écrite dans le JOURNAL, par le service OPEN V3, puis
la projection continue d'être écrite comme avant.

L'ORDRE N'EST PAS UN DÉTAIL. Si la progression était marquée avant l'écriture du journal,
une panne entre les deux perdrait la réponse tout en interdisant de reposer la question : la
personne aurait répondu pour rien, sans aucun moyen de s'en apercevoir. On écrit la
connaissance d'abord. Si elle échoue, la route répond 503 et NE marque rien — la question
sera reposée, ce qui est réparable, à l'inverse.

LA PROJECTION N'EST PAS SUPPRIMÉE ICI. `my_profile.discovery_answers` est encore lu par le
prompt de la page d'analyse. La couper dans le même geste ferait perdre cette matière sans
l'avoir remplacée. Ce qui cesse, c'est de SERVIR l'ancienne banque ; ses lignes en base et
le code qui les lit tombent ensuite, séparément, pour qu'un seul geste ne casse pas deux
choses à la fois.

ÉCHOUE FERMÉ : chaque motif attendu exactement une fois.
"""
import pathlib, sys

R = pathlib.Path.home() / "mnt" / "candice"
F = R / "src/app/api/discovery/answer/route.ts"
src = F.read_text(encoding="utf-8")


def remplacer(avant, apres, quoi):
    global src
    n = src.count(avant)
    if n != 1:
        sys.exit(f"ÉCHEC — {quoi} : {n} occurrence(s), 1 attendue. Rien n'est écrit.")
    src = src.replace(avant, apres, 1)
    print(f"  · {quoi}")


remplacer(
    'import { generateProfileAnalysis } from "@/lib/profile/generateProfileAnalysis";',
    'import { generateProfileAnalysis } from "@/lib/profile/generateProfileAnalysis";\n'
    'import { question as questionV3 } from "@/lib/discovery/open-v3/banque";\n'
    'import { enregistrerReponseFermee } from "@/lib/discovery/open-v3/service";',
    "imports OPEN V3",
)

remplacer(
    """  const result = await recordAnswer(
    user.id, sessionId, questionKey, answer, skip, supabase,
  );""",
    """  // ── LE JOURNAL D'ABORD. Avant toute marque de progression.
  //
  //    Une question de la banque OPEN V3 écrit une preuve ; l'ancienne banque n'en écrivait
  //    aucune. Si l'écriture échoue, on répond 503 et on ne marque RIEN : la question sera
  //    reposée, ce qui se répare. L'inverse — progression marquée, réponse perdue — ne se
  //    répare pas, et la personne n'a aucun moyen de s'en apercevoir.
  const qV3 = questionV3(questionKey);
  if (qV3 && !skip && qV3.forme !== "open") {
    const cles = Array.isArray(answer) ? answer.map(String)
      : typeof answer === "string" ? [answer] : [];
    if (cles.length === 0) {
      return NextResponse.json({ error: "aucune option reçue" }, { status: 400 });
    }
    try {
      await enregistrerReponseFermee(supabase as never, {
        userId: user.id, questionId: questionKey, clesOptions: cles,
      });
    } catch (e) {
      console.error("[discovery/answer] écriture du journal impossible", questionKey, e);
      return NextResponse.json(
        { error: "la réponse n'a pas pu être enregistrée — elle te sera reposée" },
        { status: 503 },
      );
    }
  }

  const result = await recordAnswer(
    user.id, sessionId, questionKey, answer, skip, supabase,
  );""",
    "écriture du journal avant la progression",
)

F.write_text(src, encoding="utf-8")
print("OK — une réponse Discovery entre désormais dans le journal.")
