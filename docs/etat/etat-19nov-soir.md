# Discovery — état au 19 novembre au soir (mandat de 09h31, repris à 15h06)

**Le Discovery décidé n'est pas entièrement exécuté.** Le parcours est intégré et testable en local ;
plusieurs parties décidées s'exécutent désormais, d'autres attendent une décision précise (§4).
Rien n'est déployé. Aucune écriture en production. Commit servi : **non confirmé**.

Classeur : `Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_6.xlsx`. Banque active : **2 281 questions**, 15 348 options.

---

## 1. Fonctionnalités développées

| # | Consigne | Ce qui existe | Où |
|---|---|---|---|
| 1 | Stabilité `undetermined` | Migration 120 (fichier ; **appliquée en local seulement**), type, validation à l'écriture, consolidation (une preuve seule → `unknown` ; mêlée à d'autres, elle ne change rien). Péremption et recommandations ne lisent pas la stabilité : aucun effet mesurable. | `supabase-migration-120-…sql`, `evidence.ts`, `consolidate.ts` |
| 2 | Les 15 destinations | Toutes ont un chemin d'écriture. Œuvres, épisodes, lieux : identité propre et provenance ; animaux : déclarés par la personne ; ambiguïté : question de clarification, rien d'écrit. Chaque lecture laisse un relevé ; une lecture faite par une version antérieure du lecteur est reprise. | `destinations.ts`, `destinations-ecriture.ts`, routes `clarification`, `animal`, écran « Une précision » |
| 3 | Le découpage n'est pas une preuve | Copie exacte (accents et casse), qualification par le modèle, contre-examen de la proposition (négation, autre personne, passé, condition). Cas positifs et négatifs pour chaque destination. | `destinations.test.ts` |
| 4 | Garde-fous structurés | Matrice des **1 031** options de garde-fou : cible, refus, contexte, contrainte (848 SOFT, 183 HARD), périmètre, critère. **1 020 traduites, 11 indécidables** (paramètre inconnu). Un refus ne s'applique jamais hors de son périmètre. | `docs/discovery/matrice-garde-fous.csv`, `garde-fous-discovery.ts` |
| 5 | Usage positif | Portée de consentement dédiée `reco:gouts` (l'autorisation d'exclusion ne suffit pas) ; seule la parole du proche lui-même ; contradictions écartées ; sujets sensibles exclus ; justification neutre. | `gouts-proche.ts`, `usage-profil.ts` |
| 6 | Paramètres | Table des 24 questions paramétrées : paramètre, source, propriétaire, contexte, validité, valeurs multiples, répétition. **10 exécutables** (préparation en cours nommée), **14 sans source** → jamais proposées. | `parametres.json`, `parametres.ts` |
| 7 | Catégories composites | Elles n'ouvrent que les questions d'orientation ; une réponse positive ou la démarche ouvre le reste ; rien n'est écrit. **Défaut trouvé ce soir et corrigé** : répondre « Ce n'est pas vraiment mon univers » ouvrait tout le jardinage (§3). | `etat.ts`, `ouvertures-explicites.json` |
| 8 | « Consommation et valeur », faible place | Révision 5 : les cinq énoncés réécrits autour du rapport aux objets (diff tracé, 3 options isolées) ; « faible place » n'est plus un rejet sur 6 autres réponses ; 41 lignes listées. | `revision-5-diff.json` |
| 9 | Niveau C | La réponse garde le sens de son contrat (préférence, garde-fou, fait) ; son contexte porte la préparation ; les lecteurs généraux l'écartent, le lecteur de la préparation la rend. | `service.ts`, `read-journal.ts` |
| 10 | Le reste | **Conditions en prose** : table versionnée de lectures (ce soir, §2.3). Décision 5 (Carnet d'envies) : proposée, jamais ajoutée d'office. Décision 8 : les 42 options en revue de sens n'écrivent plus rien. Révision 6 : 56 des 68 questions en arbitrage activées. Onglet 3 : 0 écart. Registre M1–M9 : vérifié en entier (§2.4). Dix profils rejoués. Essai du vrai extracteur préparé. | voir §2–§3 |

## 2. Contrats réellement exécutés

### 2.1 Par voie de contrat (options de la banque active)

| Voie | Ce que le code écrit |
|---|---|
| HSG_EVIDENCE | une preuve, dans sa portée (générale, ou celle de la préparation au niveau C) |
| FACT | un fait (`discovery.fait.*`) ; 754 options |
| ACTION_PARAMETER | rien de durable ; au niveau C, un fait de la préparation |
| DISCOVERY_STATE | la progression seulement |
| OPEN_KNOWLEDGE | le verbatim ; la lecture suit le contrat de la question (onglet 9 ou 17) |
| Options en revue de sens (décision 8) | **rien**, motif `sens_en_revue` |

### 2.2 Par ouverture (`docs/discovery/etat-19nov/effectifs.json`)

| Situation | Questions |
|---|---|
| Ouvrable sur le terrain | 1 384 |
| Ouvrable sur préparation en cours | 269 |
| Ouvrable sur réponse de tri | 159 |
| Ouvrable sur démarche explicite | 53 |
| Historique (conditionnée 32, remplacée 29) | 61 |
| Sensible fermée (HIGH 112, MAXIMALE 9, consigne 1) | 122 |
| Stérile (aucune option n'écrit) | 43 |
| Fermée même avec tout | 9 |
| **Non résolue** | **181** (380 ce matin) |

### 2.3 Les conditions en prose (point 10)

`lectures-de-conditions.json`, produit par `scripts/discovery/lectures-de-conditions.py`, relu, figé. Chacune des **380** questions non résolues par le texte du référentiel a exactement une issue :

| Issue | Nombre | Exemple |
|---|---|---|
| **Lecture établie, exécutée** | **199** | `live.0486` « Si festivals appréciés (0475) » → « Réponse à live.0475 : Festival » |
| Hypothèse : choix écrits, non exécutée | 68 | `comics.0438` « Si occasion envisagée » : seconde main, ou événement ? |
| Sans lecture : ce qui manque est écrit | 113 | `JWL-TAILLE-01` : une recommandation en préparation se passe chez le pilote |

Garanties vérifiées au chargement (`lectures.ts`) et par les essais (`lectures.test.ts`, 19) : une lecture n'ouvre jamais plus que le texte ; le niveau écrit est conservé ; une sous-partie reste attachée à sa branche ; une question sensible n'est lue que si elle s'ouvre sur démarche, marque et consigne recopiées à l'identique ; la condition d'origine est recopiée, et une lecture est refusée si le classeur change. Quatre lectures automatiques qui **retiraient une restriction** (« Achat concret, budget engagé ») ont été écartées.

### 2.4 Registre M1–M9 (onglet 15), vérifié ligne à ligne

M1, M3, M4, M5, M6, M7, M8, M9 : **conformes** (M2, M3, M5, M8 vérifiés ce soir sur les questions que nomme l'onglet 4). **M2 : écart** — l'attribut `service_preference` est bien employé (32 lignes), mais le registre rend obligatoires l'acteur (Candice, proche, prestataire), le bénéficiaire et le contexte : aucune ligne ne les porte, le producteur ne les écrit pas.

## 3. Résultats observés

| Vérification | Résultat |
|---|---|
| Compilation | 0 erreur |
| Suite d'essais complète | 104 fichiers, **1 164 essais, 0 échec** |
| Construction de l'application | réussie |
| Scripts sur la pile locale (base réelle, politiques d'accès) | 33 : 35/0 · 32 : 32/0 · 30 : 53/0 · 10 : 16/0 · 12 : 14/0 · 13 : 40/0 · 15 : 208/0 |
| Dix profils en personnage, rejoués (deux lots chacun, réponses par la vraie route, lot signé) | 0 réponse refusée ; constats ci-dessous |

**Ce que le rejeu des dix profils a trouvé :**

1. **Corrigé** — Camille répond « Ce n'est pas vraiment mon univers » à la question d'orientation du jardinage et recevait ensuite deux questions de jardinage dans le même lot : toute branche où l'on a *répondu* passait pour ouverte, et la règle « orientation seulement » ne s'appliquait plus. Désormais seule une ouverture antérieure aux réponses, ou une réponse positive, compte (`etat.ts` ; script 33, cas 7).
2. **Corrigé** — ma propre lecture de `sleep.0606` (« Sous-branche : voyage et décalage (si voyage actif) ») avait perdu la branche Sommeil : Yasmina recevait la question sans avoir ouvert le sommeil. Lecture corrigée ; un essai vérifie désormais l'ancrage de toutes les sous-parties lues.
3. Alice (« Rien de spécial, je suis assez casanière », aucune catégorie cochée) n'a **aucune question** : le Discovery ne propose rien à une personne sans centre d'intérêt déclaré.
4. **Même intention posée deux ou trois fois** d'une génération de branche à l'autre : Camille reçoit `sport.0183` et `sportp.0503` dans le même lot. Le classeur ne déclare pas ces paires (§4, D7).
5. « Ce n'est pas vraiment mon univers » s'écrit encore en **rejet** de place (`garden.0557`). Sans effet d'interdiction : aucune question n'est fermée, les recommandations ne s'en servent pas pour exclure. Elle fait partie des 41 lignes listées par la révision 5 (§4, D6).

**Ce que ces essais ne prouvent pas.** Le modèle est simulé partout. Les réponses en personnage sont les miennes, et les dix profils ne remplacent pas des personnes. L'essai du vrai extracteur est prêt (`scripts/local/34-essai-extracteur-reel.mts` : 14 cas fictifs dont 9 où rien ne doit s'écrire, base en mémoire, clé lue dans l'environnement et jamais affichée) ; il n'a tourné qu'à blanc, avec une clé factice refusée par le service.

## 4. Décisions précises restant nécessaires

| # | Sujet | Identifiants | Choix |
|---|---|---|---|
| D1 | Juge des garde-fous dans leur périmètre | 1 020 lignes de la matrice | (a) un second appel au modèle, séparé de la génération, qui reçoit l'idée et le critère et rend oui/non — contraire à la règle actuelle « les refus du proche n'entrent dans aucun prompt » ; (b) garder la règle : les garde-fous du Discovery n'écartent rien (situation actuelle, comptée) |
| D2 | Couple, famille avec enfants, télétravail, vie professionnelle | relation2.0787–0790, daily2.1130–1132, daily2.1134–1137, daily2.1138–1139, relation2.0802–0804, work2.1356–1357 | (a) une question d'entrée par situation ; (b) une donnée de l'onboarding à désigner ; (c) laisser fermé |
| D3 | Hôtellerie (20 questions) | travel2.0915–0927 et suivantes | (a) un séjour en préparation ; (b) travel2.0915 hors « un endroit où dormir » ; (c) les deux |
| D4 | Énoncé qui présume plus que la condition | CRE-15, CRE-16, CRE-18 (céramique), CHS-13 (talons) | (a) exiger l'intérêt déclaré pour la céramique / les talons ; (b) suivre le texte |
| D5 | « Niveau B avancé Esthétique » ; « après les 6 axes » ; axe Sécurité de Réussite (décision 3) | aesthetic.1966–1969, value.1522, success.1729–1731 et voisines | voir `lectures-de-conditions.json` et `dossiers-19nov.md` (choix a/b/c écrits) |
| D6 | « Pas mon univers / pas mon truc » | 41 lignes de `revision-5-diff.json` ; la note y est fausse pour JDS-01, live.0474, sportp.0503, qui demandent bien « Quelle place… » | (a) la traiter comme une faible place (comme « Très peu de place ») ; (b) garder une appréciation négative, sans effet de fermeture (situation actuelle) |
| D7 | Une seule question « place du domaine » par domaine | sport.0183 ↔ sportp.0503 ; GAM-01 ↔ gaming.0202 ↔ gaming2.1388 ; HUM-01 ↔ humor.0136 ↔ humor2.1414 ; THE-01 ↔ theatre.0098 ↔ theatre2.1363 ; LEA-01 ↔ learning.0235 ↔ learning2.1437 ; beauty.0155 ↔ beauty2.1287 ; fashion.0143 ↔ fashion2.1058 ; tech.0195 ↔ tech2.1313 ; work.0227 ↔ work2.1337 ; JDS-01 ↔ games.0946 | (a) poser la question de la branche la plus récente, l'autre seulement si elle n'a pas de réponse ; (b) garder les deux |
| D8 | Décision 8 : destinations proposées | dreams.2004, philovie.1636, values.1910, learning2.1455 | valider ou corriger, question par question (`dossiers-19nov.md`) |
| D9 | Paramètres sans source | brand.0268–0270, creator.0277–0278, destination.0286, place.0273, activity.0281 (« Entité détectée et importante ») ; food.0030–0031 ; craft.0620, 0622 ; CHS-07 ; JDS-08 | « importante » n'a pas de définition. Pour les lieux et œuvres, le registre des référents nommés existe désormais : (a) tout référent de cette nature nommé par la personne ; (b) seulement ceux nommés en réponse à une question d'attachement |
| D10 | Répétition d'une question paramétrée | CEL-02 à CEL-08, FOO-08… | Aujourd'hui posée **une fois** : la progression est tenue par question, pas par préparation. Faut-il la reposer pour chaque nouvelle préparation (Noël, puis un anniversaire) ? Si oui : progression par (question, préparation) |
| D11 | M2 | daily2.1143, dreams.1999, celebav.2155, craft.0666, daily2.1120 | écrire l'acteur et le bénéficiaire, ligne par ligne (le texte les donne pour quatre sur cinq ; daily2.1120 « être prévenu(e) » ne dit pas par qui) |
| D12 | 12 questions encore en arbitrage | dont CRE-11 (doublon de craft.0623 et sportp.0510) | le classeur n'écrit rien sur les 11 autres : il faut une proposition de contrat pour chacune |
| D13 | Personne sans centre d'intérêt | profil « Alice » | proposer une question d'entrée large, ou rien ? |

## 5. Ce qui reste à faire de ton côté, plus tard

- **Production** (paquet final, rien maintenant) : appliquer la migration 120 **avant** de servir ce code ; créer la variable serveur `DISCOVERY_LOT_SECRET`.
- **Essai du vrai extracteur** : à lancer dans ton Terminal (commande dans l'en-tête du script 34), après `npm install`.
- Aucun écran ne permet encore à un proche d'accorder `reco:gouts` : seule la route existe.
