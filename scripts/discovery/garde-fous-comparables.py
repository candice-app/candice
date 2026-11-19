#!/usr/bin/env python3
"""GARDE-FOUS COMPARABLES — décision D1 d'Estelle, 19 nov. 17h43.

Produit `src/lib/discovery/open-v3/garde-fous-comparables.json` depuis la matrice des garde-fous
(`garde-fous.json`) et la banque. Chaque ligne y reçoit un MODE DE COMPARAISON avec une idée,
fait de champs déclarés, comparés CÔTÉ SERVEUR à une description structurée de l'idée :

  valeur      la réponse est une valeur d'une DIMENSION de l'idée. La dimension est la question
              elle-même, ses valeurs possibles sont les options de la question (sans les options
              de méta-réponse). « Cuir » à « Quelles odeurs évites-tu ? » → l'idée a-t-elle, pour
              la dimension fragrance2.1152, la valeur « Cuir » ?
  categorie   la réponse refuse tout ce que la question vise, dans ses canaux : « Je préfère qu'on
              ne m'offre pas de chaussures » → toute idée de cadeau du domaine chaussures.
  maniere     la réponse refuse une manière commune à toutes les idées : rien de matériel, rien
              sans me demander, rien qui m'expose, rien qui partage une information sur moi,
              rien d'occasion, aucun abonnement, aucun produit dérivé.
  reserve     la réponse pose une restriction que seule la personne peut vérifier (« Une
              grossesse » pour un soin) : dans son domaine, aucune idée n'est vérifiablement
              compatible.
  condition   « Oui, si je valide le contenu » : n'écarte rien ; HARD, elle empêche de présenter
              l'idée comme compatible tant qu'elle n'est pas remplie.
  resistant   ce que cette approche ne sait pas comparer : motif et exemple écrits.

La TAXONOMIE (dimensions et valeurs par domaine, dimensions communes) est publique : elle est la
même pour tout le monde et ne dit rien de ce qu'un proche a répondu. C'est elle seule qu'un
modèle reçoit pour décrire une idée.
"""
import json, re, pathlib, collections

R = pathlib.Path(__file__).resolve().parents[2]
M = json.load(open(R / 'src/lib/discovery/open-v3/garde-fous.json'))
qs = json.load(open(R / 'src/lib/discovery/open-v3/banque.json')); qs = qs if isinstance(qs, list) else qs['questions']
Q = {q['id']: q for q in qs}

# Options de méta-réponse : elles ne décrivent jamais une idée.
META = re.compile(r"^(rien|aucun|aucune|jamais|je ne sais pas|ça dépend|cela dépend|autre|peu importe|pas vraiment|non|oui)\b|ne m.offre pas|qu.on ne m.offre|préfère éviter|préfère ne pas|laisse tranquille|ne rien|ne pas recevoir|pas un cadeau pour moi|sans référence précise", re.I)

