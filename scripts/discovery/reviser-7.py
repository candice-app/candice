#!/usr/bin/env python3
"""RÉVISION 7 DU RÉFÉRENTIEL OPEN V3 — décisions d'Estelle du 19 nov. 17h43 (D6) et une correction de libellé.

Part de la RÉVISION 6 (sha vérifié), produit la RÉVISION 7 et son diff. Deux blocs, rien d'autre :

 J. « PAS MON UNIVERS / PAS MON TRUC » (D6), LIGNE PAR LIGNE. Les 41 réponses `domain_importance`
    laissées en `rejet` par la révision 5 sont relues AVEC L'ÉNONCÉ COMPLET et rangées dans l'un
    des concepts décidés, gardés distincts :
      · faible place        — la réponse dit un degré ou une fréquence (« peu », « rarement »,
                              « pas une priorité », « par nécessité ») → polarité `absence_de_critere` ;
      · appréciation négative — la réponse dit un désintérêt (« ne m'intéresse pas », « pas mon
                              univers » à « X, pour toi, c'est plutôt… », « fatigant ») → `rejet`
                              CONSERVÉE : c'est la polarité négative du journal. Elle ne ferme
                              aucune question et n'écarte aucun cadeau (seul un garde-fou le fait) ;
      · souhait de réduire  — « j'aimerais y passer moins de temps » → `souhait` ;
      · position déclarée    — ni place ni appréciation (une conviction, un projet de vie) : inchangée.
    Le refus de poursuivre le questionnaire reste un acte distinct (« Ne plus me poser de
    questions sur ce sujet »), qu'aucune de ces réponses ne déclenche.
    CORRECTION DE NOTE : la révision 5 disait de JDS-01, live.0474 et sportp.0503 « l'énoncé ne
    demande pas la place du domaine ». C'est faux : elles demandent « quelle place ». Elles sont
    rangées ici en faible place, et la note fautive est rectifiée dans ce diff.

 L. success.1711 (D5) : les douze dimensions « à développer » passent de `positive` à `souhait`.

 M. D8 : dreams.2004, philovie.1636, values.1910 → connaissance ouverte ; learning2.1455 → fait déclaré.

 K. NOTES DE CONTRAT DANS DES LIBELLÉS AFFICHÉS. Deux options portaient une note de rédaction
    (« → GUARDRAIL … », « → réponse neutre … ») qui s'afficherait telle quelle à la personne.
    Le libellé est ramené à ce qu'elle doit lire ; le contrat de la ligne n'est pas touché.

ÉCHOUE FERMÉ : sha de la source, texte exact attendu avant chaque écriture, effectifs par bloc.
Usage : python3 scripts/discovery/reviser-7.py   (depuis la racine du dépôt)
"""
import hashlib, json, sys, pathlib, collections
import openpyxl

RACINE = pathlib.Path(__file__).resolve().parents[2]
SRC = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_6.xlsx'
DST = RACINE / 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_7.xlsx'
DIFF = RACINE / 'docs/discovery/revision-7-diff.json'
ATTENDU = '27d46cbca9b7497ed769e2842ee309f2807704bd9d5d43aa798afab36febc145'
if hashlib.sha256(SRC.read_bytes()).hexdigest() != ATTENDU:
    sys.exit('ÉCHEC — source inattendue. La révision 7 ne part que de la révision 6.')

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

