#!/usr/bin/env python3
"""LECTURES DES CONDITIONS — produit `src/lib/discovery/open-v3/lectures-de-conditions.json`.

Une condition du référentiel écrite en prose (« Si festivals appréciés (0475) », « Cadeau de
transmission », « Sous-branche : catégorie Cabas choisie ») n'est pas exécutable. Ce script en
écrit une LECTURE dans le vocabulaire que le moteur exécute déjà — niveau, branche ouverte,
préparation en cours, et la réponse donnée à une question précise :

    « Réponse à live.0475 : Festival »

Règles, toutes vérifiées à la génération :
  · une lecture n'ouvre JAMAIS plus que le texte. Quand le texte donne plusieurs cas (« passion ou
    achat concret »), seuls ceux que le moteur sait constater sont repris, les autres sont nommés
    dans `non_repris`. Quand le texte ajoute une RESTRICTION que le moteur ne sait pas constater
    (« Achat concret, budget engagé »), il n'y a pas de lecture : la retirer ouvrirait plus ;
  · une condition marquée sensible n'est jamais lue (sa garde reste entière) ;
  · chaque option citée existe dans la banque, au libellé près, sinon le script s'arrête ;
  · la condition d'origine est recopiée telle quelle : si le classeur change, le chargement
    refuse la lecture (lectures.ts) et il faut la relire.

Trois statuts :
  · etablie   : exécutée. Le texte le dit en toutes lettres, ou la question citée par son numéro
                porte l'option nommée.
  · hypothese : vraisemblable mais il faut choisir (deux sens, ou une source à désigner). NON
                exécutée ; les choix sont écrits.
  · sans_lecture : ce que le moteur ne sait pas constater, avec ce qui manque.

Usage : python3 scripts/discovery/lectures-de-conditions.py [--voir]
"""
import json, re, sys, pathlib, unicodedata

R = pathlib.Path(__file__).resolve().parents[2]
qs = json.load(open(R / 'src/lib/discovery/open-v3/banque.json')); qs = qs if isinstance(qs, list) else qs['questions']
Q = {q['id']: q for q in qs}
cond = lambda i: re.sub(r'\s+', ' ', Q[i]['condition_emission']).strip()
SENSIBLE = re.compile(r'sensitivity\s*:\s*(?:high|maximale|moyenne)|sous-branche sensible|niveau\s+s\b|ne jamais ouvrir|OUVERTURE SUR DÉMARCHE', re.I)

def norm(s):
    s = unicodedata.normalize('NFC', s).replace('’', "'").replace(' ', ' ')
    return re.sub(r'\s+', ' ', s).strip().lower()

def opt(sel, *libelles):
    """Les libellés EXACTS de la banque pour ces options de `sel` — s'arrête si l'un manque."""
    assert sel in Q, f'question citée absente : {sel}'
    par = {norm(o['libelle']): o['libelle'] for o in Q[sel]['options']}
    sortie = []
    for l in libelles:
        assert norm(l) in par, f'« {l} » n’est pas une option de {sel} : {list(par.values())}'
        sortie.append(par[norm(l)])
    return f"Réponse à {sel} : {' | '.join(sortie)}"

def sauf(sel, *exclus):
    """Toutes les options de `sel` sauf celles nommées (qui doivent exister)."""
    ex = {norm(x) for x in exclus}
    for x in ex: assert x in {norm(o['libelle']) for o in Q[sel]['options']}, f'« {x} » absent de {sel}'
    return opt(sel, *[o['libelle'] for o in Q[sel]['options'] if norm(o['libelle']) not in ex])

lectures, sans = {}, {}
def ED(i, lue_apres, critere, justification, non_repris=()):
    """Question sensible OUVERTE SUR DÉMARCHE : seule la condition d’origine (après « ║ ») est lue ;
    la marque et la consigne qui la précèdent sont recopiées à l’identique — la garde reste entière."""
    c = cond(i); assert '║' in c and 'OUVERTURE SUR DÉMARCHE' in c, i
    E(i, c[:c.index('║') + 1] + ' ' + lue_apres, critere, justification, non_repris)
    lectures[i]['demarche'] = True
def E(ids, lue, critere, justification, non_repris=()):
    for i in ([ids] if isinstance(ids, str) else ids):
        assert i in Q, i
        lectures[i] = {'question': i, 'origine': cond(i), 'lue': lue, 'statut': 'etablie', 'critere': critere,
                       'justification': justification, 'non_repris': list(non_repris)}
def H(ids, manque, choix):
    for i in ([ids] if isinstance(ids, str) else ids):
        assert i in Q, i
        sans[i] = {'question': i, 'origine': cond(i), 'statut': 'hypothese', 'manque': manque, 'choix': choix}
def S(ids, manque, decision=None):
    # `decision` : la fermeture est VOULUE par une décision d'Estelle (citée) — à ne pas confondre avec
    # une condition que le moteur ne sait pas encore constater (19 nov., 19h56).
    for i in ([ids] if isinstance(ids, str) else ids):
        assert i in Q, i
        sans[i] = {'question': i, 'origine': cond(i), 'statut': 'sans_lecture', 'manque': manque, **({'decision': decision} if decision else {})}

NUM = 'question citée par son numéro'
CAT = 'catégorie choisie à la question de tri de la branche'

# ═════ 1. RENVOIS NUMÉROTÉS — la question citée porte l'option nommée ═════════════════════════
E('music2.1017', opt('music2.1016', 'Vinyles'), NUM, '« vinyle actif (1016) » : « Vinyles » coché à music2.1016.')
E('daily2.1129', sauf('daily2.1128', 'Je ne recherche pas particulièrement du temps seul(e)'), NUM,
  '« temps pour soi valorisé (1128) » : toute réponse sauf celle qui dit ne pas le rechercher. « Très rarement » dit qu’elle en a peu, pas qu’elle n’y tient pas.')
E('fashion2.1083', opt('fashion2.1082', 'Est en train d’évoluer'), NUM, '« le style évolue (1082) » : la seule réponse qui le dit au présent.',
  ['« Est devenu plus simple / affirmé » (évolution passée) et « Ne reflète pas encore qui je suis » ne sont pas repris'])
E('jewelry.0292', 'Branche jewelry ouverte ET ' + sauf('jewelry.0291', 'Je préfère qu’on ne m’offre pas de bijoux'), NUM,
  '« jewelry.0291 non fermante » : toute réponse sauf le refus. Sans réponse à 0291, la question attend (0291 est de même niveau et posée d’abord).')
E('watch.0309', 'Branche watch ouverte ET ' + sauf('watch.0308', 'Je préfère qu’on ne m’offre pas de montre'), NUM, '« 0308 non fermante » : toute réponse sauf le refus.')
E('work2.1341', 'Branche work2 ouverte ET ' + opt('work2.1340', 'Oui énormément', 'Oui selon le contexte', 'Seulement certains cadeaux'), NUM,
  '« attention professionnelle acceptée (1340) » : les trois réponses d’acceptation.', ['« Peu » et « Pas vraiment » ne sont pas une acceptation'])