UNIVERSELLES = {
  'materiel':         {'intitule': "L'idée consiste-t-elle à offrir un OBJET matériel ?", 'valeurs': ['oui', 'non']},
  'decidee_sans_elle': {'intitule': "L'idée se fait-elle sans demander d'abord son avis à la personne (initiative, surprise, organisation à sa place) ?", 'valeurs': ['oui', 'non']},
  'surprise':         {'intitule': "L'idée repose-t-elle sur une surprise ?", 'valeurs': ['oui', 'non']},
  'expose_au_regard': {'intitule': "L'idée expose-t-elle la personne au regard d'autres personnes (public, réseaux, discours, mise en avant) ?", 'valeurs': ['oui', 'non']},
  'partage_information': {'intitule': "L'idée partage-t-elle ou utilise-t-elle une information personnelle sur la personne auprès d'autres ?", 'valeurs': ['oui', 'non']},
  'seconde_main':     {'intitule': "L'objet proposé est-il d'occasion, vintage ou de seconde main ?", 'valeurs': ['oui', 'non']},
  'abonnement':       {'intitule': "L'idée est-elle un abonnement ou un service récurrent ?", 'valeurs': ['oui', 'non']},
  'produit_derive':   {'intitule': "L'objet est-il un produit dérivé (goodies, figurine, objet à l'effigie d'une œuvre, d'une équipe, d'un artiste) ?", 'valeurs': ['oui', 'non']},
}
# Manières reconnues dans le LIBELLÉ de la réponse, avec la valeur refusée de la dimension commune.
MANIERES = [
  (r"rien de matériel|aucun cadeau matériel|pas d.objet|aucun objet\b(?! dérivé)", 'materiel', 'oui'),
  (r"je préfère posséder", 'materiel', 'non'),
  (r"sans me demander|sans mon accord|aucune initiative|ne rien faire sans", 'decidee_sans_elle', 'oui'),
  (r"aucune surprise|pas de surprise", 'surprise', 'oui'),
  (r"aucun abonnement", 'abonnement', 'oui'),
  (r"produits? dérivés?|objets? dérivés?", 'produit_derive', 'oui'),
  (r"ne pas accumuler|éviter d.en accumuler|préfère ne pas accumuler", 'materiel', 'oui'),
]
CIBLE_UNIVERSELLE = {
  'toute proposition qui expose cette personne au regard des autres': ('expose_au_regard', 'oui'),
  'toute proposition qui partage ou utilise une information sur cette personne': ('partage_information', 'oui'),
  'un cadeau d’occasion offert à cette personne': ('seconde_main', 'oui'),
}
CATEGORIE = re.compile(r"éviter les cadeaux (?:de |liés|professionnels)|éviter ce terrain|ne m.offre pas|qu.on ne m.offre|éviter ce type|éviter les cadeaux liés|pas vraiment un cadeau pour moi|ne pas recevoir|ne rien recevoir|^jamais$|^aucun(e)?$|^rien$|^je préfère éviter$|laisse tranquille|^que l.on ne fasse presque rien$", re.I)
RESERVE = re.compile(r"^(une grossesse|des allergies|des sensibilités|des contre-indications|un traitement)", re.I)
RESISTANTS = [
  (r"possède déjà", "comparer à ce que la personne possède déjà demande un inventaire que Candice n'a pas", "« Un objet que j'ai déjà » : un livre peut être un doublon sans qu'aucune description de l'idée le dise."),
  (r"sans référence précise", "la condition porte sur la QUALITÉ de l'information du pilote (une référence précise), pas sur l'idée", "« Rien de matériel sans référence précise » : la même idée de matériel est acceptable avec la bonne référence, refusée sans."),
  (r"mauvaise localisation|mal situé|trop loin", "la qualité d'un lieu (localisation) ne se lit pas dans une idée, seulement dans une réservation précise", "« Une mauvaise localisation » : « un week-end à Lisbonne » ne dit pas où est l'hôtel."),
  (r"trop basique|bas de gamme|qualité médiocre|mal fait|mauvaise qualité", "un niveau de qualité est relatif : aucune description d'idée ne l'établit", "« Du matériel trop basique » : « un set d'aquarelle » peut l'être ou non selon la référence."),
  (r"^rien : |^rien pour l.instant$|^faire comme si rien", "la réponse dit qu'aucune attention n'est souhaitée dans ce contexte, mais le contexte (le moment, l'état de la personne) n'est pas une caractéristique de l'idée", "« Rien pour l'instant » (dreams.2001) : le refus vaut pour une période que l'idée ne porte pas."),
]

# « Je préfère éviter les talons » : la réponse NOMME ce qu'elle écarte. Ce nom, recopié tel quel,
# est la valeur de la dimension (aucune paraphrase).
EVITE = re.compile(r"^je préfère (?:éviter|ne pas recevoir|ne pas avoir) (?P<objet>(?:les|le|la|l’|l'|des|tout ce qui|ce qui)\b.+)$", re.I)
def descriptif(lib):
    m = EVITE.match(lib.strip())
    return m.group('objet').strip() if m else None
