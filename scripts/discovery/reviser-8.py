#!/usr/bin/env python3
"""RÉVISION 8 DU RÉFÉRENTIEL OPEN V3 — décisions d'Estelle du 19 nov., 18h54.

Part de la RÉVISION 7 (sha vérifié). Six questions jusqu'ici « en arbitrage » reçoivent leur contrat ;
cinq sont activées, une est retirée de la rotation. Chaque cellule changée porte sa décision.

 N. CRE-11 « Tu préfères pratiquer… » : question CANONIQUE (correspondance historique : craft.0623).
    L'énoncé demande une PRÉFÉRENCE : « Chez moi », « En extérieur » n'écrivent plus une pratique
    effective (FACT) mais une préférence de lieu, dans le vocabulaire canonique `usage_context`.
    Compagnie (`companions`), cadre (`facilitator`) et lieu se cumulent : choix MULTIPLE. « Cela
    dépend de la technique » est gardé comme une condition (polarité `condition`), pas un état.
 O. SOM-01 : sensible, facultative, ouverte sur démarche ; état déclaré et daté (`temporary`).
 P. causes.1919 « À mon histoire personnelle » → connaissance ouverte confidentielle.
 Q. flowers.2126 « Du soutien », « Du réconfort » → paramètres de la préparation.
 R. relation.0015 : cadence (portée : période difficile), initiative, variation : trois attributs.
 S. sport.0188 : retirée de la rotation ; sportp.0504 couvre la même intention, avec sa saisie libre.
"""
import hashlib, json, sys, pathlib, collections
import openpyxl

RACINE = pathlib.Path(__file__).resolve().parents[2]
SRC = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_7.xlsx'
DST = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_8.xlsx'
DIFF = RACINE / 'docs/discovery/revision-8-diff.json'
ATTENDU = '79e76afd6e50b2289f3a988809d823ce2d86268bf12e7a34ac3f25a0047f6eba'
if hashlib.sha256(SRC.read_bytes()).hexdigest() != ATTENDU:
    sys.exit('ÉCHEC — source inattendue. La révision 8 ne part que de la révision 7.')

def lettre(i):
    s = ''; n = i + 1
    while n: n, r = divmod(n - 1, 26); s = chr(65 + r) + s
    return s
t = lambda v: '' if v is None else str(v).strip()
wb = openpyxl.load_workbook(SRC)
ws0 = wb['0_FICHE_CANONIQUE']
C0 = {t(c.value): i for i, c in enumerate(ws0[1])}
ENONCE, POL, ATT = C0['ÉNONCÉ / RÉPONSE'], C0['polarité'], C0['attribut']
VOIE, FAM, INTERDITS, CONDOPT = C0['voie'], C0['famille HSG'], C0['INFÉRENCES INTERDITES'], C0['condition d’émission']
diff = []
def changer(ligne, col, apres, decision, bloc, qid, **plus):
    c = ws0.cell(row=ligne, column=col + 1); avant = c.value
    if t(avant) == t(apres): return False
    diff.append({'bloc': bloc, 'onglet': ws0.title, 'cellule': f'{lettre(col)}{ligne}', 'question_id': qid,
                 'colonne': t(ws0.cell(row=1, column=col + 1).value), 'avant': avant, 'apres': apres, 'decision': decision, **plus})
    c.value = apres; return True
lignes = []; qid = None
for r in range(2, ws0.max_row + 1):
    genre = t(ws0.cell(row=r, column=C0['ligne'] + 1).value)
    if genre == 'QUESTION': qid = t(ws0.cell(row=r, column=C0['question_id'] + 1).value)
    if genre: lignes.append((r, qid, genre))
ligne_de = {q: r for r, q, g in lignes if g == 'QUESTION'}
enonce_de = {q: t(ws0.cell(row=r, column=ENONCE + 1).value) for q, r in ligne_de.items()}
def option(q, lib):
    for r, qq, g in lignes:
        if qq == q and g.startswith('→') and t(ws0.cell(row=r, column=ENONCE + 1).value) == lib: return r
    sys.exit(f'ÉCHEC — option introuvable : {q} « {lib} ». Rien n’est écrit.')


def q_ligne(q): return ligne_de[q]
def mettre(qid, lib, col, val, decision, bloc):
    r = q_ligne(qid) if lib is None else option(qid, lib)
    changer(r, C0[col], val, decision, bloc, qid, **({} if lib is None else {'option': lib}))