E(['live.0486', 'live.0490'], opt('live.0475', 'Festival'), NUM, '« festivals appréciés / festival envisagé (0475) » : « Festival » coché à live.0475.')
E(['live.0487', 'live.0492'], opt('live.0475', 'Spectacle de danse', 'Ballet'), NUM, '« danse appréciée (0475) » : « Spectacle de danse », et « Ballet », qui en est un.')
E('music2.1030', opt('music2.1005', 'Musique de film'), NUM, '« la musique de film compte (1005) » : « Musique de film » cochée.')
E(['pets.0392', 'pets.0393', 'pets.0394'], opt('pets.0391', 'J’ai un ou plusieurs animaux', 'Les animaux font vraiment partie de ma famille'), NUM,
  '« Animal présent (pets.0391) » : les deux réponses qui disent un animal à soi.', ['« Les animaux sont une véritable passion » ne dit pas qu’elle en a un'])
E('pets.0395', opt('pets.0391', 'J’ai un ou plusieurs animaux', 'Les animaux font vraiment partie de ma famille') + ' ET ' +
  opt('pets.0394', 'J’adorerais', 'Oui de temps en temps', 'Pourquoi pas'), NUM,
  '« Animal présent + cadeau animal non refusé » : un animal (pets.0391) ET pets.0394 hors des deux refus.')
E('pets.0404', opt('pets.0392', 'Chien'), NUM, '« Générée uniquement pour les chiens » : « Chien » à pets.0392 (« Quels animaux partagent ta vie ? »).', ['« Plusieurs espèces » ne dit pas lesquelles'])
E('pets.0405', opt('pets.0392', 'Chat'), NUM, '« Générée uniquement pour les chats » : « Chat » à pets.0392.', ['« Plusieurs espèces » ne dit pas lesquelles'])
E('resonance.1532', opt('resonance.1526', 'Les animaux'), NUM, '« sensibilité aux animaux détectée (1526) ».')
E('resonance.1533', opt('resonance.1526', 'Les enfants'), NUM, '« sensibilité aux enfants détectée (1526) ».')
E('resonance.1534', opt('resonance.1526', 'Les personnes âgées'), NUM, '« si sensibilité détectée (1526) » : l’énoncé porte sur les personnes âgées, l’option du même nom.')
E('resonance.1535', opt('resonance.1526', 'Les artisans et les savoir-faire'), NUM, '« sensibilité aux savoir-faire » (territoire de resonance.1526, comme ses voisines numérotées).')
E('sportw.0542', opt('sportw.0541', 'Maillot officiel'), NUM, '« merchandising sportif accepté (0541) », et l’énoncé porte sur un maillot : « Maillot officiel » coché.',
  ['les autres objets dérivés acceptés ne disent rien d’un maillot'])
E('daily2.1145', 'Niveau C daily2 ET ' + sauf('daily2.1144', 'Je préfère une petite aide quotidienne'), NUM,
  '« après 1144 » : un créneau a été désigné ; « ce temps » de l’énoncé est ce créneau.')
E('joys.1890', 'Niveau B joys ET ' + opt('joys.1883', 'La nourriture ou une boisson'), NUM, '« SEULEMENT si nourriture ou boisson choisie (1883) ».')
E('gaming2.1408', opt('gaming2.1404', 'Une expérience VR'), NUM, '« UNIQUEMENT si intérêt (1390/1404) » : seule gaming2.1404 porte la réalité virtuelle.')
E('garden.0577', opt('garden.0560', 'Les jardins paysagers') + ' OU ' + opt('garden.0558', 'Un petit jardin', 'Un grand jardin'), NUM,
  '« jardin paysager (0560 / espace jardin en 0558) » : l’un ou l’autre.')
E('photo.0689', opt('photo.0675', 'Confirmé(e)', 'Expert(e)', 'Professionnel(le) ou semi-pro'), NUM, '« niveau confirmé+ en 0675 ».')
E('podcast.0463', opt('podcast.0445', 'True crime') + ' OU ' + opt('podcast.0446', 'Une enquête'), NUM, '« true crime/enquête apprécié (0445/0446) ».')
E('podcast.0464', opt('podcast.0445', 'Fiction audio') + ' OU ' + opt('podcast.0446', 'Une fiction audio'), NUM, '« fiction audio appréciée (0445/0446) ».')
E('podcast.0465', opt('podcast.0445', 'Humour') + ' OU ' + opt('podcast.0446', 'Un format humoristique'), NUM, '« humour apprécié (0445/0446) ».')
E('sleep.0604', sauf('sleep.0596', 'Je n’y ai jamais vraiment réfléchi') + ' OU ' + opt('sleep.0603', 'Un bel oreiller', 'Du linge de lit'), NUM,
  '« literie importante (0596/0603) » : un critère de literie nommé, ou une attention de literie souhaitée.')
E('tech2.1331', opt('tech2.1316', 'Impression 3D', 'Robotique', 'Drones'), NUM, '« UNIQUEMENT si pertinent (1316 : impression 3D, robotique, drones) ».')
E(['consumption2.1202', 'consumption2.1203', 'consumption2.1204'],
  opt('consumption2.1201', 'Est une excellente idée', 'Me plaît s’il correspond à une habitude existante', 'Me plaît s’il est limité dans le temps', 'Me convient si je n’ai rien à résilier'), NUM,
  '« si le principe est accepté (1201) » : les quatre réponses qui l’acceptent (1203 et 1204 appartiennent à la même sous-partie).',
  ['« Peut devenir une contrainte », « Risque de faire doublon » : des réserves, pas une acceptation'])
E('food2.0873', opt('food2.0872', 'Café', 'Espresso', 'Cappuccino', 'Matcha', 'Thé'), NUM, '« si café/thé apprécié (0872) » (le matcha est un thé).')
E('food2.0875', opt('food2.0874', 'Beaucoup', 'Oui'), NUM, '« si la personne aime recevoir (0874) ».', ['« Occasionnellement » ne dit pas qu’elle aime recevoir'])
E('museum.0718', opt('museum.0699', 'Expositions immersives'), NUM, '« immersif (0699) ».')
E(['photo.0686', 'photo.0687'], opt('photo.0677', 'Je les imprime', 'Je crée des albums', 'Je les encadre'), NUM, '« impression & albums (0677) ».')
E('sportp.0524', opt('sportp.0504', 'Football', 'Rugby', 'Basket', 'Handball', 'Volleyball'), NUM, '« sport collectif pratiqué (0504) » : les sports collectifs de la liste.')
E('sportw.0549', opt('sportw.0532', 'Formule 1', 'Moto'), NUM, '« F1/sports mécaniques suivis (0532) ».')
E('travel2.0900', opt('travel2.0890', 'Avec mes enfants'), 'réponse qui le dit', '« si la personne voyage avec des enfants » : « Avec mes enfants » à travel2.0890.',
  ['« En famille » ne dit pas qu’il y a des enfants'])
