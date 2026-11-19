# Paquet figé du 19 novembre au soir — corrections du mandat de 19h56

Le commit qui porte ce fichier est figé pour la revue. Rien n'est en production : aucune migration n'a été appliquée à la base vivante et rien n'a été déployé. Le commit servi en production n'est pas confirmé.

## Trois catégories de preuve

| Catégorie | Ce qu'elle établit | État |
|---|---|---|
| **Logique éprouvée avec réponses simulées** | Pour une réponse donnée du modèle, ce que l'application écrit, refuse, relit et transmet | exécutée : tests et scripts locaux, ci-dessous |
| **Lecture réellement observée du modèle** | Ce que le vrai modèle découpe, qualifie et cible | **non exécutée** : script 34, procédure prête |
| **Parcours complet réellement exécuté** | Routes, base, recommandation et entrées du modèle observées, avec le vrai modèle | **non exécuté** : script 37 en mode `reel`, procédure prête |

Rien de ce paquet n'est dit « prouvé avec le vrai modèle ».

## 1. Script 37 : il passe désormais par le parcours réel

Le script a été réécrit. Il ne contourne plus les routes, et il s'exécute en mode simulé : **29 vérifications, 0 échec**.

- **Sélection et lot signé.** La proche choisit « apprentissage » par `/api/discovery/sujet`. Le serveur propose les lots (`/api/discovery/lot`) et chaque acte part avec son jeton signé (`/api/discovery/answer`) : 21 actes, tous en HTTP 200. Le script vérifie chaque statut HTTP et chaque erreur de lecture, et s'arrête sur une erreur au lieu de conclure « rien transmis ».
- **Persistance et relecture.**
  - « Astronomie » est un intérêt **explicite** (learning2.1440).
  - « la céramique japonaise » est un intérêt **lu par le modèle**, donc inféré (learning2.1459).
  - « la chimie », niée, n'est écrite comme intérêt nulle part.
  - Le portrait relit l'ensemble.
- **Entrées du modèle observées.** Un relais (`scripts/local/relais-observateur.mjs`) se place entre l'application et le modèle. Il garde la consigne et les messages réellement envoyés, avec le statut HTTP rendu. Il ne garde aucun en-tête. La fenêtre d'observation n'est ouverte qu'une fois les travaux de fond terminés, et un appel étranger à la recommandation fait échouer le script. Ce garde-fou vient d'un défaut réel : la première exécution avait mêlé à l'observation l'analyse de profil de la proche, lancée en arrière-plan.
- **Sans autorisation.** Aucune donnée de la proche ne figure dans ce qui part au modèle. La recommandation enregistrée ne déclare aucune provenance.
- **Après accord de `reco:gouts`**, donné depuis la session de la proche :
  - « Astronomie » part au modèle, dans la ligne des goûts déclarés ;
  - la lecture par modèle (« céramique… ») n'est pas éligible : elle est gardée comme cas négatif et ne part pas ;
  - l'idée qui s'en inspire est rendue avec la justification neutre ;
  - la provenance `reco:gouts` est enregistrée, sur la recommandation comme sur les idées proposées.
- **Après retrait.**
  - La recommandation est vidée et marquée à recalculer.
  - Les idées proposées qui en venaient sont retirées.
  - La fiche du pilote (HTTP 200) n'en affiche aucune.
  - La génération suivante n'envoie plus rien de la proche.

Rapport : `docs/discovery/parcours-complet-simule.json`.

## 2. Une appréciation ne change plus de cible

**Le défaut.** « Les thermes de Bagnères : j'y ai adoré le silence » écrivait LOVE envers l'établissement, et le script 36 comptait ce résultat comme réussi. Le même risque existait dans l'extracteur des réponses libres et des récits, par exemple avec « J'adore l'ambiance du Café de Flore ».

**La correction.** Elle s'applique aux deux lecteurs : destinations (lecture v3) et extracteur libre.

- Le modèle déclare une `cible` (`referent` ou `aspect`).
- Les **mots** de la réponse la vérifient ensuite, avec `cibleLexicale` et `cibleDUneEntite`. La vérification ne peut que refuser :
  - un objet qui n'est pas le référent ;
  - un « y » suivi d'un objet ;
  - un nom absent de sa phrase.
- Dans le doute, aucune relation n'est écrite. La phrase reste en connaissance ouverte, marquée « cible non établie ».

**Ce qui est vérifié.**

| Où | Cas | Résultat |
|---|---|---|
| Script 36, base locale | « j'y ai adoré le silence » | aucune relation, **même quand le faux modèle affirme `referent`** ; motif relu en base |
| Script 36, base locale | « j'adore cet établissement » | LOVE écrit, puis relu |
| Script 36, base locale | épisode « la voix de l'invitée », œuvre « le dessin de Blacksad » | aucune relation ; l'auteur n'en reçoit aucune |
| Script 39, base locale | récit sur « l'ambiance du Café de Flore » | aucune entité écrite, rien d'ouvert |
| Tests unitaires | destinations : 8 cas d'examen, 13 cas de lecture, 4 écritures ; entités : 17 cas ; extracteur : 3 cas | réussis |
| Script 34, vrai modèle | 9 cas ajoutés | écrits, **pas encore lancés** |

