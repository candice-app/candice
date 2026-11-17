#!/usr/bin/env python3
"""LE PARTAGE SE DÉCIDE ÉLÉMENT PAR ÉLÉMENT : allergies, régime, alcool.

CE QUI SE PASSAIT. Une seule case, « Allergies · régime · alcool », décidait des trois.
Partager une allergie parce qu'un proche organise un dîner obligeait à partager aussi un
régime — et un régime peut dire une conviction religieuse. Trois informations de nature
différente, une seule réponse possible : c'est le consentement qui était mal posé, pas
seulement son affichage.

  · allergie  → donnée de santé ;
  · régime    → peut révéler une conviction religieuse ou philosophique ;
  · alcool    → un choix de vie, qui ne dit ni l'un ni l'autre.

CE QU'ON FAIT. Trois clés distinctes, trois cases, trois décisions. Aucune des trois n'est
cochée par défaut : pour ce genre d'information, le défaut est de ne pas partager.

LES CONSENTEMENTS DÉJÀ DONNÉS NE SONT PAS REPORTÉS. `sanitizeScope` ne garde que les clés
connues : un partage qui portait `facts_alimentaire` perd simplement cette portée, et la
personne rechoisit. C'est volontaire. Quand la QUESTION change, l'ancienne réponse n'y
répond plus — reporter le groupe sur les trois clés ferait partager une conviction
religieuse au titre d'une case où personne n'a lu le mot « religion ». Le report va donc
toujours vers MOINS de partage, jamais vers plus.

ÉCHOUE FERMÉ : chaque motif est compté, et le compte attendu doit tomber juste.
"""
import pathlib, sys

R = pathlib.Path.home() / "mnt" / "candice"
total = 0


def patch(rel, paires):
    global total
    f = R / rel
    src = f.read_text(encoding="utf-8")
    for avant, apres, attendu, quoi in paires:
        n = src.count(avant)
        if n != attendu:
            sys.exit(f"ÉCHEC — {rel} / {quoi} : {n} occurrence(s), {attendu} attendue(s). Rien n'est écrit.")
        src = src.replace(avant, apres)
        total += n
        print(f"  · {rel.split('/')[-1]:22s} {quoi} ({n})")
    f.write_text(src, encoding="utf-8")


# ── 1. Les clés de visibilité ────────────────────────────────────────────────
patch("src/lib/profile/visibility.ts", [
    ('  | "facts_alimentaire"',
     '  | "facts_allergies"    // santé — jamais regroupée avec autre chose\n'
     '  | "facts_regime"       // peut dire une conviction religieuse ou philosophique\n'
     '  | "facts_alcool"       // un choix de vie, qui ne dit ni l\'une ni l\'autre',
     1, "SectionKey"),
    ('"facts_tailles", "facts_alimentaire", "facts_parfums", "facts_adresse",',
     '"facts_tailles", "facts_allergies", "facts_regime", "facts_alcool", "facts_parfums", "facts_adresse",',
     1, "ALL_SECTION_KEYS"),
    ('facts_tailles: "visible", facts_alimentaire: "visible", facts_parfums: "visible",',
     'facts_tailles: "visible", facts_allergies: "visible", facts_regime: "visible",\n'
     '    facts_alcool: "visible", facts_parfums: "visible",',
     2, "vues « visible »"),
    ('facts_tailles: "filtered_off", facts_alimentaire: "filtered_off",',
     '    // Non cochées par défaut, toutes les trois : pour ce genre d\'information,\n'
     '    // le défaut est de NE PAS partager, et la personne décide case par case.\n'
     '    facts_tailles: "filtered_off", facts_allergies: "filtered_off",\n'
     '    facts_regime: "filtered_off", facts_alcool: "filtered_off",',
     1, "vue invite_filtre"),
    ('facts_tailles: "hidden", facts_alimentaire: "hidden", facts_parfums: "hidden",',
     'facts_tailles: "hidden", facts_allergies: "hidden", facts_regime: "hidden",\n'
     '    facts_alcool: "hidden", facts_parfums: "hidden",',
     1, "vue masquée"),
    ('facts_tailles: "never", facts_alimentaire: "never", facts_parfums: "never",',
     'facts_tailles: "never", facts_allergies: "never", facts_regime: "never",\n'
     '    facts_alcool: "never", facts_parfums: "never",',
     1, "vue aveugle"),
])

# ── 2. Les trois cases du partage ────────────────────────────────────────────
patch("src/lib/profile/share-sections.ts", [
    ('      { keys: ["facts_alimentaire"], label: "Allergies · régime · alcool" },',
     '      // TROIS CASES, PAS UNE. Une allergie est une donnée de santé ; un régime peut\n'
     '      // dire une conviction ; l\'alcool ne dit ni l\'un ni l\'autre. Les regrouper\n'
     '      // forçait à partager les trois pour en partager une seule.\n'
     '      { keys: ["facts_allergies"], label: "Allergies" },\n'
     '      { keys: ["facts_regime"],    label: "Régime alimentaire" },\n'
     '      { keys: ["facts_alcool"],    label: "Rapport à l\'alcool" },',
     1, "SHARE_GROUPS"),
])

# ── 3. Les faits affichables : régime et alcool cessent d'être une seule chaîne ──
patch("src/lib/profile/sheet-data.ts", [
    ("  allergies?: string;\n  regimeAlcool?: string;",
     "  allergies?: string;\n"
     "  /** SÉPARÉS, parce qu'ils se partagent séparément. Une chaîne unique obligerait\n"
     "   *  à montrer les deux ou aucun des deux. */\n"
     "  regime?: string;\n  alcool?: string;",
     1, "PracticalFacts"),
    ("""  const regimeAlcool = [
    pi.regime ? (REGIME_FR[pi.regime] ?? pi.regime) : null,
    pi.alcool ? (ALCOOL_FR[pi.alcool] ?? pi.alcool) : null,
  ].filter(Boolean).join(" · ");""",
     """  const regime = pi.regime ? (REGIME_FR[pi.regime] ?? pi.regime) : undefined;
  const alcool = pi.alcool ? (ALCOOL_FR[pi.alcool] ?? pi.alcool) : undefined;""",
     1, "construction"),
    ('    regimeAlcool: regimeAlcool || undefined,',
     '    regime,\n    alcool,',
     1, "retour"),
])

# ── 4. Chaque fait passe par SA porte ────────────────────────────────────────
patch("src/lib/profile/v2-tiers.ts", [
    ('      allergies: shown("facts_alimentaire") ? data.facts.allergies : undefined,\n'
     '      regimeAlcool: shown("facts_alimentaire") ? data.facts.regimeAlcool : undefined,',
     '      // UNE PORTE PAR FAIT. Partager une allergie n\'ouvre plus le régime, et\n'
     '      // inversement : ce sont trois décisions, elles passent par trois clés.\n'
     '      allergies: shown("facts_allergies") ? data.facts.allergies : undefined,\n'
     '      regime: shown("facts_regime") ? data.facts.regime : undefined,\n'
     '      alcool: shown("facts_alcool") ? data.facts.alcool : undefined,',
     1, "v2-tiers"),
])

print(f"\nOK — {total} remplacement(s). Le partage se décide élément par élément.")
