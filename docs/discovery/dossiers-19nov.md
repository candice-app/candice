# Dossiers du 19 novembre

Classeur : `Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_6.xlsx`. Produit par `scripts/discovery/dossiers-19nov.py`.

## Décision 3 — « Réussite — axe Sécurité » et ses voisins

**Colonne.** La condition d’émission de la question (onglet 0).

**Formulation complète.** « Niveau B Réussite — axe Sécurité », parfois suivie d’une note (« — sensitivity: HIGH — jamais communiqué… », « — croise philovie.1646 »).

**Valeurs voisines.** 9 axes, 26 questions : Statut (3) · Liberté (3) · Impact (3) · Création (3) · Sécurité (3) · Reconnaissance (2) · Maîtrise (4) · Temps disponible (2) · Transmission (3).

**Trois questions représentatives.**

- `success.1729` — « La sécurité est-elle une condition de réussite pour toi ? » — Niveau B Réussite — axe Sécurité
- `success.1730` — « À quel moment pourrais-tu te dire : « je suis suffisamment en sécurité » ? » — Niveau B Réussite — axe Sécurité — sensitivity: HIGH — jamais communiqué au pilote
- `success.1731` — « Une réussite importante doit-elle nécessairement comporter une part de risque ? » — Niveau B Réussite — axe Sécurité

**Fonction.** C’est un regroupement éditorial à l’intérieur du niveau B de la branche Réussite : il range les questions par dimension de la réussite. Aucune règle du classeur ne dit ce qui ouvre un axe. Aujourd’hui ces questions ne sont pas posées.

**Ce qui pourrait le rendre vrai.** `success.1711` — « Aujourd’hui, quelle dimension de la réussite aimerais-tu davantage développer ? » (niveau A, réponse multiple) a exactement 13 réponses, une par axe :

| Axe du classeur | Réponse à success.1711 |
|---|---|
| Statut | Le statut |
| Liberté | La liberté |
| Impact | L’impact |
| Création | La création |
| Sécurité | La sécurité |
| Reconnaissance | La reconnaissance |
| Maîtrise | La maîtrise |
| Temps disponible | Le temps disponible |
| Transmission | La transmission |

**Choix à faire.** (a) Un axe s’ouvre quand sa dimension est cochée à `success.1711`. Limite : la question demande la dimension que la personne *aimerait développer*, pas celle qui compte déjà pour elle. (b) Tous les axes s’ouvrent avec le niveau B de la branche, le regroupement restant purement éditorial. (c) Autre source. Rien n’est activé en attendant.


## Décision 8 — 31 motivations de vie, 11 aides à l’apprentissage

Ces lignes étaient rangées DRIVER ; la révision 2 les a reclassées en préférence (`value_sought`, `facilitator`) sans que l’accord les couvre. **Depuis aujourd’hui elles n’écrivent plus rien** tant que leur sens n’est pas établi (`sens-en-revue.json`).

