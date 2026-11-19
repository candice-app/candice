#!/usr/bin/env python3
"""Importe 9_CONTRATS_OUVERTS (colonnes _v2, seules exécutables) et 17_DESTINATIONS_CONDITIONNELLES
du classeur officiel (révision 3) vers src/lib/discovery/open-v3/contrats-ouverts.json.
Vérifie l'empreinte, et s'arrête sur une relation, un statut ou une polarité qu'il ne connaît pas."""
import openpyxl, json, hashlib, sys, os, re
ICI = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.join(ICI, '..', '..')
F = os.path.join(RACINE, 'docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_4.xlsx')
SHA = '5a66c613db82797d336534a679e513321cbbdbf7bf20cfd12102c4f84cf28eca'
if hashlib.sha256(open(F, 'rb').read()).hexdigest() != SHA: sys.exit('empreinte du classeur inattendue')
wb = openpyxl.load_workbook(F, read_only=True)
REL = {'LOVE', 'LIKE', 'CURIOUS', 'WANT_TO_TRY', 'WANT_TO_OWN', 'WANT_TO_VISIT', 'NEUTRAL', 'DISLIKE', 'AVOID'}
def relations(cellule, ou):
    if cellule is None or str(cellule).strip() in ('', '—', 'NONE', 'AUCUNE', 'aucune'): return []
    r = [x.strip() for x in re.split(r'\s*/\s*|\s*,\s*', str(cellule)) if x.strip()]
    inconnues = [x for x in r if x not in REL]
    if inconnues: return {'non_lu': str(cellule)}
    return r
rows = list(wb['9_CONTRATS_OUVERTS'].iter_rows(values_only=True)); H = [str(c) for c in rows[0]]
col = lambda n: H.index(n)
contrats = []
for r in rows[1:]:
    if not r or not r[0]: continue
    contrats.append({
        'question': r[0], 'statut': r[col('statut_effectif_v2')], 'polarite': r[col('polarite_canonique_v2')],
        'type_entite': r[col('type_entite_canonique_v2')],
        'relations_admissibles': relations(r[col('relations admissibles')], r[0]), 'relations_interdites': relations(r[col('relations INTERDITES')], r[0]),
        'emission_primaire': r[col('emission_primaire_v2')], 'destination_secondaire': r[col('destination_secondaire_v2')],
        'schema_ecriture': r[col('schema_ecriture_v2')], 'scope': r[col('scope_v2')], 'condition_extraction': r[col('condition_extraction_v2')],
        'inferences_interdites': r[col('inferences_interdites_v2')], 'permissions': r[col('permissions_v2')], 'version': r[col('version_contrat_open')],
    })
rows = list(wb['17_DESTINATIONS_CONDITIONNELLES'].iter_rows(values_only=True)); H = [str(c) for c in rows[0]]
dest = [dict(zip(H, [None if c is None else str(c) for c in r])) for r in rows[1:] if r and r[0]]
json.dump({'classeur': os.path.basename(F), 'sha256_classeur': SHA, 'contrats': contrats, 'destinations_conditionnelles': dest},
          open(os.path.join(RACINE, 'src/lib/discovery/open-v3/contrats-ouverts.json'), 'w'), ensure_ascii=False, indent=1)
import collections
print(len(contrats), 'contrats ·', len(dest), 'destinations conditionnelles')
print(collections.Counter(c['statut'] for c in contrats)); print(collections.Counter(c['polarite'] for c in contrats))
print('relations non lues :', [(c['question'], c['relations_admissibles']) for c in contrats if isinstance(c['relations_admissibles'], dict)][:6], [(c['question'], c['relations_interdites']) for c in contrats if isinstance(c['relations_interdites'], dict)][:6])
print(collections.Counter(tuple(c['relations_admissibles']) if isinstance(c['relations_admissibles'], list) else 'NON_LU' for c in contrats))
print(collections.Counter(d['declencheur'] for d in dest), collections.Counter(d['statut'] for d in dest))
