# -*- coding: utf-8 -*-
"""RÉVISION 2 du référentiel — applique les décisions d'Estelle du 18 novembre, et SEULEMENT elles.

SOURCE INTACTE : la révision 1, sha256 cfb63b66…edf2ee. Rien n'est écrit dessus. La révision 2
est un FICHIER DISTINCT, et chaque cellule changée est tracée — onglet, cellule, avant, après,
décision qui l'autorise — dans docs/discovery/revision-2-diff.json.

TROIS DÉCISIONS, TROIS BLOCS :

 A. RECLASSEMENT DRIVER → PREFERENCE (162 lignes : 148 dans des questions actives, 14 dans
    deux questions en arbitrage). Le référentiel rangeait sous DRIVER ce que la personne
    RECHERCHE dans une activité, un objet ou un projet (« Quand tu prends une photo, tu
    cherches surtout à… »). DRIVER, dans le journal, est un vocabulaire FERMÉ de moteurs
    d'attention (DRV_…) : aucune de ces lignes n'en porte un. Décision : la valeur recherchée
    devient une préférence rangée dans son contexte exact — PREFERENCE.<domaine>.<attribut> —
    sans produire ni DRIVER, ni trait de personnalité, ni NEED.
    L'ATTRIBUT N'EST PAS TOUCHÉ : 151 lignes portent `value_sought`, 11 portent `facilitator`
    (« Qu'est-ce qui déclenche ton envie d'apprendre ? » — ce qui déclenche, pas ce qui est
    cherché). Les fondre sous un seul nom effacerait cette différence.
    Les deux onglets qui portent la famille sont corrigés ensemble (0_FICHE_CANONIQUE et
    1_CONTRATS_PAR_REPONSE) : un classeur qui se contredit d'un onglet à l'autre ne tranche rien.

 B. BRANCHE « CAUSES » SENSIBLE. La branche compte 30 questions (et non 14 — voir le bloc B).
    Les 22 qui ne portaient aucune marque reçoivent la marque de sensibilité et leur mode
    d'ouverture : démarche explicite de la personne ou sujet abordé spontanément ; un score de
    pertinence seul ne les ouvre pas. Les 9 déjà marquées par le référentiel ne sont pas touchées.

 C. CONTRAT DE food2.0882A. La seule question ouverte sans inférences interdites. Le contrat
    d'Estelle REMPLACE la condition d'émission précédente, qui prévoyait une relation ENTITY
    (WANT_TO_TRY / WANT_TO_OWN) et une PREFERENCE.food.desired_item : la décision du jour
    interdit l'une et l'autre à partir de cette seule envie. L'ancien texte est conservé dans
    le diff.

ÉCHOUE FERMÉ : la source doit avoir le sha attendu, et chaque bloc vérifie le NOMBRE de lignes
qu'il s'attend à toucher. Un compte inattendu arrête tout avant l'écriture.

Usage : python3 scripts/discovery/reviser-2.py   (depuis la racine du dépôt)
"""
import hashlib, json, re, shutil, sys, pathlib, collections
import openpyxl

RACINE = pathlib.Path(__file__).resolve().parents[2]
SRC = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_1.xlsx'
DST = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_2.xlsx'
DIFF = RACINE / 'docs/discovery/revision-2-diff.json'
ATTENDU = 'cfb63b66c888a1f34f2b2952d51cfaf7138c905c742c437458af2cfaa7edf2ee'

h = hashlib.sha256(SRC.read_bytes()).hexdigest()
if h != ATTENDU:
    sys.exit(f'ÉCHEC — source inattendue : {h}. La révision 2 ne part que de la révision 1 revue.')

def lettre(col_idx):  # 0-based
    s = ''; n = col_idx + 1
    while n: n, r = divmod(n - 1, 26); s = chr(65 + r) + s
    return s

t = lambda v: '' if v is None else str(v).strip()

shutil.copy(SRC, DST)
wb = openpyxl.load_workbook(DST)
diff = []

def changer(ws, ligne, col_idx, apres, decision, bloc):
    c = ws.cell(row=ligne, column=col_idx + 1)
    avant = c.value
    if t(avant) == t(apres):
        return
    diff.append({'bloc': bloc, 'onglet': ws.title, 'cellule': f'{lettre(col_idx)}{ligne}',
                 'colonne': t(ws.cell(row=1, column=col_idx + 1).value),
                 'avant': avant, 'apres': apres, 'decision': decision})
    c.value = apres

