#!/usr/bin/env python3
"""RÉVISION 4 DU RÉFÉRENTIEL OPEN V3 — décisions d'Estelle du 19 nov.

Part de la RÉVISION 3 (sha vérifié), produit la RÉVISION 4 et son diff. Deux blocs, et rien d'autre :

 F. « TRÈS PEU DE PLACE » NE SIGNIFIE PAS « JE REJETTE ». Les dix-neuf questions historiques
    « Quelle place … occupe … réellement dans ta vie ? » portent toutes l'option « Très peu de
    place ». Quatorze l'écrivent avec la polarité `absence_de_critere`, cinq avec `rejet`
    (consumption.0242, fragrance.0163, home.0173, nature.0210, work.0227). Décision : cette
    réponse décrit une faible place ACTUELLE ; elle ne dit ni dégoût ni refus d'en parler. Les
    cinq sont alignées sur les quatorze. La VALEUR n'est pas touchée (les dix-neuf n'emploient
    pas la même échelle : relevé dans le diff, non corrigé ici).

 G. RÉVISION ÉDITORIALE DES ÉNONCÉS À GABARIT. Cinq énoncés historiques ont été produits en
    collant le nom d'un domaine dans une phrase : « Quelle place culture — lecture occupe-t-il
    réellement dans ta vie ? ». La langue est corrigée (article, accord, préposition) ; le
    préfixe de rangement « culture — » est retiré. L'intention, les options et le contrat ne
    changent pas : seule la cellule de l'énoncé est écrite.
    ISOLÉES, NON CORRIGÉES : les cinq questions de « consommation et valeur ». Les rendre
    correctes oblige à dire ce que « valeur » désigne (la valeur des choses, ou ce qui a de la
    valeur pour la personne) : c'est un choix de sens, il revient à Estelle.

ÉCHOUE FERMÉ : sha de la source, texte exact attendu avant chaque écriture, effectifs par bloc.
Usage : python3 scripts/discovery/reviser-4.py   (depuis la racine du dépôt)
"""
import hashlib, json, re, sys, pathlib, collections
import openpyxl

RACINE = pathlib.Path(__file__).resolve().parents[2]
SRC = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_3.xlsx'
DST = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_4.xlsx'
DIFF = RACINE / 'docs/discovery/revision-4-diff.json'
ATTENDU = '1b326ff4ea28d83cc8880e8451d30acff7d31a93962f8c73d3a738fdc5093425'

if hashlib.sha256(SRC.read_bytes()).hexdigest() != ATTENDU:
    sys.exit('ÉCHEC — source inattendue. La révision 4 ne part que de la révision 3.')

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

ENONCE, POL, VAL = C0['ÉNONCÉ / RÉPONSE'], C0['polarité'], C0['valeur']
lignes = []          # (ligne, question_id, type de ligne)
qid = None
for r in range(2, ws0.max_row + 1):
    genre = t(ws0.cell(row=r, column=C0['ligne'] + 1).value)
    if genre == 'QUESTION': qid = t(ws0.cell(row=r, column=C0['question_id'] + 1).value)
    if genre: lignes.append((r, qid, genre))
enonce_de = {q: t(ws0.cell(row=r, column=ENONCE + 1).value) for r, q, g in lignes if g == 'QUESTION'}

# ═════════════ F. « Très peu de place » ═════════════
DEC_F = ("Décision du 19 nov. : pour une question sur la place actuelle d'un domaine, « Très peu de place » décrit "
         "une faible place actuelle — ni dégoût, ni refus d'en parler. Polarité alignée sur les quatorze autres contrats.")
PLACE = re.compile(r'^Quelle place .+ occupe-t-il réellement dans ta (vie|vie ) ?\?$')
contrats = []
for r, q, g in lignes:
    if not g.startswith('→') or not PLACE.match(enonce_de.get(q, '')): continue
    if t(ws0.cell(row=r, column=ENONCE + 1).value) != 'Très peu de place': continue
    contrats.append({'question_id': q, 'ligne': r, 'polarite': t(ws0.cell(row=r, column=POL + 1).value), 'valeur': t(ws0.cell(row=r, column=VAL + 1).value)})
