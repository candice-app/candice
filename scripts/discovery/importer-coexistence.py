#!/usr/bin/env python3
"""Importe l'onglet 13_COEXISTENCE_GENERATIONS du classeur officiel (révision 3) vers
src/lib/discovery/open-v3/coexistence.json. Vérifie l'empreinte du classeur avant de lire, et
s'arrête sur toute décision qu'il ne connaît pas : une règle inconnue ne se devine pas."""
import openpyxl, json, hashlib, sys, os
ICI = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.join(ICI, '..', '..')
F = os.path.join(RACINE, 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_5.xlsx')
SHA = '70469c254fede8b8baa21959c8131a16322d3b675b3882d0afde35104ac6d535'
sha = hashlib.sha256(open(F, 'rb').read()).hexdigest()
if sha != SHA: sys.exit(f'empreinte du classeur inattendue : {sha}')
rows = list(openpyxl.load_workbook(F, read_only=True)['13_COEXISTENCE_GENERATIONS'].iter_rows(values_only=True))
assert [str(c) for c in rows[0]] == ['niveau', 'domaine', 'historique', 'prioritaire', 'questions historiques', 'questions 2', 'recoupement options', 'proximité énoncé', 'décision'], rows[0]
CONNUES = {'NEW_PRIMARY', 'KEEP_DISTINCT_CONDITIONED', 'ALIAS_OLD_TO_NEW'}
branches, questions = [], []
for r in rows[1:]:
    if not r or not r[0]: continue
    if r[0] == 'BRANCHE':
        if not str(r[8]).startswith('Un seul pool visible'): sys.exit(f'règle de branche inconnue : {r[8]}')
        branches.append({'domaine': r[1], 'historique': r[2], 'prioritaire': r[3], 'regle': r[8]})
    elif r[0] == 'QUESTION':
        code = str(r[8]).split(' — ')[0].strip()
        if code not in CONNUES: sys.exit(f'décision inconnue : {r[8]}')
        questions.append({'ancienne': r[2], 'nouvelle': r[3], 'decision': code, 'regle': r[8]})
    else: sys.exit(f'niveau inconnu : {r[0]}')
out = {'classeur': os.path.basename(F), 'sha256_classeur': SHA, 'onglet': '13_COEXISTENCE_GENERATIONS', 'branches': branches, 'questions': questions}
json.dump(out, open(os.path.join(RACINE, 'src/lib/discovery/open-v3/coexistence.json'), 'w'), ensure_ascii=False, indent=1)
print(len(branches), 'branches ·', len(questions), 'questions')
for q in questions:
    if q['decision'] == 'ALIAS_OLD_TO_NEW': print(q)