# ═════════════ A. DRIVER → PREFERENCE ═════════════
DEC_A = ("Décision du 18 nov. : une valeur recherchée dans un contexte est une PREFERENCE rangée dans ce "
         "contexte (PREFERENCE.<domaine>.<attribut>). DRIVER est un vocabulaire fermé de moteurs d'attention "
         "(DRV_…) ; aucune de ces lignes n'en porte. Ni DRIVER, ni trait de personnalité, ni NEED.")

ws0 = wb['0_FICHE_CANONIQUE']
C0 = {t(c.value): i for i, c in enumerate(ws0[1])}
question_courante = None
lignes_question = {}         # ligne de la question → [familles de ses options, après correction]
touchees_0 = []
for r in range(2, ws0.max_row + 1):
    lig = t(ws0.cell(row=r, column=C0['ligne'] + 1).value)
    if lig == 'QUESTION':
        question_courante = r
        lignes_question[r] = {'id': t(ws0.cell(row=r, column=C0['question_id'] + 1).value), 'driver': 0}
    elif lig.startswith('→') and t(ws0.cell(row=r, column=C0['famille HSG'] + 1).value) == 'DRIVER':
        changer(ws0, r, C0['famille HSG'], 'PREFERENCE', DEC_A, 'A')
        touchees_0.append(r)
        lignes_question[question_courante]['driver'] += 1
if len(touchees_0) != 162:
    sys.exit(f'ÉCHEC — bloc A, onglet 0 : {len(touchees_0)} lignes DRIVER au lieu de 162. Rien n\'est écrit.')

# Les synthèses de question (« 7 réponses → 7×DRIVER ») sont DÉRIVÉES des options : on les
# recalcule, sinon la ligne de question annoncerait une famille que ses options n'ont plus.
SYNTH = re.compile(r'(\d+)×([A-Z_]+)')
for r, info in lignes_question.items():
    if info['driver'] == 0:
        continue
    cellule = ws0.cell(row=r, column=C0['CE QUE ÇA DIT DE LA PERSONNE'] + 1)
    texte = t(cellule.value)
    if '×DRIVER' not in texte:
        continue
    comptes = collections.OrderedDict()
    for n, fam in SYNTH.findall(texte):
        fam2 = 'PREFERENCE' if fam == 'DRIVER' else fam
        comptes[fam2] = comptes.get(fam2, 0) + int(n)
    debut = texte[:SYNTH.search(texte).start()]
    fin = texte[[m.end() for m in SYNTH.finditer(texte)][-1]:]
    nouveau = debut + ' · '.join(f'{n}×{f}' for f, n in comptes.items()) + fin
    changer(ws0, r, C0['CE QUE ÇA DIT DE LA PERSONNE'], nouveau,
            'synthèse dérivée des options, recalculée après le reclassement', 'A')

ws1 = wb['1_CONTRATS_PAR_REPONSE']
C1 = {t(c.value): i for i, c in enumerate(ws1[1])}
touchees_1 = 0
for r in range(2, ws1.max_row + 1):
    if t(ws1.cell(row=r, column=C1['hsg_family'] + 1).value) == 'DRIVER':
        changer(ws1, r, C1['hsg_family'], 'PREFERENCE', DEC_A, 'A')
        touchees_1 += 1
if touchees_1 != 162:
    sys.exit(f'ÉCHEC — bloc A, onglet 1 : {touchees_1} lignes DRIVER au lieu de 162. Rien n\'est écrit.')

# ═════════════ B. CAUSES SENSIBLE ═════════════
MARQUE_B = ("sensitivity: HIGH — OUVERTURE SUR DÉMARCHE EXPLICITE : la personne choisit d'explorer ce sujet "
            "ou l'aborde spontanément ; un score de pertinence seul ne l'ouvre pas. L'intérêt pour une cause "
            "ne permet de déduire aucune appartenance politique, religieuse ou associative. ║ ")