ACTIVE = 'REVUE'
# ═════════════ N. CRE-11 ═════════════
DN = 'D12/décision 2 (19 nov., 18h54) : CRE-11 canonique ; préférence, pas pratique effective ; dimensions cumulables.'
mettre('CRE-11', None, 'statut', ACTIVE, DN, 'N')
mettre('CRE-11', None, 'type', 'MULTI · réponses multiples sans plafond arbitraire', DN + ' Compagnie, cadre et lieu se cumulent.', 'N')
for lib, val in [('Chez moi', 'lieu_de_pratique_prefere=chez_soi'), ('En extérieur', 'lieu_de_pratique_prefere=en_exterieur')]:
    mettre('CRE-11', lib, 'voie', 'HSG_EVIDENCE', DN, 'N'); mettre('CRE-11', lib, 'famille HSG', 'PREFERENCE', DN, 'N')
    mettre('CRE-11', lib, 'attribut', 'usage_context', DN, 'N'); mettre('CRE-11', lib, 'valeur', val, DN, 'N')
    mettre('CRE-11', lib, 'polarité', 'positive', DN, 'N')
    mettre('CRE-11', lib, 'condition d’émission', 'option sélectionnée (MULTI)', DN, 'N')
lib = 'Cela dépend de la technique'
mettre('CRE-11', lib, 'voie', 'HSG_EVIDENCE', DN, 'N'); mettre('CRE-11', lib, 'famille HSG', 'PREFERENCE', DN, 'N')
mettre('CRE-11', lib, 'attribut', 'usage_context', DN, 'N'); mettre('CRE-11', lib, 'valeur', 'conditionnalite=selon_la_technique', DN, 'N')
mettre('CRE-11', lib, 'polarité', 'condition', DN, 'N'); mettre('CRE-11', lib, 'stabilité', 'contextual', DN, 'N')
mettre('CRE-11', lib, 'condition d’émission', 'option sélectionnée (MULTI) ; les autres choix de la même réponse valent selon la technique', DN, 'N')
for lib in ['Seul(e)', 'Avec un proche', 'En cours', 'Dans un atelier partagé', 'En stage ponctuel', 'En collectif']:
    mettre('CRE-11', lib, 'condition d’émission', 'option sélectionnée (MULTI)', DN, 'N')
for r, q, g in lignes:
    if q == 'CRE-11' and g.startswith('→'):
        changer(r, INTERDITS, "une préférence de pratique n'est pas une pratique effective ; aucun niveau ni fréquence ; un lieu préféré n'est pas un lieu de vie", DN, 'N', q, option=t(ws0.cell(row=r, column=ENONCE + 1).value))

# ═════════════ O. SOM-01 ═════════════
DO = 'Décision 3 (19 nov., 18h54) : SOM-01 sensible, facultative, ouverte sur démarche ; état daté, sans diagnostic ni NEED.'
PREFIXE = "OUVERTURE SUR DÉMARCHE EXPLICITE (sensibilité moyenne) : la personne choisit d'explorer ce sujet ou l'aborde spontanément, et la relance reste dans ce contexte ; un score de pertinence seul ne l'ouvre pas ; un refus ou un changement de sujet arrête ces relances. ║ "
orig = t(ws0.cell(row=q_ligne('SOM-01'), column=C0['condition d’émission'] + 1).value)
mettre('SOM-01', None, 'condition d’émission', PREFIXE + orig.rstrip('.') + ' — sensitivity: MOYENNE', DO, 'O')
mettre('SOM-01', None, 'statut', ACTIVE, DO, 'O')
for r, q, g in lignes:
    if q == 'SOM-01' and g.startswith('→') and t(ws0.cell(row=r, column=VOIE + 1).value) == 'FACT':
        l = t(ws0.cell(row=r, column=ENONCE + 1).value)
        changer(r, C0['stabilité'], 'temporary', DO, 'O', q, option=l)
        changer(r, INTERDITS, "état DÉCLARÉ et DATÉ : aucun diagnostic, aucun NEED automatique, jamais communiqué à un tiers ; un état ancien n'est pas présenté comme actuel sans vérification", DO, 'O', q, option=l)

# ═════════════ P. causes.1919 ═════════════
DP = 'Décision 4 (19 nov., 18h54) : « À mon histoire personnelle » → connaissance ouverte confidentielle ; le récit n’est pas exigé.'
lib = 'À mon histoire personnelle'
mettre('causes.1919', lib, 'voie', 'OPEN_KNOWLEDGE', DP, 'P'); mettre('causes.1919', lib, 'famille HSG', None, DP, 'P')
mettre('causes.1919', lib, 'attribut', 'raison_de_l_engagement', DP, 'P')
mettre('causes.1919', lib, 'INFÉRENCES INTERDITES', "aucune valeur morale, aucune identité, aucune histoire précise déduites ; confidentiel (jamais cité à un pilote) ; la personne n'a pas à raconter cette histoire", DP, 'P')
mettre('causes.1919', None, 'statut', ACTIVE, DP, 'P')