lignes = []
for l in M['matrice']:
    q = Q.get(l['question']); lib = l['libelle'].strip(); base = {k: l[k] for k in ('question', 'libelle', 'domaine', 'canaux', 'contrainte', 'nature')}
    if l['statut'] != 'traduit':
        motif = ("ce qui est refusé dépend d'un paramètre de l'énoncé (" + re.search(r'\{[^}]+\}', l['enonce']).group(0) + ") : il se compare à la préparation en cours, pas à l'idée seule"
                 if '{' in l['enonce'] else "la matrice n'a pas pu traduire cette réponse (options encore à écrire, ou objet précis non identifié)")
        lignes.append({**base, 'mode': 'resistant', 'motif': motif, 'exemple': f"« {lib} » à « {l['enonce']} »"}); continue
    if not q:
        lignes.append({**base, 'mode': 'resistant', 'motif': 'question absente de la banque active', 'exemple': ''}); continue
    res = next(((m, e) for r_, m, e in RESISTANTS if re.search(r_, lib, re.I)), None)
    if res:
        lignes.append({**base, 'mode': 'resistant', 'motif': res[0], 'exemple': res[1]}); continue
    if l['nature'] == 'condition':
        lignes.append({**base, 'mode': 'condition', 'dimension': l['question'], 'portee': 'domaine'}); continue
    man = next(((d, v) for r_, d, v in MANIERES if re.search(r_, lib, re.I)), None)
    if man:
        lignes.append({**base, 'mode': 'maniere', 'dimension': man[0], 'valeurs': [man[1]], 'portee': 'domaine'}); continue
    if l['cible'] in CIBLE_UNIVERSELLE:
        d, v = CIBLE_UNIVERSELLE[l['cible']]
        lignes.append({**base, 'mode': 'maniere', 'dimension': d, 'valeurs': [v], 'portee': 'toutes' if l['cible'].startswith('toute proposition') else 'domaine'}); continue
    if RESERVE.search(lib):
        lignes.append({**base, 'mode': 'reserve', 'portee': 'domaine'}); continue
    if CATEGORIE.search(lib) or l['cible'] == 'toute proposition dans ce domaine':
        lignes.append({**base, 'mode': 'categorie', 'portee': 'domaine'}); continue
    obj = descriptif(lib)
    if obj and not re.search(r"connais déjà|que je connais", obj):
        lignes.append({**base, 'mode': 'valeur', 'dimension': l['question'], 'valeurs': [obj]}); continue
    if re.match(r"^(non|oui|pas vraiment|peu)\b", lib, re.I):
        lignes.append({**base, 'mode': 'resistant', 'motif': "réponse oui/non : ce qu'elle refuse dépend du sens de la question, qui n'est pas une caractéristique d'idée écrite", 'exemple': f"« {lib} » à « {l['enonce']} »"}); continue
    if META.search(lib):
        lignes.append({**base, 'mode': 'resistant', 'motif': "réponse de méta-niveau qui ne nomme ni une valeur, ni une catégorie, ni une manière reconnue", 'exemple': f"« {lib} » à « {l['enonce']} »"}); continue
    lignes.append({**base, 'mode': 'valeur', 'dimension': l['question'], 'valeurs': [lib]})

# La taxonomie : une dimension par question qui porte au moins une ligne « valeur », avec TOUTES ses
# options descriptives (pas seulement celles que quelqu'un a refusées).
dims = {}
for l in lignes:
    if l['mode'] != 'valeur': continue
    q = Q[l['question']]
    d = dims.setdefault(q['id'], {'id': q['id'], 'domaine': l['domaine'], 'intitule': q['enonce'],
                                  'valeurs': [descriptif(o['libelle']) or o['libelle'] for o in q['options'] if descriptif(o['libelle']) or not META.search(o['libelle'])]})
    assert l['valeurs'][0] in d['valeurs'], (q['id'], l['valeurs'], d['valeurs'])
domaines = sorted({l['domaine'] for l in lignes})
sortie = {
  'version': '2026-11-19.d1', 'source': 'garde-fous.json (' + M['classeur'] + ') et banque active',
  'note': 'Taxonomie publique (la même pour tous) + mode de comparaison de chaque ligne. Aucune ligne ne s’applique par un mot partagé.',
  'domaines': domaines, 'universelles': UNIVERSELLES, 'dimensions': sorted(dims.values(), key=lambda d: d['id']),
  'lignes': lignes,
}
json.dump(sortie, open(R / 'src/lib/discovery/open-v3/garde-fous-comparables.json', 'w'), ensure_ascii=False, indent=1)
c = collections.Counter(l['mode'] for l in lignes)
print(dict(c), '| dimensions', len(dims), '| HARD par mode', dict(collections.Counter(l['mode'] for l in lignes if l['contrainte'] == 'HARD')))
for l in [x for x in lignes if x['mode'] == 'resistant'][:60]: print('  R', l['question'], '|', l['libelle'][:60], '|', l['motif'][:90])
