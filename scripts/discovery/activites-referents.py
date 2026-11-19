"""LES RÉFÉRENTS D'ACTIVITÉ — table générée (20 nov., principe validé par Estelle).

« Une activité comme la céramique peut être le sujet d'un intérêt ou d'une pratique. Elle doit pouvoir
servir de paramètre à une question sans être transformée automatiquement en entité marchande ou en
nouvelle famille de connaissance. Je valide le principe d'un référent d'activité explicitement typé,
rattaché au construct canonique et à sa provenance. »

Un référent d'activité n'est PAS une entité du journal : aucune ligne nouvelle n'est écrite. Il est
DÉRIVÉ, à la lecture de l'état, d'une réponse fermée que la personne a donnée, et il garde :
  · son construct canonique (le domaine et la clé que l'option écrit déjà) ;
  · son MODE, qui dit ce que la réponse établit, et rien de plus :
      attrait   — « t'attirent », « aimes-tu regarder » : elle aime ; elle ne pratique pas forcément ;
      pratique  — « pratiques-tu réellement aujourd'hui » : elle pratique ; ni niveau, ni équipement,
                  ni envie de progresser ne s'en déduisent ;
  · sa provenance (question, option).
Ce n'est ni un atelier concret, ni un établissement, ni un événement : il n'a ni lieu, ni date, ni
prestataire. Ces trois-là restent des entités du journal (lieu, événement), avec leurs propres règles.

Les questions qui le prennent pour paramètre, et le prérequis EXACT de chacune, sont écrits plus bas.
"""
import json, hashlib, unicodedata, re
B = json.load(open('src/lib/discovery/open-v3/banque.json'))
Q = {q['id']: q for q in (B['questions'] if isinstance(B, dict) else B)}

