#!/usr/bin/env python3
"""LA SANTÉ SORT DU NARRATIF DE LA FICHE — partie generateProfileAnalysis.

(La partie synthesis.ts — séparation de `contraintesPratiques` à la source — est déjà
appliquée. Voir le message de commit pour le raisonnement complet.)

ÉCHOUE FERMÉ : chaque motif attendu exactement une fois.
"""
import pathlib, sys

F = pathlib.Path.home() / "mnt" / "candice" / "src/lib/profile/generateProfileAnalysis.ts"
src = F.read_text(encoding="utf-8")

if "contraintesPratiques" not in (F.parent / "synthesis.ts").read_text(encoding="utf-8"):
    sys.exit("ÉCHEC — synthesis.ts ne sépare pas encore les contraintes pratiques.")

PAIRES = [
    (
        """      if (v.mobility_constraints) parts.push("contrainte mobilité");
      if (Array.isArray(v.allergies) && v.allergies.length > 0) {
        parts.push(`allergies : ${(v.allergies as string[]).join(", ")}`);
      }""",
        """      // NI ALLERGIES NI MOBILITÉ ICI. La fiche est PARTAGEABLE, et ce bloc nourrit le
      // texte. Ces contraintes vivent dans `constraints`, qui n'est pas dans le select
      // partagé : Candice les connaît pour agir, jamais pour les raconter.""",
        "allergies/mobilité hors du prompt",
    ),
    (
        """    // Mobilité / santé — texte libre (nuance émotionnelle)
    if (typeof pi.mobilite_sante === "string" && pi.mobilite_sante.trim().length > 3) {
      lines.push("── MOBILITÉ / SANTÉ (texte libre) ──");
      lines.push(pi.mobilite_sante.trim().slice(0, 200));
      lines.push("");
    }""",
        """    // LE TEXTE LIBRE MOBILITÉ / SANTÉ N'ENTRE PAS DANS LE PROMPT. Il était transmis avec
    // la consigne de le « fondre dans les sections pertinentes » — donc dans `summary`,
    // qui part avec la fiche dès qu'elle est partagée.""",
        "texte libre santé hors du prompt",
    ),
    (
        ", couleurs_matieres, odeurs_detestees, mobilité/santé) doivent être PARAPHRASÉES",
        ", couleurs_matieres, odeurs_detestees) doivent être PARAPHRASÉES",
        "consigne : plus de « mobilité/santé » à fondre",
    ),
    (
        "RÈGLES SUR LES SECTIONS :",
        """INFORMATION SENSIBLE — INTERDICTION ABSOLUE DE LA NOMMER : santé, maladie, allergie,
intolérance, régime imposé, situation ou traitement médical, grossesse, contrainte de
mobilité, adresse. Même si une telle information t'était fournie, tu ne l'écris JAMAIS, ni
en clair, ni paraphrasée, ni par allusion. Cette fiche peut être PARTAGÉE avec un proche.
Candice connaît ces informations pour AGIR — écarter un restaurant, choisir un lieu
accessible — et ne les DIT jamais dans un texte : elles ne vivent que dans le bloc d'infos
pratiques, sous cadenas. (Elles sont normalement déjà filtrées en amont ; cette règle est
une sécurité de plus, parce qu'une seule couche ne suffit jamais.)

RÈGLES SUR LES SECTIONS :""",
        "interdiction absolue dans le prompt système",
    ),
    (
        """      constraints: facts.avoidAlerts.filter(a =>
        a.includes("alcool") || a.includes("halal") || a.includes("allergie") || a.includes("mobilité")
      ),""",
        """      // STRUCTUREL, plus lexical : le filtre par mot-clé ratait « arachide », « lactose »,
      // « sans gluten » — tout ce qui ne contient pas littéralement « allergie ».
      constraints: facts.contraintesPratiques,""",
        "constraints : structurel au lieu de lexical",
    ),
]

for avant, apres, quoi in PAIRES:
    n = src.count(avant)
    if n != 1:
        sys.exit(f"ÉCHEC — {quoi} : motif présent {n} fois (1 attendue). Rien n'est écrit.")
    src = src.replace(avant, apres, 1)
    print(f"  · {quoi}")

F.write_text(src, encoding="utf-8")
print("OK — la santé ne passe plus par le texte de la fiche.")
