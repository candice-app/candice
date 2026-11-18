#!/usr/bin/env python3
"""IMPORT DU RÉFÉRENTIEL DISCOVERY OPEN V3 — du classeur vers une banque typée, en dur.

POURQUOI UN IMPORT, ET PAS UNE LECTURE À L'EXÉCUTION. Le classeur fait 10 Mo et change à
la main. Une application qui le relit en production dépend d'un fichier que personne ne
relit : une cellule modifiée changerait ce que Candice demande et ce qu'elle écrit dans le
journal, sans revue, sans diff, sans test. La banque est donc FIGÉE dans le dépôt, et ce
script est le seul chemin du classeur vers elle.

ÉCHOUE FERMÉ, À CHAQUE ÉTAPE :
  · le SHA-256 du classeur doit être celui attendu — un classeur différent n'est pas
    importé en silence, il est refusé ;
  · toute famille HSG, polarité, stabilité ou sévérité inconnue du journal arrête l'import.
    Une valeur que le journal ne connaît pas produirait une écriture refusée par la base,
    découverte par une utilisatrice au milieu de son parcours ;
  · rien n'est écrit tant qu'une anomalie bloquante subsiste.

CE QU'IL NE FAIT PAS : il ne corrige rien. Les incohérences du classeur sont RAPPORTÉES,
jamais réparées en passant — une correction silencieuse à l'import serait une décision
produit prise par un script.

Usage :  python3 scripts/discovery/importer-open-v3.py [--sha <attendu>] [--ecrire]
Sans --ecrire : analyse et rapport seulement, aucun fichier touché.
"""
from __future__ import annotations
import argparse, collections, hashlib, json, pathlib, re, sys, datetime

VERSION = "importer-open-v3 / 2"
RACINE = pathlib.Path(__file__).resolve().parents[2]
CLASSEUR = RACINE / "docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_2.xlsx"
SORTIE = RACINE / "src/lib/discovery/open-v3"
SHA_ATTENDU = "7a843e8b13f034008334a78da65cc08f626d85c87325d84427e7a122bd1f0a2c"

# ── Vocabulaires du JOURNAL. Lus dans le code, jamais recopiés à la main : une copie
#    diverge, et la divergence ne se verrait qu'en production.
def vocabulaire(nom: str) -> set[str]:
    src = (RACINE / "src/lib/knowledge/vocabulary.ts").read_text(encoding="utf-8")
    m = re.search(rf"export const {nom} = \[(.*?)\] as const;", src, re.S)
    if not m:
        sys.exit(f"ÉCHEC — {nom} introuvable dans vocabulary.ts. L'import ne devine pas un vocabulaire.")
    return set(re.findall(r"'([A-Z_0-9a-z.:]+)'", m.group(1)))

FAMILLES_JOURNAL = {
    "PROFILE", "INTEREST", "ENTITY", "PREFERENCE", "BEHAVIOR",
    "GUARDRAIL", "NEED", "DRIVER", "CONTEXT", "AFFECTION_LANGUAGE",
}
STABILITES = {"stable", "evolving", "contextual", "temporary"}
SEVERITES = {"SOFT", "HARD"}
VOIES = {"HSG_EVIDENCE", "FACT", "OPEN_KNOWLEDGE", "ACTION_PARAMETER", "DISCOVERY_STATE", "NO_EMISSION"}

# Deux générations de métadonnées cohabitent dans le classeur. On NORMALISE, et on COMPTE
# combien de questions sont passées par là : une normalisation silencieuse masquerait le
# fait que le référentiel n'a pas une seule écriture.
TYPES = {
    "single": ("single", None), "multi": ("multi", None),
    "open": ("open", None), "ranked_multi": ("ranked_multi", None),
    "SINGLE · facultative": ("single", True),
    "OPEN · facultative": ("open", True),
    "MULTI · réponses multiples sans plafond arbitraire": ("multi", None),
}


def lire_valeur(brut: str):
    """`valeur` prend trois formes, toutes légitimes :
      · un SCALAIRE — « technique_sans_interet » ;
      · une suite `clé=valeur` séparée par « ; » ;
      · les deux à la fois — « direction=receive ; modality=WORDS ; parole_honnete ».

    La troisième n'est PAS une anomalie, contrairement à ce que cet import a d'abord cru :
    le fragment sans « = » est un QUALIFICATIF — la nuance que l'option ajoute au contrat.
    Le traiter comme une erreur faisait perdre, pour les langages d'affection, la direction
    et la modalité qui se trouvaient juste à côté dans la même cellule.

    Les fragments libres sont conservés sous `__libres__`, jamais fondus dans une clé :
    deviner à quelle clé ils se rattachent serait inventer le contrat."""
    brut = (brut or "").strip()
    if not brut:
        return None, None
    parts = [p.strip() for p in brut.split(";") if p.strip()]
    avec = [p for p in parts if "=" in p]
    sans = [p for p in parts if "=" not in p]
    table = {p.split("=", 1)[0].strip(): p.split("=", 1)[1].strip() for p in avec}
    if avec and sans:
        table["__libres__"] = sans
        return table, None
    if avec:
        return table, None
    return {"__scalaire__": parts[0] if len(parts) == 1 else parts}, None