E('travel2.0932', opt('travel2.0890', 'Avec mes enfants'), 'réponse qui le dit', '« si séjour familial », et l’énoncé porte sur « un hôtel avec enfants » : « Avec mes enfants » à travel2.0890.')

# ═════ 2. CATÉGORIES CHOISIES à la question de tri de la branche ═══════════════════════════════
for i, libs in [('bags.0377', ['Un sac à main', 'Un petit sac ou une pochette']), ('bags.0378', ['Un cabas']), ('bags.0379', ['Un sac à dos']),
                ('bags.0380', ['Un sac ordinateur']), ('bags.0381', ['Un sac de voyage ou un week-end', 'Une valise']),
                ('bags.0382', ['Un portefeuille', 'Un porte-cartes', 'Une trousse ou un petit accessoire'])]:
    E(i, opt('bags.0360', *libs), CAT, f'« {cond(i)} » : la catégorie à bags.0360 (« Quel type de sac… »).')
for i, libs in [('shoes.0347', ['Sneakers']), ('shoes.0348', ['Bottes', 'Bottines']), ('shoes.0349', ['Chaussures habillées']),
                ('shoes.0350', ['Chaussures de sport', 'Chaussures de randonnée ou outdoor'])]:
    E(i, opt('shoes.0332', *libs), CAT, f'« {cond(i)} » : la catégorie à shoes.0332 (« Quels types de chaussures portes-tu… »).')
E('shoes.0341', opt('shoes.0332', 'Escarpins', 'Bottes', 'Bottines', 'Sandales', 'Chaussures habillées'), CAT,
  '« Uniquement si la catégorie le justifie : escarpins, bottes, bottines, sandales, chaussures habillées » : ces catégories à shoes.0332.')
for i, libs in [('fashion2.1091', ['Un beau manteau ou une veste']), ('fashion2.1092', ['Une maille ou un pull']), ('fashion2.1093', ['Une chemise ou une blouse']),
                ('fashion2.1094', ['Une robe']), ('fashion2.1095', ['Un jean']), ('fashion2.1096', ['Un pantalon']),
                ('fashion2.1097', ['Un vêtement de sport']), ('fashion2.1098', ['Un vêtement d’intérieur', 'Un pyjama'])]:
    E(i, opt('fashion2.1060', *libs), CAT, f'« {cond(i)} » : la catégorie à fashion2.1060 (« Quels vêtements aurais-tu plaisir à recevoir ? »).',
      ['« ou achat concret » : la catégorie d’un achat en préparation n’est pas connue du moteur'] if i == 'fashion2.1091' else [])
E('garden.0575', opt('garden.0560', 'Les fleurs', 'Les bouquets'), CAT, '« si la personne aime les fleurs » : « Les fleurs » ou « Les bouquets » à garden.0560.',
  ['« INDÉPENDAMMENT du jardinage » : aucune question hors de la branche ne dit qu’on aime les fleurs ; la lecture est plus étroite que le texte'])

# ═════ 3. AXES DE craft.0614 (sens fixés par Estelle le 19 nov.) ══════════════════════════════
PRATIQUE = 'Je pratique moi-même une ou plusieurs activités créatives'
FAN = ['J’aime surtout regarder et découvrir', 'J’achète parfois des œuvres ou des objets artisanaux', 'Je collectionne certains objets ou artistes', 'J’aime les beaux objets, sans être particulièrement connaisseur']
E('craft.0647', 'Niveau C craft ET ' + opt('craft.0614', PRATIQUE), 'axe défini par Estelle', '« Niveau C Pratiquant » : niveau C de la branche, pratique déclarée à craft.0614.')
E('craft.0645', 'Niveau C craft ET ' + opt('craft.0614', PRATIQUE) + ' ET Achat concret', 'axe défini par Estelle',
  '« Niveau C Pratiquant : passion ou achat concret ».', ['« passion » : aucun seuil écrit'])
E('craft.0663', 'Niveau C craft ET Achat concret', 'préparation nommée', '« Niveau C Achat : achat concret » : l’axe « Achat » est l’achat lui-même.')
E('craft.0667', opt('craft.0614', PRATIQUE, *FAN), 'axe défini par Estelle', '« Transversal aux deux axes » : Pratiquant OU Fan/acheteur (mêmes options que les questions de ces axes).')

# ═════ 4. PRÉPARATIONS EN COURS nommées en toutes lettres ══════════════════════════════════════
E(['legacy.1512', 'legacy.1513', 'legacy.1514', 'legacy.1515'], 'Cadeau concret', 'préparation nommée', '« Cadeau de transmission » : un cadeau en préparation dans la branche Transmission.')
E('travel2.0936', 'Niveau C travel2 ET Séjour concret', 'préparation nommée', '« destination envisagée » : un séjour en préparation.',
  ['proche qui veut réserver', 'budget significatif', 'surprise à sécuriser', 'rêve devenu projet actif'])
E('bags.0383', 'Niveau C bags ET Achat concret', 'préparation nommée', '« modèle réel » : un modèle précis en vue, donc un achat.',
  ['achat par un proche', 'budget important', 'contrainte bloquante', 'passion'])
E('shoes.0351', 'Niveau C shoes ET Achat concret', 'préparation nommée', '« paire précise » : un achat.', ['achat par un proche', 'budget important', 'passion', 'contrainte'])
E('watch.0317', 'Intérêt watch sélectionné ou détecté OU Achat concret', 'texte littéral', '« Seulement si intérêt horloger manifesté ou si le choix concret l’exige ».')
E('sensory2.1490', 'Niveau C sensory2', 'consigne, pas condition', '« donnée CONTEXTUELLE » dit comment ranger la réponse, pas quand poser.')
E('success.1711', 'Branche success ouverte', 'consigne, pas condition', '« donnée DATÉE » dit comment ranger la réponse.')
E(['food.%04d' % n for n in list(range(21, 30)) + list(range(31, 49)) + [50]],
  'Branche food ouverte ; Ne jamais afficher les questions alcool si la personne ne boit pas', 'nom de domaine',
  '« Cuisine/gastronomie active » : la branche food (dont c’est le nom). La consigne « ne boit pas » est conservée telle quelle.')
E('sleep.0606', 'Niveau B sleep ; Branche travel ouverte OU Branche travel2 ouverte', 'texte littéral', '« Sous-branche : voyage et décalage (si voyage actif) » : une partie du niveau B de Sommeil, ET le domaine voyage ouvert. (Une première lecture omettait la branche Sommeil et ouvrait plus que le texte : relevé en rejouant Yasmina.)')

