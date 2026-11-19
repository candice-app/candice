#!/usr/bin/env python3
"""NOMS OFFICIELS DES BRANCHES ET RÈGLES D'OUVERTURE ÉCRITES — importés d'une source explicite.

Le classeur officiel (V5 OPEN V3 révision 3) renvoie 97 fois à un « onglet Branches » qu'il ne
contient pas. Cet onglet existe : c'est la feuille « Branches » de la Banque de micro-questions
V1.1 (15 sept. 2026, 67 branches), reprise ligne à ligne, avec sa provenance, dans le
« Référentiel enrichi — Architecture HSG V2 » (feuilles A et B). C'est ce second fichier qu'on
lit ici, parce qu'il porte aussi, question par question, l'identifiant de branche ET son nom.

CE QUE CE SCRIPT PRODUIT (src/lib/discovery/open-v3/noms-officiels.json) :
  · pour chaque identifiant de branche de la banque : son NOM OFFICIEL (feuille B) ;
  · pour les 67 branches de la feuille A : les règles écrites — ouverture (niveau A), garde-fous,
    niveau B, niveau C, saturation, parcours — MOT POUR MOT, avec leur ligne d'origine.

CE QU'IL NE FAIT PAS : il ne traduit aucune règle en condition exécutable. La source le dit
elle-même (« ORIGINALE — non exécutable en l'état », « Rien n'est arbitré dans ce classeur »).
La lecture exécutable est faite ailleurs (ouvertures.ts), et elle est bornée et nommée.

Il s'arrête si l'empreinte du fichier change, ou si un identifiant porte deux noms.
"""
import hashlib, json, sys, collections
import openpyxl

SOURCE = 'docs/discovery/sources/Candice_Referentiel_Enrichi_Architecture_HSG_V2.xlsx'
SHA = '0126a1878661a39f49d246cd708b305f0d325907d7bd0ae7efd61fd3521dbd1a'
SORTIE = 'src/lib/discovery/open-v3/noms-officiels.json'

sha = hashlib.sha256(open(SOURCE, 'rb').read()).hexdigest()
if sha != SHA:
    sys.exit(f'empreinte inattendue : {sha}')
wb = openpyxl.load_workbook(SOURCE, read_only=True)
B = list(wb['B. Questions (2397)'].iter_rows(values_only=True))
A = list(wb['A. Architecture 67 branches'].iter_rows(values_only=True))

noms = collections.defaultdict(set); lignes = {}
for r in B[1:]:
    if r[0] != 'BANQUE' or not r[3] or not r[4]:
        continue
    noms[str(r[3]).strip()].add(str(r[4]).strip())
    lignes.setdefault(str(r[3]).strip(), str(r[17]))
for ident, n in noms.items():
    if len(n) != 1:
        sys.exit(f'« {ident} » porte {len(n)} noms : {sorted(n)}')

regles = {}
for r in A[1:]:
    if not r[0]:
        continue
    regles[str(r[0]).strip()] = {
        'ouverture_niveau_A': r[1], 'garde_fous': r[2], 'niveau_B': r[3], 'niveau_C': r[4],
        'saturation': r[5], 'parcours': r[6], 'provenance': r[7],
    }

branches = []
for ident in sorted(noms):
    nom = next(iter(noms[ident]))
    branches.append({'id': ident, 'nom_officiel': nom, 'provenance_nom': lignes[ident].rsplit(' / ligne', 1)[0] + ' (colonnes Domaine et Branche / Thème)',
                     **({'regles': regles[nom]} if nom in regles else {})})
sans_identifiant = sorted(set(regles) - {b['nom_officiel'] for b in branches})
if sans_identifiant:
    sys.exit(f'règles sans branche correspondante : {sans_identifiant}')
json.dump({
    'source': SOURCE.split('/')[-1], 'sha256_source': SHA,
    'origine': 'Candice_Banque_Microquestions_V1.1.xlsx (15 sept. 2026), feuilles Banque et Branches, reprises dans le Référentiel enrichi V2 avec leur provenance',
    'statut_des_regles': 'ORIGINALES — écrites en prose, jamais traduites en conditions exécutables ni arbitrées dans la source',
    'branches': branches,
}, open(SORTIE, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(f'{len(branches)} identifiants nommés, dont {sum(1 for b in branches if "regles" in b)} avec règles écrites → {SORTIE}')
