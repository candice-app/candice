DA figée « Présence » V11 — référence obligatoire : docs/design-system.html, docs/reference-app.html, docs/reference-questionnaire.html, docs/ton-candice.md. Lire avant tout travail UI.
Fiche profil (pilote ET vues tierces) : référence visuelle absolue = design/redisign/Candice_Maquette_Profil_V2_REFERENCE_GELEE.html (barème typographique inclus). L'ancienne maquette REFERENCE_VALIDEE est supprimée — bascule V2 actée en Phase D du lot Refonte Profil V2.
Wishlist perso + Carnet d'envies : références gelées = design/redisign/Candice_Maquette_Wishlist_V2.html et Candice_Maquette_Carnet_Envies_V2.html (lot Wishlist V2 + Carnet, CLOS). Écran wishlist = /moi/wishlist ; carnet = contenu intégré dans la fiche proche (le header/onglets de la maquette carnet relèvent de la refonte fiche proche, reportée au lot Harmonisation design).
@AGENTS.md

## Source de verite produit
- La spec de reference est docs/Specs/Candice_Product_Spec_V26_Complete.md (V2.6, sections 0 a 46). C'est LE document qui fait foi.
  (Ajuste le nom si le fichier s'appelle autrement.)
- Avant de commencer un lot, lis la section concernee de cette spec.
- Ce document vit et evolue : refere-toi toujours a sa derniere version dans le repo.

## Lexique verrouillé (interdiction de croiser les termes)
- WISHLIST = la liste personnelle de l'utilisateur, sur SON profil (ce qu'il aimerait recevoir). Table my_wishlist_items. Candice s'en inspire pour recommander sans jamais dévoiler que la personne l'a demandé. STRICTEMENT PRIVÉE (RLS owner-only, jamais de vue tierce). Champs V2 : photo_url (bucket contact-photos, URL signée 1h), brand, web_link, size_ref, price_indicative (texte), occasion (enum), envy_level (dream/pleasure), target_recipients (uuid[], vide = n'importe qui), source_trace (declared).
- CARNET D'ENVIES = les envies REPÉRÉES pour un proche (photo, lien, boutique, phrase entendue, note). Vit sur la fiche du proche. Table carnet_envies_items. Côté proche, on ne dit JAMAIS « wishlist ». Champs V2 : source (heard/seen/link → badge Vu/Entendu, null = neutre), heard_quote, occasion, price_indicative, source_trace (spotted). Ajout par photo (identification IA « à vérifier ») ou manuel. Le legacy contacts.gift_wishlist est DÉPRÉCIÉ (fusionné, migration 67, jamais droppé).
- IDÉES = les propositions de Candice.
- TRAÇABILITÉ SOURCE (source_trace, pour le futur moteur de reco, NON câblé) : declared (wishlist du proche lui-même) / spotted (carnet) / deduced (profil).
- RÉSERVATION INVISIBLE (my_wishlist_items.reservation_status via RPC reserve_wishlist_item / confirm_wishlist_purchase, SECURITY DEFINER atomiques, péremption 30 j) : intention molle → confirmation d'achat. Invisible du pilote ; un proche ne voit jamais qu'un autre a réservé. Surface proche-facing (réclamation) = lot Moteur de reco à venir.

## Regles produit dures
- Modele : 100 % abonnement (9 EUR/mois, 1 mois offert, CB demandee seulement a J-7). Questionnaire et analyse toujours gratuits.
- Equilibre gratuit/payant : Candice propose souvent des attentions NON payantes ; le mix ne penche jamais plus vers le payant que vers le gratuit.
- Aucune recommandation marchande n'atteint le pilote sans passage par la console.
- Jamais d'analyse sur input vide ou quasi-vide.
- Securite emotionnelle : Candice n'est jamais therapeute, medecin ni coach. Sur situation sensible, elle oriente vers un humain (voir spec section 43).
- Jamais de score ni de % affiches. Interdits copy : profil, personnalite, diagnostic, compatibilite, score, %, MBTI, coach, surveille, veille, detection. Preferer « tu sembles… », « on devine… ».

## Avant chaque lot
1. Lire la section concernee de la spec (docs/Specs/...).
2. Respecter la DA V11 et docs/ton-candice.md.
3. Coder, tester, commit clair.


## RÈGLES D'EXÉCUTION — PERMANENTES (s'appliquent à chaque tâche)

Ces règles priment sur toute habitude par défaut. En cas de conflit avec une autre instruction, demande avant d'agir.

1. N'invente RIEN. Si une information manque ou est ambiguë, ARRÊTE-toi et pose la question. Ne décide jamais à la place d'Estelle.
2. Fais UNIQUEMENT ce qui est demandé. Aucune initiative, aucun « petit plus », aucun refactor non demandé, aucune fonctionnalité non listée.
3. Reprends EXACTEMENT les libellés, textes, noms de champs, routes et valeurs fournis — mot pour mot, sans reformuler.
4. En cas de doute entre deux interprétations : liste les deux options et attends la réponse. Ne tranche jamais seul.
5. Ne touche jamais à ce qui est marqué « hors périmètre », même si ça paraît lié.
6. Respecte l'ordre d'exécution demandé. Commits atomiques, un par étape. TypeScript clean.
7. Migrations additives par défaut, jamais destructives sur des données réelles. Signale toujours toute migration Supabase à appliquer, avec le nom exact du fichier.
8. Quand un point de STOP est demandé, tu t'arrêtes, tu récapitules, et tu attends la validation avant de continuer.
9. PUSH SYSTÉMATIQUE : à chaque STOP et à chaque fin de lot, `git push` sans exception — un STOP validé sur device suppose que le device voit le code.
10. COMPTE QA PERMANENT : test-perf-claude@candice.app (fiche 100 % synthétique) — sert aux vérifications navigateur (WebKit/Playwright) contre la prod à chaque lot. Ne jamais le supprimer, ne jamais y mettre de vraies données.

## RAPPORT D'HYPOTHÈSES — OBLIGATOIRE EN FIN DE CHAQUE TÂCHE

À la fin de chaque tâche (et à chaque point de STOP), termine TOUJOURS par une section « ⚠ RAPPORT D'HYPOTHÈSES » qui liste, en langage simple :

A. ZONES DE FLOU : chaque point où l'instruction était ambiguë ou incomplète, l'hypothèse prise par défaut, et l'alternative qui était possible. S'il n'y en a aucune, écris « Aucune zone de flou ».
B. DÉCISIONS PRISES SEUL : tout choix non explicitement demandé (nom de champ, valeur par défaut, comportement d'un cas limite, libellé inventé).
C. LAISSÉ EN SUSPENS : ce qui n'a pas été fait et pourquoi (hors périmètre, donnée manquante, dépend d'un autre lot).
D. À VÉRIFIER PAR ESTELLE : les points qui méritent une relecture humaine avant de considérer la tâche close.
E. MIGRATIONS / BUILD : migration(s) à appliquer (nom de fichier exact) ; confirmation que `npm run build` passe.

But : ne plus jamais combler une zone de flou en silence. Tout trou comblé par défaut doit être visible pour qu'Estelle puisse le corriger immédiatement.