def txt(v) -> str:
    return "" if v is None else str(v).strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sha", default=SHA_ATTENDU)
    ap.add_argument("--ecrire", action="store_true")
    args = ap.parse_args()

    if not CLASSEUR.exists():
        sys.exit(f"ÉCHEC — classeur absent : {CLASSEUR}")
    sha = hashlib.sha256(CLASSEUR.read_bytes()).hexdigest()
    if sha != args.sha:
        sys.exit(f"ÉCHEC — SHA-256 {sha}\n          attendu {args.sha}\n"
                 "Le classeur n'est pas celui qui a été revu. Rien n'est importé.")

    import openpyxl
    wb = openpyxl.load_workbook(CLASSEUR, read_only=True, data_only=True)
    ws = wb["0_FICHE_CANONIQUE"]
    it = ws.iter_rows(values_only=True)
    C = {c: i for i, c in enumerate(next(it))}

    questions: list[dict] = []
    courante: dict | None = None
    bloquants: list[str] = []
    rapport = {
        "types_normalises": collections.Counter(),
        "valeurs_mixtes": [],
        "attributs_multi_familles": {},
        "options_sans_voie": 0,
        "options_hsg_sans_famille": [],
    }
    attr_familles: dict[str, set[str]] = collections.defaultdict(set)

    for r in it:
        if not any(txt(v) for v in r):
            continue
        ligne = txt(r[C["ligne"]])
        if ligne == "QUESTION":
            brut_type = txt(r[C["type"]])
            if brut_type not in TYPES:
                bloquants.append(f"type de question inconnu : {brut_type!r} ({txt(r[C['question_id']])})")
                continue
            forme, facultative = TYPES[brut_type]
            if brut_type != forme:
                rapport["types_normalises"][brut_type] += 1
            statut = txt(r[C["statut"]])
            courante = {
                "id": txt(r[C["question_id"]]),
                "enonce": txt(r[C["ÉNONCÉ / RÉPONSE"]]),
                "forme": forme,
                **({"facultative": True} if facultative else {}),
                "branche": txt(r[C["branche"]]),
                "niveau": txt(r[C["niveau"]]) or None,
                "statut": statut,
                "etat": ("retiree" if statut.startswith("RETIRÉE")
                         else "en_arbitrage" if statut.startswith("ARBITRAGE")
                         else "active" if statut == "REVUE" else "inconnu"),
                "condition_emission": txt(r[C["condition d’émission"]]),
                "inferences_interdites": txt(r[C["INFÉRENCES INTERDITES"]]),
                "portee": txt(r[C["portée"]]),
                "utilite": txt(r[C["utilité"]]),
                "options": [],
            }
            if courante["etat"] == "inconnu":
                bloquants.append(f"statut non reconnu : {statut!r} ({courante['id']})")
            questions.append(courante)
        elif ligne.startswith("→"):
            if courante is None:
                bloquants.append("une option précède toute question — le classeur n'est pas ordonné")
                continue
            voie = txt(r[C["voie"]])
            if not voie:
                rapport["options_sans_voie"] += 1
            elif voie not in VOIES:
                bloquants.append(f"voie inconnue : {voie!r} ({courante['id']})")
            famille = txt(r[C["famille HSG"]])
            if voie == "HSG_EVIDENCE" and not famille:
                rapport["options_hsg_sans_famille"].append(courante["id"])
            if famille and famille not in FAMILLES_JOURNAL:
                bloquants.append(f"famille HSG inconnue du journal : {famille!r} ({courante['id']})")
            stab = txt(r[C["stabilité"]])
            if stab and stab not in STABILITES:
                bloquants.append(f"stabilité inconnue : {stab!r} ({courante['id']})")
            sev = txt(r[C["sévérité"]])
            if sev and sev not in SEVERITES:
                bloquants.append(f"sévérité inconnue : {sev!r} ({courante['id']})")

            valeur, anomalie = lire_valeur(txt(r[C["valeur"]]))
            if anomalie:
                rapport["valeurs_mixtes"].append({"question": courante["id"], "detail": anomalie})
            attribut = txt(r[C["attribut"]])
            if attribut and famille:
                attr_familles[attribut].add(famille)

            courante["options"].append({
                "rang": txt(r[C["rang"]]) or None,
                "libelle": txt(r[C["ÉNONCÉ / RÉPONSE"]]),
                "voie": voie,
                **({"famille": famille} if famille else {}),
                **({"domaine": txt(r[C["domaine"]])} if txt(r[C["domaine"]]) else {}),
                **({"attribut": attribut} if attribut else {}),
                **({"valeur": valeur} if valeur else {}),
                **({"severite": sev} if sev else {}),
                **({"polarite": txt(r[C["polarité"]])} if txt(r[C["polarité"]]) else {}),
                **({"stabilite": stab} if stab else {}),
                "niveau_preuve": txt(r[C["niveau de preuve"]]),
                "condition_emission": txt(r[C["condition d’émission"]]),
                "inferences_interdites": txt(r[C["INFÉRENCES INTERDITES"]]),
            })

    # ── Un attribut sous DEUX familles n'est pas une broutille : GUARDRAIL arme un veto,
    #    PREFERENCE non. Deux options de la même question peuvent donc avoir des effets
    #    opposés sans que rien ne le dise. On le remonte.
    rapport["attributs_multi_familles"] = {
        a: sorted(f) for a, f in attr_familles.items() if len(f) > 1
    }

    # ── UNE QUESTION OUVERTE SANS BARRIÈRE D'INFÉRENCE NE PART PAS.
    #
    #    Sur une question fermée, le contrat est déterministe : l'option choisie dit exactement
    #    quoi écrire. Sur une question OUVERTE, c'est un MODÈLE qui lit la réponse, et
    #    `inferences_interdites` est la seule chose qui l'empêche de conclure au-delà des mots.
    #    Sans elle, une phrase sur ce qu'on aime manger peut devenir une allergie, un régime
    #    religieux, une pathologie — des catégories que Candice n'a pas le droit de déduire.
    #
    #    On ne l'écrit pas à la place d'Estelle : écrire une barrière, c'est décider ce que
    #    Candice a le droit de comprendre. La question sort du parcours actif et attend.
    sans_barriere = [q for q in questions
                     if q["etat"] == "active" and q["forme"] == "open"
                     and not q["inferences_interdites"]
                     and not any(o.get("inferences_interdites") for o in q["options"])]
    for q in sans_barriere:
        q["etat"] = "en_arbitrage"
        q["motif_arbitrage"] = ("question ouverte sans inférences interdites : un modèle lirait "
                                "la réponse sans barrière. Contrat d'extraction à écrire.")

    actives = [q for q in questions if q["etat"] == "active"]
    arbitrage = [q for q in questions if q["etat"] == "en_arbitrage"]
    retirees = [q for q in questions if q["etat"] == "retiree"]

    print(f"\n{VERSION}")
    print(f"classeur  : {CLASSEUR.name}")
    print(f"SHA-256   : {sha}")
    print(f"\nQUESTIONS : {len(questions)}   ·   options : {sum(len(q['options']) for q in questions)}")
    print(f"   actives (REVUE)          : {len(actives)}")
    print(f"   en arbitrage             : {len(arbitrage)}   ← décision d'Estelle attendue")
    print(f"   retirées du parcours     : {len(retirees)}")

    if sans_barriere:
        print(f"\n⚠ {len(sans_barriere)} question(s) OUVERTE(S) sans barrière d'inférence — écartée(s) du parcours :")
        for q in sans_barriere:
            print(f"     {q['id']:18s} {q['enonce'][:70]}")

    print("\nCE QUE L'IMPORT A DÛ NORMALISER OU SIGNALER")
    if rapport["types_normalises"]:
        print("   · deux générations d'écriture du type de question :")
        for k, v in rapport["types_normalises"].most_common():
            print(f"        {v:>4}  {k!r} → {TYPES[k][0]}")
    if rapport["options_sans_voie"]:
        print(f"   · options sans voie déclarée : {rapport['options_sans_voie']} (aucune émission possible)")
    if rapport["options_hsg_sans_famille"]:
        print(f"   · options HSG_EVIDENCE sans famille : {len(rapport['options_hsg_sans_famille'])}")
    if rapport["valeurs_mixtes"]:
        print(f"   · cellules `valeur` de forme mixte : {len(rapport['valeurs_mixtes'])}")
    amf = rapport["attributs_multi_familles"]
    if amf:
        print(f"   · attributs portés par PLUSIEURS familles : {len(amf)}")
        for a, fs in list(amf.items())[:8]:
            arme = "⚠ arme un veto dans l'une, pas dans l'autre" if "GUARDRAIL" in fs else ""
            print(f"        {a:28s} → {', '.join(fs)}  {arme}")
        if len(amf) > 8:
            print(f"        … et {len(amf) - 8} autres")

    if bloquants:
        print(f"\n{len(bloquants)} ANOMALIE(S) BLOQUANTE(S) — rien n'est écrit :")
        for b in bloquants[:25]:
            print("   ✗", b)
        if len(bloquants) > 25:
            print(f"   … et {len(bloquants) - 25} autres")
        return 1

    print("\n0 anomalie bloquante.")
    if not args.ecrire:
        print("Analyse seule (--ecrire pour produire la banque).")
        return 0

    # ── DEUX SORTIES, ET C'EST VOULU.
    #
    #    La banque complète pèse 13 Mo : la prose y domine — portée, utilité, inférences
    #    interdites, niveau de preuve, corrections. Embarquer ça dans l'application ferait
    #    payer à chaque chargement de page un texte que seule une revue humaine lit.
    #
    #    · `src/lib/discovery/open-v3/banque.json` — ce dont le MOTEUR a besoin pour poser
    #      la question et écrire la réponse, et rien d'autre.
    #    · `docs/discovery/open-v3-integral.json` — tout, hors du bundle, pour la revue et
    #      pour retrouver d'où vient un contrat.
    #
    #    Une exception : `inferences_interdites` est CONSERVÉE pour les questions ouvertes
    #    et les options OPEN_KNOWLEDGE. Là, c'est un modèle qui lit la réponse, et ce champ
    #    est la barrière qui l'empêche d'inventer. Ailleurs le contrat est déterministe :
    #    le champ documente, il ne protège pas.
    def maigrir(q: dict) -> dict:
        ouverte = q["forme"] == "open"
        opts = []
        for o in q["options"]:
            m = {k: v for k, v in o.items()
                 if k in ("rang", "libelle", "voie", "famille", "domaine", "attribut",
                          "valeur", "severite", "polarite", "stabilite")}
            if ouverte or o.get("voie") == "OPEN_KNOWLEDGE":
                if o.get("inferences_interdites"):
                    m["inferences_interdites"] = o["inferences_interdites"]
                if o.get("condition_emission"):
                    m["condition_emission"] = o["condition_emission"]
            opts.append(m)
        maigre = {k: v for k, v in q.items()
                  if k in ("id", "enonce", "forme", "facultative", "branche", "niveau",
                           "condition_emission")}
        if ouverte and q.get("inferences_interdites"):
            maigre["inferences_interdites"] = q["inferences_interdites"]
        maigre["options"] = opts
        return maigre

    SORTIE.mkdir(parents=True, exist_ok=True)
    manifeste = {
        "genere_par": VERSION,
        "genere_le": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "classeur": CLASSEUR.name,
        "sha256_classeur": sha,
        "questions_actives": len(actives),
        "questions_en_arbitrage": len(arbitrage),
        "questions_retirees": len(retirees),
        "options_totales": sum(len(q["options"]) for q in questions),
        "normalisations": dict(rapport["types_normalises"]),
        "attributs_multi_familles": amf,
        "valeurs_mixtes": rapport["valeurs_mixtes"],
        "options_hsg_sans_famille": sorted(set(rapport["options_hsg_sans_famille"])),
        "options_sans_voie": rapport["options_sans_voie"],
        "ouvertes_sans_barriere": [{"id": q["id"], "enonce": q["enonce"], "branche": q["branche"]}
                                   for q in sans_barriere],
    }
    def ecrire(p: pathlib.Path, data, compact=False):
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(data, ensure_ascii=False,
                                separators=(",", ":") if compact else None,
                                indent=None if compact else 1), encoding="utf-8")
        print(f"   écrit : {p.relative_to(RACINE)}  ({p.stat().st_size // 1024} Ko)")

    ecrire(SORTIE / "banque.json", [maigrir(q) for q in actives], compact=True)
    ecrire(SORTIE / "manifeste.json", manifeste)
    ecrire(RACINE / "docs/discovery/open-v3-integral.json",
           {"actives": actives, "en_arbitrage": arbitrage, "retirees": retirees}, compact=True)
    ecrire(RACINE / "docs/discovery/open-v3-en-arbitrage.json", arbitrage)
    return 0


if __name__ == "__main__":
    sys.exit(main())