# ═════════════ Q. flowers.2126 ═════════════
DQ = 'Décision 5 (19 nov., 18h54) : soutien et réconfort sont les intentions de CETTE attention florale — paramètres de la préparation.'
for lib, v in [('Du soutien', 'message=du_soutien'), ('Du réconfort', 'message=du_reconfort')]:
    mettre('flowers.2126', lib, 'voie', 'ACTION_PARAMETER', DQ, 'Q'); mettre('flowers.2126', lib, 'famille HSG', None, DQ, 'Q')
    mettre('flowers.2126', lib, 'attribut', None, DQ, 'Q'); mettre('flowers.2126', lib, 'valeur', v, DQ, 'Q')
    mettre('flowers.2126', lib, 'polarité', 'factuelle', DQ, 'Q')
mettre('flowers.2126', None, 'statut', ACTIVE, DQ, 'Q')

# ═════════════ R. relation.0015 ═════════════
DR = 'Décision 6 (19 nov., 18h54) : cadence (une seule, en période difficile), initiative et variation séparées et cumulables.'
for lib in ['Plusieurs fois par jour', 'Une fois par jour', 'Tous les deux ou trois jours', 'Une fois par semaine']:
    mettre('relation.0015', lib, 'attribut', 'cadence_en_periode_difficile', DR, 'R')
    mettre('relation.0015', lib, 'condition d’émission', 'option sélectionnée ; UNE seule cadence par réponse (groupe exclusif « cadence ») ; portée : les périodes difficiles seulement', DR, 'R')
lib = 'Seulement si j’écris d’abord'
mettre('relation.0015', lib, 'attribut', 'initiative_du_contact', DR, 'R'); mettre('relation.0015', lib, 'valeur', 'initiative=elle_ecrit_d_abord', DR, 'R')
mettre('relation.0015', lib, 'polarité', 'condition', DR, 'R')
mettre('relation.0015', lib, 'condition d’émission', 'option sélectionnée ; cumulable avec une cadence ; portée : les périodes difficiles', DR, 'R')
lib = 'Cela dépend de la gravité'
mettre('relation.0015', lib, 'voie', 'FACT', DR, 'R'); mettre('relation.0015', lib, 'attribut', 'variation_du_contact', DR, 'R')
mettre('relation.0015', lib, 'valeur', 'variation=selon_la_gravite', DR, 'R'); mettre('relation.0015', lib, 'polarité', 'condition', DR, 'R')
for r, q, g in lignes:
    if q == 'relation.0015' and g.startswith('→'):
        changer(r, INTERDITS, "aucune fréquence universelle déduite hors des périodes difficiles", DR, 'R', q, option=t(ws0.cell(row=r, column=ENONCE + 1).value))
mettre('relation.0015', None, 'statut', ACTIVE, DR, 'R')

# ═════════════ S. sport.0188 ═════════════
DS = 'Décision 7 (19 nov., 18h54) : retirée de la rotation ; sportp.0504 « Quels sports pratiques-tu réellement aujourd’hui ? » couvre la même intention, et sa réponse « Autre » ouvre une saisie libre au même contrat (pratique déclarée).'
mettre('sport.0188', None, 'statut', 'RETIRÉE — remplacée par sportp.0504 (saisie libre « Autre » au même contrat)', DS, 'S')

wb.save(DST)
sha = hashlib.sha256(DST.read_bytes()).hexdigest()
DIFF.write_text(json.dumps({'source': SRC.name, 'source_sha256': ATTENDU, 'revision': DST.name, 'revision_sha256': sha,
    'cellules_modifiees': len(diff), 'par_bloc': dict(collections.Counter(d['bloc'] for d in diff)),
    'correspondances_historiques': [{'canonique': 'CRE-11', 'historique': 'craft.0623', 'equivalence': 'identique (mêmes neuf options) ; la réponse historique garde le contrat de sa question'},
                                    {'canonique': 'sportp.0504', 'historique': 'sport.0188', 'equivalence': 'même intention (sports pratiqués) ; réponses libres historiques conservées, non reposées'}],
    'diff': diff}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'révision 8 : {DST.name}\nsha256     : {sha}\ncellules   : {len(diff)}  {dict(collections.Counter(d["bloc"] for d in diff))}')
