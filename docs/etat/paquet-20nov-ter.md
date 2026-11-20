# Paquet du 20 novembre (ter) : correction après le troisième passage réel

Ce paquet succède à **eea2f38**. Le commit qui contient ce fichier est la nouvelle version ; son identifiant figure dans le message de commit.

**État de la production : inchangé.**

- Seule la migration **115** est appliquée sur la base vivante.
- Le commit servi par l'hébergeur : **non confirmé**.
- Ce paquet n'ajoute aucune migration. Aucun passage sur `main`, aucun déploiement.

## Le passage réel sur eea2f38 reste tel qu'il a été observé

Il est conservé sans modification dans `docs/discovery/passage-reel-20nov-eea2f38/`.

| Essai | Résultat observé |
|---|---|
| Script 34 (lecture) | **37/38**, sortie 1 ; seul échec : boisson-projection |
| Script 37 (parcours) | **28 vérifications passées, 0 en échec**, statut **achevé**, consentement et retrait compris |
| Lanceur | sortie 1, l'échec du 34 est transmis |

Ce passage reste **37/38**. Il n'est remplacé par aucun autre passage d'eea2f38.

**La céramique, observée cette fois.** Le relais a gardé ce que le modèle a rendu pour la réponse libre du script 37 : « la céramique japonaise » et « l'histoire des cartes anciennes » en intérêt, et « La chimie ne m'intéresse pas » en intérêt **non affirmé**. La céramique a été écrite, puis tenue hors des recommandations. La cause de son absence sur 4cfb4d1 reste **non observée** : le relais de cette version ne gardait pas les réponses.

## L'écart restant : boisson-projection

**Réponse.** « Un verre de vin nature sur une terrasse à Lisbonne, au coucher du soleil. » (drinks.2102)

**Rendu du modèle.** Le passage entier, en projection, correct. Il a **ajouté** :

- `identite.rattachement = « Portugal »`, qui est absent de la réponse ;
- `relation = WANT_TO_VISIT` et `cible = referent`.

**Ce que faisait le code.** Il refusait le rattachement inventé (`precision_inexacte`), ce qui est juste, mais perdait du même coup toute la projection.

**La cause.** Le lecteur validait tous les champs rendus, même ceux que la destination ne prévoit pas. Un fait de projection n'a ni identité à résoudre, ni relation envers une entité.

## La correction : chaque destination ne lit que les champs de son contrat (lecteur v6)

| Champ | Admis pour |
|---|---|
| `identite` | les destinations qui résolvent un référent : œuvre, épisode, lieu, animal |
| `relation`, `cible` | les destinations d'entité |
| `condition`, `limite` | toutes, comme avant |

**Champ hors contrat.** Il est écarté **avant** l'examen : ni lu, ni validé, ni écrit. Il est seulement nommé au relevé de la lecture (`champsIgnores`), pour la trace.

**Champ du contrat.** Il reste exigé **à la lettre**, exactement comme avant :

- une condition inventée écarte toujours le segment ;
- un auteur inventé pour une œuvre aussi ;
- une localité inventée pour un lieu aussi.

**Rien n'est assoupli** dans la copie exacte.

La consigne du modèle dit aussi de ne déclarer `identite`, `relation` et `cible` que pour les déclencheurs qui les demandent, et de ne jamais ajouter un pays, une région, un auteur ou une envie que la réponse n'écrit pas.

**Ce qui est écrit pour la réponse de Lisbonne :**

- **un seul fait**, `moment_ideal_boisson`, avec le passage tel qu'écrit ;
- **aucune preuve** : ni goût, ni habitude, ni envie de visiter ;
- aucune entité, et « Portugal » n'apparaît nulle part ;
- le verbatim est gardé.

## Les tests

**La sortie brute réelle du modèle**, identique au rapport d'eea2f38, est une fixture de régression (`destinations.test.ts`, bloc « lecteur v6 »). Elle vérifie :

- le segment est retenu, sans identité ni relation, et ses trois champs écartés sont nommés ;
- l'écriture produit le seul fait de projection, rien d'inventé, et le relevé nomme les champs écartés ;
- le découpage propre du même texte donne le même fait ;
- les champs du contrat restent exigés à la lettre : condition inventée, auteur inventé, localité inventée ;
- une relation rendue pour un intérêt n'est jamais lue.

**Le jugement du script 34** exige désormais exactement un fait `moment_ideal_boisson`, aucune preuve, et l'absence de « Portugal ».

## Deux verdicts distincts

**Verdict 1 — le périmètre implémenté fonctionne-t-il ?**

- Avec réponses simulées : oui, sur ce paquet (voir les preuves).
- Avec le vrai modèle : sur eea2f38, 37/38 et parcours achevé. Sur ce paquet, **à établir** : les deux scripts réels sont à rejouer en entier.

Un passage réel ne mesure pas la stabilité statistique du modèle.

**Verdict 2 — le Discovery est-il conforme à ce qui a été décidé ?** **Non.** 118 questions restent ouvertes : 24 hypothèses, et 94 non implémentées (54 décisions, 23 données, 17 prérequis).

## Vérifications du paquet

Voir `docs/etat/paquet-20nov-ter-preuves.txt`.