# ═════════════ J. D6, ligne par ligne ═════════════
FAIBLE, APPRECIATION, SOUHAIT, POSITION = 'faible place', 'appréciation négative', 'souhait de réduire', 'position déclarée'
POLARITE = {FAIBLE: 'absence_de_critere', APPRECIATION: 'rejet', SOUHAIT: 'souhait', POSITION: None}
J = [
 ('CRE-01', 'Ce n’est pas vraiment un univers important pour moi', FAIBLE, "« quel rapport aujourd’hui » ; la réponse dit l’importance (« pas un univers important »), pas un désintérêt"),
 ('JDS-01', 'Ce n’est pas vraiment mon truc', FAIBLE, "« quelle place occupent… en ce moment » : question de place (la note de la révision 5 était fausse)"),
 ('live.0474', 'Ce n’est pas vraiment mon univers', FAIBLE, "« Quelle place occupent les spectacles vivants dans ta vie ? » : question de place (note de la révision 5 fausse)"),
 ('sportp.0503', 'Ce n’est pas vraiment mon truc', FAIBLE, "« Quelle place le sport occupe-t-il dans ta vie aujourd’hui ? » : question de place (note de la révision 5 fausse)"),
 ('animals.2132', 'Pas une priorité', FAIBLE, 'degré : « pas une priorité »'),
 ('beauty2.1287', 'Seulement quand c’est nécessaire', FAIBLE, '« Prendre soin de toi représente… » : degré de pratique'),
 ('beauty2.1287', 'Très peu de place dans ma vie', FAIBLE, 'la réponse dit la place'),
 ('celebration.0811', 'Le vivre simplement', FAIBLE, 'manière peu investie de vivre un événement ; ni rejet de la célébration, ni désintérêt'),
 ('celebration.0811', 'Passer rapidement à la suite', FAIBLE, 'idem : peu d’investissement, pas un refus'),
 ('food2.0856', 'Je suis assez peu gourmand(e)', FAIBLE, 'degré : « assez peu »'),
 ('food2.0857', 'Je cuisine surtout par nécessité', FAIBLE, 'pratique actuelle limitée au nécessaire'),
 ('home2.1259', 'Un lieu où je passe finalement peu de temps', FAIBLE, 'pratique actuelle (temps passé)'),
 ('home2.1265', 'Rarement', FAIBLE, 'fréquence'),
 ('home2.1265', 'Presque jamais', FAIBLE, 'fréquence'),
 ('money.1575', 'Les vêtements', FAIBLE, 'place dans le budget de la personne (dépense repoussée) ; ne dit rien d’un cadeau reçu'),
 ('money.1575', 'Les voyages', FAIBLE, 'idem'), ('money.1575', 'La technologie', FAIBLE, 'idem'), ('money.1575', 'La voiture', FAIBLE, 'idem'),
 ('money.1575', 'Les loisirs', FAIBLE, 'idem'), ('money.1575', 'La beauté', FAIBLE, 'idem'),
 ('museum.0711', 'Sont réservés aux incontournables', FAIBLE, 'place en voyage, limitée'),
 ('museum.0711', 'Sont rarement ma priorité', FAIBLE, 'degré'),
 ('philovie.1656', 'Peu', FAIBLE, 'degré'),
 ('tech2.1313', 'Je m’y intéresse très peu', FAIBLE, 'degré : « très peu »'),
 ('travel.0065', 'Le lieu compte peu', FAIBLE, 'degré ; ne dit pas l’absence de besoins pratiques pour un séjour (D3)'),
 ('travel2.0915', 'Est principalement un endroit où dormir', FAIBLE, 'place de l’hébergement dans l’expérience ; ne dit pas l’absence de besoins pratiques pour un futur séjour (D3)'),
 ('games.0946', 'Ce n’est pas vraiment mon truc', APPRECIATION, '« Les jeux de société, pour toi, c’est plutôt… » : un rapport, la réponse dit un désintérêt'),
 ('garden.0557', 'Ce n’est pas vraiment mon univers', APPRECIATION, '« Les plantes et le jardinage, pour toi, c’est plutôt… » : désintérêt'),
 ('garden.0586', 'Ne m’attire pas', APPRECIATION, 'une attention précise (plante symbolique) qui n’attire pas : appréciation, pas interdiction'),
 ('museum.0698', 'Pas vraiment mon univers', APPRECIATION, '« Les musées et expositions, pour toi, c’est… » : désintérêt'),
 ('photo.0668', 'Ce n’est pas vraiment mon univers', APPRECIATION, '« La photographie, pour toi, c’est plutôt… » : désintérêt'),
 ('spirit.0727', 'Quelque chose qui ne me parle pas', APPRECIATION, 'désintérêt'),
 ('food2.0874', 'Pas vraiment', APPRECIATION, '« Tu aimes recevoir chez toi ? » : la question porte sur le goût, la réponse le nie'),
 ('hosting.2041', 'Fatigant', APPRECIATION, 'vécu négatif'),
 ('travel.0068', 'Cela ne m’intéresse pas', APPRECIATION, 'désintérêt pour un équipement'),
 ('wellbeing.0224', 'Ne m’intéresse pas', APPRECIATION, 'désintérêt'),
 ('wellbeing.0225', 'Je ne suis pas attiré(e) par ce type d’expérience', APPRECIATION, 'désintérêt'),
 ('tech2.1313', 'J’aimerais y passer moins de temps', SOUHAIT, 'souhait de réduire la place, pas un désintérêt'),
 ('work2.1337', 'Quelque chose dont j’aimerais qu’il prenne moins de place', SOUHAIT, 'souhait de réduire la place du travail'),
 ('animals.2143', 'Non', POSITION, '« Te vois-tu toujours vivre avec un animal ? » : un projet de vie, ni place ni appréciation ; aucun effet sur les cadeaux'),
 ('family.1812', 'Non, le lien de naissance ne suffit pas', POSITION, 'une conviction (FACT) ; inchangée'),
]
if len(J) != 41: sys.exit(f'ÉCHEC — bloc J : {len(J)} lignes au lieu de 41.')
rangees = []
for q, lib, concept, pourquoi in J:
    r = option(q, lib)
    if t(ws0.cell(row=r, column=ATT + 1).value) != 'domain_importance' or t(ws0.cell(row=r, column=POL + 1).value) != 'rejet':
        sys.exit(f'ÉCHEC — bloc J : {q} « {lib} » n’est plus `domain_importance` en `rejet`.')
    pol = POLARITE[concept]
    change = pol is not None and changer(r, POL, pol, f"D6 (19 nov.) : {concept} — {pourquoi}", 'J', q, option=lib, enonce=enonce_de[q])
    rangees.append({'question_id': q, 'enonce': enonce_de[q], 'option': lib, 'concept': concept, 'polarite': pol or 'rejet (inchangée)', 'modifiee': bool(change), 'pourquoi': pourquoi})