# La forme lue dans un énoncé (« Qu'est-ce que tu aimes le plus dans {activité} ? ») : avec son article.
FORME = {
 # craft.0615 — univers créatifs (attrait)
 'Photographie': 'la photographie', 'Peinture': 'la peinture', 'Dessin ou illustration': 'le dessin ou l’illustration',
 'Aquarelle': 'l’aquarelle', 'Gravure ou impression': 'la gravure ou l’impression', 'Sculpture': 'la sculpture',
 'Céramique ou poterie': 'la céramique ou la poterie', 'Collage': 'le collage', 'Calligraphie ou lettering': 'la calligraphie ou le lettering',
 'Arts textiles': 'les arts textiles', 'Couture': 'la couture', 'Broderie': 'la broderie', 'Tricot ou crochet': 'le tricot ou le crochet',
 'Tissage': 'le tissage', 'Travail du bois': 'le travail du bois', 'Verre': 'le travail du verre', 'Mosaïque': 'la mosaïque',
 'Bijouterie créative': 'la bijouterie créative', 'Reliure ou papeterie': 'la reliure ou la papeterie', 'Sérigraphie': 'la sérigraphie',
 'Art numérique': 'l’art numérique', 'Design d’objet': 'le design d’objet', 'Artisanat local': 'l’artisanat local',
 # sportw.0532 — sports regardés (attrait)
 'Football': 'le football', 'Rugby': 'le rugby', 'Tennis': 'le tennis', 'Basket': 'le basket', 'Handball': 'le handball',
 'Volleyball': 'le volleyball', 'Formule 1': 'la Formule 1', 'Moto': 'la moto', 'Cyclisme': 'le cyclisme', 'Athlétisme': 'l’athlétisme',
 'Natation': 'la natation', 'Ski': 'le ski', 'Sports de combat': 'les sports de combat', 'Boxe': 'la boxe', 'Golf': 'le golf',
 'Sports américains': 'les sports américains', 'Esport': 'l’esport', 'Équitation': 'l’équitation',
 # sportp.0504 — sports pratiqués (pratique)
 'Course à pied': 'la course à pied', 'Trail': 'le trail', 'Marche': 'la marche', 'Randonnée': 'la randonnée', 'Vélo': 'le vélo',
 'VTT': 'le VTT', 'Fitness': 'le fitness', 'Musculation': 'la musculation', 'CrossFit': 'le CrossFit', 'Yoga': 'le yoga',
 'Pilates': 'le Pilates', 'Danse': 'la danse', 'Padel': 'le padel', 'Escalade': 'l’escalade', 'Snowboard': 'le snowboard',
 'Surf': 'le surf', 'Voile': 'la voile', 'Triathlon': 'le triathlon',
}
SOURCES = {
 'craft.0615': ('attrait', '« Quels univers créatifs ou artistiques t’attirent vraiment ? » : un attrait déclaré, pas une pratique'),
 'sportw.0532': ('attrait', '« Quels sports aimes-tu réellement regarder ? » : aimer regarder, pas pratiquer'),
 'sportp.0504': ('pratique', '« Quels sports pratiques-tu réellement aujourd’hui ? » : une pratique actuelle déclarée ; ni niveau, ni fréquence, ni équipement'),
}
EXCLUES = {
 'craft.0642': '« pratiques-tu ou aimerais-tu pratiquer » : la réponse ne dit pas laquelle des deux — elle n’établit ni une pratique, ni une envie d’essayer distincte',
 'craft.0614': '« Je pratique moi-même » ne nomme aucune activité : une pratique sans objet ne remplit pas un paramètre',
 'children.2065': 'activités qu’elle souhaite encourager chez un enfant : ce n’est pas la sienne',
 'travel2.0910': 'activités de voyage : un contexte, pas une activité qu’elle aime ou pratique pour elle-même',
}
# Le prérequis EXACT de chaque question qui prend {activité} — ou une activité pour objet.
QUESTIONS = {
 'activity.0281': (['attrait'], '« Qu’est-ce que tu aimes le plus dans {activité} ? » présume qu’elle l’aime : un attrait déclaré. Une pratique seule ne prouve pas qu’elle l’aime.'),
 'activity.0282': (['pratique'], '« Quel est ton niveau aujourd’hui ? » présume une pratique (la question demande le niveau ; elle ne le suppose pas). Aimer ne suffit pas.'),
 'activity.0283': (['pratique'], '« À quelle fréquence le pratiques-tu réellement ? » présume une pratique. Aimer ne suffit pas.'),
 'activity.0284': (['pratique'], '« … ou simplement continuer comme aujourd’hui ? » présume une pratique actuelle. Une envie d’essayer n’est pas une pratique actuelle.'),
}
FERMEES = {
 'activity.0285': '« du matériel qu’il ne faudrait surtout pas choisir à ta place » présume une pratique ÉQUIPÉE ; pratiquer ne démontre pas un équipement, et aucune réponse ne le déclare',
}
def slug(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '_', s).strip('_')
options = []
for qid, (mode, pourquoi) in SOURCES.items():
    q = Q[qid]
    for o in q['options']:
        lib = o['libelle']
        if lib == 'Autre': continue
        if lib not in FORME: raise SystemExit(f'{qid} : forme manquante pour « {lib} »')
        dom = o.get('domaine') or q['branche']
        # Le construct canonique que l'option écrit déjà : un intérêt typé, ou le fait de pratique déclarée
        # (le même contrat que la saisie « Autre » de sportp.0504, reponses-structurees.json).
        construct = f"{o['famille']}.{dom}.{o.get('cle') or o.get('attribut')}" if o.get('famille') else 'discovery.fait.sport_practice.pratique'
        options.append({'question': qid, 'option': lib, 'mode': mode, 'domaine': dom, 'construct': construct,
                        'id': f'activite:{dom}:{slug(lib)}', 'forme': FORME[lib]})
out = {
 'version': '2026-11-20', 'note': __doc__.strip().split('\n')[0],
 'modes': {'attrait': 'elle aime (ou aime regarder) ; ne prouve pas une pratique', 'pratique': 'elle pratique aujourd’hui ; ne prouve ni niveau, ni fréquence, ni équipement, ni envie de progresser'},
 'sources': {k: {'mode': m, 'pourquoi': p} for k, (m, p) in SOURCES.items()},
 'exclues': EXCLUES, 'options': options,
 'questions': {k: {'modes': m, 'pourquoi': p} for k, (m, p) in QUESTIONS.items()}, 'fermees': FERMEES,
}
for k in list(QUESTIONS) + list(FERMEES) + list(SOURCES) + list(EXCLUES): assert k in Q, k
s = json.dumps(out, ensure_ascii=False, indent=1)
open('src/lib/discovery/open-v3/activites-referents.json', 'w').write(s + '\n')
print(len(options), 'options ;', hashlib.sha256(s.encode()).hexdigest()[:12])
