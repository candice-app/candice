#!/usr/bin/env python3
"""DOSSIERS DU 19 NOV. — ce que les décisions 3 et 8, les 68 questions en arbitrage, la matrice
d'attributs (onglet 3) et le registre M1–M9 (onglet 15) demandent de FOURNIR ou de VÉRIFIER.
Tout est lu dans la banque active et le classeur : rien n'est recopié d'un ancien relevé.
Usage : python3 scripts/discovery/dossiers-19nov.py   (depuis la racine du dépôt)"""
import json, re, pathlib, collections, openpyxl
R = pathlib.Path(__file__).resolve().parents[2]
B = json.load(open(R / 'src/lib/discovery/open-v3/banque.json', encoding='utf8')); B = B if isinstance(B, list) else B['questions']
MAN = json.load(open(R / 'src/lib/discovery/open-v3/manifeste.json', encoding='utf8'))
Q = {q['id']: q for q in B}
ARB = json.load(open(R / 'docs/discovery/open-v3-en-arbitrage.json', encoding='utf8'))
wb = openpyxl.load_workbook(R / 'docs/discovery' / MAN['classeur'], read_only=True)
t = lambda v: '' if v is None else re.sub(r'\s+', ' ', str(v)).strip()
out = {}; md = [f"# Dossiers du 19 novembre\n\nClasseur : `{MAN['classeur']}`. Produit par `scripts/discovery/dossiers-19nov.py`.\n"]

# ═══ DÉCISION 3 — « Réussite — axe … » ═══
axes = collections.OrderedDict()
for q in B:
    m = re.match(r'^Niveau B Réussite — axe ([^—(]+)', t(q['condition_emission']))
    if m: axes.setdefault(m.group(1).strip(), []).append(q)
sel = Q['success.1711']
corr = {a: next((o['libelle'] for o in sel['options'] if re.sub(r'^(Le |La |L’)', '', o['libelle']).lower() == a.lower()), None) for a in axes}
out['decision_3'] = {'colonne': 'condition d’émission (onglet 0_FICHE_CANONIQUE)', 'axes': {a: [q['id'] for q in qs] for a, qs in axes.items()},
    'selecteur_propose': {'question': sel['id'], 'enonce': sel['enonce'], 'option_par_axe': corr}}
md += ["## Décision 3 — « Réussite — axe Sécurité » et ses voisins\n",
  "**Colonne.** La condition d’émission de la question (onglet 0).\n",
  f"**Formulation complète.** « Niveau B Réussite — axe Sécurité », parfois suivie d’une note (« — sensitivity: HIGH — jamais communiqué… », « — croise philovie.1646 »).\n",
  f"**Valeurs voisines.** {len(axes)} axes, {sum(len(v) for v in axes.values())} questions : " + ' · '.join(f"{a} ({len(v)})" for a, v in axes.items()) + ".\n",
  "**Trois questions représentatives.**\n"] + [f"- `{q['id']}` — « {q['enonce']} » — {t(q['condition_emission'])}" for q in axes.get('Sécurité', [])[:3]] + [
  "\n**Fonction.** C’est un regroupement éditorial à l’intérieur du niveau B de la branche Réussite : il range les questions par dimension de la réussite. Aucune règle du classeur ne dit ce qui ouvre un axe. Aujourd’hui ces questions ne sont pas posées.\n",
  f"**Ce qui pourrait le rendre vrai.** `{sel['id']}` — « {sel['enonce']} » (niveau A, réponse multiple) a exactement {len(sel['options'])} réponses, une par axe :\n",
  "| Axe du classeur | Réponse à success.1711 |\n|---|---|"] + [f"| {a} | {corr[a] or '— aucune —'} |" for a in axes] + [
  "\n**Choix à faire.** (a) Un axe s’ouvre quand sa dimension est cochée à `success.1711`. Limite : la question demande la dimension que la personne *aimerait développer*, pas celle qui compte déjà pour elle. "
  "(b) Tous les axes s’ouvrent avec le niveau B de la branche, le regroupement restant purement éditorial. (c) Autre source. Rien n’est activé en attendant.\n"]

