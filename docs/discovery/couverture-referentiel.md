# Couverture complète du référentiel — révision 8

Généré par `scripts/discovery/couverture-referentiel.mts` le 2026-11-19. Détail question par question, clause par clause : `docs/discovery/couverture-referentiel.json`.

Méthode : chaque clause de chaque condition est évaluée par le vrai évaluateur du moteur, dans l’état réellement lu en base pour un compte neuf, puis dans un état où tout est déclaré. Une clause indécidable dans les deux n’est pas implémentée. « Fermée par le produit » ne s’emploie que lorsqu’une décision ou le référentiel la prévoit, et la cite.

**2407 questions** (2286 actives, 6 en arbitrage, 115 retirées) · **2778 clauses** évaluées, dont **170** indécidables.

| Statut | Questions |
|---|---|
| en_arbitrage_hors_banque | 6 |
| fermee_par_garde_de_sensibilite | 125 |
| fermee_par_le_produit | 3 |
| implementee_condition_d_origine | 1688 |
| implementee_lecture_etablie | 285 |
| non_implementee | 108 |
| non_implementee_hypothese | 23 |
| ouverte_sur_demarche | 54 |
| retiree_par_le_referentiel | 115 |

## fermee_par_le_produit

- **activity.0282** — fermée par le produit — décision 9 (19 nov., 18h54) : la question présume une pratique qu’aucune relation d’entité n’établit — « ton niveau aujourd'hui » présume une PRATIQUE ; aucune relation d'entité ne l'établit (aimer n'est pas pratiquer)
- **activity.0283** — fermée par le produit — décision 9 (19 nov., 18h54) : la question présume une pratique qu’aucune relation d’entité n’établit — « le pratiques-tu réellement » présume une pratique ; même manque
- **activity.0285** — fermée par le produit — décision 9 (19 nov., 18h54) : la question présume une pratique qu’aucune relation d’entité n’établit — « du matériel » présume une pratique équipée ; même manque

## fermee_par_garde_de_sensibilite

- **beauty2.1303, beauty2.1305, beauty2.1312, bond.1694, bond.1695, bond.1696, bond.1697, bond.1699, bond.1704, bond.1707, causes.1918, causes.1919, causes.1924, causes.1934, causes.1935, causes.1938, causes.1939, change.1783, change.1784, change.1796, collection.2032, consumption2.1219, consumption2.1230, daily2.1133, dreams.2011, dreams.2018, family.1815, family.1816, family.1820, family.1821, family.1829, family.1830, family.1835, family.1841, family.1843, fashion2.1112, humor2.1419, memory.0748, memory.0750, memory.0751, memory.0752, memory.0753, memory.0756, memory.0757, memory.0759, memory.0763, memory.0764, memory.0765, memory.0767, memory.0768, mental.1865, money.1571, money.1572, money.1579, money.1583, money.1585, money.1588, money.1591, philovie.1653, philovie.1662, relation2.0791, relation2.0806, repair.0833, repair.0834, repair.0835, repair.0836, repair.0837, repair.0838, repair.0839, repair.0840, repair.0841, repair.0842, repair.0843, repair.0844, repair.0845, repair.0846, repair.0848, repair.0849, repair.0850, repair.0851, repair.0852, repair.0853, repair.0854, repair.0855, resonance.1540, spirit.0727, spirit.0728, spirit.0729, spirit.0730, spirit.0731, spirit.0732, spirit.0733, spirit.0734, spirit.0735, spirit.0736, spirit.0737, spirit.0738, spirit.0739, spirit.0740, spirit.0741, spirit.0742, spirit.0743, spirit.0744, spirit.0745, spirit.0746, spirit.0747, success.1715, success.1719, success.1730, success.1734, success.1747, success.1751, values.1906, work2.1349, work2.1355** — sensible (high) et sans ouverture sur démarche au référentiel : la garde des questions sensibles la ferme (conditions.ts) — à rouvrir seulement par une démarche que le référentiel écrirait
- **causes.1940, change.1786, change.1787, change.1788, change.1789, change.1790, change.1791, change.1797, family.1836** — sensible (maximale) et sans ouverture sur démarche au référentiel : la garde des questions sensibles la ferme (conditions.ts) — à rouvrir seulement par une démarche que le référentiel écrirait
- **gaming2.1388** — sensible (niveau non dit) et sans ouverture sur démarche au référentiel : la garde des questions sensibles la ferme (conditions.ts) — à rouvrir seulement par une démarche que le référentiel écrirait

