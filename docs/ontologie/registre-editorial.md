# Registre éditorial — ce qui est dans le produit SANS être passé par la relecture d'Estelle

> Garantie contre l'oubli. **Rien ne sort de ce registre sans qu'Estelle l'ait relu. Rien n'y entre en silence.** Chaque entrée : ce que c'est, où ça vit, combien, et sa nature (provisoire / legacy / pont).

| # | Contenu | Où | Compte | Nature |
|---|---|---|---|---|
| E-1 | **Subtexts** d'options (consignes sous chaque option) | `presentation.ts` + doc mappings | 128 | Provisoire — écrits avant verrouillage ton Candice + DA V11. Présentation INERTE. |
| E-2 | **Icônes** d'options (attention) | `presentation.ts` | 35 | Provisoire. Présentation INERTE. |
| E-3 | **MICRO** (consignes sous les titres de question) | `canonical-attention.ts` | 4 (q1,q2,q4,qe) | Provisoire — repris du legacy, non relus. |
| E-4 | **Dims** affectives (option → MOT/SER/…) | `attention-dims.ts` + doc mappings | 28 | Sémantique de fait, reprise du scoring déployé V15, NON RELUE. Gravée au journal (`dims`). |
| E-5 | **Deltas d'axes** tempérament (option → axe·valeur) | `temperament-deltas.ts` + doc mappings | 36 | PONT legacy (ancien dictionnaire), NON RELU. `projection_bridge`, interdit au HSG. Condition de mort §47quater. |
| E-6 | **Deltas d'axes** lifestyle (option → axe·valeur·target·q) | `lifestyle-deltas.ts` | 42 entrées (19 deltas `lifestyle` + 26 suppléances `temperament`) | PONT legacy, extrait par import, NON RELU. `projection_bridge`, interdit au HSG. **Seuls les axes** : `filter`/`canal` exclus (canoniques, cas 1 — §47quater). Condition de mort §47quater. |
| E-7 | **Libellés de champs** A3 singularité/pratique/q17 (questionText des FACTs) | `socle-facts-fields.ts` | 11 + 17 + 1 | Repris MOT POUR MOT des composants (SingularityStep/PracticalStep/AvoidStep). Provenance verbatim ; aucune valeur inventée. Les FACTs eux-mêmes sont verbatim, sans mapping. |
| E-8 | **Libellés + options** incognito (A4 : stems I1–I16, textes d'options, jetons) | `onboarding-incognito.ts` | 17 questions / ~118 options | Banque canonique de la transcription §4, **NON RELUE par Estelle**. Ne pas la faire passer pour validée. Jetons {Prénom}/{Pronom}/{pronom} résolus au rendu. |

## À ne pas traiter dans ce lot (inscrit pour mémoire)

- **Trou de couverture Food (q15) & Voyage (q16)** : jamais rendues depuis la clôture V15 (déplacées vers le Discovery, exclues des listes `_ACTIVE`). Le trou est **antérieur au lot B**. Reprise = chantier Discovery (hors périmètre de ce lot).

## Dette d'alignement (datée par événement, pas à traiter hors de son déclencheur)

- **Dims/rank de l'attention** (E-4) sont de la sémantique LEGACY logée dans les colonnes `dims`/`rank` au lieu de `projection_bridge` — pour éviter un refactor pur sur le domaine qui marche. Elles portent **la même interdiction** (jamais lues comme connaissance par HSG/respiration/analyse, cf. §47bis) et **la même condition de mort que `projection_bridge`** : `dims`, `rank`, `projection_bridge` et les colonnes du scoring legacy meurent **au même événement** — le jour où la reco réécrite lit les PROFILE constructs V15.

## Ton de la prose « type A » (fiche, respirations, analyse) — éditorial à affiner par Estelle

La prose SUR une personne est générée par le modèle (hsg §48sexies), mais son **ton** est guidé par le prompt. Les formulations d'exemple produites par l'assistant (ex. « elle rentre à l'intérieur plutôt que d'extérioriser ») ne sont **pas du français qu'Estelle signerait** : les tournures / few-shots de ton des prompts de respiration et de fiche sont à **reprendre par Estelle**. Le modèle garde la main sur le contenu (tags) ; Estelle cadre le registre de langue.

## Signal qualité 7e (générations incomplètes) — emplacement provisoire

Le compteur « générations incomplètes » (règle 7e bis : 2ᵉ tentative → rien + signal) vit **provisoirement** dans `/parametres/compte` (atteignable, gratuit). **Sa vraie place = la CONSOLE DE VALIDATION** (cahier des charges moteur d'événements : l'écran où Estelle voit ce que l'IA recommande / exclut / ce dont elle doute). **Le compteur y déménage le jour où la console existe**, avec les autres signaux de qualité. On ne construit pas d'écran console aujourd'hui.

## Lot distinct « ÉTATS ET RELANCES » — NE PAS FAIRE MAINTENANT

N'appartient pas au lot socle. Les états arrivent par deux surfaces **qui n'existent pas encore** : le mode conversationnel, et l'ajout d'une info sur la fiche d'un proche **hors questionnaire**. À faire quand elles existent :
- La famille **CONTEXT se périme** ; les autres familles non. Une evidence CONTEXT est **restituée avec sa date** et **devient une question** passé un certain âge.
- Quand un **état difficile** est déclaré, Candice **revient au bout d'un délai** qui dépend du type de contexte, **auprès du PILOTE, jamais du proche**.
- Estelle pose les **durées** ; la **cadence** passe par le **score de fatigue**.
- ⚠ À ne pas confondre avec la restitution de TRAITS (toujours autorisée, 7d) : ce lot ne concerne que les ÉTATS périssables.

## SÉQUENCE DIRECTRICE (décision 24 oct) — rappelée à la fin de CHAQUE rapport, avec l'état de chaque ligne

Lister ne suffit pas (trois livrables ont dérivé 4 tours en étant listés). État à jour obligatoire :
1. **Extraction du texte libre** — spec + écart faits (lecture) ; **BUILD à venir**.
2. **Étape 0** (Estelle refait onboarding complet + une fiche proche → journal réel et entier) — EN ATTENTE (après 1).
3. **Orchestration** (génération par section ; cœur déterministe fait) — EN ATTENTE (après 1+2). **BLOQUANT : rien de visuel tant que non livré.**
4. **Câblage affichage** (masquage/régé/calculé qui tient) + **fiche sur la maquette gelée** — après 3.
5. **Écrans** : 2→5 (profil/analyse/synthèse), puis 6→11 et 14, puis 12, 13 et la reco au minimum.
6. **Suppression de l'ancien chemin** en un commit, puis **migration de suppression des colonnes** (séparée).

## Question ouverte — OÙ VIT LA FAMILLE BEHAVIOR SUR LA FICHE (décision design d'Estelle)

BEHAVIOR (« sous pression, il garde pour lui » — stress/conflit/communication/expression) est **produite** mais n'a **aucune maison** sur la maquette gelée (4 blocs « En profondeur », aucun ne porte le comportement). **Ne pas la force-placer** (l'enfouir dans « se sentir aimé » la déforme). Laissée **non consommée et signalée** (test de couverture l'acte). Estelle décide sa section ; d'ici là, elle n'apparaît pas sur la fiche.

## Radar : 11 domaines du dictionnaire SANS catégorie (Estelle choisit lesquels ajouter)

Le radar (13 catégories) ne couvre pas 11 domaines d'INTEREST : **bijoux & montres, architecture, photographie, automobile, artisanat, sciences, entrepreneuriat, développement personnel, famille & enfants, animaux, collection**. Quatre pèsent pour une attention : **bijoux/montres, animaux, photographie, artisanat**. Estelle choisit lesquels ajouter ; **le libellé des nouvelles catégories est d'Estelle** (éditorial).

## Mécanisme radar → INTEREST (double mappings) — proposé, Estelle tranche

Le radar (13 catégories, le « 15 » est un nom faux) journalise dans INTEREST au domaine parent. **Une case cochée ne compte jamais deux fois** : proposition = **un domaine PRINCIPAL + un alias non pondéré**. Ex. « Art & culture » → **1 evidence INTEREST** `parent_domain = art` (principal) ; `culture_history` noté comme **alias** (champ descriptif, pas une 2ᵉ evidence) → pèse une fois dans les classements. Les catégories mono-domaine (Lecture→books_literature) : 1 evidence, pas d'alias.

## Libellés de vide (éditorial, Estelle) — « Pas encore d'éléments » provisoire

Tout libellé de section vide (ex. Tables/Voyages en attente d'extraction) est provisoire, de l'assistant, à reprendre par Estelle. Marques+lieux fusionnés en un bloc tant qu'il n'y a qu'un fait : validé, scindé à l'extraction.

## Point A (pont d'alignement des clés incognito) — ANNULÉ (22 oct)

Raison : décision « on supprime l'ancien » (hsg §48quater). Maintenir l'ancien affichage via un pont de clés ne protège personne (seule utilisatrice). Les écrans lisent le journal, puis l'ancien est supprimé. Le pont aurait été du travail jeté.

## Lot officiel « IDENTITÉ, MERGE ET DÉPART » — règle validée (voir hsg §48bis), 3 pièces à construire

La règle de préséance et de visibilité est **tranchée et validée par l'avocate** (pas en attente d'un avis). Elle est **écrite au document** (hsg §48bis) ; **rien n'est encore implémenté** (ni préséance, ni merge, ni écran). Les 3 pièces, chiffrées par l'inventaire (22 oct), non construites :

1. **Lien fiche ↔ compte (merge déclaré par le pilote)** — cf. inventaire b. Jamais automatique (en incognito on n'a qu'un prénom).
2. **Suppression de compte et cascade sélective** — cf. inventaire d. Ne supprimer que les `self_report` du partant ; les evidences d'un tiers à son sujet ne bougent pas. Le retour de l'incognito n'est PAS une restauration : la préséance retombe d'elle-même (à prouver quand la préséance sera codée).
3. **Écrans** — « c'est la même Julie » (déclaration de merge) ; choix du pilote au départ de Julie ; proposition incognito / côte à côte. Cf. inventaire f. **Textes de l'écran de merge = Estelle** (non rédigés par l'assistant) : « ce que tu as écrit n'est pas perdu / reste chez nous / revient si Julie repart / ton historique est conservé / désormais Julie décide de ce qu'elle partage ».

**Calendrier (hsg §48ter.6)** : la **fiche proche** (`/contacts/[id]`) est le **1ᵉʳ des 14 écrans** à débrancher du rangement à plat vers le JOURNAL — c'est le préalable d'un affichage mergé. Ordre du lot : préséance au read → bloc traits fiche au journal → acte de merge + écran → départ/retour. **Migration préalable** : ajouter `declared_via_relative` au CHECK `source_type` (migration 82 ne l'a pas) avant tout flux côte à côte.

## Questions ouvertes (à arbitrer au LOT RECO, pas avant — ces axes meurent avec la réécriture)

- **Double-application des suppléances tempérament du lifestyle (BUG LATENT du scoring déployé).**
  `QuestionnaireFlow` appelle `mergeTemperamentSupplements` DEUX fois : au step4 (sur les suppléances des
  questions step4) puis au step5 (sur le RE-calcul de TOUTES les réponses = step4 + q18/q19). Les
  suppléances **step4** sont donc ajoutées **deux fois** à `temperament_axes`. **Axes surpondérés** :
  `sensibiliteDetails` (q14,q4a), `rapportTemps` (q4a,q4c), `spontaneiteControle` (q4a,q4c),
  `exigenceStanding` (q4a,q4c). Surpoids ≈ `round(raw_step4/8×100)` compté une fois de trop par axe
  (ex. mesuré : `rapportTemps` raw=3 → +38 appliqué deux fois → 76 au lieu de 38). Les suppléances
  **step5** (q18/q19) ne sont PAS doublées. **Décision Estelle : NE PAS corriger maintenant** — ces axes
  legacy meurent avec la réécriture de la reco (le corriger serait du travail jeté). La reconstruction du
  journal reproduit FIDÈLEMENT ce double-comptage (sinon l'égalité de vecteur échouerait, .6/.7). À
  rouvrir quand la reco lira les PROFILE constructs V15.

## À venir (sera inscrit quand gravé)

- *(rien en attente sur le socle — attention, tempérament et lifestyle gravés : E-1…E-6.)*
