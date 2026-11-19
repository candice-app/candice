# Discovery — état après le mandat du 19 novembre (08h05)

Ce document complète `etat-19nov.md` (écrit au matin). Il ne traite que du Discovery. Le paquet de
sécurité et les règles de déploiement sont suivis séparément et n'ont pas été touchés.

**Rien n'a été déployé. Aucune écriture en production. Commit servi : non confirmé** (rien n'a été
poussé ; GitHub est resté à `fee8dab`).

Classeur de référence : `docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_4.xlsx`
(SHA-256 `5a66c613…f28eca`). Banque active : 2 225 questions, 14 997 options.

---

## 1. Ce qui est fait, point par point du mandat

| # | Demande | État | Où |
|---|---|---|---|
| 1 | Correspondances explicites, versionnées, avec source | **Fait.** Les seuils (3 occurrences, 25 %, domaine majoritaire) ne décident plus de rien : ils ne servent qu'à proposer des candidats (`scripts/discovery/proposer-correspondances.mts`). Le moteur ne lit que des tables écrites, chacune avec sa source et son statut `etablie` / `hypothese`. Ajouter une question ne change aucune correspondance validée (alarme de dérive `--verifier`). | `correspondances.json`, `noms-officiels.json`, `ouvertures-explicites.json`, `dependances-explicites.json` |
| 2 | Fermer la route de réponse | **Fait.** Lot signé par le serveur ; six contrôles avant toute écriture ; un refus n'écrit rien. | `lot.ts`, `reponse.ts`, script 32 |
| 3 | Réviser les 96 énoncés sans les retirer | **Fait pour 90**, tracé (identifiant, avant, après). **5 isolés** non corrigés : deux sens possibles (voir §4, B1). | `revision-4-diff.json` |
| 4 | « Très peu de place » ≠ rejet | **Fait** pour les 19 contrats de la question à gabarit : 5 polarités corrigées avec diff. Une faible place baisse la priorité, ne ferme rien. Le refus de poursuivre est un acte distinct, explicite et réversible. | révision 4 bloc F, `etat.ts`, route `/api/discovery/sujet` |
| 5 | Ouvertures bien-être, déco & maison, ciné & séries, vin, « ne boit pas » | **Fait.** « Ne boit pas » ne protège que les 4 questions qui supposent l'alcool. Aucune préférence créée. | `ouvertures-explicites.json` |
| 6 | Dépendances de `craft.0614` | **Fait** : 23 questions rattachées aux six sens donnés, par clé d'option stable. Aucun axe entier ouvert. | `dependances-explicites.json` |
| 7 | Source des ouvertures manquantes | **Trouvée et importée** : feuille « Branches » de la Banque de micro-questions V1.1 (15 sept.), reprise dans le Référentiel enrichi V2. 96 noms officiels, 67 règles écrites. Le docx « 13 Branches VERSION RÉPARÉE » n'a pas été repris comme règle : il se dit lui-même version de travail en attente de validation. | `docs/discovery/sources/`, `noms-officiels.json` |
| 8 | Parties importées non exécutées | **Fait en partie** — voir §2 et §4. Faits d'option, réponses de projet, alias, destinations conditionnelles : exécutés. Extensions, paramètres, décisions 3, 5, 8 : bloqués ou non faits, avec le motif exact. | `produire.ts`, `service.ts`, `destinations.ts` |
| 9 | Identité des actes et reprises | **Fait.** Les six cas sont éprouvés (même requête, double clic simultané, A → B → A, renvoi du dernier A, panne entre connaissance et progression, réponse identique ultérieure). | `actes.test.ts`, script 32 |
| 10 | Brancher jusqu'à l'usage réel | **Fait pour le portrait, avec deux défauts trouvés et corrigés ; recommandations : bloqué sur une décision** — voir §3. | `faits-portrait.ts`, `breath-tags.ts`, `declarations-proche.ts` |

---

## 2. Couverture

### 2.1 Par onglet du classeur