| Question | Énoncé | Réponses | Portée | Destination proposée |
|---|---|---|---|---|
| `dreams.2004` | Pourquoi ce projet compte-t-il autant pour toi ? | 11 : Me prouver quelque chose · Me sentir plus libre · Créer · Apprendre · Changer de vie · Vivre une expérience forte · Partager avec quelqu’un · Me reconnecter à une ancienne envie · Réaliser un rêve d’enfance · Être fier ou fière de moi · Transmettre | le projet ou le rêve dont la personne parle (« ce projet ») — pas sa vie en général | connaissance ouverte « raison pour laquelle ce projet compte », rattachée à ce projet ; ni DRIVER, ni NEED, ni préférence générale |
| `philovie.1636` | Qu’est-ce qui te donne le plus l’impression d’avancer dans la bonne direction ? | 12 : Construire quelque chose · Apprendre · Aider · Créer · Me dépasser · M’occuper des personnes que j’aime · Découvrir · Être reconnu(e) · Gagner en liberté · Trouver davantage d’équilibre · Laisser une trace · Profiter davantage du présent | sa vie en général, déclarée | connaissance ouverte de type « priorité de vie » (même traitement que la question « moteurs » de l’onboarding, décision du 5 oct.) ; ni DRIVER, ni NEED |
| `values.1910` | Tu es le plus motivé(e) lorsque… | 8 : Tu apprends · Tu aides · Tu construis · Tu crées · Tu explores · Tu transmets · Tu gagnes · Tu résous un problème | sa vie en général, déclarée | connaissance ouverte de type « priorité de vie » ; ni DRIVER, ni NEED |
| `learning2.1455` | Qu’est-ce qui déclenche le plus souvent ton envie d’apprendre ? | 11 : Une discussion · Un problème concret · Une rencontre · Un livre · Un podcast · Une vidéo · Un voyage · Une émotion · Un projet · Une actualité · Le hasard | sa façon d’apprendre | fait déclaré « ce qui déclenche l’envie d’apprendre » dans le domaine de l’apprentissage ; aucune préférence sur des personnes (« une discussion », « une rencontre » décrivent un déclencheur, pas un goût pour quelqu’un) |

**Cas équivalents** (même réponse dans plusieurs questions) : « créer » (dreams.2004, philovie.1636) ; « apprendre » (dreams.2004, philovie.1636).

**Choix à faire.** Valider ou corriger la destination proposée, question par question. La révision du classeur et l’import suivront.


## Les 12 questions en arbitrage

Elles ne sont ni servies ni lues. Le classeur dit seulement « arbitrage en attente — N réponses ». Ce que la ligne permet de dire :

| Lecture | Questions |
|---|---|
| aucun point écrit sur les réponses | 11 |
| doublon d’une question active | 1 |

**Doublons d’une question active** (même énoncé) — proposition : garder l’active, retirer celle-ci.

| En arbitrage | Énoncé | Active |
|---|---|---|
| `CRE-11` | Tu préfères pratiquer… | `craft.0623`, `sportp.0510` |

**Exemples de point écrit par le classeur.**

Aucune : pour les 11 autres, le classeur n’écrit rien sur les réponses — ni contrat, ni point à trancher. Il n’y a rien à arbitrer tant qu’une proposition de contrat n’est pas écrite pour chacune.

Les 12 sont listées une à une dans `dossiers-19nov.json` (clé `arbitrages`). Les 56 autres des 68 d’origine ont été rendues actives par la révision 6 (`revision-6-diff.json`).


## Onglet 3 — matrice d’attributs

La matrice définit 39 attributs ; la banque active en emploie 39.

- **Employés par la banque et absents de la matrice : 0.** aucun.
- **Définis par la matrice et jamais employés : 0.** aucun.


## Onglet 15 — registre M1 à M9

Le classeur les dit toutes « appliquées ». Vérification dans la banque active, là où le registre nomme une ligne :

| Décision | Sujet | Vérification |
|---|---|---|
| M1 | gift_format donneur/receveur | conforme sur 4 ligne(s) |
| M2 | service_preference | conforme sur 32 ligne(s) — mais le registre rend OBLIGATOIRES l’acteur (Candice, proche, prestataire), le bénéficiaire et le contexte : aucune de ces lignes ne les porte, et le producteur ne les écrit pas. Le sens « qui doit assister » n’est donc pas conservé à l’écriture. |
| M3 | posture financière | conforme sur 4 ligne(s) |
| M4 | horizon d’un projet | conforme sur 6 ligne(s) |
| M5 | tonalité émotionnelle d’une attention | conforme sur 8 ligne(s) |
| M6 | rythme souhaité | conforme sur 10 ligne(s) |
| M7 | affect d’une situation | conforme sur 5 ligne(s) |
| M8 | rôle dans l’humour | conforme sur 4 ligne(s) |
| M9 | écoute attentive | conforme sur 3 ligne(s) |
