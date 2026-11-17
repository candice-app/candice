#!/usr/bin/env python3
"""Le narratif de la page d'analyse reçoit les entités du journal, refus compris.

Jusqu'ici les entités étaient STOCKÉES mais jamais transmises au modèle qui écrit la fiche :
il composait sans savoir ce que la personne aime ni, surtout, ce qu'elle refuse. Pour Sophie,
« surtout pas de fleurs coupées » n'atteignait pas la plume.

ÉCHOUE FERMÉ : chaque motif attendu exactement une fois.
"""
import pathlib, sys

F = pathlib.Path.home() / "mnt" / "candice" / "src/lib/profile/generateProfileAnalysis.ts"
src = F.read_text(encoding="utf-8")


def remplacer(avant, apres, quoi):
    global src
    n = src.count(avant)
    if n != 1:
        sys.exit(f"ÉCHEC — {quoi} : motif présent {n} fois (1 attendue). Rien n'est écrit.")
    src = src.replace(avant, apres, 1)
    print(f"  · {quoi}")


# 1. signature
remplacer(
    "  recentMemories: string[];\n  gender: Gender;\n}): string {",
    "  recentMemories: string[];\n"
    "  /** Entités LUES DANS LE JOURNAL (avec leur polarité). */\n"
    "  entities: { brands: string[]; places: string[]; hobbies: string[]; events: string[]; autres: string[]; evites: string[] };\n"
    "  gender: Gender;\n}): string {",
    "signature de buildAnalysisPrompt",
)

# 2. déstructuration
remplacer(
    "  const { facts, practicalInfo, singularity, discoveryAnswers, recentMemories, gender } = data;",
    "  const { facts, practicalInfo, singularity, discoveryAnswers, recentMemories, entities, gender } = data;",
    "déstructuration",
)

# 3. bloc dans le prompt, AVANT la fin des données
remplacer(
    '  lines.push("=== FIN DES DONNÉES ===");',
    '''  // ENTITÉS DU JOURNAL — nommées telles quelles, jamais interprétées (règle 7a), et les
  // REFUS en premier : une fiche qui oublie un refus fait recommander ce que la personne fuit.
  if (entities.evites.length > 0) {
    lines.push("── CE QU'ELLE REFUSE (déclaré, à ne JAMAIS proposer ni présenter comme un goût) ──");
    entities.evites.forEach((e) => lines.push(`• ${e}`));
    lines.push("");
  }
  const aimees: Array<[string, string[]]> = [
    ["Marques / maisons", entities.brands],
    ["Lieux", entities.places],
    ["Centres d'intérêt", entities.hobbies],
    ["Occasions", entities.events],
    ["Autres (livres, films, musiques, produits…)", entities.autres],
  ].filter(([, v]) => (v as string[]).length > 0) as Array<[string, string[]]>;
  if (aimees.length > 0) {
    lines.push("── CE QU'ELLE AIME (journal — NOMMER tel quel, ne RIEN en déduire) ──");
    aimees.forEach(([titre, vals]) => lines.push(`${titre} : ${vals.join(", ")}`));
    lines.push("");
  }

  lines.push("=== FIN DES DONNÉES ===");''',
    "bloc entités dans le prompt",
)

# 4. passage à l'appel
remplacer(
    "    recentMemories,\n    gender,\n  }) + worksLevelsLine;",
    "    recentMemories,\n    entities,\n    gender,\n  }) + worksLevelsLine;",
    "passage au prompt",
)

# 5. les refus du journal rejoignent les deal_breakers du repli
remplacer(
    "      deal_breakers: facts.avoidAlerts.slice(0, 3),",
    "      deal_breakers: [...new Set([...entities.evites, ...facts.avoidAlerts])].slice(0, 3),",
    "refus du journal dans deal_breakers",
)

F.write_text(src, encoding="utf-8")
print("OK — le narratif voit ce que la personne aime, et d'abord ce qu'elle refuse.")