Script 36 : **15 vérifications, 0 échec**.

## 3. Couverture

### Décisions rejouées en base

Script 39 : **47 vérifications, 0 échec**. Les réponses sont écrites sous la session de la personne, puis la décision est prise sur l'état **relu** en base.

| Décision | Ce qui est vérifié |
|---|---|
| D3 hôtellerie | « un endroit où dormir » ≠ goût ≠ absence de besoins ; un séjour seul n'ouvre pas un goût général ; niveau B relu |
| D4 céramique | peinture ≠ céramique ; céramique sans envie de pratiquer ≠ CRE-16 |
| D4 talons | plateforme ≠ talon ; CHS-13 exige aussi un achat en préparation (niveau C) |
| CRE-11 | **préférence de lieu, et non plus fait de pratique** : `usage_context` écrit et relu ; aucun fait ni comportement de pratique ; les autres dimensions restent ; craft.0623 n'est pas reposée |
| D5 esthétique | « jamais pensé » et « Cela dépend » n'ouvrent rien ; une question passée par la route n'ouvre rien ; contre-épreuve |
| flowers.2126 | « Du soutien » devient un paramètre du projet, rattaché au projet ; aucune preuve sur la personne |
| D1 | par la route de génération : les baskets sont rétrogradées derrière le livre, relu en base ; le qualificateur ne reçoit aucun refus, observé au relais ; provenance `reco_exclusions` |
| D9 | destination (WANT_TO_VISIT ≠ LOVE) ; lieu ; créateur (CURIOUS) ; réponse rattachée à l'entité, non reposée ; activity.0282, 0283 et 0285 fermées |

### Couverture complète du référentiel

Fichiers : `docs/discovery/couverture-referentiel.md` et `.json`. On y trouve 2 407 questions et 2 778 clauses. Chaque clause est évaluée par le vrai évaluateur, d'abord dans l'état lu en base pour un compte neuf, puis dans un état où tout est déclaré.

| Statut | Questions |
|---|---|
| implémentée, condition d'origine | 1 688 |
| implémentée, lecture établie | 285 |
| ouverte sur démarche (sensible) | 54 |
| **fermée par le produit** (décision citée) | 3 |
| **fermée par la garde de sensibilité** (sensible, sans démarche au référentiel) | 125 |
| **non implémentée**, hypothèse en attente d'arbitrage | 23 |
| **non implémentée** (ce qui manque est écrit) | 108 |
| retirée par le référentiel | 115 |
| en arbitrage, hors banque | 6 |

**Constat nouveau.** activity.0281 et activity.0284 sont lues, mais aucun écrivain ne produit une entité « activité ». Elles sont donc classées non implémentées, et non fermées. Je ne l'ai pas comblé : ajouter le type « activité » à l'extracteur changerait la frontière entre intérêt et entité, et cette décision n'est pas la mienne.

## 4. Vrai modèle, rédaction et plan

- **Procédure** : `docs/discovery/procedure-vrai-modele.md`. Le lanceur est `scripts/local/40-parcours-vrai-modele.sh`.
  - Il demande la clé lui-même, avec une saisie masquée. Elle ne vit que dans son processus.
  - Il donne une valeur locale à **chaque** variable lue par l'application, et s'arrête s'il en manque une. `.env.local` ne peut alors rien injecter : Next ne remplace jamais une variable déjà définie, vérifié dans `@next/env`.
  - Le relais ne transmet jamais un en-tête `Authorization`.
- **CRE-11** : « préférence de lieu, et non plus fait de pratique ». La phrase est corrigée dans le bilan.
- **Plan** : le contrôle SQL confirme l'état du schéma, pas le commit servi. Corrigé dans `docs/securite/ordre-de-deploiement.md` et dans le bilan. La preuve du déploiement reste séparée.

## Vérifications du paquet

- **Tests et construction.** 1 273 tests réussis, typage propre, build réussi.
- **Scripts locaux** (modèle simulé, pile locale, comptes de test), tous à 0 échec :

| Script | Vérifications |
|---|---|
| 15 | 208 |
| 18 | 75 |
| 30 | 53 |
| 32 | 32 |
| 33 | 35 |
| 35 | 45 |
| 36 | 15 |
| 37 (simulé) | 29 |
| 38 | 7 |
| 39 | 47 |

- **Transitions** (script 23, rejouées avec ce code) : A × 122 18/0, B × 120 18/0, B × 122 18/0, B × 117 18/0, B × 117 sans 121 et 122 18/0, A × 117 17/0. Sorties : `docs/securite/preuves-transition/`.