# ═════ 5. REGROUPEMENTS ÉDITORIAUX — aucune question ne présume une situation ═════════════════
E(['consumption2.1193', 'consumption2.1194', 'consumption2.1195', 'consumption2.1196'], 'Niveau B consumption2', 'regroupement éditorial',
  '« Sous-branche Durabilité, provenance & valeurs » : un thème du niveau B ; aucun énoncé ne présume un achat ou une situation.')
E('consumption2.1201', 'Niveau B consumption2', 'regroupement éditorial', '« Abonnements, box & services récurrents » : la question demande l’avis, elle ne présume rien.')
E(['consumption2.1229', 'consumption2.1231'], 'Niveau B consumption2', 'regroupement éditorial',
  '« Achats pour les autres : la manière dont une personne OFFRE… » : la suite est une raison d’être, pas une condition.')
E('food2.0872', 'Niveau B food2', 'regroupement éditorial', '« Sous-branche Boissons » : thème du niveau B. La question ne présume pas l’alcool.')
E(['food2.0876', 'food2.0877'], 'Niveau B food2', 'regroupement éditorial', '« Sous-branche Souvenirs ».')
E(['relation2.0797', 'relation2.0798', 'relation2.0799'], 'Niveau B relation2', 'regroupement éditorial',
  '« Sous-branche Famille » (branche Relation) : moments et rôle en famille, sans présumer d’enfants ni de foyer.')
E('sleep.0605', 'Niveau B sleep', 'regroupement éditorial', '« odeurs et sommeil » : thème, aucune présomption.')
E(['fashion2.%04d' % n for n in range(1085, 1091)], 'Niveau B fashion2', 'regroupement éditorial',
  '« Niveau B Mode — habitudes d’achat » : intitulé d’un groupe de questions, sans critère.')
E(['learning2.1456', 'learning2.1457', 'learning2.1458', 'learning2.1459', 'learning2.1460', 'learning2.1461', 'learning2.1463', 'learning2.1464'],
  'Branche learning2 ouverte', 'regroupement éditorial', '« Cartouche ADN d’apprentissage — N. … » : le numéro d’une question dans un bloc ; « donnée TEMPORAIRE » est une consigne de rangement.')

# ═════ 6. HYPOTHÈSES — il faut choisir ═══════════════════════════════════════════════════════
H('comics.0438', '« Si occasion envisagée » a deux sens en BD.', ['(a) seconde main : réponse à une question « d’occasion » (aucune en BD : il faudrait la désigner)', '(b) un événement en préparation (« Événement concret »)'])
H(['bags.0388', 'shoes.0357', 'watch.0327'], '« seconde main / vintage envisagé » : envisagé où ?',
  ['(a) consumption2.1188 hors « Je préfère du neuf » et « Je préfère éviter » (rapport général à la seconde main)', '(b) pour l’achat en préparation : le moteur ne connaît pas cette caractéristique d’un achat'])
H('garden.0583', '« si la personne jardine réellement » : aucune réponse ne dit « je jardine ».',
  ['(a) garden.0557 : « Une vraie passion » ou « J’aime jardiner quand j’ai un espace extérieur »', '(b) garden.0558 : un jardin ou un potager déclaré', '(c) les deux'])
# ═════ D5 — « avancé » et « après les 6 axes » : aucun seuil chiffré inventé ════════════════════
# Esthétique : « Niveau B avancé » n’a pas de seuil écrit. RÈGLE PROPOSÉE, question par question
# (dossier D5, à valider) : chaque question d’arbitrage s’ouvre au niveau B APRÈS la question
# qu’elle approfondit — elle affine une réponse, elle ne vient pas avant.
REPONDUE = lambda sel: opt(sel, *[o['libelle'] for o in Q[sel]['options']])
# Validée par Estelle le 19 nov. (18h54), avec une exigence de plus : la réponse amont doit RENDRE
# l'approfondissement pertinent, et une information doit manquer encore. Un passage (aucune réponse)
# n'ouvre rien ; une réponse « jamais pensé », ou une condition (« cela dépend »), non plus.
D5 = 'D5 validée (19 nov., 18h54) : après la question approfondie, sur une réponse qui le rend pertinent'
for i, ref, retenues, pourquoi, exclues in [
    ('aesthetic.1966', 'aesthetic.1965', ['Oui, énormément', 'Oui, dans l’ensemble', 'J’aime plusieurs univers différents'],
     '« beau ou pratique » arbitre une place DÉCLARÉE de l’esthétique (1965)', ['« Non, chaque domaine est indépendant »', '« Je n’y ai jamais vraiment pensé »']),
    ('aesthetic.1967', 'aesthetic.1953', [o['libelle'] for o in Q['aesthetic.1953']['options']],
     '« parfaitement beau, singulier, une histoire… » affine ce qui la séduit (1953) — toutes ses réponses disent un attrait', []),
    ('aesthetic.1968', 'aesthetic.1956', [o['libelle'] for o in Q['aesthetic.1956']['options'] if not o['libelle'].startswith('Cela dépend')],
     '« le prestige augmente-t-il l’attrait » prolonge 1956 (« pont Signature de valeur »)', ['« Cela dépend de l’histoire de l’objet » (condition)']),
    ('aesthetic.1969', 'aesthetic.1961', [o['libelle'] for o in Q['aesthetic.1961']['options']],
     '« rester fidèle ou renouveler » prolonge « intemporel, actuel, dans l’air du temps » (1961)', []),
]:
    E(i, f"Niveau B aesthetic ET {opt(ref, *retenues)} ; ET information manquante", D5, pourquoi + '.',
      ['« uniquement si le profil mérite d’être précisé » (1966) : aucun critère écrit'] + [f'{x} : ne rend pas l’approfondissement pertinent' for x in exclues])
# ═════ SITUATION DE VIE DÉCLARÉE — décision D2 d’Estelle (19 nov.) ════════════════════════════
# « Réutilise une déclaration explicite, autorisée et suffisamment actuelle […]. Sinon, propose une
# question d’entrée facultative et neutre. Ne déduis pas couple, parentalité ou activité
# professionnelle à partir d’un intérêt, d’un âge ou d’une réponse concernant quelqu’un d’autre. »
# Aucune question de l’onboarding ne recueille ces situations (vérifié) : la déclaration vient de
# l’entrée « Ton quotidien » (service.ts, ENTREE_QUOTIDIEN), où cocher vaut aussi accord pour en
# parler. Le niveau B de la question est gardé ; « travel2.0890 “Avec mes enfants” » N’EST PAS une
# preuve d’enfants au quotidien (voyager avec des enfants ne dit pas qu’ils sont les siens).
D2 = 'situation déclarée par la personne (D2)'
for ids, br, sit, pourquoi in [
    (['relation2.0787', 'relation2.0788', 'relation2.0789', 'relation2.0790'], 'relation2', 'couple', '« uniquement si un partenaire existe ET si la personne accepte d’enrichir cette dimension » : « Une vie de couple » cochée dit les deux.'),
    (['daily2.1130', 'daily2.1131', 'daily2.1132'], 'daily2', 'couple', '« Couple au quotidien » : une vie de couple déclarée.'),
    (['daily2.1134', 'daily2.1135', 'daily2.1136', 'daily2.1137'], 'daily2', 'enfants_au_quotidien', '« Famille et enfants au quotidien » : les énoncés présument des enfants ; « Des enfants dans mon quotidien » déclaré.'),
    (['daily2.1138', 'daily2.1139'], 'daily2', 'travail_a_domicile', '« à ouvrir si télétravail ou activité à domicile » : « Travailler depuis chez moi » déclaré.'),
    (['relation2.0802', 'relation2.0803', 'relation2.0804'], 'relation2', 'activite_professionnelle', '« Relations professionnelles » : les énoncés présument une vie professionnelle ; « Une activité professionnelle » déclarée.'),
]:
    E(ids, f'Niveau B {br} ET Situation déclarée : {sit}', D2, pourquoi,
      ['tout indice indirect (intérêt, âge, réponse sur un proche, branche ouverte) : D2 interdit de le déduire'])