| Onglet | Exécuté par le code | Reste |
|---|---|---|
| 00_SYNTHESE | Politique de niveau C et de recalcul. | Plafond « 1 proactive par visite » : pas de notion de visite. |
| 0_FICHE_CANONIQUE | Importé (`banque.json`), révision 4 comprise. Conditions lues clause par clause. | 403 questions dont la condition n'est pas entièrement comprise (détail §2.3). |
| 1_CONTRATS_PAR_REPONSE | Voie, famille, attribut, valeur, polarité, stabilité de chaque option. | Voir §2.2. |
| 2_JOURNAL_V4_V5, 11_TABLE_DE_MIGRATION | Historique, non exécutable par nature. | — |
| 3_MATRICE_ATTRIBUTS | — | Non confronté à l'import. |
| 4_ARBITRAGES_RESIDUELS, 15_REGISTRE_M1_M9 | — | Application de M1 à M9 dans le code non reprouvée. |
| 5_QUESTIONS_RESTRUCTUREES | Questions retirées absentes de la banque. | — |
| 6_ALIAS_OPTIONS | **Fait aujourd'hui** : 4 alias lus, l'ancienne option masquée, la réponse rangée sous l'option canonique. | — |
| 7_CONTROLE_SEMANTIQUE, 10_COUVERTURE | — | Non rejoués. |
| 8_QUALITE_QUESTIONNAIRE | Q4 (niveaux, recalcul). Q2 en partie, par l'onglet 13. | Paires Q2 hors onglet 13 ; Q1, Q3. |
| 9_CONTRATS_OUVERTS | Relations admises, archives, barrière d'inférences. | Schéma d'écriture et permissions `_v2` : importés, non exécutés. |
| 12_CONTRAT_DE_QUESTION | — | 100 conditions canoniques non confrontées à celles de la banque. |
| 13_COEXISTENCE_GENERATIONS | Fait. | — |
| 14_MATRICE_EXTENSIONS | `pace_preference` (porté par les lignes du classeur). | 4 extensions : bloquées (§4, B6). |
| 16_POLITIQUE_PARAMETRES | — | 437 lignes non exécutées (§4, B7). |
| 17_DESTINATIONS_CONDITIONNELLES | **Fait aujourd'hui** : 4 destinations sur 15 écrivent. Les 9 questions ne passent plus par la lecture générale. | 11 destinations au « verbatim seul » (§4, B3 à B5). |

### 2.2 Par contrat (voie de chaque option)

| Voie | Options | Ce que le code écrit |
|---|---|---|
| HSG_EVIDENCE | 12 945 | Une preuve pour 12 905. Rien pour 40 (contrat incomplet sur la ligne). |
| FACT | 600 | **Un fait pour 596, depuis aujourd'hui** (aucun n'était écrit ce matin). Rien pour 4. |
| ACTION_PARAMETER | 610 | Rien. C'est un réglage d'une action en cours, pas une connaissance ; sa politique est l'onglet 16, non exécuté. |
| DISCOVERY_STATE | 463 | Rien dans le journal de connaissances : la réponse compte pour la progression seulement. |
| OPEN_KNOWLEDGE | 375 | Rien par l'option fermée. Le texte saisi suit le chemin des réponses ouvertes. |
| NO_EMISSION | 4 | Rien, comme le contrat le demande. |

Questions fermées dont aucune option n'écrit : **38** (96 ce matin).

Réponses de niveau C : écrites comme **fait rattaché au projet**, jamais comme préférence générale.
386 questions rattachent leur réponse à un projet ; sans projet en cours, aucune n'est proposée (vérifié sur toute la banque) et une réponse forcée est refusée (409).

### 2.3 Par ouverture (effectifs recalculés, `docs/discovery/etat-19nov/effectifs.json`)

| Situation | Questions |
|---|---|
| Ouvrable sur le terrain | 1 297 |
| Ouvrable sur projet en cours | 168 |
| Ouvrable sur réponse de tri | 96 |
| Ouvrable sur démarche explicite | 47 |
| Historique conditionnée / remplacée | 27 / 28 |
| Sensible, fermée (HIGH 102, MAXIMALE 9, consigne 1) | 112 |
| Stérile | 38 |
| Fermée même avec tout | 9 |
| **Non résolue** : fragment non compris 160 · condition en prose après le nom 100 · sous-partie à ouverture en prose 66 · nom ou contexte non rattaché 45 · dépendance sans option 14 · tête de sous-partie 9 · nom tenu pour hypothèse 8 · Hôtellerie 1 | **403** |

