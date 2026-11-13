# -*- coding: utf-8 -*-
"""Traduit la RÉVISION 1 en contrat versionné. Chaque rapport porte l'identité exacte de
ce qu'il a lu — fichier, SHA-256, version du script — pour que deux rejeux divergents
puissent toujours être réconciliés. C'est ce qui manquait au rapport précédent, et c'est
pour cela qu'un écart a mis une heure à s'expliquer."""
import argparse, hashlib, json, datetime, openpyxl

VERSION_SCRIPT = 'exporter.py v2 · 2026-11-13'
FAMILLES = {'INTEREST','PREFERENCE','PROFILE','AFFECTION_LANGUAGE','NEED','DRIVER','BEHAVIOR','GUARDRAIL','ENTITY','CONTEXT'}
RELATIONS = {'LOVE','LIKE','CURIOUS','WANT_TO_TRY','WANT_TO_OWN','WANT_TO_VISIT','NEUTRAL','DISLIKE','AVOID'}
STABILITES = {'stable','evolving','contextual','temporary'}
RELATIONSHIPS = {'casual','curious','enthusiast','passion','expert'}
ROLES = {'primary','secondary'}
VOIES = {'HSG_EVIDENCE','FACT'}
GABARITS = {'<identite_du_sujet_declare>': 'SUJET_RESOLU',
            '<appreciation_parmi_les_neuf>': 'RELATION_RESOLUE_PARMI_ENTITY_RELATIONS'}
DECLENCHEURS_IMPLEMENTES = set()   # aucun évaluateur écrit à ce jour

p = argparse.ArgumentParser()
p.add_argument('--classeur', default='REVISION_1.xlsx')
p.add_argument('--sortie', default='/mnt/user-data/outputs/discovery-open-v3.json')
a = p.parse_args()

empreinte = hashlib.sha256(open(a.classeur, 'rb').read()).hexdigest()
w = openpyxl.load_workbook(a.classeur, read_only=True)
rows = list(w['17_DESTINATIONS_CONDITIONNELLES'].iter_rows(values_only=True))
head, data = rows[0], rows[1:]
vide = lambda v: v in (None, '', 'NONE')