## non_implementee_hypothese

- **bags.0388, shoes.0357, watch.0327** — en attente d’arbitrage : « seconde main / vintage envisagé » : envisagé où ? — choix : (a) consumption2.1188 hors « Je préfère du neuf » et « Je préfère éviter » (rapport général à la seconde main) | (b) pour l’achat en préparation : le moteur ne connaît pas cette caractéristique d’un achat
- **bags.0390, watch.0330** — en attente d’arbitrage : « Achat concret, budget engagé » : le budget d’un achat n’est pas connu du moteur ; lire « Achat concret » seul ouvrirait plus. — choix : (a) ajouter le budget à la déclaration d’un achat | (b) accepter « Achat concret » seul
- **causes.1942** — en attente d’arbitrage : « Niveau C Causes — recommandation contextuelle » : posée pendant une recommandation (chez le pilote) ou pour un projet de la personne ? — choix : (a) Niveau C de la branche, pour une préparation de la personne | (b) jamais dans le Discovery : question du pilote
- **comics.0438** — en attente d’arbitrage : « Si occasion envisagée » a deux sens en BD. — choix : (a) seconde main : réponse à une question « d’occasion » (aucune en BD : il faudrait la désigner) | (b) un événement en préparation (« Événement concret »)
- **dreams.2012** — en attente d’arbitrage : « si le projet est un voyage » : le moteur ne sait pas de quel genre est le rêve. — choix : (a) une option « voyage » à une question de dreams à désigner | (b) « Séjour concret »
- **fashion2.1105** — en attente d’arbitrage : « Achat concret UNIQUEMENT, avec consentement » : quel consentement ? — choix : (a) celui de répondre (le Discovery est toujours la personne elle-même) : « Achat concret » | (b) un consentement dédié à recueillir
- **fragrance2.1154** — en attente d’arbitrage : « après 1153 — paramétrique {parfum} » : 1153 est une question ouverte ; il faut le parfum nommé. — choix : (a) le parfum résolu par la lecture de 1153 (référent nommé) | (b) laisser fermé
- **garden.0583** — en attente d’arbitrage : « si la personne jardine réellement » : aucune réponse ne dit « je jardine ». — choix : (a) garden.0557 : « Une vraie passion » ou « J’aime jardiner quand j’ai un espace extérieur » | (b) garden.0558 : un jardin ou un potager déclaré | (c) les deux
- **home2.1278** — en attente d’arbitrage : « Art mural : pont avec la branche Art / Musées » : un pont, pas une règle. — choix : (a) Niveau B home2 (thème) | (b) Niveau B home2 ET branche Art ou Musées ouverte
- **home2.1280** — en attente d’arbitrage : « Mobilier — SEULEMENT si pertinent (projet, déménagement, rénovation) ». — choix : (a) « Achat concret » dans la branche | (b) laisser fermé
- **live.0496** — en attente d’arbitrage : « Achat concret, artiste adoré identifié » : l’artiste n’est pas connu du moteur. — choix : (a) « Achat concret » seul | (b) Achat concret ET une réponse qui nomme un artiste
- **photo.0685** — en attente d’arbitrage : « photo smartphone dominante (0673) » : 0673 est à choix multiple, la dominance ne se lit pas. — choix : (a) « Mon téléphone » seul coché | (b) « Mon téléphone » coché
- **reading2.1251** — en attente d’arbitrage : « si essai lu (1238) » : reading2.1238 n’a pas d’option « Essai ». — choix : (a) « Philosophie », « Sciences humaines », « Psychologie », « Histoire », « Économie », « Vulgarisation scientifique » | (b) ajouter « Essais » aux options de 1238
- **resonance.1536** — en attente d’arbitrage : « Territoire Le courage / L’accomplissement » : pas de numéro. — choix : (a) resonance.1526 : « Les exploits humains », « Les parcours de résilience », « Les rêves accomplis » | (b) Niveau B resonance (thème)
- **sleep.0595** — en attente d’arbitrage : « matières uniquement si literie/linge de maison est une piste concrète » : vise des options (matières), pas la question. — choix : (a) Niveau B sleep, et les options de matière masquées hors achat | (b) Niveau B sleep ET Achat concret
- **sleep.0613** — en attente d’arbitrage : « Tout objet coûteux ou très personnel (matelas, oreiller, couette) » : achat ou cadeau ? — choix : (a) « Achat concret » | (b) « Achat concret » OU « Cadeau concret »
- **travel2.0944** — en attente d’arbitrage : « Niveau C, réservation offerte » : offerte à qui ? — choix : (a) « Cadeau concret » (elle offre) | (b) « Séjour concret » (on lui offre)
- **value.1523** — en attente d’arbitrage : « paramétrique par catégorie (1522) » : « cette exigence » désigne UNE catégorie de 1522. — choix : (a) une fois par catégorie cochée, la catégorie affichée | (b) seulement si une seule catégorie est cochée
- **work2.1356, work2.1357** — en attente d’arbitrage : « si concerné » (management ; activité créative) : aucune réponse ne le dit. — choix : (a) une question de rôle dans work2 | (b) work2.1357 : craft.0614 « Je pratique moi-même… » | (c) laisser fermé