DEC_B = "Décision du 18 nov. : la branche « causes » rejoint les questions sensibles (22 questions non marquées sur 30)."
# LA BRANCHE COMPTE 30 QUESTIONS, PAS 14. Le chiffre de quatorze venait d'un affichage coupé
# (les quatorze premières lignes d'une liste) pris pour la branche entière ; la première
# version de ce bloc l'attendait, et s'est arrêtée sur le vrai compte. La décision vise la
# BRANCHE, et son motif vaut pour toutes ses questions.
#   · 8 portent déjà une marque de sensibilité du référentiel (7 « HIGH », 1 « MAXIMALE » :
#     causes.1940) : on n'y touche pas. Elles gardent leur propre règle, et restent fermées
#     tant qu'elle n'est pas lisible. Relevé fait par affichage de la marque de chaque
#     question, après deux comptages à l'œil faux (9, puis 8 dont une mal classée).
#   · 22 n'en portent pas : elles reçoivent la marque ET le mode d'ouverture décidé.
causes = [r for r, info in lignes_question.items() if info['id'].startswith('causes.')]
if len(causes) != 30:
    sys.exit(f'ÉCHEC — bloc B : {len(causes)} questions « causes. » au lieu de 30. Rien n\'est écrit.')
SENSIBLE = re.compile(r'sensitivity\s*:\s*(?:high|maximale)|sous-branche sensible|niveau\s+s\b|ne jamais ouvrir', re.I)
marquees = 0
for r in causes:
    avant = t(ws0.cell(row=r, column=C0['condition d’émission'] + 1).value)
    if SENSIBLE.search(avant):
        continue
    changer(ws0, r, C0['condition d’émission'], MARQUE_B + avant, DEC_B, 'B')
    marquees += 1
if marquees != 22:
    sys.exit(f'ÉCHEC — bloc B : {marquees} questions marquées au lieu de 22. Rien n\'est écrit.')

# ═════════════ C. food2.0882A ═════════════
DEC_C = "Décision du 18 nov. : contrat d'extraction de food2.0882A, tel que dicté par Estelle."
INTERDITS_C = ("Une envie de plat ne prouve aucune allergie, aucun régime, aucune conviction, aucune pratique "
               "régulière ni préférence durable. Aucune préférence durable, aucun veto et aucune relation ENTITY "
               "à partir de cette seule envie. Une réponse vide, un refus ou « aucune envie particulière » ne "
               "crée aucune envie.")
EMISSION_C = ("Conserver le verbatim soumis. Enregistrer un FAIT d'envie culinaire ACTUELLE si la réponse "
              "l'exprime, avec les détails et la période effectivement mentionnés (stabilité : temporaire). "
              "Si la personne déclare séparément une allergie ou une contrainte alimentaire, ce segment suit le "
              "chemin déjà autorisé pour cette information, avec ses permissions. Aucune ENTITY, aucune "
              "PREFERENCE, aucun GUARDRAIL.")
q_food = [r for r, info in lignes_question.items() if info['id'] == 'food2.0882A']
if len(q_food) != 1:
    sys.exit(f'ÉCHEC — bloc C : food2.0882A trouvée {len(q_food)} fois. Rien n\'est écrit.')
rq = q_food[0]
changer(ws0, rq, C0['INFÉRENCES INTERDITES'], INTERDITS_C, DEC_C, 'C')
ro = rq + 1
if not t(ws0.cell(row=ro, column=C0['ligne'] + 1).value).startswith('→'):
    sys.exit('ÉCHEC — bloc C : la ligne suivant food2.0882A n\'est pas son option. Rien n\'est écrit.')
changer(ws0, ro, C0['condition d’émission'], EMISSION_C, DEC_C, 'C')
changer(ws0, ro, C0['INFÉRENCES INTERDITES'], INTERDITS_C, DEC_C, 'C')

wb.save(DST)
sha2 = hashlib.sha256(DST.read_bytes()).hexdigest()
par_bloc = collections.Counter(d['bloc'] for d in diff)
DIFF.write_text(json.dumps({
    'source': SRC.name, 'source_sha256': ATTENDU,
    'revision': DST.name, 'revision_sha256': sha2,
    'cellules_modifiees': len(diff), 'par_bloc': dict(par_bloc),
    'diff': diff,
}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'révision 2 : {DST.name}')
print(f'sha256     : {sha2}')
print(f'cellules   : {len(diff)}  ({dict(par_bloc)})')
