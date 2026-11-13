# -*- coding: utf-8 -*-
"""Confronte le classeur aux vocabulaires canoniques du dépôt — TROIS passes.

CE QUE CE CONTRÔLE COUVRE, ET CE QU'IL NE COUVRE PAS. La version précédente ne regardait
que les colonnes PORTANT LE NOM d'un vocabulaire canonique. Sa conclusion — « seules 6
colonnes portent un vocabulaire du journal » — n'était donc vraie que des colonnes ainsi
nommées : une colonne qui porterait la même notion sous un autre nom, ou une valeur
canonique enfouie dans un contrat composite, lui échappait entièrement. Trois passes :

  A · PAR NOM     — la colonne s'appelle comme un vocabulaire canonique.
  B · PAR VALEUR  — les valeurs d'une colonne sont majoritairement tirées d'un vocabulaire
                    canonique, quel que soit son nom. C'est ainsi qu'on trouve la même
                    notion sous un autre intitulé.
  C · COMPOSITE   — une valeur canonique est ENFOUIE dans un texte plus long
                    (« famille=INTEREST ; relation=LIKE »). Un contrat composite transporte
                    du vocabulaire sans jamais le présenter comme tel.

LES MARQUEURS SONT TRAITÉS CHAMP PAR CHAMP, jamais globalement. « undetermined » appartient
au contrat pour `stabilite` ; pour `relationship` il est INTERDIT — le degré inconnu
s'écrit NULL. Les dispenser partout, comme le faisait la version précédente, rendait le
contrôle aveugle au défaut même qu'il devait attraper.

  python3 confronter.py --classeur X.xlsx --sortie rapport.json [--autotest]
"""
import argparse, collections, json, re, sys
import openpyxl

CANON = {
 'famille':        (['INTEREST','PREFERENCE','PROFILE','AFFECTION_LANGUAGE','NEED','DRIVER','BEHAVIOR','GUARDRAIL','ENTITY','CONTEXT'],
                    'knowledge_evidences_target_family_check (migration 82)'),
 'relation':       (['LOVE','LIKE','CURIOUS','WANT_TO_TRY','WANT_TO_OWN','WANT_TO_VISIT','NEUTRAL','DISLIKE','AVOID'],
                    'ENTITY_RELATIONS — vocabulary.ts:496'),
 'stabilite':      (['stable','evolving','contextual','temporary'],
                    'knowledge_evidences_stability_check (migration 82)'),
 'relationship':   (['casual','curious','enthusiast','passion','expert'],
                    'INTEREST_RELATIONSHIPS — vocabulary.ts:439 (+ migration 110)'),
 'evidence_role':  (['primary','secondary'],
                    'knowledge_evidences_evidence_role_check (migration 82)'),
 'confidence':     (['high','medium','low'],
                    'knowledge_evidences_confidence_check (migration 82)'),
 'severity':       (['SOFT','HARD'],
                    'knowledge_evidences_severity_check (migration 82)'),
 'guardrail_scope':(['selection','execution','context'],
                    'knowledge_evidences_guardrail_scope_check (migration 82)'),
 'assertion_status':(['explicit','inferred'], 'kev_assertion (migration 83)'),
 'assertion_basis':(['self_report','observed','subject_statement','reporter_interpretation'],
                    'knowledge_evidences_assertion_basis_check (migration 86)'),
}

# MARQUEURS ADMIS, CHAMP PAR CHAMP. Un marqueur absent de cette table est un ÉCART.
MARQUEURS_PAR_CHAMP = {
 'stabilite':   {'NONE', 'undetermined'},   # « undetermined » est prévu par le contrat
 'relationship':{'NONE'},                   # ⚠ PAS « undetermined » : le degré inconnu = NULL
 'famille':     {'NONE'},
 'relation':    {'NONE'},
 'evidence_role':{'NONE'},
}
DEFAUT_MARQUEURS = {'NONE'}
GABARIT = re.compile(r'^<[a-z_]+>$')

def marqueurs(champ): return MARQUEURS_PAR_CHAMP.get(champ, DEFAUT_MARQUEURS)

def normaliser(c):
    c = (c or '').strip().lower()
    return c if c in CANON else (c.rstrip('s') if c.rstrip('s') in CANON else None)