S'y ajoutent **24 questions à paramètre** (`{occasion}`, `{marque}`…) : jamais servies (§4, B7).

---

## 3. Point 10 — ce que j'ai trouvé en suivant les connaissances jusqu'à leur usage

**Portrait.** Les preuves du Discovery (goûts, intérêts, rejets) arrivaient déjà au portrait par le
journal. Les **faits** n'étaient lus par personne. Ils le sont maintenant, en lignes bornées (40 au
plus, le surplus compté), chacune avec sa question et sa provenance — « dit par la personne » ou
« lu dans une réponse libre, non confirmé ». Deux déclarations opposées sont rendues ensemble et
marquées, jamais départagées. Les réponses de projet et les phrases entières n'y entrent pas.

**Défaut trouvé n° 1 — toutes les phrases du Discovery partaient dans les prompts.** Le lecteur de
faits des écrans de respiration et des sections de profil envoyait au modèle *tous* les faits du
compte, « à nommer ». Les phrases entières des réponses ouvertes en faisaient partie. Corrigé : les
faits `discovery.*` ne sortent plus par ce lecteur ; seul le lecteur qui sait les trier les reçoit.

**Défaut trouvé n° 2 — un garde-fou du Discovery retirait des recommandations au hasard.** 1 009
options écrivent un garde-fou dont le libellé stocké est un chemin technique
(`shoe.gift_openness.cadeau_chaussures_refuse`). L'exclusion des recommandations retire toute idée
partageant un mot avec ce libellé : celui-ci retirait donc toute idée contenant « cadeau ». Corrigé :
ces garde-fous n'écartent plus rien et sont comptés. **Conséquence à connaître** : « je préfère
qu'on ne m'offre pas de chaussures », dit au Discovery, n'écarte pas encore les chaussures (§4, B8).

**Recommandations.** Elles ne lisent du proche que ses rejets déclarés, après génération, sous son
consentement. Une lecture par modèle n'y entre pas — règle existante, que je n'ai pas changée.
L'usage *positif* de ce que le proche a dit n'est décidé nulle part (§4, B9).

**Ancienne projection.** L'analyse lit encore `my_profile.discovery_answers` ; le nouveau chemin n'y
écrit plus. Non retiré : c'est une suppression de comportement sur des données existantes.

---

## 4. Blocages exacts