if len(contrats) != 19: sys.exit(f'ÉCHEC — bloc F : {len(contrats)} contrats « Très peu de place » au lieu de 19.')
a_corriger = [c for c in contrats if c['polarite'] == 'rejet']
if sorted(c['question_id'] for c in a_corriger) != ['consumption.0242', 'fragrance.0163', 'home.0173', 'nature.0210', 'work.0227']:
    sys.exit(f"ÉCHEC — bloc F : contrats en rejet inattendus : {[c['question_id'] for c in a_corriger]}")
if any(c['polarite'] not in ('rejet', 'absence_de_critere') for c in contrats):
    sys.exit('ÉCHEC — bloc F : une troisième polarité est apparue.')
for c in a_corriger:
    changer(c['ligne'], POL, 'absence_de_critere', DEC_F, 'F', c['question_id'], option='Très peu de place')

# ═════════════ G. Énoncés à gabarit ═════════════
#          brut dans la source                 sujet                                        accord              dans / à / de
FORMES = {
 'cinema':    ('culture — cinéma',             'le cinéma',                                'occupe-t-il',      'le cinéma', 'au cinéma', 'du cinéma'),
 'series':    ('culture — séries',             'les séries',                               'occupent-elles',   'les séries', 'aux séries', 'des séries'),
 'theatre':   ('culture — théâtre',            'le théâtre',                               'occupe-t-il',      'le théâtre', 'au théâtre', 'du théâtre'),
 'reading':   ('culture — lecture',            'la lecture',                               'occupe-t-elle',    'la lecture', 'à la lecture', 'de la lecture'),
 'music':     ('culture — musique',            'la musique',                               'occupe-t-elle',    'la musique', 'à la musique', 'de la musique'),
 'art':       ('culture — art, musées et expositions', 'l’art, les musées et les expositions', 'occupent-ils', 'l’art, les musées et les expositions', 'à l’art, aux musées et aux expositions', 'de l’art, des musées et des expositions'),
 'humor':     ('culture — humour',             'l’humour',                                 'occupe-t-il',      'l’humour', 'à l’humour', 'de l’humour'),
 'fashion':   ('mode et vêtements',            'la mode et les vêtements',                 'occupent-ils',     'la mode et les vêtements', 'à la mode et aux vêtements', 'de la mode et des vêtements'),
 'beauty':    ('beauté et soins',              'la beauté et les soins',                   'occupent-ils',     'la beauté et les soins', 'à la beauté et aux soins', 'de la beauté et des soins'),
 'fragrance': ('parfum et odeurs',             'le parfum et les odeurs',                  'occupent-ils',     'le parfum et les odeurs', 'au parfum et aux odeurs', 'du parfum et des odeurs'),
 'home':      ('maison et décoration',         'la maison et la décoration',               'occupent-elles',   'la maison et la décoration', 'à la maison et à la décoration', 'de la maison et de la décoration'),
 'sport':     ('sport et activité physique',   'le sport et l’activité physique',          'occupent-ils',     'le sport et l’activité physique', 'au sport et à l’activité physique', 'du sport et de l’activité physique'),
 'tech':      ('technologie et innovation',    'la technologie et l’innovation',           'occupent-elles',   'la technologie et l’innovation', 'à la technologie et à l’innovation', 'de la technologie et de l’innovation'),
 'gaming':    ('jeux vidéo',                   'les jeux vidéo',                           'occupent-ils',     'les jeux vidéo', 'aux jeux vidéo', 'des jeux vidéo'),
 'nature':    ('nature et plein air',          'la nature et le plein air',                'occupent-ils',     'la nature et le plein air', 'à la nature et au plein air', 'de la nature et du plein air'),
 'wellbeing': ('bien-être et repos',           'le bien-être et le repos',                 'occupent-ils',     'le bien-être et le repos', 'au bien-être et au repos', 'du bien-être et du repos'),
 'work':      ('travail et carrière',          'le travail et la carrière',                'occupent-ils',     'le travail et la carrière', 'au travail et à la carrière', 'du travail et de la carrière'),
 'learning':  ('apprentissage et curiosité',   'l’apprentissage et la curiosité',          'occupent-ils',     'l’apprentissage et la curiosité', 'à l’apprentissage et à la curiosité', 'de l’apprentissage et de la curiosité'),
}
ISOLEES = {'consumption': 'consommation et valeur'}
GABARITS = [
 (lambda x: f'Quelle place {x} occupe-t-il réellement dans ta vie ?',                         lambda f: f'Quelle place {f[1]} {f[2]} réellement dans ta vie ?'),
 (lambda x: f'Qu’est-ce que tu recherches d’abord dans {x} ?',                                lambda f: f'Qu’est-ce que tu recherches d’abord dans {f[3]} ?'),
 (lambda x: f'Qu’est-ce qui peut le plus facilement gâcher une expérience liée à {x} ?',      lambda f: f'Qu’est-ce qui peut le plus facilement gâcher une expérience liée {f[4]} ?'),
 (lambda x: f'Quel souvenir ou exemple représente le mieux ce que tu aimes dans {x} ?',       lambda f: f'Quel souvenir ou exemple représente le mieux ce que tu aimes dans {f[3]} ?'),
 (lambda x: f'Qu’aimerais-tu découvrir ou vivre davantage autour de {x} ?',                   lambda f: f'Qu’aimerais-tu découvrir ou vivre davantage autour {f[5]} ?'),
]
DEC_G = ("Révision éditoriale du 19 nov. : énoncé produit par gabarit, langue corrigée (article, accord, préposition ; "
         "préfixe de rangement « culture — » retiré). Intention, options et contrat inchangés.")
