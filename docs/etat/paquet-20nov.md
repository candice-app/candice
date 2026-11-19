# Paquet du 20 novembre : corrections après le premier passage réel

Ce paquet succède à **50e3c42**, la version revue le 19 novembre. Le commit qui contient ce fichier est la nouvelle version, et son identifiant figure dans le message de commit.

**État de la production**

- Rien n'est en production.
- Seule la migration **115** est appliquée sur la base vivante.
- Le commit servi par l'hébergeur reste **à confirmer séparément**.
- Ce paquet n'ajoute aucune migration.
- Aucun passage sur `main`, aucun déploiement.

## Deux verdicts distincts

### Verdict 1 : le périmètre effectivement implémenté fonctionne-t-il ?

**Avec réponses simulées : oui.** Tout passe sur ce paquet :

- tests, typage et construction ;
- scripts locaux sur la pile locale, avec des comptes de test ;
- transitions de migrations.

Les chiffres sont dans « Vérifications ».

**Avec le vrai modèle : pas encore établi sur ce paquet.**

Sur 50e3c42, le passage du 19 novembre a donné :

- lecture (script 34) : **31 cas sur 38** ;
- parcours complet (script 37) : **27 vérifications sur 27**, mais son cas négatif « céramique » était vide.

Les défauts observés sont corrigés ici, et le passage réel est à refaire. C'est la prochaine preuve de fonctionnement. La procédure est dans `docs/discovery/procedure-vrai-modele.md`.

### Verdict 2 : le Discovery est-il conforme à ce qui a été décidé ?

**Non, pas encore.** Sur 2 407 questions du référentiel :

| | Questions |
|---|---|
| Implémentées : condition d'origine (1 694), lecture établie (293), ouverture sur démarche (55) | 2 042 |
| Fermées volontairement : décision produit (1), garde de sensibilité (125) | 126 |
| Retirées par le référentiel | 115 |
| En arbitrage hors banque | 6 |
| **Hypothèses de lecture qui attendent ton arbitrage** | **24** |
| **Décisions produit nécessaires** | **54** |
| **Données à recueillir ou à rattacher** | **23** |
| **Prérequis métier absents** | **17** |
| Clauses comprises mais non exécutées | **0** |

Les tests et les scripts simulés ne ferment ni ces 118 questions, ni la qualité de lecture du vrai modèle.

## Ce qui a changé depuis 50e3c42

### 1. Le lanceur 40 transmet désormais son verdict

**Le défaut :** le lanceur se terminait par un `echo` et annonçait une réussite même quand un essai échouait.

**Le remède :** son code de sortie **est** le verdict (`scripts/local/_executer-essais.sh`). Il ne vaut 0 que si les conditions suivantes sont toutes remplies :

- les deux essais sortent en 0 ;
- leurs journaux sont écrits ;
- leurs rapports ont été écrits **pendant ce passage**, sont lisibles et nomment le commit.

**L'épreuve, sans appel payant** (`scripts/local/tests-lanceur.sh`). Elle tourne aussi au début du lanceur, avant tout appel payant.

| Scénario | Verdict attendu | Obtenu |
|---|---|---|
| Premier essai en échec | échec | échec |
| Second essai en échec | échec | échec |
| Les deux réussis | réussite | réussite |
| Rapport du 34 absent | échec | échec |
| Rapport du 37 absent | échec | échec |
| Journal non écrit | échec | échec |
| Rapport d'un passage antérieur | échec | échec |

**Défaut de la garde `lsof`, corrigé :** sur ton Mac, `lsof -v` écrit sa version sur stderr, et la garde prenait cela pour une absence de `lsof`. Elle ne conclut désormais à l'absence que si `lsof` est réellement introuvable.

**La clé :** si elle est déjà dans l'environnement du lancement, le lanceur la prend. Sinon, il la demande en saisie masquée.

### 2. Les écarts de la lecture réelle

| Cas | Cause observée | Correction |
|---|---|---|
| sujet-present | le modèle a « corrigé » le déclencheur `SUJET_DECLARE` en `SUJET_DECLARED` : toute la lecture était perdue | les déclencheurs lui sont présentés par **code neutre** (C1, C2…), puis traduits ; un nom déformé reste refusé (lecteur **v4**) |
| projection, episode, cible-referent-lieu, et l'élément sensoriel de lieu-ideal | le modèle rend « j'adore » pour « j’adore » : **copie inexacte** | la copie tolère les variantes typographiques d'un **même** caractère (apostrophes, guillemets, espaces insécables, tirets), une pour une, si bien que les positions restent celles du texte. Une lettre différente reste refusée. |
| boisson-projection | « précision inexacte », cause non visible dans le rapport | le rapport du 34 garde maintenant **ce que le modèle a rendu**, pour chaque cas ; ce cas est à relire au prochain passage |
| oeuvre-appreciee | l'attendu du script (« clarification ») contredisait la règle écrite : un titre copié de la réponse, dans le médium de la question, identifie l'œuvre ; seul un épisode exige son émission | **attendu corrigé, code inchangé**, justification écrite dans le script. Si tu veux exiger l'auteur pour une œuvre, c'est un arbitrage |
| lieu-bien-etre | le jugement ne regardait que les preuves, alors que la voie de sensory2.1482 n°1 est un **fait** (lieu de bien-être) | jugement corrigé : le fait du lieu, ou une clarification, et toujours aucune préférence générale |

**Assertions renforcées :**

