# Paquet du 20 novembre (bis) : corrections après le deuxième passage réel

Ce paquet succède à **4cfb4d1**, revu par Estelle le 20 novembre (deuxième passage réel). Le commit qui contient ce fichier est la nouvelle version ; son identifiant figure dans le message de commit.

**État de la production : inchangé.**

- Seule la migration **115** est appliquée sur la base vivante.
- Le commit servi par l'hébergeur : **non confirmé**.
- Ce paquet n'ajoute aucune migration. Aucun passage sur `main`, aucun déploiement.

## Le passage réel sur 4cfb4d1 reste tel qu'il a été observé

| Essai | Résultat observé | Rapports |
|---|---|---|
| Script 34 (lecture) | **33/38**, sortie 1 | `docs/discovery/passage-reel-20nov/` |
| Script 37 (parcours) | **6 vérifications passées, 1 en échec**, sortie 1, **interrompu** avant la recommandation | idem |
| Lanceur | échec correctement transmis | idem |

Deux des cinq échecs du 34 (envie, pas-envie) étaient des **erreurs de mesure**, pas des pannes : le diagnostic direct l'a montré. Le passage n'en devient pas 35/38 : il reste **33/38** dans ses rapports.

Le consentement et le retrait **n'ont pas été rejoués** sur 4cfb4d1 avec le vrai modèle : le parcours s'est arrêté avant.

## Deux verdicts distincts

**Verdict 1 — le périmètre implémenté fonctionne-t-il ?**

- Avec réponses simulées : oui, sur ce paquet (voir « Vérifications »).
- Avec le vrai modèle : **pas établi**. Les défauts du deuxième passage sont corrigés ici ; le passage réel est à refaire, les deux scripts en entier.

**Verdict 2 — le Discovery est-il conforme à ce qui a été décidé ?** **Non.** 118 questions restent ouvertes (24 hypothèses, 94 non implémentées : 54 décisions, 23 données, 17 prérequis). Leur recensement n'est pas leur implémentation.

## Ce qui a changé depuis 4cfb4d1

Le lecteur des destinations passe en **v5**. Chaque correction refuse davantage ou distingue mieux ; aucune ne retire une protection. Chacune a ses cas positifs **et** ses contre-exemples (`destinations.test.ts`, blocs « lecteur v5 »).

### 1. Une période n'est pas une portée (sujet-present)

**Observé.** Le vrai modèle rend `limite = « En ce moment »` ; toute limite non vide était refusée (`portee_limitee`). Les deux sujets étaient perdus.

**Correction.** Une limite qui n'est **qu'**un repère de temps (« en ce moment », « actuellement », « depuis peu »…) ou d'intensité (« un peu », « surtout ») ne restreint pas la portée. La liste est **fermée** : toute autre limite reste refusée, y compris « en ce moment au travail ». La consigne du modèle le dit aussi.

**Inchangé.** Condition, négation, autre personne, non affirmé : refusés, même avec une période (cas testés).

**Exigé du script 34.** Exactement deux intérêts, positifs, stabilité `contextual`.

### 2. L'attitude peut être dans le passage (oeuvre-appreciee)

**Observé.** Le vrai modèle rend `passage = « J'adore Blacksad »`. Le code ne lisait que les mots autour du passage, et perdait le verbe.

**Correction.**

- Les mots du passage sont lus **à part**, puis combinés sans jamais assouplir : une négation, d'où qu'elle vienne, l'emporte ; puis l'incertitude ; le positif seulement s'il est seul.
- La cible est vérifiée à partir du **nom déclaré** (« Blacksad »), pas du passage entier.

**Contre-exemples, dans les deux découpages.** « J'adore le dessin de Blacksad » reste une appréciation d'un **aspect**. « Je n'ai pas aimé Blacksad », « Je n'adore pas Blacksad », « Mon fils adore Blacksad », « J'adorais Blacksad » restent refusés. Un nom absent de la réponse reste refusé.

### 3. Une technique n'est pas une matière (rejet-technique-style)

**Observé.** Le macramé a été rangé en **matière**. Le script comptait deux rejets, sans vérifier l'attribut : le cas passait à tort.

**Correction.**

- La consigne distingue technique et matière, avec exemples ; dans le doute, le modèle ne rend pas le passage.
- Une **validation de refus seulement** : un passage classé matière qui ne nomme qu'une technique connue, ou l'inverse, est **écarté** (`classification_contredite`). Il n'est **jamais traduit** vers l'autre destination.
- Les mots qui sont l'un et l'autre (céramique, teinture, fil) ne prouvent rien : ils restent au jugement du modèle.