corrigees, isolees = 0, []
for r, q, g in lignes:
    if g != 'QUESTION': continue
    branche = t(ws0.cell(row=r, column=C0['branche'] + 1).value)
    avant = enonce_de[q]
    if branche in ISOLEES:
        for brut, _ in GABARITS:
            if avant == brut(ISOLEES[branche]):
                isolees.append({'question_id': q, 'enonce': avant,
                    'pourquoi': '« consommation et valeur » : la correction oblige à dire si « valeur » est la valeur des choses ou ce qui a de la valeur pour la personne.',
                    'sens_A': avant.replace('consommation et valeur', 'la consommation et la valeur des choses'),
                    'sens_B': avant.replace('consommation et valeur', 'ta façon de consommer et ce qui compte pour toi')})
        continue
    if branche not in FORMES: continue
    f = FORMES[branche]
    for brut, propre in GABARITS:
        if avant == brut(f[0]):
            changer(r, ENONCE, propre(f), DEC_G, 'G', q); corrigees += 1
# Aucun énoncé au gabarit ne doit rester hors de ces deux listes.
ART = r'(?!le |la |les |l’|au |aux |à |du |de |des )'
RESTE = re.compile(rf'^Quelle place {ART}.+ occupe-t-il réellement dans ta vie|recherches d’abord dans {ART}|gâcher une expérience liée à {ART}|ce que tu aimes dans {ART}|davantage autour de {ART}')
restants = [q for r, q, g in lignes if g == 'QUESTION' and RESTE.search(t(ws0.cell(row=r, column=ENONCE + 1).value))
            and q not in {i['question_id'] for i in isolees}]
if corrigees != 90 or len(isolees) != 5 or restants:
    sys.exit(f'ÉCHEC — bloc G : {corrigees} corrigées (90 attendues), {len(isolees)} isolées (5), restants {restants[:8]}. Rien n\'est écrit.')

wb.save(DST)
sha = hashlib.sha256(DST.read_bytes()).hexdigest()
DIFF.write_text(json.dumps({'source': SRC.name, 'source_sha256': ATTENDU, 'revision': DST.name, 'revision_sha256': sha,
    'cellules_modifiees': len(diff), 'par_bloc': dict(collections.Counter(d['bloc'] for d in diff)),
    'bloc_F_les_19_contrats': [{k: c[k] for k in ('question_id', 'polarite', 'valeur')} for c in contrats],
    'bloc_F_releve_non_corrige': "Les dix-neuf contrats n'emploient pas la même échelle de valeur pour la même réponse (voir « valeur » ci-dessus). Non corrigé ici : aucun lecteur ne compare aujourd'hui ces valeurs entre domaines.",
    'bloc_G_isolees_non_corrigees': isolees,
    'note': "Seul l'onglet 0_FICHE_CANONIQUE est écrit, comme aux révisions 1 à 3 : c'est lui que l'import lit. L'onglet 1_CONTRATS_PAR_REPONSE répète l'énoncé et la polarité et garde l'ancienne valeur.",
    'diff': diff}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'révision 4 : {DST.name}\nsha256     : {sha}\ncellules   : {len(diff)}  {dict(collections.Counter(d["bloc"] for d in diff))}  isolées : {len(isolees)}')