# ═══ DÉCISION 8 — 31 motivations de vie, 11 aides à l'apprentissage ═══
REVUE = {'dreams.2004': 'motivation', 'philovie.1636': 'motivation', 'values.1910': 'motivation', 'learning2.1455': 'aide'}
lignes = [{'question': i, 'enonce': Q[i]['enonce'], 'reponse': o['libelle'], 'nature': n, 'attribut': o.get('attribut'), 'domaine': o.get('domaine'), 'ecrit_aujourd_hui': f"{o.get('famille')}.{o.get('domaine')}.{o.get('attribut')}"}
          for i, n in REVUE.items() for o in Q[i]['options'] if o.get('attribut') in ('value_sought', 'facilitator')]
eq = collections.defaultdict(list)
for l in lignes: eq[l['reponse'].lower()].append(l['question'])
PROP = {
 'dreams.2004': ("le projet ou le rêve dont la personne parle (« ce projet ») — pas sa vie en général", "connaissance ouverte « raison pour laquelle ce projet compte », rattachée à ce projet ; ni DRIVER, ni NEED, ni préférence générale"),
 'philovie.1636': ("sa vie en général, déclarée", "connaissance ouverte de type « priorité de vie » (même traitement que la question « moteurs » de l’onboarding, décision du 5 oct.) ; ni DRIVER, ni NEED"),
 'values.1910': ("sa vie en général, déclarée", "connaissance ouverte de type « priorité de vie » ; ni DRIVER, ni NEED"),
 'learning2.1455': ("sa façon d’apprendre", "fait déclaré « ce qui déclenche l’envie d’apprendre » dans le domaine de l’apprentissage ; aucune préférence sur des personnes (« une discussion », « une rencontre » décrivent un déclencheur, pas un goût pour quelqu’un)"),
}
out['decision_8'] = {'lignes': lignes, 'propositions': {k: {'portee': v[0], 'destination': v[1]} for k, v in PROP.items()}, 'equivalents': {k: v for k, v in eq.items() if len(v) > 1}}
n_m = sum(1 for l in lignes if l['nature'] == 'motivation'); n_a = len(lignes) - n_m
md += [f"\n## Décision 8 — {n_m} motivations de vie, {n_a} aides à l’apprentissage\n",
  "Ces lignes étaient rangées DRIVER ; la révision 2 les a reclassées en préférence (`value_sought`, `facilitator`) sans que l’accord les couvre. **Depuis aujourd’hui elles n’écrivent plus rien** tant que leur sens n’est pas établi (`sens-en-revue.json`).\n",
  "| Question | Énoncé | Réponses | Portée | Destination proposée |\n|---|---|---|---|---|"]
for i in REVUE:
    rs = [l['reponse'] for l in lignes if l['question'] == i]
    md.append(f"| `{i}` | {Q[i]['enonce']} | {len(rs)} : {' · '.join(rs)} | {PROP[i][0]} | {PROP[i][1]} |")
md += ["\n**Cas équivalents** (même réponse dans plusieurs questions) : " + ' ; '.join(f"« {k} » ({', '.join(v)})" for k, v in eq.items() if len(v) > 1) + ".\n",
  "**Choix à faire.** Valider ou corriger la destination proposée, question par question. La révision du classeur et l’import suivront.\n"]

# ═══ LES 68 QUESTIONS EN ARBITRAGE ═══
# Le point à arbitrer est écrit par le classeur, réponse par réponse (colonnes « statut » et « point à arbitrer »).
ws0 = wb['0_FICHE_CANONIQUE']; it0 = ws0.iter_rows(values_only=True); H0 = {t(c): i for i, c in enumerate(next(it0))}
points = collections.defaultdict(list); courant = None
for r in it0:
    g = t(r[H0['ligne']])
    if g == 'QUESTION': courant = t(r[H0['question_id']])
    elif g.startswith('→') and 'ARBITRAGE' in t(r[H0['statut']]).upper(): points[courant].append({'reponse': t(r[H0['ÉNONCÉ / RÉPONSE']]), 'statut': t(r[H0['statut']]), 'point': t(r[H0['point à arbitrer']])})
