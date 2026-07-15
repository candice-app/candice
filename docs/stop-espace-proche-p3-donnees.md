# ⛔ STOP DONNÉES — onglet [Prénom] : quelle source alimente le profil du proche ?

Avant de construire l'onglet [Prénom] (le plus gros), une décision de données que tu dois trancher — l'ai vérifiée en base, elle n'est pas déductible seul.

## La réalité en base

Le maquette [Prénom] montre un profil **riche, dérivé d'une analyse** (podium du langage d'attention, cartes « ce qui le touche/le fait se sentir aimé… », son monde, territoire, univers, infos pratiques). Or :

- **`profile_analysis` contact-scoped = 0 ligne** (aucune analyse n'a jamais été générée POUR un contact). Le pipeline `generateProfileAnalysis(pilote, contactId)` **existe** mais n'est **jamais appelé** avec un `contactId` — il ne sert qu'au profil du pilote.
- Deux cas très différents de « proche » :
  - **Proche = utilisateur Candice qui a partagé** (`contacts.proche_user_id` renseigné) → son analyse existe (SON `profile_analysis`), lue via consentement (`procheAnalysis` dans la fiche actuelle). Données riches disponibles. Visibilité = `contact_consents`.
  - **Proche = contact non-utilisateur** (ex. « Thibaud » du compte QA, `proche_user_id = NULL`) → **aucune analyse**. Seul existe le **questionnaire du pilote SUR le proche** (`contacts.questionnaire_responses`) + faits (date_de_naissance, postal_address, gender…).

## Réutilisation `ProfileV2` (rendu « identique au pilote », §15)

`ProfileV2` gère déjà les vues tierces (visibilité, 3e personne, libellés « Ses tables »…) — c'est LE rendu identique-au-pilote demandé. Mais il est bâti sur la structure `my_profile` (pilote). L'alimenter avec les données d'un proche demande un **adaptateur** (analyse proche → `ProfileV2Data`).

## Ce que je dois te faire trancher

1. **Onglet [Prénom], source du profil** :
   - **(A)** Proche-utilisateur partagé → son analyse + visibilité consentement ; **contact non-utilisateur** → générer une analyse contact-scoped (LLM, via le pipeline existant, à câbler) puis l'afficher.
   - **(B)** Ne rendre riche que le proche-utilisateur partagé ; pour un contact non-utilisateur → afficher les **faits du questionnaire** + états vides sur les sections d'analyse (pas de génération LLM dans ce lot).
   - **(C)** Générer systématiquement une analyse contact-scoped (utilisateur OU non) à partir de tout ce que le pilote sait — homogène, mais c'est de la génération LLM (territoire « moteur de reco »).

2. **Rendu des sections** : réutiliser `ProfileV2` (identique pilote, + `hideHeader` + un adaptateur données proche) — **ma reco** — vs reproduire les sections dans le module espace-proche (plus littéral à la maquette, mais duplique et risque de diverger du pilote).

## Ma recommandation

- **Rendu = réutiliser `ProfileV2`** (headerless) sous la chrome espace-proche → garantit « identique au pilote » par construction, zéro divergence.
- **Source = option B pour ce lot** : profil riche pour un proche-utilisateur partagé (analyse + consentement) ; pour un contact non-utilisateur, afficher les **faits connus** + états vides élégants sur les sections d'analyse, SANS déclencher de génération LLM (qui relève du lot Moteur de reco). La génération contact-scoped (option A/C) sera un branchement propre quand le moteur arrivera.
- Conséquence immédiate : sur le compte QA (Thibaud, non-utilisateur, aucune analyse), l'onglet [Prénom] montrera la chrome + les faits + des sections en état vide — c'est correct et honnête, pas un bug.

## ⚠ RAPPORT D'HYPOTHÈSES
**A. ZONES DE FLOU** : la génération d'analyse pour un contact non-utilisateur (existe techniquement, jamais déclenchée) — dans ce lot ou au lot Moteur de reco ?
**B. DÉCISIONS PRISES SEUL** : aucune (je m'arrête avant de coder l'onglet).
**C. LAISSÉ EN SUSPENS** : Phases 3/4/5 tant que la source n'est pas tranchée.
**D. À VÉRIFIER PAR ESTELLE** : (1) source du profil [Prénom] — A / **B (ma reco)** / C ? (2) réutiliser `ProfileV2` (ma reco) ou reproduire ? (3) génération d'analyse contact = ce lot ou lot Moteur de reco ?
**E. MIGRATIONS / BUILD** : rien appliqué, rien codé pour 3-5.

**STOP.** Je ne construis l'onglet [Prénom] qu'après ton choix de source (A/B/C) et du mode de rendu.
