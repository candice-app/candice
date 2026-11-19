#!/usr/bin/env python3
"""RÔLES DES PRÉFÉRENCES DE SERVICE (M2) — décision D11 d'Estelle (19 nov.).

« Écris l'acteur, le bénéficiaire et le contexte quand ils sont établis ; une valeur inconnue reste
inconnue. Pour « être prévenu », ne choisis pas un acteur à la place de la personne ; une
clarification pourra compléter ce point à l'usage. »

Produit `src/lib/discovery/open-v3/roles-de-service.json` : pour CHAQUE question dont une option est
`service_preference`, ce que son ÉNONCÉ établit, avec le passage qui le fonde. Rien n'est deviné :
  · acteur : « un proche » → proche ; « l'autre » (couple) → partenaire ; tout le reste (« on »,
    « quelqu'un », forme passive comme « être prévenu(e) ») → non_etabli ;
  · bénéficiaire : la personne quand l'énoncé la désigne comme celle qui reçoit (te, toi, pour toi,
    recevoir, ton/ta/tes…) ; non_etabli quand elle y est celle qui agit (liste écrite ci-dessous) ;
  · contexte : la préparation en cours quand la question en exige une (écrit à la réponse) ; le
    projet nommé à dreams.1997 pour « ce projet » ; sinon le complément de l'énoncé (« Pour une
    occasion importante ») tel quel ; sinon non_precise.
Usage : python3 scripts/discovery/roles-de-service.py
"""
import json, re, pathlib
R = pathlib.Path(__file__).resolve().parents[2]
qs = json.load(open(R / 'src/lib/discovery/open-v3/banque.json'))
# Énoncés où la personne est celle qui AGIT (organise, choisit, délègue pour une célébration qu'elle
# prépare) : le bénéficiaire n'y est pas établi.
ELLE_AGIT = {'celebav.2173': '« tu es prêt(e) à… » : elle agit', 'celebav.2175': '« comment trouves-tu tes idées » : elle cherche',
             'celebav.2191': '« ce que tu aimerais déléguer » : l’organisation qu’elle porte', 'celebav.2192': '« ton niveau de contrôle » sur ce qu’elle organise',
             'celebav.2198': '« quel rôle souhaites-tu garder » : elle organise', 'legacy.1514': '« quel degré de formalisation » : sa transmission, à d’autres'}
# Énoncés où l'OPTION établit qu'elle est celle qui reçoit, sans pronom dans l'énoncé.
ELLE_RECOIT = {'celebav.2155': '« Ne rien savoir du tout », « Tout savoir à l’avance » : c’est elle que la surprise vise',
               'craft.0666': '« Une vraie surprise », « Recevoir une participation » : c’est elle qui reçoit l’œuvre',
               'daily2.1120': '« être prévenu(e) » : c’est elle qui est prévenue (qui prévient reste non établi, D11)'}
RECOIT = re.compile(r"\b(te|toi|ton|ta|tes|recevoir|recommande|surprendre)\b|\bt’|\bt'|pour toi|qu’on|qu'on|qu’un proche|que l’autre", re.I)
lignes = {}
for q in qs:
    if not any(o.get('attribut') == 'service_preference' for o in q['options']): continue
    e = q['enonce']
    if re.search(r"qu[’']un proche", e): acteur, fa = 'proche', '« un proche »'
    elif re.search(r"que l[’']autre", e): acteur, fa = 'partenaire', '« l’autre » (moment à deux)'
    else: acteur, fa = 'non_etabli', 'l’énoncé ne nomme pas qui agit' + (' (« être prévenu(e) » : D11)' if 'prévenu' in e else '')
    if q['id'] in ELLE_AGIT: benef, fb = 'non_etabli', ELLE_AGIT[q['id']]
    elif q['id'] in ELLE_RECOIT: benef, fb = 'la_personne', ELLE_RECOIT[q['id']]
    elif RECOIT.search(e): benef, fb = 'la_personne', f'« {RECOIT.search(e).group(0)} »'
    else: benef, fb = 'non_etabli', 'l’énoncé ne désigne pas qui reçoit'
    if 'ce projet' in e: ctx, fc = 'projet_de:dreams.1997', '« ce projet » : le projet nommé à dreams.1997'
    elif re.search(r'\{[^}]+\}', e): ctx, fc = 'preparation', 'paramètre d’énoncé : la préparation qui le remplit'
    elif q['niveau'] == 'C': ctx, fc = 'preparation', 'question de niveau C : la préparation en cours, écrite à la réponse'
    elif re.match(r'^Pour (ce|cette|cet|ces) ', e): ctx, fc = 'non_etabli', '« ' + re.match(r'^Pour (ce|cette|cet|ces) [^,?…]+', e).group(0) + ' » : référent non résolu'
    else:
        m = re.match(r'^(Pour|Autour de|Dans|Quand|Si|En|Concernant) ([^,?…]+)[,…]', e)
        ctx, fc = (m.group(0).rstrip(',… ').strip(), 'complément de l’énoncé, tel quel') if m else ('non_precise', 'aucun contexte dans l’énoncé')
    lignes[q['id']] = {'enonce': e, 'acteur': acteur, 'beneficiaire': benef, 'contexte': ctx, 'fondement': {'acteur': fa, 'beneficiaire': fb, 'contexte': fc}}
(R / 'src/lib/discovery/open-v3/roles-de-service.json').write_text(json.dumps({'version': '2026-11-19.D11', 'note': __doc__.split('\n\n')[1], 'questions': lignes}, ensure_ascii=False, indent=1) + '\n')
import collections
print(len(lignes), collections.Counter(v['acteur'] for v in lignes.values()), collections.Counter(v['beneficiaire'] for v in lignes.values()), collections.Counter(v['contexte'] for v in lignes.values() if v['contexte'] in ('preparation','non_precise','projet_de:dreams.1997')))
for i in ['daily2.1143','dreams.1999','celebav.2155','craft.0666','daily2.1120','daily2.1132','celebav.2175']: print(i, {k: lignes[i][k] for k in ('acteur','beneficiaire','contexte')})
