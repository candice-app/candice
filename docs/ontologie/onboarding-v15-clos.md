# Onboarding Candice — V15, fermé le 2 octobre 2026

Référence de clôture. Le fichier de détail est `Candice_Questionnaire_Onboarding_V15.xlsx` (26 onglets). Ce document est la version lisible depuis un prompt, pour le lot qui code l'onboarding. Le classeur Excel ne doit jamais être parsé par le code.

**Autorité.** Le Dictionnaire canonique fait foi sur le sens des concepts. Le document Human Signal Graph fait foi sur leur usage, leur contextualisation et leur consolidation. Ce fichier est une application des deux, pas une troisième ontologie. Toute implémentation porte `ontology_version` et `hsg_version`, et tout changement sémantique doit être traçable jusqu'à une modification validée du Dictionnaire ou du HSG. Le code n'est pas une autorité sémantique.

---

## Les chiffres de contrôle

| | |
|---|---|
| Lignes du fichier | 128 (127 options + la scission de l'option 106) |
| Options actives dans le socle | **106** |
| Retirées | 12 — Q3 (7) et Q12 (5), statut `REMOVED_FROM_ONBOARDING_CORE` |
| Déplacées vers le Discovery | 10 — Q15 Food (5), Q16 Voyage (5) |
| Avec evidence PROFILE | 50 (corrigé — voir écarts §9 ; le 55 d'origine était antérieur aux retraits V13/V14) |
| Sans PROFILE mais avec information utile | 55 (corrigé — voir écarts §9) |
| **Evidences PROFILE** | **59** — 11 `GLOBAL_DIRECT`, 48 `LOCAL/CONTEXTUAL`, 0 `GLOBAL_CONSOLIDATED` |
| dont secondaires | 17 (corrigé — voir écarts §9 ; le 20 d'origine était antérieur aux retraits V13/V14) |
| Evidences PROFILE négatives | 2 — ligne 86 `APPETENCE_OBJECT −1`, ligne 98 `PROFILE_STRUCTURE −1` |
| Evidences AFFECTION_RECEIVE | 14 (2 par modalité : Q1 à 100 %, Q4 à 50 %) |
| Evidences AFFECTION_GIVE | 7 (QE seule, vecteur séparé) |
| Evidences BEHAVIOR | 20 — 4 contextes |
| GUARDRAIL actifs | 4, tous `severity = HARD` |
| Constructs sortant `unknown` de l'onboarding | `APPETENCE_SPONTANEITY`, `APPETENCE_PREMIUM`, `PROFILE_INTENSITY`, `PROFILE_SENSITIVITY.sensory`, `PROFILE_SENSITIVITY.emotional` |

Ces chiffres doivent être recalculés depuis le code et comparés. Un écart, même de 1, signifie qu'une ligne n'a pas été transcrite comme elle est arbitrée.

---

## Les 10 familles canoniques

`INTEREST` · `PREFERENCE` · `PROFILE` · `AFFECTION_LANGUAGE` · `NEED` · `DRIVER` · `BEHAVIOR` · `GUARDRAIL` · `ENTITY` · `CONTEXT`

`FACT` est une couche amont, pas une famille : il conserve une proposition ayant une valeur sémantique propre même quand elle ne produit aucun signal, et il ne disparaît jamais quand un signal en est dérivé. `ONTOLOGY_GAP` est un mécanisme de remontée, pas une famille.

Le socle fermé alimente huit familles sur dix. `INTEREST` et `CONTEXT` ne sont pas alimentés, et c'est normal : les intérêts viennent du champ à 13 catégories, des champs libres et du Discovery.

## PROFILE — nomenclature canonique

**A. Neuf dimensions de fonctionnement transversal** — `PROFILE_OPENNESS`, `PROFILE_INTENSITY`, `PROFILE_SENSITIVITY`, `PROFILE_STRUCTURE`, `PROFILE_AUTONOMY`, `PROFILE_RELATIONALITY`, `PROFILE_EXACTINGNESS`, `PROFILE_ADAPTABILITY`, `PROFILE_REFLECTIVENESS`

**B. Huit orientations transversales de préférence et d'arbitrage** — `APPETENCE_EXPERIENCE`, `APPETENCE_OBJECT`, `IMPORTANCE_AESTHETIC`, `IMPORTANCE_FUNCTIONAL`, `IMPORTANCE_AUTHENTICITY`, `APPETENCE_PREMIUM`, `APPETENCE_SPONTANEITY`, `IMPORTANCE_MASTERY`

**C. Un continuum** — `SOCIAL_ENERGY`, où 0 est une position réelle et non `UNKNOWN`

Plus trois sous-facettes : `PROFILE_SENSITIVITY.sensory` / `.aesthetic` / `.emotional`

Les huit orientations du groupe B restent dans la famille PROFILE. Elles ne deviennent pas PREFERENCE parce que leur nom parle d'appétence ou d'importance : la frontière est l'orientation transversale stable d'un côté, le goût concret local de l'autre.

---

## Les règles de mapping appliquées

**Evidence, pas verdict.** `+2` directe forte · `+1` directe ou modérée · `−1` contraire explicite modérée · `−2` contraire explicite forte. **Zéro n'est jamais une evidence** — absence d'evidence vaut `UNKNOWN`. Seule exception : un continuum dont 0 est une valeur sémantique réelle, `SOCIAL_ENERGY`.

**Absence d'evidence ≠ evidence négative.** Non sélectionné ≠ rejeté. `UNKNOWN` ≠ `LOW`. Une evidence négative ne se pose que sur une formulation explicitement négative, un rejet, ou une faible appétence exprimée.

**Primaire et secondaire.** Une réponse peut fournir une evidence primaire sur le phénomène directement interrogé et des evidences secondaires sur d'autres constructs réellement contenus dans le choix. Le critère : **l'angle de la question décide.** Une evidence secondaire reçoit un poids inférieur et ne peut jamais, seule, consolider fortement un construct transversal. Dans le classeur, primaire est l'implicite et ne s'écrit pas ; secondaire est mentionné. Côté code, chaque evidence porte son rôle.

**Contexte — deux statuts seulement au niveau du mapping.** `GLOBAL_DIRECT` si stem + réponse établissent directement le construct comme disposition transversale. `LOCAL/CONTEXTUAL` si leur sens ne permet de conclure que dans un domaine ou une situation susceptible de modifier cette disposition. **Une situation d'observation constitutive du construct ne rend pas à elle seule l'evidence locale.** `GLOBAL_CONSOLIDATED` n'est jamais produit par le mapping d'une réponse : il résulte de la convergence de plusieurs evidences contextualisées indépendantes, et c'est le moteur de consolidation qui le produit. Rien ne se reclasse mécaniquement sur la seule présence d'un stem situationnel. L'unité à classer est **stem + réponse**, jamais l'option seule.

**Même mot ≠ même signal.** On mappe le sens de l'evidence, pas des mots-clés. « Sincère » produit `DRV_AUTHENTICITY` à la ligne 12 parce que la sincérité y est ce qui donne sa valeur à l'attention, et rien aux lignes 1 et 25 où le phénomène discriminant est la modalité affective et le timing.

**Préférence déclarée ≠ comportement en situation.** Un stem qui dit « je préfère » mesure une préférence et produit `PREFERENCE`. Un stem qui décrit une situation — « quand je suis stressé(e) », « face à un désaccord » — mesure un comportement et produit `BEHAVIOR`. La même information ne se mappe jamais dans les deux familles pour fabriquer de la convergence.

**Jamais de déduction inverse.** Aimer les expériences ne signifie pas ne pas aimer les objets ; exiger le beau ne signifie pas négliger l'usage ; aimer l'authentique ne signifie pas rejeter le premium ; être spontané ne signifie pas ne jamais vouloir décider.

**Confusions interdites.** `PROFILE_STRUCTURE` ≠ `IMPORTANCE_MASTERY` (organisation et prévisibilité contre décider et valider). `APPETENCE_PREMIUM` n'est ni le prestige, ni le statut, ni la marque, ni l'exigence générale, ni l'esthétique, ni la qualité au sens large, ni la rareté, ni l'exclusivité. Qualité ≠ premium. Marque ≠ prestige. Faible planification ≠ forte spontanéité. Autonomie ≠ solitude. Orientation relationnelle ≠ énergie sociale. Le prestige et le statut ne sont pas des constructs canoniques.

**Le vocabulaire structurant est fermé.** Pas de `PROFILE_ROMANTIC`, pas de `NEED_TRAVEL`, pas de `DRV_FASHION`. À côté, une banque descriptive ouverte et extensible, structurée en `type · subject · relation · intensity · context · source`. Aucune information pertinente ne disparaît faute de catégorie, et `ONTOLOGY_GAP` n'est pas l'absence de tag fermé.

**Les tags ne sont jamais affichés.** Aucun sur la fiche d'un proche, ni en console, ni en notification. Ils filtrent le catalogue et alimentent le scoring, rien d'autre.

**Deux sorties à ne pas confondre.** Le portrait visible relit l'ensemble des réponses brutes — fermées, ouvertes, nuances, anecdotes, contradictions, réponses sans tag, questions vides. Les tags sont une couche d'aide au raisonnement, jamais un substitut aux réponses. Interdiction de traduire mécaniquement un score en phrase (`PROFILE_RELATIONALITY` élevé → « tu es très relationnelle »). Les tensions doivent apparaître plutôt qu'être lissées.

---

## AFFECTION_LANGUAGE

14 codes, 7 modalités × 2 directions : `WORDS` · `SERVICES` · `PERSONALIZED_GIFT` · `SYMBOLIC_GIFT` · `QUALITY_TIME` · `MICRO_ATTENTIONS` · `SURPRISE`.

`RECEIVE` et `GIVE` ne sont jamais fusionnés et l'un ne se déduit jamais de l'autre. Aucun langage dominant unique n'est imposé. Scoring : Q1 à 100 %, Q4 à 50 % (plus la cadence), Q2 à 0 %, QE en vecteur séparé. Pondération par le rang : `{0: 5, 1: 3, 2: 1}`. `affection_cadence` = `regular_micro | rare_marking | contextual | unknown`, conservée séparément de la modalité et jamais transformée en `PROFILE_STRUCTURE`.

**Un langage affectif n'est pas un NEED.** « Les mots me font me sentir aimé(e) » renseigne la modalité, pas un besoin. Règle de non-tautologie : ne jamais créer un NEED parce que la question le contient elle-même. Vérifié : aucune ligne de Q1, Q2, Q4 ou QE ne porte de NEED.

## BEHAVIOR

Mode comportemental contextuel : manière déclarée, ou suffisamment observée, dont une personne tend à agir, réagir, décider ou communiquer **dans une situation donnée**.

Structure : `context` · `pattern` · `strength` · `confidence` · `stability` · `source` · `timestamp` · `evidence_ids`, plus `trigger` et `target` facultatifs. Famille canonique, manifestations extensibles mais normalisées — aucun dictionnaire exhaustif de comportements, aucun code inventé par anticipation, et réutilisation obligatoire d'un pattern existant quand il correspond au sens de l'evidence.

Les 4 contextes du socle : `stress_response` (Q6), `conflict_response` (Q7), `decision_process` (Q10), `emotional_expression` (Q11). Le Discovery pourra révéler `distress_response`, `grief_response`, `change_response`, `help_seeking`, `celebration_behavior` et d'autres, uniquement quand des données réelles le justifieront.

Q9 ne produit **aucun** BEHAVIOR : son stem dit « pour communiquer, je préfère », donc ses cinq options produisent des `PREFERENCE.communication.*`.

**Frontières.** BEHAVIOR ≠ PROFILE (pattern en situation contre fonctionnement transversal consolidé) · ≠ NEED (ce que je tends à faire contre ce dont j'ai besoin) · ≠ PREFERENCE (une réaction n'est pas nécessairement choisie) · ≠ DRIVER (le comportement n'indique pas ce qui donne de la valeur) · ≠ GUARDRAIL (un comportement n'est pas une interdiction).

Pourquoi c'est opérationnel : deux personnes portant `NEED_SUPPORT` n'appellent pas la même attention si l'une se retire quand elle va mal et l'autre cherche le lien.

## GUARDRAIL

`severity` et `scope` appartiennent à l'**evidence**, jamais au code du guardrail. `SOFT` pour une préférence négative ou un inconfort ; `HARD` pour un refus, une aversion forte ou une impossibilité — un `HARD` signifie « ne pas proposer ce qui viole cette contrainte » et aucun score positif ne le compense, un `SOFT` pénalise le matching sans exclure. `scope` = `selection | execution | context`.

Les 4 du socle sortent en `HARD`, parce que le stem de Q18 demande ce que la personne détesterait et qu'une option cochée sous ce stem est une evidence de refus. `GRD_PUBLIC_EXPOSURE` (117), `GRD_SCHEDULE_DISRUPTION` (118), `GRD_TOO_INTIMATE` + `GRD_SENTIMENTAL_OVERLOAD` (119) en `scope = selection` ; `GRD_POOR_EXECUTION` (120) en `scope = execution` — cela n'élimine pas les surprises, cela élimine les options dont la bonne exécution n'est pas assez certaine. La ligne 119 est la seule dont la formulation nuance : « **trop** intime ou **trop** intense » porte sur un seuil, pas sur une catégorie.

L'option 121 « je suis plutôt partant(e) pour tout » ne produit aucun guardrail, et **l'absence de guardrail n'est pas une information** : absence de guardrail = absence d'evidence, donc rien à stocker.

## PREFERENCE — schéma canonique du socle

| Chemin | Valeurs | Lignes |
|---|---|---|
| `PREFERENCE.communication.channel` | `call` · `written` · `voice` · `in_person` · `flexible` | 112–116, et 61 en confirmation pondérée (contexte `self_expression`) |
| `PREFERENCE.communication.style` | `direct` · `expressive` · `analytical` · `light_humorous` | 57, 58, 59, 60 |
| `PREFERENCE.organised_for_me.surprise_level` | `none` · `partial` · `full` | 107, 108, 109 |
| `PREFERENCE.relational.punctuality` | `high` | 99 |
| `PREFERENCE.gift.value_basis` | `intention_over_price` | 105 |
| `PREFERENCE.brands.sensitivity` | `positive` — ouvre une branche vers des `ENTITY_BRAND` | 106 |
| `PREFERENCE.experience.tier` | `exceptional`, confiance basse | 106b |

La ligne 61 verse sur le même attribut que Q4d mais depuis un contexte différent : elle **confirme sans doubler le poids**. Aucune paire de PREFERENCE ne représente le même phénomène sous deux chemins. La 99 (attente envers les autres) et le FACT de la 100 (son propre retard) sont deux faces d'un sujet, pas un doublon — et leur écart est une information. La 105 et la 106b sont en tension, à préserver plutôt qu'à lisser.

## FACT du socle

Ligne 100 — `fact_type = habit`, « souvent un peu en retard, sans malice ». Implication : ne pas bâtir une attention dont la réussite dépend de sa ponctualité.

Ligne 101 — `fact_type = functional_impact`, `subject = mental_load`, `relation = causes`, `effect = rapid_exhaustion`. Implication : réduire le nombre de décisions, coordinations et tâches nécessaires. **Ne produit pas `NEED_RELIEF`.**

## Lignes sans aucune production

Ligne 79 « Les deux me touchent » : non-choix, aucun signal, aucune information conservée.

## Modèle de stockage

Par construct : `score` (`high | medium | low | unknown`, jamais 0 par défaut) · `confidence` (`high | medium | low | none`) · `evidence_count` · `evidence_sources` · rôle de l'evidence · `contexts` · `globalStatus`.

Pour AFFECTION_LANGUAGE : `direction` · `modality` · `strength` · `confidence` · `evidence_count` · `evidence_ids` · `contexts` · `affection_cadence` · `regularity_importance`, avec deux vecteurs entièrement séparés.

Les evidences sont un journal en ajout seul ; l'état consolidé en est dérivé, donc recalculable intégralement quand le modèle évolue.

---

## Les 13 constructs sans aucune evidence GLOBAL_DIRECT

`APPETENCE_OBJECT` (11 evidences, toutes dans le cadeau) · `APPETENCE_EXPERIENCE` (5) · `IMPORTANCE_FUNCTIONAL` (4) · `PROFILE_RELATIONALITY` (6) · `PROFILE_REFLECTIVENESS` (4) · `PROFILE_AUTONOMY` (3) · `IMPORTANCE_MASTERY` (2) · `PROFILE_ADAPTABILITY` (2) · `PROFILE_OPENNESS` (1) · et `APPETENCE_SPONTANEITY`, `APPETENCE_PREMIUM`, `PROFILE_INTENSITY`, `PROFILE_SENSITIVITY.sensory` et `.emotional` à zéro evidence.

Pour eux, le global ne sera jamais observé directement : il sera consolidé depuis des contextes convergents, ou restera `UNKNOWN`. Ce n'est pas un défaut — un socle centré sur l'attention et le cadeau produit des evidences situées là. C'est la carte de ce que le Discovery doit aller chercher ailleurs.

Les 11 `GLOBAL_DIRECT` viennent de trois endroits seulement : les 5 `SOCIAL_ENERGY` de Q5, les 2 `PROFILE_STRUCTURE` de Q4a (97 et 98), et les 4 de Q4b (102 `PROFILE_EXACTINGNESS`, 103 `IMPORTANCE_AUTHENTICITY`, 104 `IMPORTANCE_AESTHETIC` et `PROFILE_SENSITIVITY.aesthetic`).

Les dix contextes locaux employés : `gift` · `gift.material` · `attention_received` · `affection_given` · `surprise` · `organised_for_me` · `relationship` · `stress` · `decision` · `communication`.

## Les cas limites tranchés, à ne pas réouvrir

**Les paires 97 / 107** portent le même construct et la même valeur, `PROFILE_STRUCTURE +2`, avec deux statuts différents : « j'anticipe et je planifie à l'avance » sous un stem « mon rapport au temps » est `GLOBAL_DIRECT` ; « j'aime tout savoir à l'avance » sous « quand on organise quelque chose pour moi » est locale à `organised_for_me`. La force d'une evidence et son extension sont indépendantes.

**Les paires 14 / 104** de même : `IMPORTANCE_AESTHETIC +2` locale dans un cas, globale dans l'autre.

**`APPETENCE_SPONTANEITY` n'a aucune evidence** et c'est voulu. Les six options qui l'alimentaient (7, 13, 27, 108, 109, 121) décrivent le plaisir d'être surpris par quelqu'un, alors que le construct est défini comme le plaisir d'improviser et de décider dans l'instant. La définition n'a pas été élargie pour sauver les mappings.

**Les lignes 111 et 121** sont locales malgré une formulation d'option générale, parce que le stem fait partie de l'evidence.

## Deux gaps d'ontologie ouverts

**La charge mentale** (ligne 101) est traitée comme un FACT `functional_impact`, mais aucune famille ne porte le coût énergétique de l'organisation comme contrainte de recommandation.

**Les 32 extrapolations du code** restent à corriger dans `temperament/questions.ts` et `lifestyle/questions.ts` — une préférence transformée en trait psychologique, à chaque fois. Lot de code à part, documenté dans l'onglet « Corrections du code » du classeur.

## Ce que l'onboarding produit

Un excellent profil V0, **plus une carte de ce que Candice doit encore apprendre**. Une signature de fonctionnement · une signature relationnelle · un mode d'emploi pour faire plaisir · des portes ouvertes pour le Discovery · une banque descriptive ouverte. Et on s'arrête là.

Un construct canonique non alimenté par l'onboarding n'est pas un problème.

---

**Fermé.** On ne rouvre l'onboarding que si l'audit du Discovery révèle un véritable défaut architectural.