def analyser(chemin):
    w = openpyxl.load_workbook(chemin, read_only=True)
    parA, parB, parC = [], [], []
    for nom in w.sheetnames:
        s = w[nom]; it = s.iter_rows(values_only=True)
        try: head = next(it)
        except StopIteration: continue
        cols = [str(h) if h is not None else f'(sans_titre_{i})' for i, h in enumerate(head)]
        vus = [collections.Counter() for _ in cols]
        longs = [collections.Counter() for _ in cols]
        for r in it:
            for i, v in enumerate(r[:len(cols)]):
                if v in (None, ''): continue
                t = str(v).strip()
                if len(t) <= 40: vus[i][t] += 1
                else: longs[i][t[:4000]] += 1

        for i, c in enumerate(cols):
            champ = normaliser(c)
            obs = set(vus[i])
            # ── A · par NOM
            if champ:
                admis, src = CANON[champ]
                ok_marq = marqueurs(champ)
                hors = sorted(v for v in obs - set(admis)
                              if v not in ok_marq and not GABARIT.match(v))
                gab = sorted(v for v in obs if GABARIT.match(v))
                marq_vus = sorted(v for v in obs & ok_marq)
                marq_refuses = sorted(v for v in obs
                                      if v in {'undetermined','NONE','N/A','TBD'} and v not in ok_marq)
                parA.append({'onglet': nom, 'colonne': c, 'champ': champ, 'regle': src,
                             'admises': admis, 'observees': sorted(obs),
                             'marqueurs_admis_vus': marq_vus,
                             'MARQUEURS_REFUSES': marq_refuses,
                             'gabarits': gab, 'HORS_VOCABULAIRE': hors})
            # ── B · par VALEUR, quel que soit le nom
            else:
                for champ2, (admis, src) in CANON.items():
                    if not obs: continue
                    inter = obs & set(admis)
                    if len(inter) >= 2 and len(inter) / len(obs) >= 0.6:
                        parB.append({'onglet': nom, 'colonne': c, 'notion_probable': champ2,
                                     'regle': src, 'valeurs_canoniques_vues': sorted(inter),
                                     'autres_valeurs': sorted(obs - set(admis))[:15],
                                     'part_canonique': round(len(inter)/len(obs), 2)})
            # ── C · COMPOSITE : vocabulaire enfoui dans un texte long
            for champ2, (admis, src) in CANON.items():
                trouves = collections.Counter()
                for t, n in longs[i].items():
                    for a in admis:
                        if re.search(rf'\b{re.escape(a)}\b', t): trouves[a] += n
                if trouves:
                    parC.append({'onglet': nom, 'colonne': c, 'notion': champ2, 'regle': src,
                                 'valeurs_enfouies': dict(trouves.most_common(12))})
    return {'par_nom': parA, 'par_valeur': parB, 'composite': parC}

def controler(res):
    """Échecs durs. Rend la liste des violations."""
    v = []
    for d in res['par_nom']:
        for m in d['MARQUEURS_REFUSES']:
            v.append(f"{d['onglet']}·{d['colonne']} : marqueur « {m} » INTERDIT sur le champ {d['champ']}")
        for h in d['HORS_VOCABULAIRE']:
            v.append(f"{d['onglet']}·{d['colonne']} : valeur « {h} » hors {d['regle']}")
    return v

def autotest():
    """Réintroduit relationship « undetermined » et EXIGE l'échec. Un contrôle qui ne
       s'est jamais déclenché ne prouve rien."""
    faux = {'par_nom': [{'onglet': 'TEST', 'colonne': 'relationship', 'champ': 'relationship',
                         'regle': CANON['relationship'][1], 'admises': CANON['relationship'][0],
                         'observees': ['undetermined'], 'marqueurs_admis_vus': [],
                         'MARQUEURS_REFUSES': ['undetermined'], 'gabarits': [],
                         'HORS_VOCABULAIRE': []}], 'par_valeur': [], 'composite': []}
    viol = controler(faux)
    assert viol and 'undetermined' in viol[0], "AUTOTEST ÉCHOUÉ : relationship undetermined non détecté"
    # Et le même marqueur doit rester ADMIS sur la stabilité.
    ok = {'par_nom': [{'onglet': 'TEST', 'colonne': 'stabilite', 'champ': 'stabilite',
                       'regle': CANON['stabilite'][1], 'admises': CANON['stabilite'][0],
                       'observees': ['undetermined'], 'marqueurs_admis_vus': ['undetermined'],
                       'MARQUEURS_REFUSES': [], 'gabarits': [], 'HORS_VOCABULAIRE': []}],
          'par_valeur': [], 'composite': []}
    assert not controler(ok), "AUTOTEST ÉCHOUÉ : undetermined refusé à tort sur la stabilité"
    print('AUTOTEST : relationship « undetermined » → REFUSÉ ✓ · stabilite « undetermined » → ADMIS ✓')

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--classeur', default='Candice_Discovery_Referentiel_V5_OPEN_V3.xlsx')
    p.add_argument('--sortie', default='/mnt/user-data/outputs/discovery-vocabulaires-confrontes.json')
    p.add_argument('--autotest', action='store_true')
    a = p.parse_args()
    if a.autotest: autotest()
    res = analyser(a.classeur)
    viol = controler(res)
    res['violations'] = viol
    res['couverture_du_controle'] = (
        "A : colonnes NOMMÉES comme un vocabulaire canonique. "
        "B : colonnes dont les VALEURS sont majoritairement canoniques, quel que soit le nom. "
        "C : vocabulaire ENFOUI dans des textes longs. "
        "Hors couverture : une notion exprimée en mots libres sans réutiliser les valeurs "
        "canoniques, et toute colonne dont le sens métier ne se lit pas dans ses valeurs.")
    json.dump(res, open(a.sortie, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f"A par nom : {len(res['par_nom'])}  ·  B par valeur : {len(res['par_valeur'])}  ·  C composite : {len(res['composite'])}")
    for d in res['par_valeur']:
        print(f"  B  {d['onglet']}·{d['colonne']} → {d['notion_probable']} ({d['part_canonique']}) : {', '.join(d['valeurs_canoniques_vues'])}")
    for d in res['composite'][:12]:
        print(f"  C  {d['onglet']}·{d['colonne']} → {d['notion']} : {d['valeurs_enfouies']}")
    print(f"\nVIOLATIONS : {len(viol)}")
    for v in viol: print('  ⚠', v)
    sys.exit(1 if viol else 0)