**Exigé du script 34.** Exactement : macramé → `type_preference` en rejet ; shabby chic → `aesthetic_universe` en rejet ; stabilité `undetermined` ; **aucune** matière.

### 4. Un épisode décrit n'est pas un épisode identifié

**Observé.** « L'épisode de Transfert **sur** la disparition de Lucie » : le modèle a pris le sujet pour le nom, et le code a écrit `episode_marquant`.

**La règle contractuelle appliquée** (déjà arbitrée, non modifiée) : un référent n'est écrit que s'il est **résolu de façon unique** ; un épisode exige son identification **et** son émission (`resoudre`).

**Lecture.** Un sujet décrit (« sur », « à propos de », « au sujet de », « consacré à », « où », « qui parle de », « autour de ») n'est ni un titre ni un numéro : l'identité unique n'est pas démontrée.

**Conséquence.**

- Clarification ouverte, aucun fait d'épisode, aucune appréciation.
- Le verbatim reste entier, donc le sujet décrit n'est pas perdu.
- Un numéro (« l'épisode 12 ») ou un titre déclaré (« l'épisode « La disparition de Lucie » », « intitulé … ») reste identifié.
- **L'attendu du script 34 n'a pas changé** : clarification. Il exige en plus l'absence de tout fait d'épisode.

**À arbitrer, si tu le souhaites :** écrire aussi un fait **descriptif** (« un épisode de Transfert sur la disparition de Lucie »), sans référent. Rien n'est écrit en ce sens aujourd'hui, faute de destination décidée pour un tel fait.

### 5. Les envies : deux lecteurs, observés chacun

**Observé.** Le script 34 n'observait que le lecteur des destinations ; food2.0882A a son lecteur propre. Il déclarait donc l'envie « en panne » à tort.

**Correction.**

- Le lecteur de l'envie est injectable, comme celui des destinations, pour l'observer.
- Le service dit désormais s'il a appelé le modèle (`luParLeModele`).
- Le rapport garde **séparément** le statut rendu par le service et l'instrumentation de chaque lecteur.
- Une panne se lit dans le statut du service, ou dans un lecteur **attendu** qui n'a pas rendu.
- Une absence d'envie décidée sans modèle est légitime, et doit n'avoir fait **aucun** appel.

**Éprouvé** (`lecteurs-observes.test.ts`) :

- la panne véritable de chaque lecteur ;
- l'absence d'envie sans appel ;
- l'envie lue mais absente ;
- l'envie écrite ;
- le verbatim gardé dans tous les cas ;
- chaque lecteur appelé seul pour son contrat.

### 6. Le rapport du parcours dit s'il est allé au bout

Le script 37 écrit `statut` (`acheve` ou `interrompu`), `etape_atteinte` et les étapes prévues. `nature` n'annonce plus « exécuté » quand il s'est arrêté. **Toute** sortie écrit le rapport : arrêt voulu, exception, erreur d'une route.

Le relais garde maintenant aussi **ce que le modèle a rendu** (l'entrée de son outil, données fictives, jamais un en-tête). Le rapport du 37 le contient pour la lecture de la réponse libre : la cause d'une céramique absente y sera **observée**, pas supposée.

## Point de décision : niveau et fréquence d'activité

**activity.0282** (niveau) et **activity.0283** (fréquence) **restent fermées par ta décision 9**. Le paquet 4cfb4d1 les ouvrait sous pratique déclarée : c'était une révision produit, pas une correction technique. Elle est **retirée du code**.

Elle reste écrite comme **proposition non appliquée** (`revisions_proposees_non_appliquees` dans `activites-referents.json`) :

- **Ce qu'elle ferait.** Ouvrir ces deux questions seulement quand la personne a **déclaré** pratiquer l'activité (« Quels sports pratiques-tu réellement aujourd'hui ? »). Jamais sur un simple attrait.
- **Pourquoi.** La question demande le niveau ; elle ne le suppose pas.
- **Ce que ça changerait.** Deux questions de plus pour qui déclare une pratique.

Rien ne change sans ton accord explicite.

**activity.0284** (« progresser… ou continuer comme aujourd'hui ») n'était pas fermée par la décision 9 : elle était non implémentée. Elle s'ouvre sous pratique déclarée, ce qui est un raccordement. Si tu la veux aussi fermée, dis-le.

## Vérifications du paquet

Voir le message de commit et `docs/etat/paquet-20nov-bis-preuves.txt`.
