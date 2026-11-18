#!/usr/bin/env python3
"""RÉVISION 3 DU RÉFÉRENTIEL OPEN V3 — décisions d'Estelle du 18 nov. (second message).

Part de la RÉVISION 2 (sha vérifié), produit la RÉVISION 3 et son diff. Deux blocs :

 D. SENSIBILITÉ « MOYENNE ». Le référentiel posait la marque sans règle. Décision : une
    question qui la porte s'ouvre quand la personne choisit explicitement d'explorer le sujet,
    ou l'aborde spontanément ; un score seul ne suffit pas ; un refus ou un changement de
    sujet arrête ces relances. La règle est écrite EN TÊTE de la condition de chaque question
    concernée ; la condition d'origine suit « ║ » et continue de s'appliquer.

 E. `food2.0882A`. Décision : la question peut être active dès que son contrat est implémenté
    et testé ; son ouverture n'attend pas une décision d'ajout au Carnet d'envies (ajout qui
    demande, lui, une demande ou une confirmation de la personne). La clause « seulement si
    le Carnet d'envies ne contient pas déjà une entrée culinaire récente » est retirée de la
    condition ; l'ancien texte est conservé dans le diff.

ÉCHOUE FERMÉ : sha de la source, et nombre de lignes attendu par bloc.
Usage : python3 scripts/discovery/reviser-3.py   (depuis la racine du dépôt)
"""
import hashlib, json, re, shutil, sys, pathlib, collections
import openpyxl

RACINE = pathlib.Path(__file__).resolve().parents[2]
SRC = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_2.xlsx'
DST = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_3.xlsx'
DIFF = RACINE / 'docs/discovery/revision-3-diff.json'
ATTENDU = '7a843e8b13f034008334a78da65cc08f626d85c87325d84427e7a122bd1f0a2c'
NB_MOYENNE = int(sys.argv[sys.argv.index('--moyenne') + 1]) if '--moyenne' in sys.argv else None

h = hashlib.sha256(SRC.read_bytes()).hexdigest()
if h != ATTENDU:
    sys.exit(f'ÉCHEC — source inattendue : {h}. La révision 3 ne part que de la révision 2.')

def lettre(i):
    s = ''; n = i + 1
    while n: n, r = divmod(n - 1, 26); s = chr(65 + r) + s
    return s
t = lambda v: '' if v is None else str(v).strip()

wb = openpyxl.load_workbook(SRC)
ws0 = wb['0_FICHE_CANONIQUE']
C0 = {t(c.value): i for i, c in enumerate(ws0[1])}
diff = []
def changer(ligne, col, apres, decision, bloc, qid):
    c = ws0.cell(row=ligne, column=col + 1); avant = c.value
    if t(avant) == t(apres): return
    diff.append({'bloc': bloc, 'onglet': ws0.title, 'cellule': f'{lettre(col)}{ligne}', 'question_id': qid,
                 'colonne': t(ws0.cell(row=1, column=col + 1).value), 'avant': avant, 'apres': apres, 'decision': decision})
    c.value = apres

questions = [(r, t(ws0.cell(row=r, column=C0['question_id'] + 1).value)) for r in range(2, ws0.max_row + 1)
             if t(ws0.cell(row=r, column=C0['ligne'] + 1).value) == 'QUESTION']
COND = C0['condition d’émission']

# ═════════════ D. SENSIBILITÉ MOYENNE ═════════════
MARQUE_D = ("OUVERTURE SUR DÉMARCHE EXPLICITE (sensibilité moyenne) : la personne choisit d'explorer ce sujet "
            "ou l'aborde spontanément, et la relance reste dans ce contexte ; un score de pertinence seul ne "
            "l'ouvre pas ; un refus ou un changement de sujet arrête ces relances. ║ ")
DEC_D = "Décision du 18 nov. : règle d'ouverture des questions de sensibilité MOYENNE."
moyennes = []
for r, qid in questions:
    avant = t(ws0.cell(row=r, column=COND + 1).value)
    if re.search(r'sensitivity\s*:\s*MOYENNE', avant, re.I) and 'OUVERTURE SUR DÉMARCHE EXPLICITE' not in avant:
        moyennes.append((r, qid, avant))
print(f'bloc D : {len(moyennes)} questions portent « sensitivity: MOYENNE »')
if NB_MOYENNE is None:
    sys.exit('Compte seulement. Relancer avec --moyenne <nombre attendu> pour écrire.')
if len(moyennes) != NB_MOYENNE:
    sys.exit(f'ÉCHEC — bloc D : {len(moyennes)} questions au lieu de {NB_MOYENNE}. Rien n\'est écrit.')
for r, qid, avant in moyennes:
    changer(r, COND, MARQUE_D + avant, DEC_D, 'D', qid)

# ═════════════ E. food2.0882A ═════════════
DEC_E = ("Décision du 18 nov. : food2.0882A peut être active dès que son contrat est implémenté et testé ; "
         "l'ajout au Carnet d'envies demande une demande ou une confirmation de la personne et ne conditionne "
         "plus l'ouverture de la question.")
food = [(r, qid) for r, qid in questions if qid == 'food2.0882A']
if len(food) != 1: sys.exit(f'ÉCHEC — bloc E : food2.0882A trouvée {len(food)} fois.')
avant = t(ws0.cell(row=food[0][0], column=COND + 1).value)
ATT_E = 'Niveau C Food — et seulement si le Carnet d’envies ne contient pas déjà une entrée culinaire récente'
if avant != ATT_E: sys.exit(f'ÉCHEC — bloc E : condition inattendue « {avant} ».')
changer(food[0][0], COND, 'Niveau C Food', DEC_E, 'E', 'food2.0882A')

wb.save(DST)
sha = hashlib.sha256(DST.read_bytes()).hexdigest()
DIFF.write_text(json.dumps({'source': SRC.name, 'source_sha256': ATTENDU, 'revision': DST.name, 'revision_sha256': sha,
    'cellules_modifiees': len(diff), 'par_bloc': dict(collections.Counter(d['bloc'] for d in diff)),
    'questions_bloc_D': [q for _, q, _ in moyennes], 'diff': diff}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'révision 3 : {DST.name}\nsha256     : {sha}\ncellules   : {len(diff)}')
