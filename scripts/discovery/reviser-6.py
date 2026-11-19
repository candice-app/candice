#!/usr/bin/env python3
"""RÉVISION 6 DU RÉFÉRENTIEL OPEN V3 — 19 nov. : les questions dites « en arbitrage » qui ne le sont plus.

CONSTAT. Soixante-huit questions portent le statut « ARBITRAGE EN ATTENTE — N réponse(s) » et sont
tenues hors du parcours. Or le classeur a lui-même consigné, réponse par réponse, dans la colonne
« point à arbitrer », l'arbitrage rendu par l'ordre de clôture (« Arbitré par l'ordre de clôture,
annexe A : … »), et les cellules du contrat portent déjà la décision. Seul le statut de la ligne
QUESTION n'a pas été mis à jour.

CE QUE FAIT LA RÉVISION. Pour une question, et seulement si TOUTES ces conditions tiennent :
  · le nombre de réponses portant « Arbitré par l'ordre de clôture » est au moins le N annoncé ;
  · chaque réponse arbitrée a ses cellules (voie, famille, attribut) CONFORMES à l'arbitrage écrit ;
  · toutes ses réponses sont « SEMANTICALLY_REVIEWED » ;
alors le statut de la ligne QUESTION devient « REVUE », comme les 2 225 questions actives. Rien
d'autre n'est écrit : aucun contrat, aucun énoncé, aucune réponse.
Les questions qui ne remplissent pas ces conditions restent en arbitrage, et sont listées.

ÉCHOUE FERMÉ : sha de la source, texte exact attendu avant chaque écriture.
Usage : python3 scripts/discovery/reviser-6.py   (depuis la racine du dépôt)
"""
import hashlib, json, re, sys, pathlib, collections
import openpyxl
RACINE = pathlib.Path(__file__).resolve().parents[2]
SRC = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_5.xlsx'
DST = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_6.xlsx'
DIFF = RACINE / 'docs/discovery/revision-6-diff.json'
ATTENDU = json.load(open(RACINE / 'docs/discovery/revision-5-diff.json', encoding='utf8'))['revision_sha256']
if hashlib.sha256(SRC.read_bytes()).hexdigest() != ATTENDU: sys.exit('ÉCHEC — source inattendue. La révision 6 ne part que de la révision 5.')
def lettre(i):
    s = ''; n = i + 1
    while n: n, r = divmod(n - 1, 26); s = chr(65 + r) + s
    return s
t = lambda v: '' if v is None else re.sub(r'\s+', ' ', str(v)).strip()
wb = openpyxl.load_workbook(SRC); ws = wb['0_FICHE_CANONIQUE']
C = {t(c.value): i for i, c in enumerate(ws[1])}
col = lambda r, n: t(ws.cell(row=r, column=C[n] + 1).value)
questions = collections.OrderedDict(); cur = None
for r in range(2, ws.max_row + 1):
    g = col(r, 'ligne')
    if g == 'QUESTION':
        cur = col(r, 'question_id'); m = re.match(r'^ARBITRAGE EN ATTENTE — (\d+) réponse\(s\)$', col(r, 'statut'))
        questions[cur] = {'ligne': r, 'n': int(m.group(1)) if m else None, 'reponses': []} if m else None
    elif g.startswith('→') and questions.get(cur): questions[cur]['reponses'].append(r)
en_attente = {k: v for k, v in questions.items() if v}
if len(en_attente) != 68: sys.exit(f'ÉCHEC — {len(en_attente)} questions en arbitrage au lieu de 68.')

DEC = ("19 nov. : toutes les réponses que la ligne annonçait en attente portent l'arbitrage de l'ordre de clôture (annexe A), "
       "écrit par le classeur dans « point à arbitrer », et leurs cellules de contrat y sont conformes. Le statut de la question est mis à jour ; rien d'autre.")
diff, activees, restent = [], [], []
for qid, q in en_attente.items():
    arbitrees, ecarts = 0, []
    for r in q['reponses']:
        if col(r, 'statut') != 'SEMANTICALLY_REVIEWED': ecarts.append(f"{lettre(C['statut'])}{r} : statut « {col(r, 'statut')} »")
        p = col(r, 'point à arbitrer')
        m = re.match(r'^Arbitré par l’ordre de clôture, annexe A : (.+?)(?: → (.*))?$', p)
        if not m: continue
        arbitrees += 1
        parts = [x.strip() for x in m.group(1).split('/')]
        if parts[0] not in ('HSG_EVIDENCE', 'FACT', 'ACTION_PARAMETER', 'DISCOVERY_STATE', 'OPEN_KNOWLEDGE', 'NO_EMISSION'): ecarts.append(f"{lettre(C['point à arbitrer'])}{r} : arbitrage illisible « {p[:80]} »"); continue
        if col(r, 'voie') != parts[0]: ecarts.append(f"{lettre(C['voie'])}{r} : voie « {col(r, 'voie')} », arbitrage « {parts[0]} »")
        if len(parts) > 1 and parts[1] in ('PREFERENCE', 'GUARDRAIL', 'BEHAVIOR', 'INTEREST', 'ENTITY', 'NEED', 'DRIVER', 'CONTEXT', 'PROFILE', 'AFFECTION_LANGUAGE') and col(r, 'famille HSG') != parts[1]:
            ecarts.append(f"{lettre(C['famille HSG'])}{r} : famille « {col(r, 'famille HSG')} », arbitrage « {parts[1]} »")
        if len(parts) > 2 and re.match(r'^[a-z_]+$', parts[2]) and col(r, 'attribut') != parts[2]:
            ecarts.append(f"{lettre(C['attribut'])}{r} : attribut « {col(r, 'attribut')} », arbitrage « {parts[2]} »")
    if arbitrees >= q['n'] and not ecarts:
        c = ws.cell(row=q['ligne'], column=C['statut'] + 1)
        diff.append({'bloc': 'J', 'onglet': ws.title, 'cellule': f"{lettre(C['statut'])}{q['ligne']}", 'question_id': qid, 'colonne': 'statut', 'avant': c.value, 'apres': 'REVUE',
                     'decision': DEC, 'reponses_annoncees': q['n'], 'reponses_arbitrees': arbitrees, 'enonce': col(q['ligne'], 'ÉNONCÉ / RÉPONSE')})
        c.value = 'REVUE'; activees.append(qid)
    else:
        restent.append({'question_id': qid, 'enonce': col(q['ligne'], 'ÉNONCÉ / RÉPONSE'), 'reponses_annoncees': q['n'], 'reponses_arbitrees': arbitrees, 'ecarts': ecarts,
                        'reponses': [col(r, 'ÉNONCÉ / RÉPONSE') for r in q['reponses']]})
if not activees: sys.exit('ÉCHEC — aucune question ne remplit les conditions.')
wb.save(DST)
sha = hashlib.sha256(DST.read_bytes()).hexdigest()
DIFF.write_text(json.dumps({'source': SRC.name, 'source_sha256': ATTENDU, 'revision': DST.name, 'revision_sha256': sha, 'cellules_modifiees': len(diff),
    'questions_activees': activees, 'restent_en_arbitrage': restent, 'diff': diff}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'révision 6 : {DST.name}\nsha256     : {sha}\nactivées   : {len(activees)} · restent en arbitrage : {len(restent)}')
for x in restent: print('  ', x['question_id'], x['reponses_annoncees'], x['reponses_arbitrees'], x['ecarts'][:2])