NOTES_FAUSSES = [{'question_id': q, 'note_revision_5': "l'énoncé ne demande pas la place du domaine", 'correction': f"l'énoncé « {enonce_de[q]} » demande bien la place ; rangée en faible place"} for q in ('JDS-01', 'live.0474', 'sportp.0503')]

# ═════════════ K. Notes de contrat dans des libellés affichés ═════════════
K = [('CHS-01', 'Je préfère qu’on ne m’offre pas de chaussures  → GUARDRAIL cadeau de cette catégorie (pas désintérêt pour la catégorie)', 'Je préfère qu’on ne m’offre pas de chaussures'),
     ('CEL-07', 'Rien en particulier  → réponse neutre ; aucun GUARDRAIL', 'Rien en particulier')]
for q, avant, apres in K:
    changer(option(q, avant), ENONCE, apres, 'Libellé affiché : la note de rédaction qui suivait « → » est retirée ; le contrat de la ligne est inchangé.', 'K', q)

# ═════════════ L. success.1711 : un souhait de développer, pas une valeur recherchée établie (D5) ═════════════
# « Ouvre l’axe choisi à success.1711 comme un sujet que la personne souhaite développer. Ne déduis pas
# qu’il s’agit d’une priorité actuelle ou d’un trait établi. » Les douze dimensions étaient écrites en
# polarité `positive` sur `value_sought` : lues comme « ce qu’elle recherche ». Elles passent en `souhait`.
# La valeur (« dimension à développer maintenant : … ») et la stabilité `temporary` sont inchangées ;
# « Rien de particulier » (absence_de_critere) aussi.
for r, q, g in lignes:
    if q != 'success.1711' or not g.startswith('→'): continue
    lib = t(ws0.cell(row=r, column=ENONCE + 1).value)
    if lib == 'Rien de particulier': continue
    if t(ws0.cell(row=r, column=POL + 1).value) != 'positive': sys.exit(f'ÉCHEC — bloc L : success.1711 « {lib} » n’est plus `positive`.')
    changer(r, POL, 'souhait', 'D5 (19 nov.) : une dimension que la personne souhaite développer — ni priorité actuelle, ni trait établi.', 'L', q, option=lib)
if sum(1 for d in diff if d['bloc'] == 'L') != 12: sys.exit('ÉCHEC — bloc L : 12 options attendues.')

