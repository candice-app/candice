#!/usr/bin/env python3
"""LA SANTÉ SORT DU NARRATIF DE LA FICHE.

CE QUI SE PASSAIT. La fiche profil est partageable : /fiche/[consentId] et
/contacts/partage/[consentId] lisent `summary`, `summary_third_person`, `insights`,
`sections`, `summary_long`, `understood_cards`. Or le prompt qui les écrit recevait :

  · « allergies : … » et « contrainte mobilité », construits depuis practical_info.vetos ;
  · le texte libre MOBILITÉ / SANTÉ, 200 caractères ;
  · une consigne explicite de PARAPHRASER et FONDRE ces réponses « dans les sections
    pertinentes ».

Et le prompt système ne portait AUCUNE interdiction de nommer la santé — contrairement à
celui des respirations, qui en porte une absolue. Dans le chemin de repli, c'était pire
encore : `sections.avoid.chips` recevait directement les chaînes d'`avoidAlerts`, allergie
comprise, sans passer par aucun modèle.

Le filtre par PORTÉE ne protège pas : il choisit quelles sections sont montrées, pas ce
qu'elles contiennent. Une allergie fondue dans `summary` part avec la fiche.

La règle du produit existait déjà, écrite dans le prompt des respirations : « Candice la
connaît pour agir (écarter un restaurant), mais ne la DIT jamais dans un texte : elle ne
vit que dans le bloc d'infos pratiques, sous cadenas. » La page d'analyse ne l'appliquait pas.

CE QU'ON FAIT. La séparation est STRUCTURELLE, pas lexicale :
  · les contraintes issues de `vetos` quittent `avoidAlerts` pour `contraintesPratiques` ;
  · `constraints` est alimenté par ce champ au lieu d'être re-trouvé par `includes("allergie")`
    — un filtre par mot-clé rate « arachide » et « lactose », et il ratait déjà ;
  · `constraints` et `deal_breakers` ne sont PAS dans le select partagé : ils restent au pilote ;
  · le narratif ne reçoit plus ni les allergies, ni la mobilité, ni le texte libre santé ;
  · le prompt système porte la même interdiction absolue que les respirations — deuxième
    couche, parce qu'une seule ne suffit jamais.

ÉCHOUE FERMÉ : chaque motif attendu exactement une fois.
"""
import pathlib, sys

R = pathlib.Path.home() / "mnt" / "candice"


def patch(rel, paires):
    f = R / rel
    src = f.read_text(encoding="utf-8")
    for avant, apres, quoi in paires:
        n = src.count(avant)
        if n != 1:
            sys.exit(f"ÉCHEC — {rel} / {quoi} : motif présent {n} fois (1 attendue). Rien n'est écrit.")
        src = src.replace(avant, apres, 1)
        print(f"  · {quoi}")
    f.write_text(src, encoding="utf-8")


# ── 1. synthesis.ts : les contraintes pratiques quittent avoidAlerts ────────
patch("src/lib/profile/synthesis.ts", [
    (
        "  touchInsights: string[];\n  avoidAlerts: string[];",
        "  touchInsights: string[];\n"
        "  /** Évitements RELATIONNELS — peuvent être racontés. */\n"
        "  avoidAlerts: string[];\n"
        "  /** Contraintes PRATIQUES (régime, alcool, mobilité, allergies). JAMAIS dans un\n"
        "   *  texte narratif : la fiche est partageable, et ces lignes touchent à la santé.\n"
        "   *  Candice les connaît pour AGIR (écarter un restaurant), jamais pour en parler. */\n"
        "  contraintesPratiques: string[];",
        "interface : contraintesPratiques",
    ),
    (
        """  if (practicalInfo?.vetos?.no_alcohol) avoidAlerts.push("les lieux ou sorties centrés sur l'alcool");
  if (practicalInfo?.vetos?.halal || practicalInfo?.vetos?.casher) {
    avoidAlerts.push("les restaurants sans options adaptées au régime alimentaire");
  }
  if (practicalInfo?.vetos?.allergies && practicalInfo.vetos.allergies.length > 0) {
    avoidAlerts.push(`les aliments contenant : ${practicalInfo.vetos.allergies.join(", ")}`);
  }""",
        """  // CONTRAINTES PRATIQUES — séparées À LA SOURCE, pas retrouvées après coup par mot-clé.
  // Un filtre lexical sur « allergie » rate « arachide » et « lactose » : la séparation doit
  // être structurelle, sinon elle ne tient qu'au vocabulaire employé.
  const contraintesPratiques: string[] = [];
  if (practicalInfo?.vetos?.no_alcohol) contraintesPratiques.push("les lieux ou sorties centrés sur l'alcool");
  if (practicalInfo?.vetos?.halal || practicalInfo?.vetos?.casher) {
    contraintesPratiques.push("les restaurants sans options adaptées au régime alimentaire");
  }
  if (practicalInfo?.vetos?.allergies && practicalInfo.vetos.allergies.length > 0) {
    contraintesPratiques.push(`les aliments contenant : ${practicalInfo.vetos.allergies.join(", ")}`);
  }
  if (practicalInfo?.vetos?.mobility_constraints) contraintesPratiques.push("les lieux peu accessibles");""",
        "vetos → contraintesPratiques",
    ),
])

# le champ doit être rendu par computeProfileSynthesis
src = (R / "src/lib/profile/synthesis.ts").read_text(encoding="utf-8")
if src.count("    touchInsights,\n    avoidAlerts,") == 1:
    src = src.replace("    touchInsights,\n    avoidAlerts,",
                      "    touchInsights,\n    avoidAlerts,\n    contraintesPratiques,", 1)
    (R / "src/lib/profile/synthesis.ts").write_text(src, encoding="utf-8")
    print("  · retour de computeProfileSynthesis")
else:
    sys.exit("ÉCHEC — le retour de computeProfileSynthesis n'a pas la forme attendue. "
             "Le champ contraintesPratiques existe mais n'est pas rendu : corrige à la main.")

# ── 2. generateProfileAnalysis : la santé ne va plus au narratif ────────────
patch("src/lib/profile/generateProfileAnalysis.ts", [
    (
        """      if (v.mobility_constraints) parts.push("contrainte mobilité");
      if (Array.isArray(v.allergies) && v.allergies.length > 0) {
        parts.push(`allergies : ${(v.allergies as string[]).join(", ")}`);
      }""",
        """      // NI ALLERGIES NI MOBILITÉ ICI. La fiche est partageable, et ce bloc nourrit le
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
        '- Les réponses libres (adore_faire, evite_deteste, peu_savent, detail_compris, plus_beau_cadeau, cadeaux_non, envies_reves, remarquer, sentir_special, sujets_stimulants, marques_lieux, q17, couleurs_matieres, odeurs_detestees, mobilité/santé) doivent être PARAPHRASÉES et FONDUES dans les sections pertinentes — jamais copiées.',
        '- Les réponses libres (adore_faire, evite_deteste, peu_savent, detail_compris, plus_beau_cadeau, cadeaux_non, envies_reves, remarquer, sentir_special, sujets_stimulants, marques_lieux, q17, couleurs_matieres, odeurs_detestees) doivent être PARAPHRASÉES et FONDUES dans les sections pertinentes — jamais copiées.',
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
])

print("OK — la santé ne passe plus par le texte de la fiche.")