H(['work2.1356', 'work2.1357'], '« si concerné » (management ; activité créative) : aucune réponse ne le dit.', ['(a) une question de rôle dans work2', '(b) work2.1357 : craft.0614 « Je pratique moi-même… »', '(c) laisser fermé'])
H('home2.1280', '« Mobilier — SEULEMENT si pertinent (projet, déménagement, rénovation) ».', ['(a) « Achat concret » dans la branche', '(b) laisser fermé'])
H('home2.1278', '« Art mural : pont avec la branche Art / Musées » : un pont, pas une règle.', ['(a) Niveau B home2 (thème)', '(b) Niveau B home2 ET branche Art ou Musées ouverte'])
H('dreams.2012', '« si le projet est un voyage » : le moteur ne sait pas de quel genre est le rêve.', ['(a) une option « voyage » à une question de dreams à désigner', '(b) « Séjour concret »'])
H('resonance.1536', '« Territoire Le courage / L’accomplissement » : pas de numéro.', ['(a) resonance.1526 : « Les exploits humains », « Les parcours de résilience », « Les rêves accomplis »', '(b) Niveau B resonance (thème)'])
# value.1522 « uniquement après les 6 axes » : la branche Signature de valeur ouvre sur SIX questions
# de niveau A (value.1516 à value.1521, « Branche Signature de valeur ouverte ») — ce sont les six
# axes. Prérequis métier traduit tel quel : les six ont reçu une réponse, et le niveau B est atteint.
E('value.1522', 'Niveau B value ET ' + ' ET '.join(REPONDUE(f'value.{n}') for n in range(1516, 1522)), 'prérequis écrit traduit (D5)',
  '« après les 6 axes » : les six questions A de la branche (1516 à 1521), toutes répondues.')
H('travel2.0944', '« Niveau C, réservation offerte » : offerte à qui ?', ['(a) « Cadeau concret » (elle offre)', '(b) « Séjour concret » (on lui offre)'])
H(['sleep.0595'], '« matières uniquement si literie/linge de maison est une piste concrète » : vise des options (matières), pas la question.',
  ['(a) Niveau B sleep, et les options de matière masquées hors achat', '(b) Niveau B sleep ET Achat concret'])
H('sleep.0613', '« Tout objet coûteux ou très personnel (matelas, oreiller, couette) » : achat ou cadeau ?', ['(a) « Achat concret »', '(b) « Achat concret » OU « Cadeau concret »'])
# ═════ HÔTELLERIE — décision D3 d’Estelle (19 nov.) ═══════════════════════════════════════════
# « Un intérêt pertinent ou une démarche volontaire peut ouvrir l’orientation ; un séjour en
# préparation ouvre les questions utiles à ce séjour ; les détails propres à un projet restent
# rattachés à ce projet. Ne rends pas un projet obligatoire pour toute question générale, ni un
# intérêt général suffisant pour toutes les questions de réservation. » Et : « un endroit où
# dormir » ne veut pas dire « aucun besoin pratique ».
#   · ORIENTATION (0915) : la branche Voyage ouverte (un intérêt, ou le sujet choisi) OU un séjour
#     en préparation ;
#   · GOÛT (le genre d’hébergement, l’âme, le prestige, le souvenir) : une réponse à 0915 qui donne
#     une place à l’hébergement — tout sauf « Est principalement un endroit où dormir » ;
#   · BESOINS PRATIQUES (défauts, literie, chambre, salle de bain) : TOUTE réponse à 0915, ou un
#     séjour en préparation ;
#   · UTILES À UN SÉJOUR (taille, accompagnement, petit-déjeuner, spa, atmosphère) : le goût, ou un
#     séjour en préparation ;
#   · RÉSERVATION (niveau C, 0936-0942) : inchangées, toujours un séjour concret — l’intérêt seul
#     n’y suffit pas.
# Le niveau B écrit (« Niveau B Hôtellerie ») reste exigé hors séjour ; Hôtellerie est la branche travel2.
D3 = 'décision D3 (hôtellerie : exploration générale ≠ préparation)'
H915 = lambda *exclus: sauf('travel2.0915', *exclus) if exclus else opt('travel2.0915', *[o['libelle'] for o in Q['travel2.0915']['options']])
GOUT = H915('Est principalement un endroit où dormir')
TOUTE = H915()
E('travel2.0915', 'Branche travel2 ouverte OU Séjour concret', D3, 'Orientation : un intérêt pour le voyage (ou le sujet choisi), ou un séjour en préparation.')
E(['travel2.0916', 'travel2.0917', 'travel2.0918'], GOUT, D3, 'Goût pour l’hébergement : une réponse à 0915 qui lui donne une place.',
  ['« Est principalement un endroit où dormir » : ne dit pas un goût pour l’hébergement'])
E(['travel2.0919', 'travel2.0920'], TOUTE + ' OU Séjour concret', D3, 'Besoin pratique, ou attitude face à un séjour offert : vaut quelle que soit la place de l’hébergement (« un endroit où dormir » ne dit pas l’absence de besoins).')
E(['travel2.0924', 'travel2.0925', 'travel2.0926'], 'Niveau B travel2 ET ' + TOUTE + ' OU Séjour concret', D3, 'Besoin pratique (chambre, salle de bain, sommeil) : toute réponse à 0915 au niveau B, ou un séjour en préparation.')
E(['travel2.0921', 'travel2.0922', 'travel2.0927', 'travel2.0929', 'travel2.0930'], 'Niveau B travel2 ET ' + GOUT + ' OU Séjour concret', D3, 'Utile à un séjour : le goût au niveau B, ou un séjour en préparation (« selon le séjour envisagé », 0921).',
  ['« Est principalement un endroit où dormir » hors séjour : ces préférences de confort ne sont pas un besoin pratique'])