contrat, normalisations = [], []
for r in data:
    d = {h: v for h, v in zip(head, r)}
    qid, rang, motifs = d['question_id'], d['rang_destination'], []

    if d['voie'] not in VOIES: motifs.append(f"voie inconnue : {d['voie']}")
    fam = d['famille']
    if d['voie'] == 'HSG_EVIDENCE' and (vide(fam) or fam not in FAMILLES):
        motifs.append(f'famille invalide pour une evidence : {fam}')
    if d['voie'] == 'FACT' and not vide(fam):
        motifs.append(f"voie FACT portant une famille ({fam})")

    rel = d['relation']
    if not vide(rel) and rel not in GABARITS and rel not in RELATIONS:
        motifs.append(f'relation hors vocabulaire : {rel}')

    # stabilité : « undetermined » est PRÉVU par le contrat — conservé tel quel.
    stab = d['stabilite']
    if not vide(stab) and stab not in STABILITES and stab != 'undetermined':
        motifs.append(f'stabilité hors vocabulaire : {stab}')

    # relationship : deux marqueurs, deux sens, deux sorts à l'export.
    #   NON_PRECISE → null  : c'est un INTEREST, le degré n'est PAS établi.
    #   SANS_OBJET  → omis  : la destination n'est pas un INTEREST, le champ n'a pas de sens.
    # Les écrire pareil ferait disparaître la différence entre « inconnu » et « hors sujet ».
    brut_rel = d.get('relationship')
    porte_rel, val_rel = False, None
    if brut_rel == 'NON_PRECISE':
        porte_rel = True
        normalisations.append(f'{qid}|{rang} relationship NON_PRECISE → null (degré non établi)')
    elif brut_rel == 'SANS_OBJET':
        normalisations.append(f'{qid}|{rang} relationship SANS_OBJET → omis')
    elif not vide(brut_rel):
        if brut_rel in RELATIONSHIPS: porte_rel, val_rel = True, brut_rel
        else: motifs.append(f'relationship hors vocabulaire : {brut_rel}')

    # evidence_role : secondary pour les 9 HSG, SANS_OBJET pour les 6 faits.
    brut_role = d.get('evidence_role')
    role = None
    if brut_role == 'SANS_OBJET':
        if d['voie'] != 'FACT': motifs.append('evidence_role SANS_OBJET sur une voie HSG_EVIDENCE')
    elif not vide(brut_role):
        if brut_role in ROLES: role = brut_role
        else: motifs.append(f'evidence_role hors vocabulaire : {brut_role}')
        if d['voie'] == 'FACT': motifs.append('un FACT ne porte pas de rôle de preuve')
    elif d['voie'] == 'HSG_EVIDENCE':
        motifs.append('evidence_role absent sur une destination HSG_EVIDENCE')

    decl = d['declencheur']
    if vide(decl): motifs.append('aucun déclencheur')
    elif decl not in DECLENCHEURS_IMPLEMENTES:
        motifs.append(f'déclencheur NON IMPLÉMENTÉ dans le moteur : {decl}')
    if vide(d['preuve_exigee']): motifs.append('aucune preuve exigée')
    if vide(d['si_declencheur_absent']): motifs.append('comportement non défini sans déclencheur')

    e = {'question_id': qid, 'rang': rang, 'declencheur': decl, 'voie': d['voie'],
         'famille': None if vide(fam) else fam,
         'cle': None if vide(d['attribut_ou_cle']) else d['attribut_ou_cle'],
         'cle_est_gabarit': d['attribut_ou_cle'] in GABARITS,
         'type_entite': None if vide(d['type_entite']) else d['type_entite'],
         'relation': None if vide(rel) else rel,
         'relation_est_gabarit': rel in GABARITS if rel else False,
         'stabilite': None if vide(stab) else stab,
         'identifiant_requis': None if vide(d['identifiant_requis']) else d['identifiant_requis'],
         'preuve_exigee': d['preuve_exigee'], 'si_declencheur_absent': d['si_declencheur_absent'],
         'inferences_interdites': d['inferences_interdites'],
         'statut_referentiel': d['statut'],
         'statut_import': 'EXECUTABLE' if not motifs else 'DEFINIE_NON_EXECUTABLE',
         'motifs_non_executable': motifs,
         'version_contrat_open': d['version_contrat_open']}
    if porte_rel: e['relationship'] = val_rel      # présent, éventuellement null
    if role is not None: e['evidence_role'] = role
    contrat.append(e)

# CONTRÔLES DE NON-RETOUR, sur la sortie sérialisée entière.
for c in contrat:
    if c.get('relationship') == 'undetermined':
        raise SystemExit(f"ÉCHEC : relationship « undetermined » sur {c['question_id']}|{c['rang']}")
    for marqueur in ('NON_PRECISE', 'SANS_OBJET'):
        if marqueur in json.dumps(c, ensure_ascii=False):
            raise SystemExit(f"ÉCHEC : marqueur de classeur « {marqueur} » exporté tel quel sur {c['question_id']}|{c['rang']}")

sortie = {'version': 'OPEN_V3 · révision 1',
          'classeur_lu': a.classeur, 'classeur_sha256': empreinte,
          'classeur_source_officiel_sha256': '53b08fbc05ca1d9da300218a193aa4baabebdb0c5b3a142b401a086c6142649c',
          'script': VERSION_SCRIPT, 'genere_le': datetime.date.today().isoformat(),
          'declencheurs_implementes': sorted(DECLENCHEURS_IMPLEMENTES),
          'normalisations_appliquees': normalisations,
          'destinations': contrat}
json.dump(sortie, open(a.sortie, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

ex = sum(1 for c in contrat if c['statut_import'] == 'EXECUTABLE')
print(f"classeur lu : {a.classeur}  sha256 {empreinte[:16]}…")
print(f"{len(contrat)} destinations · EXECUTABLE {ex} · DEFINIE_NON_EXECUTABLE {len(contrat)-ex}\n")
for c in contrat:
    rl = ('absent' if 'relationship' not in c else repr(c['relationship']))
    rr = c.get('evidence_role', 'absent')
    print(f"  {c['question_id']:16s}|{c['rang']}  {c['voie']:13s} statut={c['statut_referentiel']:8s}"
          f" role={rr:10s} relationship={rl}")
print()
print('normalisations :')
for n in normalisations[:4]: print('  ', n)
print(f'   … {len(normalisations)} au total')