par_enonce = collections.defaultdict(list)
for q in B: par_enonce[t(q['enonce']).lower()].append(q['id'])
qual = []
for q in ARB:
    jumelles = par_enonce.get(t(q['enonce']).lower(), [])
    incompletes = [o['libelle'] for o in q['options'] if o.get('voie') in (None, '', 'None') or (o.get('voie') == 'HSG_EVIDENCE' and not o.get('famille'))]
    pts = points.get(q['id'], [])
    nature = collections.Counter(re.sub(r'\s*[:→].*$', '', x['point'])[:70] or 'point non écrit' for x in pts)
    lecture = ('doublon d’une question active' if jumelles else (nature.most_common(1)[0][0] if pts else 'aucun point écrit sur les réponses'))
    qual.append({'id': q['id'], 'enonce': q['enonce'], 'branche': q['branche'], 'statut': q['statut'], 'meme_enonce_que': jumelles, 'reponses_sans_contrat': incompletes, 'lecture': lecture, 'points': pts})
out['arbitrages'] = qual
c = collections.Counter(x['lecture'] for x in qual)
md += [f"\n## Les {len(ARB)} questions en arbitrage\n", "Elles ne sont ni servies ni lues. Le classeur dit seulement « arbitrage en attente — N réponses ». Ce que la ligne permet de dire :\n",
  "| Lecture | Questions |\n|---|---|"] + [f"| {k} | {v} |" for k, v in c.most_common()] + [
  "\n**Doublons d’une question active** (même énoncé) — proposition : garder l’active, retirer celle-ci.\n", "| En arbitrage | Énoncé | Active |\n|---|---|---|"] + [
  f"| `{x['id']}` | {x['enonce']} | {', '.join('`'+j+'`' for j in x['meme_enonce_que'])} |" for x in qual if x['meme_enonce_que']] + [
  "\n**Exemples de point écrit par le classeur.**\n"] + ([f"- `{x['id']}` « {x['enonce']} » — réponse « {x['points'][0]['reponse']} » : {x['points'][0]['point']}" for x in [y for y in qual if y['points'] and not y['meme_enonce_que']][:3]]
  or [f"Aucune : pour les {sum(1 for y in qual if not y['meme_enonce_que'])} autres, le classeur n’écrit rien sur les réponses — ni contrat, ni point à trancher. Il n’y a rien à arbitrer tant qu’une proposition de contrat n’est pas écrite pour chacune."]) + [
  f"\nLes {len(ARB)} sont listées une à une dans `dossiers-19nov.json` (clé `arbitrages`). Les 56 autres des 68 d’origine ont été rendues actives par la révision 6 (`revision-6-diff.json`).\n"]

# ═══ ONGLET 3 — MATRICE D'ATTRIBUTS ═══
rows = list(wb['3_MATRICE_ATTRIBUTS'].iter_rows(values_only=True))
matrice = {t(r[2]): t(r[0]) for r in rows[1:] if t(r[2])}
utilises = collections.Counter(o.get('attribut') for q in B for o in q['options'] if o.get('attribut'))
hors = {a: n for a, n in utilises.items() if a not in matrice}
inutilises = [a for a in matrice if a not in utilises]
out['matrice_attributs'] = {'attributs_de_la_matrice': len(matrice), 'attributs_utilises_par_la_banque': len(utilises), 'utilises_absents_de_la_matrice': hors, 'de_la_matrice_jamais_utilises': inutilises}
md += [f"\n## Onglet 3 — matrice d’attributs\n", f"La matrice définit {len(matrice)} attributs ; la banque active en emploie {len(utilises)}.\n",
  f"- **Employés par la banque et absents de la matrice : {len(hors)}.** " + (', '.join(f"`{a}` ({n} réponses)" for a, n in sorted(hors.items(), key=lambda x: -x[1])) or 'aucun') + ".",
  f"- **Définis par la matrice et jamais employés : {len(inutilises)}.** " + (', '.join(f"`{a}`" for a in inutilises) or 'aucun') + ".\n"]

# ═══ ONGLET 15 — REGISTRE M1–M9, vérifié là où il nomme une ligne ═══
def opt(qid, rang):
    q = Q.get(qid); return next((o for o in q['options'] if str(o.get('rang')) == str(rang)), None) if q else None