E(['travel2.0923', 'travel2.0928', 'travel2.0931', 'travel2.0933', 'travel2.0934', 'travel2.0935'], 'Niveau B travel2 ET ' + GOUT, D3, 'Goût au niveau B ; un séjour en préparation seul ne suffit pas (question générale, pas de préparation).',
  ['« Séjour concret » seul : une préparation ne rend pas pertinent un goût général non déclaré'])
H('fragrance2.1154', '« après 1153 — paramétrique {parfum} » : 1153 est une question ouverte ; il faut le parfum nommé.', ['(a) le parfum résolu par la lecture de 1153 (référent nommé)', '(b) laisser fermé'])
H('value.1523', '« paramétrique par catégorie (1522) » : « cette exigence » désigne UNE catégorie de 1522.', ['(a) une fois par catégorie cochée, la catégorie affichée', '(b) seulement si une seule catégorie est cochée'])
H(['photo.0685'], '« photo smartphone dominante (0673) » : 0673 est à choix multiple, la dominance ne se lit pas.', ['(a) « Mon téléphone » seul coché', '(b) « Mon téléphone » coché'])
H('reading2.1251', '« si essai lu (1238) » : reading2.1238 n’a pas d’option « Essai ».',
  ['(a) « Philosophie », « Sciences humaines », « Psychologie », « Histoire », « Économie », « Vulgarisation scientifique »', '(b) ajouter « Essais » aux options de 1238'])
H(['bags.0390', 'watch.0330'], '« Achat concret, budget engagé » : le budget d’un achat n’est pas connu du moteur ; lire « Achat concret » seul ouvrirait plus.', ['(a) ajouter le budget à la déclaration d’un achat', '(b) accepter « Achat concret » seul'])
H('live.0496', '« Achat concret, artiste adoré identifié » : l’artiste n’est pas connu du moteur.', ['(a) « Achat concret » seul', '(b) Achat concret ET une réponse qui nomme un artiste'])
H('fashion2.1105', '« Achat concret UNIQUEMENT, avec consentement » : quel consentement ?', ['(a) celui de répondre (le Discovery est toujours la personne elle-même) : « Achat concret »', '(b) un consentement dédié à recueillir'])

# ═════ 6 bis. QUESTIONS SENSIBLES SUR DÉMARCHE : la condition d’origine seule ════════════════════
ED('causes.1936', opt('causes.1918', 'La protection des océans', 'La biodiversité'), NUM, '« si océans/biodiversité coché (1918) ». La démarche reste exigée.')
ED('causes.1937', opt('causes.1918', 'La protection des animaux'), NUM, '« si animaux coché » (causes.1918). La démarche reste exigée.')
ED('causes.1941', opt('causes.1918', 'Le patrimoine', 'Les savoir-faire'), NUM, '« si patrimoine/savoir-faire coché » (causes.1918). La démarche reste exigée.')
ED('drinks.2106', 'Niveau C drinks — sensitivity: MOYENNE', 'consigne, pas condition', '« question CONTEXTUELLE » dit comment ranger la réponse. La démarche reste exigée.')
H('causes.1942', '« Niveau C Causes — recommandation contextuelle » : posée pendant une recommandation (chez le pilote) ou pour un projet de la personne ?',
  ['(a) Niveau C de la branche, pour une préparation de la personne', '(b) jamais dans le Discovery : question du pilote'])
# ═════ 6 ter. CÉRAMIQUE ET TALONS — décision D4 d’Estelle (19 nov.) ═══════════════════════════
# « Une question qui présume une pratique, un usage ou un goût précis exige le signal correspondant.
# Un intérêt pour la création ne suffit pas à présumer la céramique ; les chaussures ne suffisent pas
# à présumer le port de talons. » Le signal est demandé à une question d’orientation qui existe déjà
# (craft.0615 « Quels univers créatifs… t’attirent vraiment ? », shoes.0341 « Concernant la hauteur,
# tu portes volontiers… ») ; aucune réponse n’est fabriquée. Les gardes du texte (ne pas creuser,
# information manquante, pertinence) sont recopiées telles quelles.
GARDES = lambda dom, info=True: f' ; ET `DO_NOT_PROBE.{dom}!=true`' + (' ; ET information manquante' if info else '') + ' ; ET score de pertinence suffisant'
# Une question À RÉPONSE LIBRE ne nomme aucun attribut : « information manquante » n’y est pas
# évaluable (conditions.ts la laisse indécidable). L’information y manque exactement tant que la
# question n’a pas été posée, ce que la sélection garantit déjà (`dejaPosees`) : la clause n’ajoute
# rien et n’est pas reprise — c’est écrit dans `non_repris`.
LIBRE = '« information manquante » : question à réponse libre, sans attribut nommé ; l’information manque tant que la question n’a pas été posée, ce que la sélection garantit'
CERAMIQUE = opt('craft.0615', 'Céramique ou poterie')
PRATIQUER = opt('craft.0614', PRATIQUE, 'J’aimerais apprendre ou reprendre une pratique')
D4 = 'décision D4 (signal correspondant au présupposé)'
E(['CRE-15', 'CRE-18'], CERAMIQUE + GARDES('creativity', False), D4,
  'L’énoncé présume un goût pour la céramique : « Céramique ou poterie » à craft.0615.',
  ['« INTEREST.creativity=positive » seul : un intérêt pour la création ne présume pas la céramique (D4)', LIBRE])
E('CRE-16', CERAMIQUE + ' ET ' + PRATIQUER + GARDES('creativity', False), D4,
  'L’énoncé présume un goût pour la céramique ET l’envie de pratiquer (« créer », « pratiquer ») : « Céramique ou poterie » à craft.0615 et, à craft.0614, la pratique déclarée ou l’envie d’apprendre.',
  ['« INTEREST.creativity=positive » seul (D4)', '« ceramics_interest produit par CRE-15 » : une réponse libre, qui ne dit pas en elle-même l’envie de pratiquer', LIBRE])
E('CRE-17', CERAMIQUE + ' ET ' + PRATIQUER + GARDES('creativity'), D4,
  'Même présupposé que CRE-16 (« pratiquer la céramique ») ; le niveau C, lui, reste exigé par la règle de la question (un projet du domaine).',
  ['« INTEREST.creativity=positive » seul (D4)', '« ceramics_goal produit par CRE-16 » : une réponse libre, qui ne dit pas en elle-même l’envie de pratiquer'])
E('CRE-11', 'Branche craft ouverte ET ' + PRATIQUER + GARDES('creativity'), 'décision 2 (19 nov., 18h54) + D4',
  '« Tu préfères pratiquer… » présume la pratique ou l’envie de pratiquer : craft.0614 « Je pratique moi-même… » ou « J’aimerais apprendre ou reprendre… ».',
  ['« INTEREST.creativity=positive » seul (D4)'])
E('CHS-13', opt('shoes.0341', 'Un petit talon', 'Un talon moyen', 'Un talon haut') + GARDES('shoe', False), D4,
  'L’énoncé présume le port de talons : un talon déclaré à shoes.0341.',
  ['« INTEREST.shoe=positive » seul : aimer les chaussures ne présume pas les talons (D4)', '« heel_interest produit par CHS-12 » : CHS-12 n’existe pas dans la banque', '« Cela dépend du modèle », « Une plateforme » : ne disent pas un talon', LIBRE])

