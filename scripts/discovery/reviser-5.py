#!/usr/bin/env python3
"""RÉVISION 5 DU RÉFÉRENTIEL OPEN V3 — décisions d'Estelle du 19 nov. (09h31, points 8).

Part de la RÉVISION 4 (sha vérifié), produit la RÉVISION 5 et son diff. Deux blocs, et rien d'autre :

 H. « CONSOMMATION ET VALEUR ». Décision : au vu des options (qualité, durabilité, utilité,
    fabrication, histoire, émotion), la branche porte sur le RAPPORT AUX OBJETS, À LEUR CHOIX ET
    À LEUR VALEUR POUR LA PERSONNE. Elle ne mesure ni l'amour du shopping, ni des valeurs morales
    générales. Les cinq énoncés à gabarit sont réécrits autour de ce sens. Options et contrats
    ne sont pas touchés ; les options dont le sens s'accorde mal avec l'intention sont ISOLÉES
    dans le diff, pas modifiées.

 I. « FAIBLE PLACE » ≠ REJET, ÉTENDU. Hors des dix-neuf questions à gabarit (révision 4),
    d'autres questions mesurent la place ACTUELLE d'un domaine et écrivent la faible place avec
    la polarité `rejet`. Sont corrigées celles qui remplissent LES DEUX conditions, vérifiables
    sur la ligne : l'énoncé demande la place qu'occupe le domaine (« quelle place », « occupe(nt)
    aujourd'hui / actuellement ») ET la réponse dit une place faible (« peu de place », « très
    peu », « assez peu », « peu », « rarement », « presque jamais », « pas une priorité »).
    Polarité : `rejet` → `absence_de_critere`, comme pour les dix-neuf.
    NON CORRIGÉES, LISTÉES : les autres options `domain_importance` en `rejet`. Elles disent un
    rapport (« ce n'est pas mon univers », « ne m'intéresse pas », « fatigant ») : un désintérêt
    ou une gêne déclarés, pas une mesure de place.

ÉCHOUE FERMÉ : sha de la source, texte exact attendu avant chaque écriture, effectifs par bloc.
Usage : python3 scripts/discovery/reviser-5.py   (depuis la racine du dépôt)
"""
import hashlib, json, re, sys, pathlib, collections
import openpyxl

RACINE = pathlib.Path(__file__).resolve().parents[2]
SRC = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_4.xlsx'
DST = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_5.xlsx'
DIFF = RACINE / 'docs/discovery/revision-5-diff.json'
ATTENDU = '5a66c613db82797d336534a679e513321cbbdbf7bf20cfd12102c4f84cf28eca'
if hashlib.sha256(SRC.read_bytes()).hexdigest() != ATTENDU:
    sys.exit('ÉCHEC — source inattendue. La révision 5 ne part que de la révision 4.')

def lettre(i):
    s = ''; n = i + 1
    while n: n, r = divmod(n - 1, 26); s = chr(65 + r) + s
    return s
t = lambda v: '' if v is None else str(v).strip()
wb = openpyxl.load_workbook(SRC)
ws0 = wb['0_FICHE_CANONIQUE']
C0 = {t(c.value): i for i, c in enumerate(ws0[1])}
diff = []
def changer(ligne, col, apres, decision, bloc, qid, **plus):
    c = ws0.cell(row=ligne, column=col + 1); avant = c.value
    if t(avant) == t(apres): return
    diff.append({'bloc': bloc, 'onglet': ws0.title, 'cellule': f'{lettre(col)}{ligne}', 'question_id': qid,
                 'colonne': t(ws0.cell(row=1, column=col + 1).value), 'avant': avant, 'apres': apres, 'decision': decision, **plus})
    c.value = apres
ENONCE, POL, ATT = C0['ÉNONCÉ / RÉPONSE'], C0['polarité'], C0['attribut']
lignes = []; qid = None
for r in range(2, ws0.max_row + 1):
    genre = t(ws0.cell(row=r, column=C0['ligne'] + 1).value)
    if genre == 'QUESTION': qid = t(ws0.cell(row=r, column=C0['question_id'] + 1).value)
    if genre: lignes.append((r, qid, genre))
ligne_de = {q: r for r, q, g in lignes if g == 'QUESTION'}
enonce_de = {q: t(ws0.cell(row=r, column=ENONCE + 1).value) for q, r in ligne_de.items()}

# ═════════════ H. « Consommation et valeur » ═════════════
DEC_H = ("Décision du 19 nov. : la branche porte sur le rapport aux objets, à leur choix et à leur valeur pour la personne — "
         "ni amour du shopping, ni valeurs morales générales. Énoncé réécrit autour de ce sens ; options et contrats inchangés.")
H = {
 'consumption.0242': ('Quelle place consommation et valeur occupe-t-il réellement dans ta vie ?',
                      'Quelle place le choix de tes objets occupe-t-il réellement dans ta vie ?'),
 'consumption.0243': ('Qu’est-ce que tu recherches d’abord dans consommation et valeur ?',
                      'Quand tu choisis un objet, qu’est-ce que tu recherches d’abord ?'),
 'consumption.0244': ('Qu’est-ce qui peut le plus facilement gâcher une expérience liée à consommation et valeur ?',
                      'Qu’est-ce qui peut le plus facilement te gâcher un objet, acheté ou reçu ?'),
 'consumption.0245': ('Quel souvenir ou exemple représente le mieux ce que tu aimes dans consommation et valeur ?',
                      'Quel objet, ou quel souvenir lié à un objet, représente le mieux ce que tu aimes trouver dans les choses que tu choisis ?'),
 'consumption.0246': ('Qu’aimerais-tu découvrir ou vivre davantage autour de consommation et valeur ?',
                      'Dans ta façon de choisir les objets qui t’entourent, qu’aimerais-tu découvrir ou vivre davantage ?'),
}
for q, (avant, apres) in H.items():
    if enonce_de.get(q) != avant: sys.exit(f'ÉCHEC — bloc H : énoncé inattendu pour {q} : « {enonce_de.get(q)} ». Rien n\'est écrit.')
    changer(ligne_de[q], ENONCE, apres, DEC_H, 'H', q)
