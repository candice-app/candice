# Carnet de constats

> Journal des constats **hors périmètre** rencontrés en cours de chantier.
> Règle : tout ce qui sort du périmètre du chantier en cours est consigné **ici**, jamais corrigé dans le code au passage.
> Chaque entrée : **daté**, avec sa **preuve** (fichier:ligne, table, ou commande), et le **chantier** en cours au moment du constat.

## Format d'une entrée

```
### [AAAA-MM-JJ] Titre court du constat
- **Constat** : description factuelle, sans recommandation.
- **Preuve** : `chemin/fichier.ts:ligne` · ou `(base: nom_table)` · ou commande exacte.
- **Périmètre** : hors chantier <n> (<nom du chantier en cours>).
- **Statut** : ouvert.
```

---

## Constats

### [2026-09-29] `questionnaire_responses` : upsert impossible — contrainte unique manquante (modèle de données)
- **Constat** : les upserts de `IncognitoFlow.tsx` (l. 381, 396, 416) ciblent `onConflict: "contact_id,user_id"`, mais la table n'a **aucune contrainte/index unique sur `(contact_id, user_id)`** (seule la PK sur `id`). Toute écriture échoue donc au niveau Postgres avec l'erreur **`42P10` — "there is no unique or exclusion constraint matching the ON CONFLICT specification"** (prouvé en transaction annulée le 29/09). Comme `.error` n'était pas lu, l'échec était invisible → la table reste à 0 ligne. Le chantier 0 rend l'échec **visible** (lecture de `.error`), mais la persistance nécessiterait d'**ajouter une contrainte unique `(contact_id, user_id)`** — ce qui est une **modification du modèle de données, explicitement hors périmètre du chantier 0**.
- **Preuve** : `src/app/contacts/[id]/questionnaire/IncognitoFlow.tsx:381,396,416` ; `(base: questionnaire_responses)` — PK sur `id` seule, `data_source` NOT NULL a un défaut `'pilot_input'` (donc pas la cause) ; test `INSERT … ON CONFLICT (contact_id,user_id)` → `42P10`.
- **Périmètre** : hors chantier 0 (modèle de données). Correctif de persistance à cadrer dans un chantier ultérieur.
- **Statut** : ouvert.