# ═════ D5 — RÉUSSITE : l’axe choisi à success.1711 ouvre ses questions ═════════════════════════
# « Ouvre l’axe choisi à success.1711 comme un sujet que la personne souhaite développer. Ne déduis
# pas qu’il s’agit d’une priorité actuelle ou d’un trait établi. Les restrictions sensibles
# s’appliquent toujours. » Les questions « Niveau B Réussite — axe X » s’ouvrent au niveau B si X
# est coché à 1711 ; une question sensible n’est pas lue (sa garde reste entière).
AXES = {'Statut': 'Le statut', 'Liberté': 'La liberté', 'Impact': 'L’impact', 'Création': 'La création', 'Sécurité': 'La sécurité',
        'Reconnaissance': 'La reconnaissance', 'Maîtrise': 'La maîtrise', 'Temps disponible': 'Le temps disponible', 'Transmission': 'La transmission'}
AXES_LUS = []
for q in qs:
    m = re.match(r'^Niveau B Réussite — axe ([^—(]+?)\s*(?:—|\(|$)', cond(q['id']))
    if not m or SENSIBLE.search(cond(q['id'])): continue
    E(q['id'], f"Niveau B success ET {opt('success.1711', AXES[m.group(1).strip()])}", 'axe choisi à success.1711 (D5)',
      f"« axe {m.group(1).strip()} » : « {AXES[m.group(1).strip()]} » coché à success.1711 — un sujet à développer, ni priorité ni trait.")
    AXES_LUS.append(q['id'])

# ═════ D9 — « Entité {X} détectée et importante » (décision 9 du 19 nov., 18h54) ═══════════════
# Lue « une entité DÉCLARÉE remplit cette question » : entites-de-questions.json dit, question par
# question, quelles relations elle présume (veut visiter ≠ aime ≠ veut essayer). Pas de seuil
# d'importance ; une mention sans relation n'ouvre rien.
ENT = json.load(open(R / 'src/lib/discovery/open-v3/entites-de-questions.json'))
for i, l in ENT['questions'].items():
    E(i, 'Entité déclarée pour cette question', 'entité déclarée avec une relation que la question présume (D9)',
      f"{l['pourquoi']} — relations admises : {', '.join(l['relations'])}.", ['« importante » : aucun score ; une relation déclarée, choisie question par question'])
for i, pourquoi in ENT['fermees'].items(): S(i, pourquoi, 'fermée par le produit — décision 9 (19 nov., 18h54) : la question présume une pratique qu’aucune relation d’entité n’établit')

# ═════ 7. SANS LECTURE — le moteur ne sait pas le constater ═══════════════════════════════════
RECO = 'une recommandation EN PRÉPARATION pour cette personne : cela se passe chez le pilote, pas dans le Discovery de la personne'
S(['JWL-TAILLE-01', 'JWL-TAILLE-02', 'JWL-TAILLE-03', 'JWL-TAILLE-04', 'JWL-TAILLE-05', 'money.1590', 'relation2.0805', 'travel2.0943', 'watch.0325'], RECO)
S(['jewelry.0298', 'jewelry.0301', 'jewelry.0302', 'watch.0322'], 'un signal « symbolique / histoire / standing » ou un score « CAD_S » qu’aucune source ne définit')
S(['bags.0374', 'watch.0319'], '« rapport à la marque ambigu » : aucun critère écrit')
S('relation2.0786', 'savoir qu’un proche vit loin : donnée du carnet du pilote, pas du Discovery')
S(['shoes.0355', 'watch.0321', 'watch.0328', 'bags.0389', 'watch.0329', 'photo.0696'], 'une caractéristique de l’achat en préparation (catégorie, usage, personnalisation, mécanique, niveau de matériel) que la déclaration d’un achat ne recueille pas')
S(['live.0498', 'museum.0721', 'sportw.0553'], '« budget premium » : le budget d’une préparation n’est pas recueilli')
S('travel2.0901', 'savoir qu’un animal voyage avec la personne : aucune question ne le recueille')
S('sleep.0607', '« SEULEMENT si la personne parle elle-même de fatigue familiale » : une démarche dans un texte libre, que rien ne détecte aujourd’hui')
S('pets.0411', '« si souvenirs importants » : aucun critère écrit')
S(['comics.0435', 'games.0968', 'podcast.0466', 'podcast.0471', 'garden.0582', 'watch.0320', 'watch.0323'],
  'contextes de niveau C (« passionné », « jeu précis », « abonnement envisagé », « avant plante vivante », « occasion pressentie », « achat réel d’un proche ») qu’aucune préparation déclarée ne porte en toutes lettres')