## non_implementee

- **CEL-01, CEL-09** — « dates importantes » et « approfondissement expressément pertinent » : aucune source ni critère
- **CEL-02, CEL-03, CEL-04, CEL-05, CEL-06, CEL-07, CEL-08, learning2.1462** — paramètre d’énoncé sans source établie (parametres.json)
- **CEL-10, CEL-11** — questions de célébration : l’occasion en cours est un paramètre (parametres.json), et « format inconnu », « surprise envisagée », « exposition publique envisagée », « besoin d’aide » sont des caractéristiques d’une préparation que la déclaration ne recueille pas
- **CEL-12** — condition non comprise : niveau de délégation du projet inconnu
- **REM-09** — tag `INTEREST.resonance` de la refonte : la correspondance avec la branche historique n’est pas établie
- **REM-11, REM-12, REM-13, REM-14, REM-15, SOM-01, THE-16** — clause(s) que le moteur ne sait pas constater : {"type":"information_manquante"}
- **THE-06A, THE-06B** — la branche refonte THE-06 attend un tag `INTEREST.live_performance` que rien n’écrit sous ce nom ; THE-06B dépend de THE-06A et n’a pas encore d’options (« à écrire à partir du catalogue »)
- **activity.0281, activity.0284** — série « activité » : aucun écrivain ne produit une entité de type ENTITY_HOBBY — la condition est évaluée, mais ne peut jamais être remplie
- **aesthetic.1971** — clause(s) que le moteur ne sait pas constater : {"type":"niveau","niveau":"C","branche":"esthetique : recommandation en preparation"}
- **animals.2147, flowers.2125, hosting.2059, jewelry.0299, jewelry.0303, jewelry.0305, jewelry.0306, money.1589, pets.0406, pets.0409, shoes.0354, travel.0060B, values.1916** — une recommandation EN PRÉPARATION (côté pilote) — le Discovery de la personne ne la voit pas
- **bags.0368, celebration.0816, cinema2.0985, food2.0861, fragrance2.1153, mental.1850, pets.0396, philovie.1667, podcast.0472, reading2.1238, watch.0326** — un seuil d’importance ou d’intensité que le référentiel ne chiffre pas
- **bags.0374, watch.0319** — « rapport à la marque ambigu » : aucun critère écrit
- **bags.0389, photo.0696, shoes.0355, watch.0321, watch.0328, watch.0329** — une caractéristique de l’achat en préparation (catégorie, usage, personnalisation, mécanique, niveau de matériel) que la déclaration d’un achat ne recueille pas
- **beauty2.1298, food2.0878** — le critère de pertinence n’est pas écrit
- **cinema2.0991, joys.1893, music2.1019, podcast.0473, series2.1046, sleep.0612** — les « règles K3 » des questions préventives : introuvables dans toutes les sources consultées
- **comics.0435, games.0968, garden.0582, podcast.0466, podcast.0471, watch.0320, watch.0323** — contextes de niveau C (« passionné », « jeu précis », « abonnement envisagé », « avant plante vivante », « occasion pressentie », « achat réel d’un proche ») qu’aucune préparation déclarée ne porte en toutes lettres
- **craft.0620, craft.0622** — paramètre {activité} : la pratique déclarée une à une n’est recueillie par aucune réponse (parametres.json)
- **drinks.2103** — clause(s) que le moteur ne sait pas constater : {"type":"niveau","niveau":"C","branche":"boissons : recommandation en preparation"}
- **food.0030, food.0049** — clause(s) que le moteur ne sait pas constater : {"type":"domaines_actifs","noms":["cuisine","gastronomie"]}
- **JWL-TAILLE-01, JWL-TAILLE-02, JWL-TAILLE-03, JWL-TAILLE-04, JWL-TAILLE-05, money.1590, relation2.0805, travel2.0943, watch.0325** — une recommandation EN PRÉPARATION pour cette personne : cela se passe chez le pilote, pas dans le Discovery de la personne
- **jewelry.0298, jewelry.0301, jewelry.0302, watch.0322** — un signal « symbolique / histoire / standing » ou un score « CAD_S » qu’aucune source ne définit
- **learning2.1455** — condition non comprise : Cartouche ADN d’apprentissage — 1. Moteur de curiosité
- **live.0498, museum.0721, sportw.0553** — « budget premium » : le budget d’une préparation n’est pas recueilli
- **live.0501, sportw.0556, travel2.0945** — une préparation TERMINÉE : le moteur ne connaît que les préparations en cours
- **pets.0411** — « si souvenirs importants » : aucun critère écrit
- **philoconso.1629** — clause(s) que le moteur ne sait pas constater : {"type":"niveau","niveau":"C","branche":": uniquement lorsqu’un achat ou un cadeau est prepare"}
- **relation2.0786** — savoir qu’un proche vit loin : donnée du carnet du pilote, pas du Discovery
- **relation2.0800, relation2.0801** — Famille (branche relation2) : aucune règle d’ouverture écrite pour cette sous-partie ; ses énoncés ne présument pas d’enfants, ils ne relèvent donc pas de la situation déclarée (D2)
- **remembrance.1994** — clause(s) que le moteur ne sait pas constater : {"type":"niveau","niveau":"C","branche":"souvenirs : uniquement lorsqu’une recommandation est preparee"}
- **sensory2.1489** — clause(s) que le moteur ne sait pas constater : {"type":"niveau","niveau":"C","branche":"sensoriel : uniquement lorsqu’une recommandation est en preparation"}
- **sleep.0607** — « SEULEMENT si la personne parle elle-même de fatigue familiale » : une démarche dans un texte libre, que rien ne détecte aujourd’hui
- **travel2.0901** — savoir qu’un animal voyage avec la personne : aucune question ne le recueille
- **values.1917** — une tension entre une recommandation et une valeur : côté recommandation, pas Discovery