### [2026-09-28] `orchestrator.ts` : la fonction `log()` avale le `.error` de supabase-js
- **Constat** : le helper `log()` du cerveau écrit dans `processing_log` via `supabase.from('processing_log').insert(...)` sans jamais lire le `.error` retourné, et enveloppe l'appel dans un `catch { /* log failure must never break the orchestrator */ }` qui n'attrape rien (supabase-js ne lève pas d'exception sur erreur DB). Même motif que le `logStep` corrigé dans le Lot A, mais dans un autre module. Une écriture de log rejetée y resterait silencieuse.
- **Preuve** : `src/lib/brain/orchestrator.ts:16` (déf. `async function log(`) et `:28` (l'`insert`), `catch` sans lecture d'erreur.
- **Périmètre** : hors chantier 0 / Lot A (Lot A ne corrige que `logStep` du moteur d'analyse).
- **Statut** : ouvert.

### [2026-10-02] `discovery/engine.ts` : 12 dimensions parallèles, sans rapport avec le vocabulaire canonique
- **Constat** : le moteur Discovery définit ses propres 12 dimensions — `attention`, `gifts`, `style`, `brands`, `food`, `fragrance`, `travel`, `hobbies`, `dreams`, `surprises`, `conflicts`, `practical` — qui ne correspondent ni aux 15 axes bipolaires des anciens `questions.ts`, ni aux 10 familles / constructs du modèle canonique (lot A). Non réconcilié dans le lot A (purement additif) ; à brancher/migrer dans un lot ultérieur.
- **Preuve** : `src/lib/discovery/engine.ts` (banque `discovery_questions`, colonne `dimension`).
- **Périmètre** : hors lot A (le lot A crée le module canonique sans toucher l'existant).
- **Statut** : ouvert.

### [2026-10-02] DEPRECATED_AXES sans table d'équivalence vers les constructs canoniques
- **Constat** : `vocabulary.ts` conserve 15 axes bipolaires legacy (`DEPRECATED_AXES`) mais sans correspondance 1-1 vers les familles/constructs canoniques. Ce n'est pas un oubli : les types de migration ne figuraient dans aucun des documents d'entrée reçus au lot A. La table reste donc en l'état.
- **Périmètre** : hors lot A. La correspondance arrivera avec le lot de migration (celui qui branchera l'existant sur le module).
- **Statut** : ouvert, attendu.

### [2026-10-05] proche_user_id — même humain, deux identités, à NE PAS fusionner
- **Constat** : `contacts.proche_user_id` (`src/types/index.ts`) est renseigné quand un proche est lui-même utilisateur Candice. Le même humain existe donc sous deux identités : `contacts.id` (vu par le pilote, connaissance `reported_by_relative`) et `auth.users.id` (en propre, connaissance `declared`).
- **Règle (lot A bis)** : AUCUNE fusion automatique, aucun chemin de code qui rapprocherait les deux. Confondre les deux `assertionStatus` détruirait la distinction explicite/inféré qui fonde le modèle. Le lien existe, il est informatif, il n'est pas une identité.
- **Conséquence analytics (lot futur)** : une analyse de population devra décider si ces deux identités comptent pour une personne ou deux. Arbitrage du lot Analytics, hors lot A bis.
- **Statut** : ouvert, volontairement non résolu.

### [2026-10-05] pilot_id vs user_id — dette de nommage aux frontières
- **Constat** : le rôle « pilote/utilisateur » (FK `auth.users(id)`) est nommé `user_id` dans 106 colonnes (dominant) et `pilot_id` dans 10 tables récentes (`memories`, `wishlist`, `signals`, `processing-log`, `gender-situations`, `carnet-v2`, `fuse-gift-wishlist`, `reco-refusals`, `contact-reco-items`, `cross-validations`).
- **Décision (lot A bis)** : le module de connaissance écrit `ownerId: UserId`, aligné sur `user_id` (dominant). NON corrigé dans ce lot (périmètre fermé à `src/lib/knowledge/`).
- **Dette** : au lot B, `ownerId` devra être mappé sur `pilot_id` aux frontières de ces 10 tables. À traiter quand le module sera branché.
- **Statut** : ouvert, dette connue.

### [2026-10-05] Plafond de sensibilité : qui peut le lever (point d'arrêt 2 tranché, nuance future)
- **Tranché (lot A bis)** : le plafond tient — `userOverride` ne peut jamais élever un contenu `internal_only` (FACT sensible du proche). Raison : la connaissance porte sur un tiers qui n'a pas consenti à l'exposition. L'utilisateur contrôle SES données, pas les données sensibles de son proche. Le plafond bloque l'EXPOSITION, jamais l'USAGE (Candice écarte toujours une reco sur la base du FACT sensible, §35).
- **Nuance à implémenter plus tard** : si le proche est lui-même utilisateur Candice (`proche_user_id`), c'est LUI qui pourrait légitimement lever le plafond sur SES propres données — pas son proche. Cohérent avec declared / reported_by_relative. Lot ultérieur.
- **Statut** : plafond implémenté (SENSITIVITY_CEILING) ; levée par le proche-utilisateur = non implémentée, à faire.

### [2026-10-05] INTEREST relationship consolidé = le plus récent (provisoire, à revoir avec du volume)
- **Constat** : `casual | curious | enthusiast | passion | expert` est une échelle d'INTENSITÉ. Le consolidé prend actuellement le relationship de l'evidence la plus récente. Conséquence : une mention `casual` isolée postérieure ferait redescendre un `expert` établi.
- **Décision (lot A bis)** : gardé « le plus récent » pour l'instant — on n'a pas les données réelles pour trancher entre « le plus récent supplante » et « l'intensité la plus haute observée domine ».
- **Statut** : ouvert, à revoir quand il y aura du volume réel. (ENTITY relation, elle, est arbitrée au point d'arrêt 3 ; PREFERENCE value et SOCIAL_ENERGY position au plus récent sont validés.)

### [2026-10-05] Lot B — inventaire d'entrée du lot de SUPPRESSION des anciens modules
- **Décision (arbitrage lot B, Q3 option i)** : le questionnaire est branché sur le module, mais les 3 anciens modules (`attention`, `temperament`, `lifestyle`) NE sont PAS supprimés ce lot-ci — la reco, la génération de profil et les 3 routes breath en dépendent, et leur rebranchement est une refonte (Signal discriminé, guardrails severity/scope, DRIVER) qui exige le catalogue d'attentions inexistant. La section 9 du prompt lot B est **annulée** par cet arbitrage.
- **Gel** : en-tête de dépréciation ajouté à `attention/{questions,scoring}.ts`, `temperament/{questions,scoring}.ts`, `lifestyle/{questions,scoring}.ts` (aucun nouvel import).
- **Les 15 fichiers dépendants (inventaire du futur lot de suppression)** :
  - Parcours : `src/app/moi/questionnaire/QuestionnaireFlow.tsx`, `src/components/questionnaire/{AttentionStep,AvoidStep,LifestyleStep,TemperamentStep}.tsx`
  - Consommateurs hors parcours : `src/app/api/recommendations/generate/route.ts`, `src/lib/recommendations/{engine,types}.ts`, `src/lib/profile/{generateProfileAnalysis,synthesis}.ts`, `src/lib/profile/synthesis.test.ts`, `src/app/api/{attention,temperament,lifestyle}/breath/route.ts`
  - Interne legacy : `src/lib/lifestyle/questions.ts` importe `temperament/questions`.

### [2026-10-05] Lot B — les 32 extrapolations NON closes par ce lot (reportées)
- Le prompt lot B §9 affirmait que supprimer les anciens modules clôt les 32 extrapolations (préférence→trait, R10/R12). **Faux sous l'arbitrage Q3** : les modules restent en place, donc les 32 extrapolations restent VIVANTES dans la reco et `generateProfileAnalysis`. État transitoire assumé et documenté : le questionnaire tourne sur le modèle canonique, la reco sur les anciens axes, jusqu'au lot de rebranchement+suppression. La ligne de STOP « closes par suppression » devient « reportées au lot de suppression — carnet ».

### [2026-10-05] Lot B — table `signals` existante (à ne pas confondre avec knowledge_signals)
- Il existe déjà une table `public.signals` (2 lignes), parmi les 10 tables en `pilot_id` (migration 27). Le nommage `knowledge_signals` du lot B évite la collision. À clarifier au lot d'harmonisation : ce que porte `signals` (signaux contextuels legacy ?) et si elle doit disparaître ou fusionner.

### [2026-10-05] Lot B — « Les deux questions à ajouter » en décrit SIX
- Le titre de section de `onboarding-v15-structure.md` dit « deux » ; la section décrit six ajouts : `soutien`, `moteurs` (fermées de connaissance, non mappées), `anniversaire_ideal` (texte libre), `adresses_preferees` + `adresse_livraison_travail` (Google Places), `accepte_livraison_travail` (filtre). Imprécision de titre, pas d'exclusion : les six sont dans le lot.

### [2026-10-05] Lot B — questionnaire_responses dépréciée ; ce que lisent reco/profil
- `questionnaire_responses` (0 ligne) marquée DÉPRÉCIÉE (COMMENT ON TABLE, migration 82). La vérité brute vit dans `knowledge_sources`. Pas de miroir, pas de double écriture.
- Constat Q1 : `api/recommendations/generate` lit `contacts → questionnaire_responses(*)` (imbriqué, donc **vide** aujourd'hui) + `my_profile` ; `generateProfileAnalysis` lit `my_profile` + `memories` (PAS questionnaire_responses) ; les 3 routes `breath` ne lisent AUCUNE table (elles reçoivent les scores calculés côté client). Donc le branchement n'introduit aucune régression côté lecture : rien ne lisait de réponses réelles (table vide).

### [2026-10-05] Lot B — profile_analysis : 2 lignes de données de dev, conservées
- `profile_analysis` = 2 lignes (données de dev/test : 3 contacts, 3 my_profile, 0 réponse). Conservées telles quelles, jamais converties (R15 interdit la conversion de score, pas la conservation ; leur `engine_version` les marque). Aucun chemin du nouveau modèle ne doit les lire.

### [2026-10-05] Lot B — écrans de transition : lignes SANS MATIÈRE arbitrées
- Correction de comptage : j'avais annoncé 4 lignes SANS MATIÈRE, ma liste en contenait 3 ; depuis, 2 restaient (foodie, interdits) — toutes deux tranchées ci-dessous. Zéro ligne SANS MATIÈRE non résolue.
- **« La table est un terrain d'attention » (foodie) — PHRASE RETIRÉE.** Q15 est partie au Discovery Food (décision explicite) ; à cette frontière, Candice ne sait légitimement rien de la nourriture. La phrase est supprimée de l'écran lifestyle. **En attente de rebranchement par la branche Discovery Food** (c'est là qu'elle reviendra, mieux qu'avant).
- **« Être vraiment écouté » — RÉSOLU** par le mapping `soutien` (A ter) : 5 NEED distincts en contexte `distress` (écoute/rassurer/aider/présence/espace). L'écran 5 a la forme riche, lue dans les NEED, contexte distress jamais effacé.
- **« Ce que tu n'aimerais pas / interdits » — ACCEPTÉE** : cœur DÉPLACÉ vers GUARDRAIL (Q18, DISPONIBLE) ; seule la nuance des champs libres tombe, reviendra avec l'extracteur. Brut conservé en source `onboarding_open`.
- **Séquencement des 6 frontières** : conservé à l'identique depuis STEP_ORDER (la forme ne change pas). Vérifié : aucune frontière ne se vide après retrait de Q3/Q12/Q15/Q16 (voir STOP).

### [2026-10-06] §7 consolidation-rules — vérifié sans effet (non bloquant A/B)
> §7 consolidation-rules — pondération numérique primaire/secondaire et décroissance temporelle : vérifié le 6 octobre, AUCUN effet dans le code actuel. evidence_role agit comme une porte (onlySecondary → confidence low ; indepPrimary ≥ 2 → score high), pas comme un coefficient. Aucune décroissance par l'âge. Non bloquant pour les lots A et B. Décision requise avant l'implémentation du moteur de recommandation.
- Volontairement consigné ICI et PAS dans consolidation-rules.md : ce fichier-ci porte l'état de l'implémentation ; consolidation-rules.md fait autorité sur les règles. Ne pas mélanger les deux.

### [2026-10-06] GUARDRAIL — grain (code, context), domaine jamais élargi (lot A ter)
- Correction d'arbitrage : la consolidation d'un guardrail n'élargit JAMAIS son domaine. `consolidateGuardrails` groupe désormais par `(code, context)` (plus par code seul) ; `GuardrailSignal` porte un `context` SCALAIRE (pas `contexts[0]`, pas de fallback GLOBAL) ; `signalKey` = `code@context`. severity = la plus contraignante DANS le groupe ; scope = le plus restrictif PARMI les scopes observés (jamais d'escalade).
- Les 5 guardrails de Q18 portent `context: 'surprise'` (le stem « le type de surprise que je détesterais » fait foi — l'unité à classer est stem + réponse, jamais l'option seule). GRD_SCHEDULE_DISRUPTION et GRD_PUBLIC_EXPOSURE restent en `surprise`, pas élargis.
- **Conséquence opérationnelle (pour le LOT DE LA RECO, à ne PAS implémenter ni préfigurer)** : une attention qui n'est pas une surprise mais qui exposerait la personne en public n'est PAS filtrée par ces guardrails locaux. Ce n'est pas un défaut du modèle, c'est la limite de ce que l'onboarding sait. Question réservée au lot reco : **« un HARD déclaré dans un contexte doit-il pénaliser (sans éliminer) dans les contextes voisins ? »** L'élargissement légitime viendra du Discovery, d'une réponse ouverte ou d'une correction, avec sa propre evidence.
- Note : `mapping-soutien-moteurs.md` ne reflète pas cette correction (il ne traite que soutien/moteurs/ordre de sélection) — rien à y reporter.

### [2026-10-06] Timestamp des evidences — dérivé de la source (pas de migration 83)
- Décision : `knowledge_evidences` n'a PAS de colonne `ts`. Le temps d'ACQUISITION (quand la personne l'a dit) EST celui de la source, par définition — lu via `source_id → knowledge_sources.ts`. La consolidation (« le plus récent ») lit ce temps d'acquisition.
- Le temps de PRODUCTION (quand l'evidence a été fabriquée, ex. réextraction des mois après) est porté par `ExtractionRecord.timestamp` + `extractor`, PAS par l'evidence. Confondre les deux dans une colonne unique rendrait impossible la distinction « la personne a changé » / « le modèle a changé » (objet même du SignalSnapshot).
- Nuance C2 : C2 interdit de stocker DEUX FOIS LE MÊME FAIT ; ici ce sont deux faits qui coïncident aujourd'hui — la dérivation est juste parce que acquisition = source, pas au titre de C2.
- **Conditions qui rendraient `ts` nécessaire (à surveiller)** : (1) une evidence avec un temps d'acquisition légitimement ≠ sa source ; (2) un coût de jointure `knowledge_sources` trop élevé pour l'agrégation par période. Dans les deux cas : ajout ADDITIF + backfill depuis la FK, rattrapable sans douleur.

### [2026-10-06] RLS owner-only — POINT D'ARRÊT DUR du bloc « client authentifié »
- Rappel CLAUDE.md : un INSERT rejeté par RLS n'émet AUCUNE erreur (supabase-js renvoie `.error` sans lever). Si les policies ne couvrent pas un cas, chaque écriture du questionnaire disparaît en silence — zéro ligne, aucun message : la panne 42P10 sous une autre forme.
- Donc le bloc qui câble le client AUTHENTIFIÉ ne sera pas considéré comme « enregistrant » tant que le STOP ne porte pas les 4 preuves : (1) écriture complète avec un client authentifié (PAS le pooler superuser) ; (2) relecture de la ligne avec le même client, retrouvée ; (3) lecture avec un autre user_id → zéro ligne ; (4) count AVANT/APRÈS prouvant l'écriture réelle.

### [2026-10-06] Strength du socle hors PROFILE — défaut provisoire (rattrapable par remap)
- Règle (arbitrage) : `role` se dérive du STEM (la famille dont le stem traite directement = primary ; toute autre famille lue depuis la même réponse = secondary). `context` se dérive de l'unité stem+réponse (contexte des evidences PROFILE co-localisées si présentes, sinon contexte imposé par le stem — JAMAIS GLOBAL par défaut). `strength` ne se dérive PAS (§7 : strength ⊥ primary/secondary, les 4 combinaisons existent).
- Défaut PROVISOIRE : primary → `strong`, secondary → `moderate` (prudence : sous-estimer coûte une idée manquée, surestimer fabrique une certitude). « strength du socle hors PROFILE — défaut provisoire primary/strong, secondary/moderate. Arbitrage par option à faire, de même nature que celui des 59 evidences PROFILE. Rattrapable par remap (journal + mapping dans le code + verbatim/source_id conservés ; rejouer le mapping régénère les evidences — pas de migration). »
- On N'enrichit PAS onboarding.ts option par option (même coût que l'arbitrage PROFILE, bloquerait tout). La règle dérivée donne le rôle ; le remap couvre le reste.

### [2026-10-06] Rectification — distress N'est PAS dans CONTEXT_CODES
- Correction de l'arbitrage guardrail : `distress` avait été ajouté à `CONTEXT_CODES` (famille CONTEXT) par erreur. `CONTEXT_CODES` revient à 10 (vocabulaire de la famille CONTEXT). Les contextes LOCAUX d'evidence (le champ `evidence.context`) vivent dans un registre DISTINCT, normalisé : `EVIDENCE_CONTEXTS` = 13 (10 du socle + distress + conflict + emotional_expression). GLOBAL n'y figure pas (opposé d'un contexte local). `isValidEvidenceContext(ctx)` = GLOBAL ou membre du registre — garde-fou contre une faute de frappe qui créerait un contexte distinct et globaliserait à tort.

### [2026-10-06] Strength affective + intérêts — arbitré (provisoire, remap)
- Affection : table discrète + switch exhaustif `affectionStrengthFor` (AUCUN produit par questionWeight, qui reste documentaire). Q1 : rang 1,2→strong, 3→moderate · Q4 (50 %)→moderate · QE→strong · Q2 (0 %)→aucune evidence affective. Égalité Q4 ≡ Q1-rang3 assumée (3 grades) ; distinguables par rank/role/source. Aucun défaut silencieux (question inconnue → jette, comme le `?? 'GLOBAL'` refusé).
- Intérêts : strength `moderate` (sélection volontaire mais sans niveau déclaré). `relationship` reste absent = non précisé, jamais « faible ». RÈGLE : aucun chemin de strength vers un rendu d'intensité des intérêts — l'intensité affichée vient de relationship ; relationship absent → la phrase dit que l'intérêt existe sans le qualifier. À tester sur la projection quand elle existera ; note dans le code d'ici là.
- Les deux valeurs sont provisoires (remap), n'entrent dans aucun identifiant déterministe (la clé-cible ne porte jamais la strength).

### [2026-10-06] Intérêt coché → context GLOBAL déclaré (arbitré) + point reporté extraction
- Arbitrage : `produceInterest` pose `context: 'GLOBAL'` DÉCLARÉ (jamais fallback : `ctxFor` jette désormais sur question inconnue, plus de `?? 'GLOBAL'`). strength `moderate`, `relationship` absent. GLOBAL ne confère ni confiance ni intensité (il dit l'absence de situation). `context` reste OBLIGATOIRE sur InterestEvidence (l'extraction produira des intérêts situés : « elle cuisine surtout en vacances »). EVIDENCE_CONTEXTS reste à 13.
- **Reporté à l'extraction (NON implémenté, consigné)** : « le niveau d'intérêt consolidé est le plus élevé déclaré » a été décidé sans le contexte en vue. Un `cuisine@vacances` en passion ne doit PAS élever `cuisine@GLOBAL` — même logique que les guardrails (situé ≠ transversal), asymétrie assumée : un GLOBAL vaut partout, un situé ne vaut que chez lui. Aujourd'hui l'onboarding ne produit que du GLOBAL (un seul groupe) → rien ne presse. À trancher à l'implémentation de l'extraction.
