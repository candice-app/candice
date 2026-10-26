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

## Lot « EXTRACTION STRUCTURÉE DES REJETS / PRÉFÉRENCES / CONTEXTES » — limitation de fond, à étendre

**EN TÊTE — SÉCURITÉ, PAS CONFORT : LES ALLERGIES.** Le champ pratique « Allergies alimentaires » est saisi en TEXTE LIBRE (`practical.allergies`, sensible) et n'est PAS extrait aujourd'hui (champ plat, hors extraction A3). **Conséquence écrite noir sur blanc : une allergie tapée en libre — « fruits à coque et crustacés » — ne produit AUCUNE exclusion, et il y en a DEUX dans cette phrase.** Ce n'est pas bloquant tant que l'extraction des GUARDRAIL n'existe pas (rien n'exclut encore), mais le jour où on étend l'extracteur aux GUARDRAIL, **les allergies déclarées doivent devenir des GUARDRAIL HARD** (exclusion dure, cf. règle du rejet §48bis) — c'est de la sécurité alimentaire, pas une préférence. À traiter EN PREMIER dans ce lot.

L'extraction (§27) produit aujourd'hui **INTEREST** et **ENTITY** en structuré (+ reliquat OpenKnowledge). Elle **NE produit PAS encore** de **GUARDRAIL**, **PREFERENCE** ni **CONTEXT** structurés (vocabulaire fermé/semi-fermé, risqué depuis du libre sans garde-fou). **Conséquence écrite noir sur blanc : tout rejet ou préférence exprimé en TEXTE LIBRE est aujourd'hui INERTE** — « je ne supporte pas X » devient une ENTITY-AVOID (déjà excluante par la règle du rejet si la reco est branchée), mais « je préfère toujours le simple » ou « jamais avant 10h » ne deviennent pas une PREFERENCE/CONTEXT exploitable. **À étendre** (prochain raffinement) : ajouter GUARDRAIL (vertical path + severity SOFT/HARD), PREFERENCE (path+value), CONTEXT (périssable, cf. lot ÉTATS) à la sortie de l'extracteur, avec validation de schéma. Pas un détail d'implémentation.

**Limite du prédicat de rejet (honnête, à lever au lot d'extension)** : `candidateRejectedBy` écarte par **recoupement de termes** (le candidat partage un mot avec le rejet). Ça couvre « bouquet de fleurs » vs « fleurs coupées » (mot « fleurs » commun), mais **PAS** « bouquet de roses » vs « fleurs coupées » (aucun mot commun — « roses » n'est pas « fleurs »). **Un rejet exprimé en langage naturel demande un rapprochement SÉMANTIQUE, pas un recoupement de mots.** C'est au lot d'extension (même lot que GUARDRAIL/PREFERENCE/CONTEXT structurés) : embeddings ou normalisation vers un vocabulaire d'entités. Écrit noir sur blanc pour qu'on ne croie pas la couverture complète.

## Lot DURCISSEMENT — fermeture PHYSIQUE de la lecture brute du journal (avant ouverture publique)

Le portail `readResolvedEvidences` (preseance.ts) ferme le chemin PRATIQUE : plus aucune fonction exportée ne rend des evidences non résolues, un nouveau lecteur reçoit du résolu. Mais ce n'est pas une impossibilité PHYSIQUE : en TypeScript, le client Supabase est ambiant, n'importe quel module pourrait réécrire un `.from('knowledge_evidences')` brut. **La seule fermeture physique est au niveau BASE** : exposer une VUE SQL qui résout la préséance (ex. `DISTINCT ON (user_id, about_id, target_construct)` ordonné par niveau de provenance puis date) et **révoquer le `SELECT` sur la table de base** pour le rôle applicatif → lire du brut deviendrait impossible, pas seulement découragé. **PAS maintenant** (décision 26 oct) : ça touche le modèle de sécurité, c'est destructif sur les droits, et le portail suffit au quotidien. **À faire avant l'ouverture au public.** Subtilité à tenir : le filtre de CONTEXTE doit précéder la résolution (la respiration attention réduit dans le seul périmètre attention) — la vue doit donc soit porter le contexte, soit laisser ce filtrage au lecteur.

## Rebranchement de la reco sur le JOURNAL — conditions BLOQUANTES (à tenir le jour du lot reco)

Aujourd'hui la reco lit l'ancienne projection, pas le journal. Le jour où on la rebranche, DEUX conditions sont **bloquantes** (pas « à voir plus tard ») :