| # | Identifiants | Source consultée | Décision qui manque |
|---|---|---|---|
| B1 | consumption.0242 à 0246 | Onglet 0, révision 4 | « Consommation et valeur » : la question porte-t-elle sur la place de la consommation, ou sur le rapport à la valeur des choses ? |
| B2 | 20 questions « Hôtellerie » | Feuille « Branches » V1.1 : « hébergement cité » | Qu'est-ce qui, dans le moteur, vaut « hébergement cité » ? |
| B3 | CRE-06 (×3), sensory2.1487 (×2) | Onglet 17 ; contrainte de colonne du journal (migration 82) | Le contrat fixe la stabilité à `undetermined`. Le journal n'admet que stable, evolving, contextual, temporary. Ajouter la valeur (migration, donc production) ou choisir une valeur admise. |
| B4 | comics.0422 #1, podcast.0467 (×2), sensory2.1482 (×2) | Onglet 17 : « résolu de façon unique » | Aucun résolveur d'œuvre, d'épisode ou de lieu n'existe. Le construire, ou accepter une entité non résolue. |
| B5 | pets.0403 | Onglet 17 : `pet_id` requis | Le modèle de données n'a pas d'animal identifié. |
| B6 | tradeoff_willingness, protected_domain, gift_spending_posture, preferred_attention_source | Onglet 14 : 25, 12, 4, 5 « lignes portantes » | Les options de la banque ne portent pas ces attributs (0 option). Il faut la révision du classeur qui les porte. |
| B7 | 24 questions à `{…}` (CEL-02 à 08, FOO-02, FOO-08, CHS-07, JDS-08, REM-06, activity.0281, craft.0620, craft.0622, brand.0268 à 0270, creator.0277, creator.0278, destination.0286, food.0030, food.0031, place.0273) ; 610 options ACTION_PARAMETER | Onglet 12 (« occasion connue et éligible ») ; onglet 16 (politique de péremption) | Quelle réponse antérieure fournit la valeur de chaque paramètre, et une question se pose-t-elle une fois par valeur ? |
| B8 | 1 009 options de garde-fou, 355 questions | `declarations-proche.ts`, `rejection-match.ts` | Pour chaque garde-fou du Discovery : ce qu'il écarte, en mots appariables à une idée. |
| B9 | — | `declarations-proche.ts` (en-tête) | Ce que le proche a dit peut-il faire *apparaître* une idée, et comment la justifier sans révéler sa déclaration ? |
| B10 | Couple, Couple au quotidien, Famille et enfants, Travail à domicile ; joys ; work2 | Feuille « Branches » V1.1 | Le moteur ne connaît pas la situation de vie. D'où la lire ? |
| B11 | aesthetic.1967 à 1969 ; craft.0623, craft.0625 | Feuille « Branches » ; ta réponse sur `craft.0614` | « Niveau B avancé Esthétique » : quel seuil ? craft.0623 et 0625 valent-elles aussi pour « souhait d'apprendre » ? |
| B12 | « Mode & beauté », « Tech & jeux », « Nature & jardinage », `jewelry_watches`, `cinema_series` du journal | `ouvertures-explicites.json` (statut hypothèse) | Ces catégories ouvrent-elles beauté, jeux vidéo, jardinage ? |
| B13 | beauty2.1287, comics.0414, THE-01, theatre2.1363, LEA-01 et semblables | Onglet 1 | « Faible place » écrite en rejet hors des 19 contrats corrigés : même correction ? |
| B14 | Décisions 3, 5, 8 ; 68 questions en arbitrage | — | Non reprises aujourd'hui. |

Les seuils de profondeur (B à 3 réponses, C à 8) restent un rythme provisoire : la règle écrite est
en prose, branche par branche.

---

## 5. Résultats observés

Tout a été exécuté sur ma copie de travail, puis recopié à l'identique sur le Mac.

| Vérification | Résultat |
|---|---|
| Compilation TypeScript | 0 erreur |
| Suite d'essais complète | 98 fichiers, 1 015 essais, 0 échec |
| Construction de l'application (`next build`) | réussie, 150 routes |
| Script 32 — route fermée et identité des actes (vraies routes HTTP) | 32 / 0 |
| Script 30 — portes, niveau C, recalcul | 42 / 0 |
| Script 15 — dix comptes de bout en bout | 208 / 0 |
| Scripts 10, 12, 13 — valeur recherchée, causes, envie culinaire | 15 / 0, 14 / 0, 40 / 0 |
| Script 33 — faits, destinations, projets, lecteurs (nouveau) | 16 / 0 |

**Ce que ces essais ne prouvent pas.**

- Le modèle est **simulé** partout : on lui dicte un découpage et on regarde ce que l'application en
  fait. Rien ici ne dit ce qu'un vrai modèle lirait dans une vraie phrase. L'extracteur réellement
  servi n'a pas été essayé — il faut la vraie clé, que je n'ai pas et ne dois pas avoir.
- La base est une base locale construite depuis les migrations, pas la production.
- Les dix profils « en personnage » n'ont pas été rejoués : leurs réponses préparées ne
  correspondent plus aux lots.
- La base en mémoire des essais unitaires n'applique pas les contraintes de colonnes. Le script 33,
  sur la vraie base locale, a attrapé une écriture que les essais unitaires laissaient passer
  (preuve d'intérêt sans force). Corrigée, et l'essai unitaire vérifie désormais ce champ.

---

## 6. Au déploiement (rien à faire maintenant)

- Créer la variable serveur `DISCOVERY_LOT_SECRET` (32 caractères au moins). Sans elle, le
  Discovery ne propose ni n'accepte rien.
- Les tables `discovery_sessions` et `profile_completion` restent inscriptibles par la personne :
  l'appartenance d'une question au lot est garantie, l'ordre du parcours ne l'est pas par la base.