CONTROLES = {
 'M1': [('celebav.2179', r, lambda o: o.get('voie') == 'FACT', 'FACT') for r in range(1, 5)],
 'M4': [('dreams.2002', r, lambda o: o.get('voie') == 'FACT', 'FACT') for r in range(1, 7)],
 'M6': [('time.1549', r, lambda o: o.get('attribut') == 'pace_preference', 'pace_preference') for r in range(1, 5)] + [('travel2.0897', r, lambda o: o.get('attribut') == 'pace_preference', 'pace_preference') for r in range(1, 7)],
 'M7': [('philovie.1648', r, lambda o: o.get('voie') == 'FACT', 'FACT') for r in range(1, 6)],
 # M2, M3, M5, M8 : le registre renvoie à l’annexe A ; l’onglet 4 nomme les questions concernées.
 'M2': [(qid, o.get('rang'), lambda o: o.get('attribut') == 'service_preference' or o.get('voie') != 'HSG_EVIDENCE' or o.get('famille') == 'GUARDRAIL' or o.get('attribut') == 'gift_format', 'service_preference (hors garde-fous, paramètres d’action et formes de cadeau)')
        for qid in ['daily2.1143', 'dreams.1999', 'celebav.2155', 'craft.0666', 'daily2.1120'] for o in (Q[qid]['options'] if qid in Q else [])],
 'M3': [('money.1582', r, lambda o: o.get('famille') == 'BEHAVIOR' and o.get('attribut') == 'gift_spending_posture', 'BEHAVIOR gift_spending_posture') for r in range(1, 5)],
 'M5': [('REM-11', r, lambda o: o.get('voie') == 'ACTION_PARAMETER', 'ACTION_PARAMETER') for r in range(1, 9)],
 'M8': [('humor2.1422', r, lambda o: o.get('voie') == 'FACT', 'FACT') for r in (1, 2, 3, 5)],
 'M9': [('joys.1893', 1, lambda o: 'active_listening' in json.dumps(o, ensure_ascii=False), 'active_listening'), ('bond.1669', 3, lambda o: 'availability_when_needed' in json.dumps(o, ensure_ascii=False), 'availability_when_needed'),
        ('bond.1669', 8, lambda o: 'notice_distress' in json.dumps(o, ensure_ascii=False), 'notice_distress')],
}
reg = []
md += ["\n## Onglet 15 — registre M1 à M9\n", "Le classeur les dit toutes « appliquées ». Vérification dans la banque active, là où le registre nomme une ligne :\n", "| Décision | Sujet | Vérification |\n|---|---|---|"]
for r in list(wb['15_REGISTRE_M1_M9'].iter_rows(values_only=True))[1:]:
    code = t(r[0]); cs = CONTROLES.get(code)
    if not cs: verdict = "non vérifiable : le registre renvoie à l’annexe A sans nommer de ligne"
    else:
        ko = []
        for qid, rang, test, attendu in cs:
            o = opt(qid, rang)
            if o is None: ko.append(f"{qid} r{rang} : " + ("question en arbitrage, absente de la banque active" if any(a['id'] == qid for a in ARB) else "introuvable"))
            elif not test(o): ko.append(f"{qid} r{rang} : attendu {attendu}, lu voie={o.get('voie')} attribut={o.get('attribut')}")
        verdict = f"conforme sur {len(cs)} ligne(s)" if not ko else f"ÉCART sur {len(ko)}/{len(cs)} : " + ' ; '.join(ko)
    if code == 'M2' and not ko:
        verdict += " — mais le registre rend OBLIGATOIRES l’acteur (Candice, proche, prestataire), le bénéficiaire et le contexte : aucune de ces lignes ne les porte, et le producteur ne les écrit pas. Le sens « qui doit assister » n’est donc pas conservé à l’écriture."
    reg.append({'decision': code, 'sujet': t(r[1]), 'application_declaree': t(r[3]), 'verification': verdict})
    md.append(f"| {code} | {t(r[1])} | {verdict} |")
out['registre_m1_m9'] = reg

(R / 'docs/discovery/dossiers-19nov.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf8')
(R / 'docs/discovery/dossiers-19nov.md').write_text('\n'.join(md) + '\n', encoding='utf8')
print(json.dumps({'axes': {a: len(v) for a, v in axes.items()}, 'axes_sans_reponse': [a for a in axes if not corr[a]], 'decision_8': [n_m, n_a], 'arbitrages': dict(c), 'attributs_hors_matrice': hors, 'inutilises': len(inutilises), 'registre': [(x['decision'], x['verification'][:70]) for x in reg]}, ensure_ascii=False, indent=1))