1. **La reco lit les rejets DANS LE JOURNAL** (ENTITY DISLIKE/AVOID + GUARDRAIL via `isRejection`), et la **preuve de bout en bout est due à CE moment-là** : un rejet déclaré dans le journal → le candidat correspondant est mécaniquement écarté à la sortie de la reco. Tant que ce n'est pas prouvé à l'écran, la dette d'exclusion n'est pas soldée. C'est la contrepartie du fait qu'on a construit `rejection-match` AVANT la reco : il reste inerte jusqu'à ce branchement, et le branchement doit prouver qu'il mord.
2. **ENTITY ou GUARDRAIL : UNE SEULE source d'exclusion.** Un même rejet ne doit pas pouvoir être écrit à la fois comme ENTITY-AVOID et comme GUARDRAIL « au cas où » — deux représentations de la même vérité (interdit). **La question « laquelle fait foi » se tranche AVEC le rebranchement reco**, pas avant : c'est là qu'on voit ce que le moteur consomme réellement. Décision à inscrire ici ce jour-là. D'ici là, l'extraction n'écrit QUE ENTITY (GUARDRAIL structuré est au lot d'extension ci-dessus), donc le conflit ne peut pas encore naître — mais il naîtra dès que GUARDRAIL sera produit, d'où la règle posée d'avance.

## Lot distinct « ÉTATS ET RELANCES » — NE PAS FAIRE MAINTENANT

N'appartient pas au lot socle. Les états arrivent par deux surfaces **qui n'existent pas encore** : le mode conversationnel, et l'ajout d'une info sur la fiche d'un proche **hors questionnaire**. À faire quand elles existent :
- La famille **CONTEXT se périme** ; les autres familles non. Une evidence CONTEXT est **restituée avec sa date** et **devient une question** passé un certain âge.
- Quand un **état difficile** est déclaré, Candice **revient au bout d'un délai** qui dépend du type de contexte, **auprès du PILOTE, jamais du proche**.
- Estelle pose les **durées** ; la **cadence** passe par le **score de fatigue**.
- ⚠ À ne pas confondre avec la restitution de TRAITS (toujours autorisée, 7d) : ce lot ne concerne que les ÉTATS périssables.

## SÉQUENCE DIRECTRICE (décision 24 oct) — rappelée à la fin de CHAQUE rapport, avec l'état de chaque ligne

Lister ne suffit pas (trois livrables ont dérivé 4 tours en étant listés). État à jour obligatoire.
**Réordonnée le 25 oct** : la préséance passe AVANT l'extraction. Raison : l'extraction écrit des inférences (niveau 5) dans le MÊME journal que les déclarations. Avec la récence seule, une inférence écrite APRÈS une déclaration l'écrasait en silence à l'écran. On ferme le trou avant de l'ouvrir.
1. **Brancher `resolveByProvenance` aux lecteurs** (préséance au read, niveau le plus fort gagne, récence à niveau égal) — **FAIT (25 oct)**. Les 3 lecteurs de respiration (`readSocleTags`, `readContactTags`, `readAttentionTags`) résolvent par provenance, plus par récence seule. **Preuve à l'écran** livrée (`breath-preseance-e2e.test.ts`) : extraite écrite EN DERNIER → le lecteur de l'écran rend la DÉCLARÉE.
2. **Câbler l'extraction au parcours** (après chaque réponse libre A3) — **FAIT côté SOI, AU CHAMP (26 oct)**. L'extraction part **au blur de chaque champ**, pas à la validation de page (`useFieldExtraction` + `FieldExtractionController`, `src/lib/questionnaire/field-extraction.ts`). Route serveur `POST /api/knowledge/extract-free-text` (clé Anthropic jamais au navigateur). Chaque champ **porte son état** (à faire / en cours / faite / échouée), visible discrètement (`ExtractionNote`). À la **validation de page**, on attend ce qui reste en cours (un ou deux champs). **Rattrapage paresseux** au montage : on relit le journal (`knowledge_sources` type `extraction_inferred`) et on relance les champs non encore faits — ce qui a échoué est repris à la visite suivante. q17 (saisi à un autre step) : extrait en une passe attendue au `onDone`. **Scope (décidé, à valider)** : les champs PRATIQUES plats (prénom, âge, tailles, adresse, allergies…) NE passent PAS par l'extraction — voir l'exception ALLERGIES en tête du lot d'extension. **PROCHE** : le parcours proche CANONIQUE (`IncognitoFlowCanonical`, celui qui écrit au journal, flag ON) ne contient QUE des options fermées, **zéro texte libre → rien à extraire** (les textareas n'existent que dans le legacy `IncognitoFlow`, OFF, qui écrit dans `questionnaire_responses`, pas le journal). L'étape 0 proche n'est donc pas aveugle.
**Replan du 26 oct (décision d'Estelle)** : elle NE refait PAS son étape 0 maintenant — le rangement va encore bouger (trois sorts, merge, reco), et elle a déjà perdu ses données à chaque refonte. Son étape 0 passe TOUT À LA FIN. À la place, un **profil de test SOPHIE** (onboarding classique entier, réponses rédigées avec des pièges) sert de banc d'essai visible à chaque étape.
3. **Profil SOPHIE garni + rapport** — à faire. Onboarding classique entier (pas incognito, pas côte à côte) → journal. Réponses d'une vraie personne avec pièges (contradiction, domaine presque vide, formulation ambiguë, rejet en langage naturel, détail très précis, réponse longue). Rapport : toutes les Q/R, les tags produits (famille/provenance/confiance), le texte de chaque respiration, la conclusion analytique, la fiche. Puis analyse comparative Sophie × second profil de test (le profil d'Estelle est dans l'ANCIEN rangement, pas le journal → pas de comparaison sur elle, aucun bricolage mi-journal mi-legacy).
4. **Orchestration de la génération** (par section ; cœur déterministe fait) — vérifiée SUR SOPHIE. **BLOQUANT : rien de visuel tant que non livré.**
5. **Câblage de l'affichage** (masquage/régé/calculé qui tient) + **la fiche sur la maquette gelée**.
6. **Écrans** : 2→5 (profil/analyse/synthèse), puis 6→11 et 14, puis 12, 13 et la reco au minimum.
7. **SUPPRESSION de l'ancien chemin** en un commit, puis **migration de drop des colonnes** (séparée). → à partir d'ici les données d'Estelle ne peuvent plus mourir.
8. **Parcours incognito complet + parcours entier.**
9. **Discovery Engine.** (Ne pas y toucher ni en parler avant ce point.)
10. **Modèle de recommandation.**
11. **ÉTAPE 0 d'Estelle** — elle remplit, une seule fois, pour de bon.

## Question ouverte — OÙ VIT LA FAMILLE BEHAVIOR SUR LA FICHE (décision design d'Estelle)

BEHAVIOR (« sous pression, il garde pour lui » — stress/conflit/communication/expression) est **produite** mais n'a **aucune maison** sur la maquette gelée (4 blocs « En profondeur », aucun ne porte le comportement). **Ne pas la force-placer** (l'enfouir dans « se sentir aimé » la déforme). Laissée **non consommée et signalée** (test de couverture l'acte). Estelle décide sa section ; d'ici là, elle n'apparaît pas sur la fiche.

## Radar : 11 domaines du dictionnaire SANS catégorie (Estelle choisit lesquels ajouter)

Le radar (13 catégories) ne couvre pas 11 domaines d'INTEREST : **bijoux & montres, architecture, photographie, automobile, artisanat, sciences, entrepreneuriat, développement personnel, famille & enfants, animaux, collection**. Quatre pèsent pour une attention : **bijoux/montres, animaux, photographie, artisanat**. Estelle choisit lesquels ajouter ; **le libellé des nouvelles catégories est d'Estelle** (éditorial).

## Mécanisme radar → INTEREST (double mappings) — proposé, Estelle tranche

Le radar (13 catégories, le « 15 » est un nom faux) journalise dans INTEREST au domaine parent. **Une case cochée ne compte jamais deux fois** : proposition = **un domaine PRINCIPAL + un alias non pondéré**. Ex. « Art & culture » → **1 evidence INTEREST** `parent_domain = art` (principal) ; `culture_history` noté comme **alias** (champ descriptif, pas une 2ᵉ evidence) → pèse une fois dans les classements. Les catégories mono-domaine (Lecture→books_literature) : 1 evidence, pas d'alias.

## Libellés de vide (éditorial, Estelle) — « Pas encore d'éléments » provisoire

Tout libellé de section vide (ex. Tables/Voyages en attente d'extraction) est provisoire, de l'assistant, à reprendre par Estelle. Marques+lieux fusionnés en un bloc tant qu'il n'y a qu'un fait : validé, scindé à l'extraction.

## Indicateur d'extraction au champ (SingularityStep) — libellés provisoires, Estelle

Chaque réponse libre montre discrètement l'état de son analyse, « comme on voit qu'un texte est enregistré ».
Libellés actuels (de l'assistant, à reprendre) : **« Candice prend en compte… »** (en cours), **« ✓ pris en
compte »** (fait), **« sera repris plus tard »** (échoué, rejoué à la visite suivante). Tout ce qui s'affiche
t'appartient : à réécrire si besoin.

## Distinguer un fait SUPPOSÉ d'un fait DÉCLARÉ à l'affichage (forme éditoriale, Estelle)

Le champ est posé et voyage : `SocleFact.assertionStatus` ('explicit' = déclaré, 'inferred' = supposé — colonne `knowledge_facts.assertion_status`, déjà en base). Les FACTs ne se résolvent pas (liste), donc le jour où l'extraction produit des FACTs, un fait **supposé** s'affichera à côté d'un fait **déclaré** avec le même poids. **Le rendu DOIT les distinguer ; la FORME est d'Estelle** (une mention « à vérifier », une teinte, une icône, un regroupement… non tranché). L'assistant ne décide pas de la forme ; il garantit que le signal est disponible au rendu. Tant que la forme n'est pas posée, aucune surface ne montre encore de fait inféré (l'extraction n'écrit pas de FACT inféré affiché).

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
