# Écarts constatés entre les documents d'entrée et l'implémentation

> Les deux documents d'entrée (`dictionnaire-canonique.md`, `hsg-architecture.md`) **ne sont pas modifiés** : ils restent la source de vérité conceptuelle. Ce fichier porte la lecture retenue là où ils divergent ou hésitent, pour qu'on ne réintroduise pas une erreur déjà arbitrée.
> Les sept décisions ci-dessous sont celles du lot A, appliquées telles quelles par `src/lib/knowledge/`.

## 1 · L'exemple 12.3 du HSG est caduc
- **Document** : HSG §12.3 écrit que « je préfère garder les choses légères, avec humour » produit `BEHAVIOR(emotional_expression, keep_it_light_with_humor)`.
- **Code** : cette réponse est l'option 60 de Q9 (stem « pour communiquer, je préfère ») → arbitrée en `PREFERENCE.communication.style = light_humorous`, **sans BEHAVIOR**. Le pattern `keep_it_light_with_humor` n'est produit par aucune option du socle.
- **Pourquoi** : une préférence déclarée sur une manière d'agir n'est pas un comportement constaté en situation. Le mapping V15 fait foi.

## 2 · Registre des patterns BEHAVIOR aligné sur le HSG quand il le nomme
- **Document** : collisions de noms entre V15 et HSG.
- **Code** : les noms HSG gagnent — `withdraw`, `regain_control`, `use_humor_to_defuse`, `extensive_research`. Renommages V15 : `withdraw_seek_calm` → `withdraw`, `research_thoroughly` → `extensive_research`. Les 16 autres patterns V15 sans équivalent HSG sont conservés. La création d'un pattern cherche d'abord dans le registre existant avant d'en ajouter (R : réutiliser plutôt que créer un synonyme).

## 3 · `value` et `strength` ne sont jamais tous deux remplis
- **Document** : les deux définissent `value` (±1/±2, force+direction) et `strength` (degré de soutien), qui se recouvrent.
- **Code** : `value` réservé aux constructs **directionnels** (PROFILE + continuum). `strength` réservé aux familles **sans direction** (AFFECTION_LANGUAGE, BEHAVIOR, INTEREST, GUARDRAIL, PREFERENCE, ENTITY, CONTEXT). Types discriminés par famille → erreur impossible. `confidence` reste orthogonal.

## 4 · `evidence_role` vaut `primary | secondary`
- **Document** : le champ apparaît dans la structure d'evidence du HSG sans définition ; §17 en donne le sens.
- **Code** : une evidence `secondary` porte un poids inférieur et **ne peut jamais, seule, porter un construct à `high`/`confidence: high`**. Testé.

## 5 · `assertionStatus` se dérive de `sourceType`, jamais saisi
- **Document** : HSG §10.2 introduit `assertion_status = user_declared` ; §33 exige de distinguer déclaré/observé/rapporté/inféré.
- **Code** : un seul champ `assertionStatus ∈ declared | observed | reported | inferred`, **calculé** depuis `sourceType`. Distinct de `user_confirmed` (= l'utilisateur a validé l'info). Une info `observed` ne devient jamais `declared`.

## 6 · `context` (evidence) et `globalStatus` (signal) sont deux champs distincts
- **Document** : les deux notions se chevauchent dans les docs.
- **Code** : `evidence.context` = littéral `GLOBAL` ou chemin de domaine. `signal.globalStatus ∈ GLOBAL_DIRECT | GLOBAL_CONSOLIDATED | LOCAL_ONLY`, appartient au signal consolidé. Une evidence ne porte jamais `GLOBAL_CONSOLIDATED`.

## 7 · Le mot `scope` est dédoublé
- **Document** : `scope` désigne à la fois la portée d'un guardrail et celle d'une branche Discovery.
- **Code** : `guardrailScope ∈ selection | execution | context` ; `branchScope ∈ universal | conditional`. Jamais `scope` seul.

