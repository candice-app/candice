# Spec moteur & règles de recommandation Candice — décisions verrouillées (v1)

> Ce document capture TOUT ce qu'on a validé. Rien ne doit s'évaporer dans la conversation. Chaque décision est rattachée au lot où elle sera codée. Quand on arrive à un lot, ce document EST le brief de code.

---

## A. Architecture runtime (à coder — Lots 8 & 9)

1. **Profil unique en base** (Supabase). Réponses au questionnaire principal + réponses aux micro-questions = **un seul et même profil**. *(État actuel : `my_profile` et `questionnaire_responses` coexistent sans réconciliation — à unifier, noté.)*
2. **La bibliothèque de micro-questions vit en base** (table `discovery_questions`, existe déjà). Le fichier Excel n'est que la **surface d'authoring** où on les écrit/cure. Le moteur lit la base, **jamais** le tableur.
3. **Déclencheurs ciblés** : un signal (« aime la gastronomie ») pointe vers un **petit jeu** de questions liées (vin ? fromage ?). Pas de scan complet du catalogue à chaque update.
4. **Extraction langage naturel → vocabulaire fermé → écriture profil.** Quand le pilote dit « Julie ne va pas bien », Claude extrait l'info, la **range dans le vocabulaire fermé** (`life_context`), l'écrit en base. Confirmation auprès du pilote sur le sensible.
5. **Sortie d'état** : quand un état sensible se termine (« elle va mieux »), il bascule en **historique** (jamais effacé).
6. **Matching au moment de la reco, dans le moteur** (pas dans le tableur). Pour chaque candidate : signal positif → monte ; inconnu → reste candidat (n'exclut jamais) ; négatif explicite → exclu ; contrainte dure (allergie) → **filtre absolu**. Via `PROFILE_SIGNAL_MAPPING`.
7. **Import catalogue = étape contrôlée** (Lot 9), pas de synchro automatique. Re-import quand le catalogue change.

---

## B. Comportement de recommandation (Lot 8)

8. **Reco proactive** : 2-3 options + un « pourquoi » + une action (commander / réserver / rédiger). Pas de questions au moment de recommander, sauf exception (sensible/bloquant).
9. **Exécution** : non-marchand → Candice réalise **directement** (donne la recette, rédige le message) ; marchand → propose le fournisseur + résa/commande **après validation du pilote**. C'est Claude qui réalise concrètement.
10. **Effort : HORS matching.** On ne demande jamais au pilote quel effort il veut mettre. L'effort est seulement une **info annoncée** à la reco (« ça te prend 10 min »).
11. **Météo** : recommande **mais prévient** et laisse le pilote vérifier — ou propose une alternative non météo-dépendante. Jamais d'annulation autoritaire.
12. **Fournisseurs : jamais au hasard.** Marque préférée si elle colle → sinon filtre (budget, contraintes, accessibilité) → tri par pertinence/note → **validation pilote**.
13. **Scores émotion / symbolique = potentiels modulés par le profil**, pas des vérités figées. (Le fromage = très symbolique pour un passionné.)
14. **Relation = déduite de 2 infos** déjà demandées (nature du lien + registre/proximité), jamais d'une étiquette rigide.
15. **Tags : un tag n'existe que s'il a une question profil correspondante** (anti-usine à gaz).

---

## C. Confiance & intervention humaine (principe directeur : intervention MINIMALE)

16. `source_confidence` = à quel point la **donnée est sûre** → pilote seulement le **ton** (affirmatif vs « à confirmer »). Aucun lien avec l'intervention humaine.
17. `needs_manual_review` = drapeau **RARE**, réservé au **touchy** : contextes sensibles (deuil, burn-out, post-partum), sécurité, très haute sensibilité. *(FAIT : resserré de 968 → 308. « Enfant » et « accessibilité de lieu » ne déclenchent plus de revue — ce n'est pas délicat en soi.)*
> **Distinction critère 12 (deux fiabilités à ne pas confondre) :**
> – Fiabilité du PROFIL = info supposée par le pilote (incognito) vs déclarée par le proche. → couche de provenance a/b/c, côté profil.
> – Fiabilité du CATALOGUE = `source_confidence` : Candice sait-elle que l'attention est réelle/accessible/disponible, ou l'a-t-elle déduite ? → côté catalogue.
18. **Contextes sensibles = mode supervisé.** Pas de liste d'interdits figée (un deuil festif, une fête post-partum peuvent être justes SI le pilote le signale). Candice **demande d'abord** au pilote, **rien n'est soumis/envoyé sans approbation humaine**, réponses **ultra-personnalisées**. *(À préciser : « approbation humaine » = pilote seul, ou pilote + humain Candice ?)*
19. **Tout le reste = autonome + apprentissage par feedback.** Le but du catalogue est d'éviter au maximum l'intervention humaine.

---

## D. Apprentissage (Lot 8, puis Lot 12)

20. **Feedback pilote** (« allergique », « n'aime pas le fromage ») → écrit dans le profil → **hard-filter durable** (on ne propose plus jamais). Boucle niveau 1.
21. **Boucle 3 propositions** (sûre / originale / simple) → sur rejet, 1 raison fermée → 1 régénération → sinon une micro-question.
22. **Prudence/audace** : peu d'infos → **audace** ; plus d'infos → plus **juste** (pas plus « prudent », plus précis).

---

## E. Budget (config par profil — Lot 6)

23. Budget **par profil**, demandé à la création du proche :
   - quotidien : rien de payant / ~20 € / ~50 € / ~100 € (en rassurant : « beaucoup de mes idées seront gratuites ») ;
   - grande occasion : ~50 € / ~150 € / ~300 € / plus ;
   - penchant : gratuit / équilibre / payant si pertinent.
   L'équilibre gratuit/payant est **piloté par le budget + l'apprentissage**. *(Formulations à valider par Estelle.)*

---

## F. Plancher qualité & lignes rouges (catalogue — verrouillé)

24. **Plancher** : pas de générique non marqué ; un objet simple OK **si jolie marque** ; premium OK **si le profil le justifie** ; carte-cadeau brute = non. *La marque, pas le prix, fait le plancher.*
25. **Lignes rouges** : sexuel/suggestif, intime hors couple, régime/perte de poids, cadeaux qui sonnent comme une critique. **Lingerie** = couple uniquement + **en idée seulement** (pas de mensurations) + marque respectable. **Clichés genrés** = seulement si le profil le confirme.

---

## G. Tests & qualité

26. **Golden profiles** : Estelle peut en créer autant qu'elle veut, testés ensemble (régression).
27. **QA reports** = photos de l'état du fichier au moment du build (pas quotidien). Monitoring vivant = après l'import.

---

## H. Répartition par lot (ce qui part au code)

- **Lot 4** — ajout d'un proche : date de naissance → tranche d'âge, polish formulaire (4.1) ; suivi d'invitation (4.2). **4.3 (incognito, lookup « déjà sur Candice », partage, consentement) = DÉVELOPPÉ EN PARALLÈLE** (plus un gate bloquant). En parallèle : mise à jour du brief juridique pour Chloé. *Caution : la mise en prod « large » avec de vraies données sensibles de tiers (Art. 9) attend le feu vert de Chloé.*
- **Lot 6** — budget engine (config par profil). *(Formulations validées.)*
- **Lot 8** — moteur : extraction → vocab → écriture profil ; sortie d'état → historique ; matching ; reco proactive 2-3 ; exécution ; météo ; fournisseurs ; feedback niveau 1.
- **Lot 9** — import catalogue → base + **synchro programmée** (toutes les 6 h / nuit) avec **garde-fou QA bloquant** avant d'appliquer.
- **Lot 12** — apprentissage niveaux 2/3 + console admin.

---

## I. Apprentissage = propriété de Candice (principe d'architecture)

28. **Candice est le cerveau, pas Claude.** Le modèle d'apprentissage (ML) est un **actif propriété de Candice**. Claude *lit* dedans pour raisonner, mais n'apprend pas à la place de Candice.
29. **Tout est stocké pour apprendre** : chaque intervention humaine (les décisions d'Estelle sur le sensible) ET chaque retour utilisateur sont **persistés dans le magasin d'apprentissage de Candice**.
30. **Apprentissage sur lot, jamais sur un cas isolé** : Candice analyse le contexte d'un *ensemble* d'interventions humaines pour faire évoluer son comportement (« à l'avenir, dans ce type de contexte, agir ainsi »), jamais sur une seule décision.
31. **Objectif** : à mesure que le volume grossit, automatiser progressivement ce qui passe aujourd'hui par l'humain, sans jamais perdre la justesse. Apprentissage **continu**.

## J. Micro-questions — emplacement (confirmé)

32. On **ne supprime pas** les micro-questions du fichier catalogue : il reste la **surface d'authoring** (lien direct avec les colonnes catalogue via `linked_catalogue_fields`). À l'import, elles partent dans **leur propre table** en base, distincte des attentions. Le moteur lit la base, jamais le tableur.

---

*Toute nouvelle décision validée s'ajoute ici. Ce document fait foi, pas la mémoire.*

---

## K. Mises à jour v1.2 (décisions verrouillées)

33. **Magasin d'apprentissage = Supabase, propriété de Candice.** Tables dédiées (`candice_learning_events` : interventions humaines + retours utilisateurs avec contexte ; `candice_provider_log` : prestataires/lieux utilisés). Claude lit pour raisonner, n'est pas le cerveau. **Visible dans la console.**
34. **Candice + Claude travaillent ensemble.** Candice = apprentissage, profil, décisions (le « quoi » et « pour qui »). Claude = sourcing réel (géoloc resto, fromager, artisans, prestataires locaux) + raisonnement (le « où »).
35. **Validation humaine AVANT de montrer au pilote** (anti-déception) : toute reco réservable/achetable passe par un humain (Estelle d'abord) qui vérifie **disponibilité + prix réels** ; Candice fournit le meilleur lien/prix trouvé ; ce n'est soumis au pilote qu'après validation.
36. **Ordre sur le sensible** : Estelle d'abord (son avis) → pilote → puis Estelle sort progressivement de la boucle à mesure que Candice apprend. **ML au cœur, non négociable.**
37. **Provenance dans la reco** : si une reco repose sur une supposition du pilote (incognito), Candice l'annonce (« basé sur ton analyse de Julie, je ne suis pas fiable à 100 % »).
38. **Sync tableur ↔ base = automatique + QA bloquant** = diff automatique ligne par ligne / colonne par colonne vs version précédente (vérifie l'ajout attendu + l'absence de casse). Estelle ne surveille jamais le fichier manuellement.
39. **4.3 (incognito, lookup, partage, consentement)** : DÉVELOPPÉ pleinement et fonctionnel. On ne bride rien a priori. Estelle a déjà dégrossi l'essentiel à l'oral avec Chloé ; on revient dessus **seulement si** un point ne passe pas. On garde une hygiène RGPD propre + un **journal des points RGPD** (voir doc dédié) pour le brief juridique complet à venir.
40. **Console = priorité** après les lots en cours. Contient : visibilité du magasin d'apprentissage, **analytics prestataires** (lieux où ≥ N personnes envoyées → négociation de commissions), management/validations.
41. **needs_review = 308** après resserrement : 298 = familles sensibles (post-partum, sensible) où l'humain tranche d'abord ; 10 = outliers à très haute sensibilité.

42. **% de fiabilité par recommandation (console)** : chaque reco affiche un score de fiabilité = tags cochés / tags pertinents (« coche 7 tags que Julie adore, 3 en suspens »), avec la liste des **questions en suspens**. Aide Estelle à décider d'un coup d'œil avant de valider l'envoi.
43. **Le ML apprend du % de fiabilité** : Candice apprend si un niveau de fiabilité (ex. 70 %) corrèle avec des attentions qui ont marché → ajuste la confiance dans le temps.
44. **Doublons (ATTENTION_CANONICAL_MAP)** : après revue, ce ne sont pas de vrais doublons mais des variantes distinctes → **conservées**. Seules ~4 répétitions exactes de noms entre clusters sont dédoublonnées. (Ne pas fusionner les variantes : appauvrirait le catalogue.)
45. **Règle tags** : un tag n'existe que s'il a une question profil. Triage : supprimer les tags orphelins redondants ; créer une micro-question seulement pour les orphelins importants. Garder le questionnaire léger.

## [MAJ 15 juin — VERROUILLÉ] Filtre anti-cliché = IMPONDÉRABLE avant sélection définitive
Le principe anti-cliché n'est PAS qu'une intention : c'est un **gate obligatoire** du moteur, vérifié **avant toute sélection définitive d'une attention** (entre génération de candidats et recommandation au pilote).
Règle : aucune attention "cliché générique" (verre à whisky, mug perso, box homme/femme, fleurs/chocolat/alcool par défaut, coffret générique…) n'est retenue **sauf signal de goût explicite dans le profil**. Sinon, le moteur **remonte d'un cran** vers l'attention juste (verre à whisky → dégustation si vrai amateur ; mug → tasse artisanale selon le rituel café ; box → expérience ciblée ; fleurs → seulement si goût avéré).
Ces "remplacer X par Y" vivent dans le **cerveau de Candice (moteur)**, jamais comme lignes catalogue. Le gate s'applique à 100 % des recos, automatiquement. → reflété dans ENGINE_WORKFLOW (étape 3.5).

## [MAJ 8 juin] "Catégories supplémentaires" de la liste = contextes/tags
Les ~80 "catégories" proposées (charge mentale, réparation relationnelle, reprise de contact, longue distance, relation pudique, déteste/adore les surprises, etc.) sont à mapper en **context_categories / occasion_tags / reason_tags** sur les attentions existantes — pas en nouvelles catégories d'attention. Nouvelle catégorie créée uniquement si rien ne colle.


## [MAJ 15 juin] Sujets sensibles — règle générale (dont infertilité / parcours difficile)
Pour TOUT sujet sensible : Candice prend l'information et **propose une attention à Estelle** ; **rien ne sort sans sa validation préalable** (mode supervisé). Aucune attention dédiée n'est créée au catalogue pour l'infertilité : on réutilise la famille "moments sensibles".
**Lignes rouges infertilité** (à écrire dans le moteur, même pour les idées soumises à Estelle) : jamais rien lié à bébé / grossesse / enfants ; jamais d'optimisme injonctif ("ça va marcher") ; jamais de conseil ; présence sobre uniquement. Donnée de santé (RGPD Art. 9) → cadrage Chloé avant toute activation élargie.