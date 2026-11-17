#!/usr/bin/env python3
"""LES QUESTIONS OUVERTES DU DISCOVERY ÉCRIVENT AUSSI DANS LE JOURNAL.

LACUNE DE MON PROPRE BRANCHEMENT. La route n'écrivait le journal que pour les questions
FERMÉES : une réponse à une question ouverte — 372 questions de la banque, et les plus
riches — n'y entrait pas du tout. Candice posait « qu'est-ce que tu aimes le plus dans la
céramique ? », recevait une phrase, et n'en gardait rien d'exploitable.

L'ORDRE EST CELUI DE L'ONBOARDING, et il n'est pas interchangeable : le VERBATIM d'abord,
l'extraction ensuite. Une extraction écrite sans son verbatim est une inférence orpheline —
elle affirme quelque chose sans que la phrase dont elle est tirée existe quelque part. Si le
verbatim échoue, l'extraction n'est pas tentée.

ET L'EXTRACTION PORTE LA BARRIÈRE DE LA QUESTION. `inferences_interdites` est le seul
garde-fou contre une conclusion au-delà des mots ; la banque refuse d'ailleurs toute question
ouverte qui n'en porte pas. Elle voyage donc jusqu'au modèle, dans le contexte du champ.

ÉCHOUE FERMÉ : motif attendu exactement une fois.
"""
import pathlib, sys

F = pathlib.Path.home() / "mnt" / "candice" / "src/app/api/discovery/answer/route.ts"
src = F.read_text(encoding="utf-8")

AVANT = """  const qV3 = questionV3(questionKey);
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
  }"""

APRES = """  const qV3 = questionV3(questionKey);
  if (qV3 && !skip) {
    try {
      if (qV3.forme === "open") {
        // ── QUESTION OUVERTE : le VERBATIM d'abord, l'extraction ensuite.
        //
        //    L'ordre n'est pas interchangeable. Une extraction écrite sans son verbatim est
        //    une inférence orpheline : elle affirme quelque chose sans que la phrase dont
        //    elle est tirée existe quelque part. Si le verbatim échoue, l'extraction n'est
        //    pas tentée — mieux vaut ne rien savoir que savoir sans pouvoir le justifier.
        const texte = typeof answer === "string" ? answer.trim() : "";
        if (texte.length === 0) {
          return NextResponse.json({ error: "réponse vide" }, { status: 400 });
        }
        await enregistrerReponseOuverte(supabase as never, {
          userId: user.id, questionId: questionKey, texte,
        });
      } else {
        const cles = Array.isArray(answer) ? answer.map(String)
          : typeof answer === "string" ? [answer] : [];
        if (cles.length === 0) {
          return NextResponse.json({ error: "aucune option reçue" }, { status: 400 });
        }
        await enregistrerReponseFermee(supabase as never, {
          userId: user.id, questionId: questionKey, clesOptions: cles,
        });
      }
    } catch (e) {
      console.error("[discovery/answer] écriture du journal impossible", questionKey, e);
      return NextResponse.json(
        { error: "la réponse n'a pas pu être enregistrée — elle te sera reposée" },
        { status: 503 },
      );
    }
  }"""

n = src.count(AVANT)
if n != 1:
    sys.exit(f"ÉCHEC — motif attendu {n} fois (1 attendue). Rien n'est écrit.")
src = src.replace(AVANT, APRES, 1)
src = src.replace(
    'import { enregistrerReponseFermee } from "@/lib/discovery/open-v3/service";',
    'import { enregistrerReponseFermee, enregistrerReponseOuverte } from "@/lib/discovery/open-v3/service";',
    1,
)
F.write_text(src, encoding="utf-8")
print("OK — les questions ouvertes du Discovery écrivent au journal.")