## Deux alignements de nommage (appliqués partout)
- **INTEREST** porte **`subject`** (pas `topic`) et **`relationship`** (`casual | curious | enthusiast | passion | expert`).
- **`relation`** est réservé à **ENTITY** (`LOVE | LIKE | CURIOUS | WANT_TO_TRY | WANT_TO_OWN | WANT_TO_VISIT | NEUTRAL | DISLIKE | AVOID`).
- Un seul usage par mot.

## 8 · GUARDRAIL : 18 codes, pas 19 (chiffre de contrôle du lot corrigé)
- **Document** : le dictionnaire canonique §8.3 — seule source énumérant les guardrails (le HSG n'en liste aucun) — définit **18** codes, répartis sur les 7 catégories : social 3, organisation 3, émotion 3, sensoriel 3, qualité 2, relationnel 3, style 1.
- **Lot** : le chiffre de contrôle annonçait 19.
- **Code** : 18 codes transcrits, aucun inventé (R25). **Arbitrage Estelle (2026-10-02) : le dictionnaire fait foi, le chiffre de contrôle 19 était une erreur → la valeur retenue est 18.** Les tests asserten 18.

## 9 · Onboarding : 50 options PROFILE / 55 sans-PROFILE-mais-utile / 17 secondaires (résumé clos corrigé)
- **Document** : le résumé `onboarding-v15-clos.md` annonçait 55 options avec evidence PROFILE, 51 sans, 20 secondaires. Le fichier de mappings détaillé (`onboarding-v15-mappings.md`, qui génère `onboarding.ts` et fait foi sur le détail) documente des retraits postérieurs : V13 (option 105 perd `IMPORTANCE_AUTHENTICITY`), V14 (`APPETENCE_SPONTANEITY` retiré des options 7, 13, 27, 108, 109). `50 + 5 = 55` et `17 + 3 = 20` reconstituent exactement les chiffres périmés du résumé.
- **Lot** : chiffres de contrôle = 55 / 20, calculés AVANT application des retraits V13/V14 (même cause que l'écart §8 guardrail : un chiffre de contrôle pré-arbitrage).
- **Code** : le module transcrit la réalité V15 — **50 options avec PROFILE, 17 secondaires**. Les 59 evidences PROFILE, 11 GLOBAL_DIRECT, 48 LOCAL, 2 négatives restent inchangés.
- **Arbitrage Estelle (2026-10-02)** : les mappings détaillés font foi. Résumé `clos` corrigé à **50 avec PROFILE · 55 sans PROFILE mais avec information utile · 17 secondaires**. Réconciliation du total : 50 + 55 + 1 (ligne 79, aucune production, volontaire) = 106 options actives. Les tests du module asserten 50/17.

## 10 · GUARDRAIL : 4 options Q18 → 5 evidences (chiffre de contrôle ambigu, pas une erreur de code)
- **Document** : le clos §Guardrails énumère **5 codes** sur **4 options** Q18 : `GRD_PUBLIC_EXPOSURE` (117), `GRD_SCHEDULE_DISRUPTION` (118), `GRD_TOO_INTIMATE` **+** `GRD_SENTIMENTAL_OVERLOAD` (119, deux codes sur une seule ligne), `GRD_POOR_EXECUTION` (120). Tous en `HARD`.
- **Lot** : le chiffre attendu annonçait « 4, tous HARD ».
- **Explication** : les deux chiffres sont justes mais comptent deux choses différentes — **4 options** de Q18 portent un guardrail, et elles produisent **5 evidences** parce que la ligne 119 porte deux codes. Le « 4 » du prompt comptait les options, le module compte les evidences.
- **Code** : **rien à corriger, l'implémentation est juste** (5 evidences guardrail, toutes HARD). C'est la valeur attendue dans le prompt qui était ambiguë. **Arbitrage Estelle (2026-10-05).**