# ═════════════ M. DESTINATIONS DES MOTIVATIONS (D8) ═════════════
# Les quatre questions étaient écrites PREFERENCE (value_sought / facilitator) : lues comme un goût ou
# une valeur recherchée. Elles n’écrivaient rien depuis le 18 nov. (sens-en-revue.json). Décision D8 :
#   · dreams.2004  → connaissance ouverte « pourquoi CE projet compte », rattachée au projet ;
#   · philovie.1636 → connaissance ouverte déclarée « ce qui donne l’impression d’avancer » ;
#   · values.1910  → connaissance ouverte « situations ou activités qui motivent » ;
#   · learning2.1455 → fait déclaré « ce qui déclenche l’envie d’apprendre ».
# La formulation est gardée (le libellé de l’option), la provenance aussi (la source de la réponse).
D8 = {
  'dreams.2004': ('OPEN_KNOWLEDGE', 'raison_du_projet', "aucun DRIVER, aucun NEED, aucun goût général : la raison vaut pour CE projet (dreams.1997), pas pour la personne en général ; ne pas fusionner avec philovie.1636 ou values.1910 même à libellé identique"),
  'philovie.1636': ('OPEN_KNOWLEDGE', 'sens_de_la_progression', "ni DRIVER ni priorité morale ; garder la formulation ; ne pas fusionner avec dreams.2004 ou values.1910 même à libellé identique (portées différentes)"),
  'values.1910': ('OPEN_KNOWLEDGE', 'situation_motivante', "ni priorité morale ni DRIVER : des situations ou activités qui motivent ; ne pas fusionner avec philovie.1636 même à libellé identique"),
  'learning2.1455': ('FACT', 'declencheur_d_apprentissage', "aucun goût pour les personnes déduit de « Une discussion » ou « Une rencontre » ; aucun INTEREST pour le support cité (livre, podcast, vidéo)"),
}
for r, q, g in lignes:
    if q not in D8 or not g.startswith('→'): continue
    voie, attr, interdits = D8[q]
    if t(ws0.cell(row=r, column=VOIE + 1).value) != 'HSG_EVIDENCE': continue      # « Autre » (saisie libre) : inchangée
    dec = f'D8 (19 nov.) : {q} → {"fait déclaré" if voie == "FACT" else "connaissance ouverte"} `{attr}`.'
    changer(r, VOIE, voie, dec, 'M', q, option=t(ws0.cell(row=r, column=ENONCE + 1).value))
    changer(r, FAM, None, dec, 'M', q, option=t(ws0.cell(row=r, column=ENONCE + 1).value))
    changer(r, ATT, attr, dec, 'M', q, option=t(ws0.cell(row=r, column=ENONCE + 1).value))
    changer(r, INTERDITS, interdits, dec, 'M', q, option=t(ws0.cell(row=r, column=ENONCE + 1).value))
    c = t(ws0.cell(row=r, column=CONDOPT + 1).value)
    if 'DRIVER recevable' in c:   # la note de l’option contredisait D8
        changer(r, CONDOPT, c.replace('DRIVER recevable, borne au projet', 'connaissance ouverte rattachée au projet, jamais DRIVER (D8)'), dec, 'M', q, option=t(ws0.cell(row=r, column=ENONCE + 1).value))
if sum(1 for d in diff if d['bloc'] == 'M' and d['colonne'] == 'voie') != 11 + 12 + 8 + 11: sys.exit('ÉCHEC — bloc M : 42 options attendues.')

wb.save(DST)
sha = hashlib.sha256(DST.read_bytes()).hexdigest()
DIFF.write_text(json.dumps({'source': SRC.name, 'source_sha256': ATTENDU, 'revision': DST.name, 'revision_sha256': sha,
    'cellules_modifiees': len(diff), 'par_bloc': dict(collections.Counter(d['bloc'] for d in diff)),
    'bloc_J_rangement_ligne_par_ligne': rangees, 'bloc_J_par_concept': dict(collections.Counter(x['concept'] for x in rangees)),
    'bloc_J_notes_fausses_de_la_revision_5': NOTES_FAUSSES,
    'note': "Seul l'onglet 0_FICHE_CANONIQUE est écrit, comme aux révisions précédentes : c'est lui que l'import lit.", 'diff': diff},
    ensure_ascii=False, indent=1), encoding='utf-8')
print(f'révision 7 : {DST.name}\nsha256     : {sha}\ncellules   : {len(diff)}  {dict(collections.Counter(d["bloc"] for d in diff))}')
print(dict(collections.Counter(x['concept'] for x in rangees)))
