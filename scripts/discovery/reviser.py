# -*- coding: utf-8 -*-
"""RÉVISION 1 du classeur officiel — applique les arbitrages déjà rendus, et SEULEMENT eux.

SOURCE INTACTE : OFFICIEL.xlsx, sha256 53b08fbc05ca1d9da300218a193aa4baabebdb0c5b3a142b401a086c6142649c
Rien n'est écrit dessus. La révision est un FICHIER DISTINCT, et chaque cellule changée
est tracée — onglet, cellule, avant, après, décision qui l'autorise.

Pourquoi un fichier distinct plutôt qu'une modification en place : la fois précédente,
j'avais modifié le classeur et présenté le résultat comme « le référentiel ». L'écart
n'est apparu que lorsque Estelle a rejoué un contrôle sur SON fichier. Une révision qui
ne se distingue pas de sa source est indétectable.
"""
import hashlib, json, shutil, openpyxl

SRC = 'OFFICIEL.xlsx'
DST = 'REVISION_1.xlsx'
ATTENDU = '53b08fbc05ca1d9da300218a193aa4baabebdb0c5b3a142b401a086c6142649c'
ONGLET = '17_DESTINATIONS_CONDITIONNELLES'

h = hashlib.sha256(open(SRC, 'rb').read()).hexdigest()
assert h == ATTENDU, f'source inattendue : {h}'

def cell(col_idx, row):      # 0-based col → lettre
    s = ''; n = col_idx + 1
    while n: n, r = divmod(n - 1, 26); s = chr(65 + r) + s
    return f'{s}{row}'

shutil.copy(SRC, DST)
w = openpyxl.load_workbook(DST)
ws = w[ONGLET]
head = [c.value for c in ws[1]]
i = {h2: k for k, h2 in enumerate(head)}
diff = []

# ── 1. Les 15 statuts EXECUTABLE → DEFINIE.
#     « EXECUTABLE » décrivait une intention ; « DEFINIE » décrit l'état réel — le contrat
#     est arrêté, son exécution par l'application reste à prouver. Le mot ne doit pas
#     laisser croire que le site l'applique déjà.
for r in range(2, ws.max_row + 1):
    c = ws.cell(row=r, column=i['statut'] + 1)
    if c.value == 'EXECUTABLE':
        diff.append({'onglet': ONGLET, 'cellule': cell(i['statut'], r), 'colonne': 'statut',
                     'avant': 'EXECUTABLE', 'apres': 'DEFINIE',
                     'decision': 'DEFINIE décrit le contrat arrêté ; EXECUTABLE se gagne par la preuve applicative'})
        c.value = 'DEFINIE'

# ── 2. Colonne `relationship`, 18e.
#     SANS_OBJET et NON_PRECISE ne disent pas la même chose, et c'est tout l'intérêt :
#     SANS_OBJET = la destination n'est pas un INTEREST, le champ n'a aucun sens ici.
#     NON_PRECISE = c'est un INTEREST, et le degré d'engagement n'est PAS établi.
#     Les confondre ferait disparaître la différence entre « hors sujet » et « inconnu ».
col_rel = len(head)
ws.cell(row=1, column=col_rel + 1).value = 'relationship'
diff.append({'onglet': ONGLET, 'cellule': cell(col_rel, 1), 'colonne': '(en-tête)',
             'avant': None, 'apres': 'relationship',
             'decision': 'le degré d’engagement d’un INTEREST n’avait aucune colonne où s’écrire'})
for r in range(2, ws.max_row + 1):
    qid = ws.cell(row=r, column=i['question_id'] + 1).value
    v = 'NON_PRECISE' if qid == 'learning2.1459' else 'SANS_OBJET'
    ws.cell(row=r, column=col_rel + 1).value = v
    diff.append({'onglet': ONGLET, 'cellule': cell(col_rel, r), 'colonne': 'relationship',
                 'avant': None, 'apres': v,
                 'decision': ('learning2.1459 : intérêt établi, degré inconnu → export null, stabilite contextual'
                              if v == 'NON_PRECISE' else 'destination non-INTEREST → champ sans objet, omis à l’export')})

# ── 3. evidence_role : secondary pour les neuf HSG, SANS_OBJET pour les six faits.
#     Règle : 9_CONTRATS_OUVERTS.condition_extraction_v2 — « secondary uniquement si le
#     segment source démontre la valeur et sa portée ». Un fait ne porte pas de rôle de
#     preuve : SANS_OBJET, jamais une valeur par défaut.
for r in range(2, ws.max_row + 1):
    voie = ws.cell(row=r, column=i['voie'] + 1).value
    c = ws.cell(row=r, column=i['evidence_role'] + 1)
    v = 'secondary' if voie == 'HSG_EVIDENCE' else 'SANS_OBJET'
    diff.append({'onglet': ONGLET, 'cellule': cell(i['evidence_role'], r), 'colonne': 'evidence_role',
                 'avant': c.value, 'apres': v,
                 'decision': ('9_CONTRATS_OUVERTS.condition_extraction_v2 — secondary si le segment démontre la valeur ET sa portée'
                              if v == 'secondary' else 'voie FACT : un fait ne porte pas de rôle de preuve')})
    c.value = v

w.save(DST)
hr = hashlib.sha256(open(DST, 'rb').read()).hexdigest()
meta = {'source': SRC, 'source_sha256': ATTENDU, 'revision': DST, 'revision_sha256': hr,
        'onglet_touche': ONGLET, 'cellules_modifiees': len(diff), 'diff': diff}
json.dump(meta, open('/mnt/user-data/outputs/revision-1-diff.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=2)

print(f'source   {ATTENDU}')
print(f'révision {hr}')
print(f'{len(diff)} cellules modifiées, toutes dans {ONGLET}\n')
import collections
par = collections.Counter(d['colonne'] for d in diff)
for k, v in par.items(): print(f'  {k:16s} {v:3d} cellule(s)')
print()
print('DIFF (extrait) :')
for d in diff[:3] + diff[15:18] + diff[-3:]:
    print(f"  {d['cellule']:6s} {d['colonne']:14s} {str(d['avant']):12s} → {d['apres']}")