# ═════ 8. RÈGLES LITTÉRALES AUTOMATIQUES (préparations nommées) ═══════════════════════════════
PREPARATIONS = [
  (r"achat (concret|précis|technique|matériel concret|envisagé|réel\b(?! d)|est envisagé)|lors d’un achat|pour un achat|produit ou une dépense précise|achat concret de|plante concrète est envisagée|livre est envisagé", 'Achat concret'),
  (r"cadeau (concret|matériel|est envisagé|pre)|avant d’offrir|cadeau ou une expérience de transmission est envisagé", 'Cadeau concret'),
  (r"événement (arrive|approche|concret)|célébration est en préparation|\banniversaire\b", 'Événement concret'),
  (r"sortie est envisagée", 'Sortie concrète'),
  (r"apprentissage est envisagé", 'Apprentissage concret'),
  (r"attention (concrète|est (réellement )?envisagée)", 'Attention concrète'),
  (r"expérience (est préparée|concrète)|création d’(une )?expérience", 'Expérience préparée — donnée contextuelle'),
  (r"séjour (de récupération )?(envisagé|à réserver)|nuit/séjour à réserver", 'Séjour concret'),
]
TOUT_PROJET = r"^(projet concret|contexte concret|seulement si contexte)\b|passion ou contexte concret"
CONSIGNES = r"RÉCITS|EXPÉRIENCES CONCRÈTES|^expériences concrètes$|^donnée contextuelle$|SELF-ONLY|auto-réponse"
# Une préparation suivie d’une virgule et d’une seule précision est une RESTRICTION (« Achat concret,
# budget engagé ») : la retirer ouvrirait plus. Une liste après « Niveau C X : » est une liste de cas.
RESTRICTION = re.compile(r'^(?:achat|cadeau|séjour|sortie)[^,:]*,\s*[^,]+$', re.I)
# La cible : les questions non résolues PAR LE TEXTE du référentiel, liste figée (les effectifs, eux,
# sont recalculés AVEC les lectures et ne peuvent pas servir de cible à leur propre générateur).
cibles = [i for i in json.load(open(R / 'docs/discovery/etat-19nov/non-resolues-du-texte.json'))['questions'] if i in Q]
for i in cibles:
    if i in lectures or i in sans: continue
    c = cond(i)
    if SENSIBLE.search(c): continue
    m = re.match(r'^(Niveau [ABC] [^:,—]+?)\s*(?:[:,—]\s*(.*))?$', c)
    nom, prose = (m.group(1).strip(), (m.group(2) or '').strip()) if m else (None, c)
    if any(k in c for k in ('Tags ENTRANTS', 'Sous-branche', 'Axe ', 'Hôtellerie', 'Cartouche', 'Territoire', 'Entité {')) or re.search(r'\b\d{4}\b', c):
        continue
    if RESTRICTION.match(prose): continue
    if re.search(r'recommandation|recos? proches|tension|après (le séjour|un événement)|compte(nt)? réellement|réellement important|est important|sont importants|amateurs|lecteurs réguliers|écoute beaucoup|charge élevée|passionnée?$|suffisamment de signaux|K3|preparatory|IGNORÉE si non pertinente|seulement si pertinent|si concerné|\{', prose):
        continue
    prep = [(phrase, re.search(motif, prose, re.I).group(0)) for motif, phrase in PREPARATIONS if re.search(motif, prose, re.I)]
    # Le niveau écrit est repris tel que le moteur le lit : par l’identifiant de la branche de la question.
    base = (nom.split()[0] + ' ' + nom.split()[1] + ' ' + Q[i]['branche']) if nom else ''
    if prep:
        alts = ' OU '.join((f'{base} ET {p}' if base else p) for p, _ in prep)
        morceaux = [x.strip() for x in re.split(r',| ou |·|;', prose) if x.strip()]
        repris = {t for _, t in prep}
        E(i, alts, 'préparation en cours nommée par le texte', ' ; '.join(f'« {t} » → {p}' for p, t in prep),
          [x for x in morceaux if not any(t.lower() in x.lower() for t in repris)])
    elif nom and re.search(TOUT_PROJET, prose, re.I):
        E(i, base, 'toute préparation en cours du domaine', f'« {prose} » : le niveau C exige déjà une préparation en cours dans le domaine, quel qu’en soit le genre.')
    elif nom and re.search(CONSIGNES, prose):
        E(i, base, 'consigne, pas condition', f'« {prose} » dit COMMENT poser la question ou à qui (le Discovery n’est répondu que par la personne elle-même).')

# ═════ 9. TOUT LE RESTE EST CONSIGNÉ — aucune question non résolue sans motif écrit ════════════
MOTIFS_RESTANTS = [
  (r'Entité \{', 'paramètre d’énoncé sans source établie (table des paramètres, parametres.json) : « détectée et importante » n’a pas de définition'),
  (r'PARAMÉTRIQUE|\{', 'paramètre d’énoncé sans source établie (parametres.json)'),
  (r'current_occasion|organizing', 'questions de célébration : l’occasion en cours est un paramètre (parametres.json), et « format inconnu », « surprise envisagée », « exposition publique envisagée », « besoin d’aide » sont des caractéristiques d’une préparation que la déclaration ne recueille pas'),
  (r'important_dates|approfondissement libre', '« dates importantes » et « approfondissement expressément pertinent » : aucune source ni critère'),
  (r'live_performance|THE-06A', 'la branche refonte THE-06 attend un tag `INTEREST.live_performance` que rien n’écrit sous ce nom ; THE-06B dépend de THE-06A et n’a pas encore d’options (« à écrire à partir du catalogue »)'),
  (r'INTEREST\.resonance', 'tag `INTEREST.resonance` de la refonte : la correspondance avec la branche historique n’est pas établie'),
  (r'K3|preparatory|préventif|préparatoire', 'les « règles K3 » des questions préventives : introuvables dans toutes les sources consultées'),
  (r'recommandation|recos? proches|wishlist|hésitation', 'une recommandation EN PRÉPARATION (côté pilote) — le Discovery de la personne ne la voit pas'),
  (r'TENSION|tension', 'une tension entre une recommandation et une valeur : côté recommandation, pas Discovery'),
  (r'après (le séjour|un événement)', 'une préparation TERMINÉE : le moteur ne connaît que les préparations en cours'),
  (r'compte(nt)? réellement|réellement important|est important|sont importants|amateurs|lecteurs réguliers|écoute beaucoup|charge élevée|passionnée?|suffisamment de signaux|animal est important|apprécie les pierres|fonctionnalité est importante', 'un seuil d’importance ou d’intensité que le référentiel ne chiffre pas'),
  (r'IGNORÉE si non pertinente|si pertinent|si concerné|FACULTATIVE', 'le critère de pertinence n’est pas écrit'),
  (r'Sous-branche Famille', 'Famille (branche relation2) : aucune règle d’ouverture écrite pour cette sous-partie ; ses énoncés ne présument pas d’enfants, ils ne relèvent donc pas de la situation déclarée (D2)'),
  (r'^Axe Pratiquant', 'paramètre {activité} : la pratique déclarée une à une n’est recueillie par aucune réponse (parametres.json)'),
]
for i in cibles:
    if i in lectures or i in sans: continue
    c = cond(i)
    motif = next((m for r_, m in MOTIFS_RESTANTS if re.search(r_, c)), None)
    assert motif, f'{i} non consignée : « {c[:120]} »'
    S(i, motif)

# Gardes finales : aucune lecture d’une condition sensible ; jamais une question dans deux sorties.
for i, l in lectures.items():
    assert l.get('demarche') or not SENSIBLE.search(l['origine']), f'{i} : condition sensible, pas de lecture'
    assert i not in sans, i
sortie = {
  'version': '2026-11-19.2',
  'note': 'Lectures des conditions en prose, relues. Seules les lignes « etablie » sont exécutées. Une lecture n’ouvre jamais plus que le texte. La condition d’origine est recopiée : si le classeur change, la lecture est refusée au chargement.',
  'source': 'Conditions de la banque active (classeur ' + json.load(open(R / 'src/lib/discovery/open-v3/manifeste.json'))['classeur'] + ') ; options des questions citées ; sens des options de craft.0614 fixés par Estelle le 19 nov.',
  'lectures': sorted(lectures.values(), key=lambda x: x['question']),
  'non_lues': sorted(sans.values(), key=lambda x: x['question']),
}
json.dump(sortie, open(R / 'src/lib/discovery/open-v3/lectures-de-conditions.json', 'w'), ensure_ascii=False, indent=1)
if '--voir' in sys.argv:
    for l in sortie['lectures']: print('E', l['question'], '|', l['origine'][:70], '=>', l['lue'][:150])
print(len(lectures), 'lectures établies,', sum(1 for x in sans.values() if x['statut'] == 'hypothese'), 'hypothèses,',
      sum(1 for x in sans.values() if x['statut'] == 'sans_lecture'), 'sans lecture', file=sys.stderr)