# Les options de ces cinq questions, confrontées à l'intention. Aucune n'est modifiée.
A_ISOLER = {
 ('consumption.0242', 'Surtout un moment partagé'): "dit avec qui l'on choisit ou achète (contrat : `companions`), pas un rapport aux objets ; se lit comme une sortie shopping, que la branche ne doit pas mesurer.",
 ('consumption.0244', 'Dette'): "dit comment un achat est financé (contrat : recours au crédit ou à l'endettement), pas ce qui gâche un objet ; touche à la situation financière de la personne.",
 ('consumption.0244', 'Valeurs incompatibles'): "compatible seulement si l'on entend « un objet contraire à mes valeurs » ; le contrat dit « valeurs incompatibles, non nommées ». À surveiller : ne doit pas devenir une mesure de valeurs morales générales.",
}
options_h, isolees_h = [], []
for r, q, g in lignes:
    if q in H and g.startswith('→'):
        lib = t(ws0.cell(row=r, column=ENONCE + 1).value)
        options_h.append({'question_id': q, 'option': lib, 'attribut': t(ws0.cell(row=r, column=ATT + 1).value), 'polarite': t(ws0.cell(row=r, column=POL + 1).value)})
        if (q, lib) in A_ISOLER: isolees_h.append({'question_id': q, 'option': lib, 'cellule': f'{lettre(ENONCE)}{r}', 'pourquoi': A_ISOLER[(q, lib)]})
if len(isolees_h) != len(A_ISOLER): sys.exit(f'ÉCHEC — bloc H : {len(isolees_h)} options isolées retrouvées sur {len(A_ISOLER)}.')

# ═════════════ I. « Faible place » étendu ═════════════
DEC_I = ("Décision du 19 nov. (extension) : la question mesure la place actuelle du domaine et la réponse dit une place faible — "
         "ni dégoût, ni refus d'en parler. Polarité `rejet` → `absence_de_critere`, comme pour les dix-neuf questions à gabarit.")
MESURE_PLACE = re.compile(r'quelle place|occupe(nt)?(-t-(il|elle)|-(ils|elles))? (aujourd’hui|actuellement)|occupent aujourd’hui|occupe-t-(il|elle) dans ta vie aujourd’hui', re.I)
FAIBLE = re.compile(r'peu de place|\btrès peu\b|^assez peu|^peu$|^rarement$|^presque jamais$|^pas une priorité$', re.I)
corrigees_i, non_corrigees = [], []
for r, q, g in lignes:
    if not g.startswith('→') or q in H: continue
    if t(ws0.cell(row=r, column=ATT + 1).value) != 'domain_importance' or t(ws0.cell(row=r, column=POL + 1).value) != 'rejet': continue
    lib = t(ws0.cell(row=r, column=ENONCE + 1).value); en = enonce_de.get(q, '')
    if MESURE_PLACE.search(en) and FAIBLE.search(lib):
        changer(r, POL, 'absence_de_critere', DEC_I, 'I', q, option=lib, enonce=en); corrigees_i.append({'question_id': q, 'enonce': en, 'option': lib})
    else:
        non_corrigees.append({'question_id': q, 'enonce': en, 'option': lib,
            'pourquoi': "l'énoncé ne demande pas la place du domaine" if not MESURE_PLACE.search(en) else "la réponse ne dit pas une place faible : elle dit un rapport (désintérêt, gêne, souhait)"})
if not corrigees_i: sys.exit('ÉCHEC — bloc I : aucune ligne ne remplit les deux conditions.')

wb.save(DST)
sha = hashlib.sha256(DST.read_bytes()).hexdigest()
DIFF.write_text(json.dumps({'source': SRC.name, 'source_sha256': ATTENDU, 'revision': DST.name, 'revision_sha256': sha,
    'cellules_modifiees': len(diff), 'par_bloc': dict(collections.Counter(d['bloc'] for d in diff)),
    'bloc_H_options_des_cinq_questions': options_h, 'bloc_H_options_isolees_non_modifiees': isolees_h,
    'bloc_I_corrigees': corrigees_i, 'bloc_I_non_corrigees_a_arbitrer': non_corrigees,
    'note': "Seul l'onglet 0_FICHE_CANONIQUE est écrit, comme aux révisions 1 à 4 : c'est lui que l'import lit.",
    'diff': diff}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'révision 5 : {DST.name}\nsha256     : {sha}\ncellules   : {len(diff)}  {dict(collections.Counter(d["bloc"] for d in diff))}')
print('I corrigées :'); [print('  ', c['question_id'], '|', c['enonce'][:70], '→', c['option']) for c in corrigees_i]
print('I non corrigées :', len(non_corrigees), '· H isolées :', len(isolees_h))
