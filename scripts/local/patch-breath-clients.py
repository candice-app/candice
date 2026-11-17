#!/usr/bin/env python3
"""Les appels de respiration n'envoient plus de connaissance — seulement le cadrage.

La lecture du journal passe CÔTÉ SERVEUR (/api/socle/breath). Le client n'a plus à lire
ni à transmettre les tags : il dit de qui on parle, et c'est tout. Tant que le client
envoyait les tags, un navigateur modifié pouvait faire affirmer n'importe quoi à Candice.

ÉCHOUE FERMÉ : chaque remplacement doit s'appliquer exactement une fois. Zéro occurrence
ou plusieurs → rien n'est écrit, et on le dit. Un patch qui « passe » en n'ayant rien
changé est pire qu'un patch qui échoue.
"""
import sys, pathlib

RACINE = pathlib.Path.home() / "mnt" / "candice"

REMPLACEMENTS = [
    # ── QuestionnaireFlow.tsx ────────────────────────────────────────────────
    ("src/app/moi/questionnaire/QuestionnaireFlow.tsx", [
        # 1. respiration cumulative tempérament
        ("""  try {
    const input = await readSocleTags(supabase as unknown as TagsReadClient, userId); // cumulatif
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const data = (await res.json()) as { text: string };
    return data.text ?? "";
  } catch {
    return "";
  }
}

// B — CONCLUSION""",
         """  try {
    // Le JOURNAL est lu côté SERVEUR : le corps ne porte que le cadrage.
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: "self" }) });
    const data = (await res.json()) as { text: string };
    return data.text ?? "";
  } catch {
    return "";
  }
}

// B — CONCLUSION"""),
    ]),
]

# Remplacements simples (motif unique dans tout le fichier), appliqués après les blocs ci-dessus.
SIMPLES = [
    ("src/app/moi/questionnaire/QuestionnaireFlow.tsx", [
        ("""    const input = await readSocleTags(supabase as unknown as TagsReadClient, userId); // cumulatif
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });""",
         """    // Le JOURNAL est lu côté SERVEUR : le corps ne porte que le cadrage.
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: "self" }) });"""),

        ("""    const input = await readSocleTags(supabase as unknown as TagsReadClient, userId);
    // FACTs restituables (filtre de visibilité mécanique dans readSocleFacts) → nommés, jamais interprétés.
    const facts = await readSocleFacts(supabase as unknown as TagsReadClient, userId);
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, facts }) });""",
         """    // Tags ET faits lus côté SERVEUR (filtre de visibilité mécanique appliqué là-bas).
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: "self" }) });"""),

        ("""    const input = await readSocleTags(supabase as unknown as TagsReadClient, userId); // tout le journal, cumulatif
    const facts = await readSocleFacts(supabase as unknown as TagsReadClient, userId); // FACTs restituables (filtre visibilité)
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, facts, subject: "self" }) });""",
         """    // Tout le journal self (5 domaines) + les FACTs restituables, lus côté SERVEUR.
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: "self" }) });"""),
    ]),
]


def appliquer(chemin: str, paires) -> list[str]:
    f = RACINE / chemin
    src = f.read_text(encoding="utf-8")
    journal = []
    for avant, apres in paires:
        n = src.count(avant)
        if n != 1:
            raise SystemExit(
                f"ÉCHEC — {chemin} : le motif attendu apparaît {n} fois (1 attendue). "
                f"Rien n'est écrit.\n--- motif ---\n{avant[:200]}…"
            )
        src = src.replace(avant, apres, 1)
        journal.append(f"  · {chemin} : 1 remplacement")
    f.write_text(src, encoding="utf-8")
    return journal


def main():
    lignes = []
    for chemin, paires in REMPLACEMENTS:
        lignes += appliquer(chemin, paires)
    for chemin, paires in SIMPLES:
        lignes += appliquer(chemin, paires)
    print("\n".join(lignes))
    print("OK — aucun tag ne transite plus par le client.")


if __name__ == "__main__":
    main()