- **lieu-ideal** exige au moins un élément **esthétique** et au moins un élément **sensoriel**.
- **D1** :
  - l'ancien commentaire annonçait un refus HARD du cuir absent du semis ;
  - le refus réel est ajouté : « Cuir », famille olfactive évitée, HARD. Le parfum aux notes de cuir doit être **écarté** ;
  - le portefeuille en cuir doit rester **compatible**, parce que ce refus borne le parfum, pas la maroquinerie.
- **Script 37** :
  - la céramique lue par le modèle doit être **réellement écrite**, et classée « pas sa déclaration », avant de vérifier qu'elle ne part pas ;
  - si elle manque, il s'arrête en échec ;
  - son rapport contient chaque vérification, le commit, la version du lecteur et les modèles observés.

**Un défaut lié, corrigé à la source :** au passage réel, le parcours complet n'avait rien écrit de la réponse libre, pour la même raison que sujet-present (`SUJET_DECLARED`).

### 3. Le périmètre non implémenté

**Raccordements techniques faits.** Ce n'étaient pas des décisions :

- **« information manquante »** sans attribut nommé : l'information n'existe que dans la réponse de la question ; elle manque tant que la question n'a pas de réponse. Sept conditions étaient bloquées par ce seul défaut.
- **« Cuisine/gastronomie active »** : c'est le nom officiel de la branche food. Deux questions.
- **THE-06A** : l'ancien motif, « rien n'écrit `INTEREST.live_performance` », était faux. Quatre questions l'écrivent.
- **REM-09** : le texte d'origine est compris tel quel.
- **« Niveau C <branche> : recommandation en préparation »** : rangées avec les autres questions de recommandation, qui relèvent d'une décision produit.

**Le classement de ce qui reste :** chaque question non implémentée porte maintenant sa **nature** et **ce qu'il faudrait**, dans `docs/discovery/couverture-referentiel.md` :

- prérequis métier absent ;
- donnée à recueillir ;
- clause comprise non exécutée ;
- décision produit.

**Les arbitrages :** `docs/discovery/arbitrages-20nov.md`. Ils présentent les 24 hypothèses et les 54 décisions produit en dix familles, chacune avec les énoncés, les options, les conséquences et ma recommandation.

### 4. Les activités : un référent typé, jamais une entité

Ton principe : un référent d'activité explicitement typé, rattaché au construct canonique et à sa provenance.

**Ce qui est fait.** Les fichiers sont `activites.ts`, `activites-referents.json` et le générateur `scripts/discovery/activites-referents.py`.

- **Ce qu'il est.** Il est **dérivé** d'une réponse fermée de la personne et n'est **écrit nulle part**. Ce n'est ni un atelier, ni un établissement, ni un événement.
- **Ce qu'il garde.** Son construct canonique, par exemple `INTEREST.creativity.type_preference`, ou le fait de pratique déclarée. Son **mode**. Sa provenance (question, option).
- **Les deux modes :**
  - **attrait** : « t'attirent », « aimes-tu regarder » ;
  - **pratique** : « pratiques-tu réellement aujourd'hui ».
- **Une activité regardée et une activité pratiquée** sont deux référents distincts.
- **Les réponses écartées comme source**, avec leur raison écrite :
  - « pratiques-tu **ou** aimerais-tu pratiquer » ;
  - « Je pratique moi-même », qui ne nomme aucune activité ;
  - les activités qu'on souhaite encourager chez un enfant ;
  - les activités de voyage.

**Le prérequis exact de chaque question :**

| Question | Prérequis | Raison |
|---|---|---|
| « Qu'est-ce que tu aimes le plus dans {activité} ? » | **attrait** | une pratique seule ne prouve pas qu'elle l'aime |
| « Quel est ton niveau aujourd'hui ? » | **pratique** | la question demande le niveau, elle ne le suppose pas |
| « À quelle fréquence le pratiques-tu réellement ? » | **pratique** | |
| « Est-ce que tu aimerais progresser, t'équiper, vivre une expérience ou simplement continuer comme aujourd'hui ? » | **pratique** | « continuer comme aujourd'hui » présume une pratique actuelle ; une envie d'essayer n'en est pas une |
| « Y a-t-il du matériel qu'il ne faudrait surtout pas choisir à ta place ? » | **reste fermée** | pratiquer ne démontre pas un équipement, et aucune réponse ne le déclare |

**⚠ Une conséquence à valider.** Le niveau et la fréquence étaient **fermés par ta décision 9**, parce qu'aucune relation d'entité n'établissait une pratique. Avec une pratique **déclarée**, leur prérequis est établi : ils s'ouvrent, mais seulement pour une pratique déclarée. Si tu veux les garder fermés, une ligne de `activites-referents.json` suffit.

**Encore fermées, faute de donnée :** les deux questions d'arts créatifs paramétrées par l'activité. « À quelle fréquence pratiques-tu {activité} ? » attend une pratique créative déclarée une à une, et aucune question ne la recueille.

**Rejoué en base** (script 39, partie ACT) :

- la céramique (attrait) remplit « ce que tu aimes » ;
- l'escalade (pratique) remplit le niveau, la fréquence et « progresser » ;
- le matériel reste fermé ;
- **aucune entité n'est écrite** ;
- la réponse reste rattachée à l'escalade, et la question n'est plus posée pour elle ;
- aimer regarder le football ouvre « ce que tu aimes », pas « à quelle fréquence le pratiques-tu ».

## Vérifications du paquet

Voir le message de commit et `docs/etat/paquet-20nov-preuves.txt`.
