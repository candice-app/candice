DA figée « Présence » V11 — référence obligatoire : docs/design-system.html, docs/reference-app.html, docs/reference-questionnaire.html, docs/ton-candice.md. Lire avant tout travail UI.
@AGENTS.md

## Source de verite produit
- La spec de reference est docs/Specs/Candice_Product_Spec_V26_Complete.md (V2.6, sections 0 a 46). C'est LE document qui fait foi.
  (Ajuste le nom si le fichier s'appelle autrement.)
- Avant de commencer un lot, lis la section concernee de cette spec.
- Ce document vit et evolue : refere-toi toujours a sa derniere version dans le repo.

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

## RAPPORT D'HYPOTHÈSES — OBLIGATOIRE EN FIN DE CHAQUE TÂCHE

À la fin de chaque tâche (et à chaque point de STOP), termine TOUJOURS par une section « ⚠ RAPPORT D'HYPOTHÈSES » qui liste, en langage simple :

A. ZONES DE FLOU : chaque point où l'instruction était ambiguë ou incomplète, l'hypothèse prise par défaut, et l'alternative qui était possible. S'il n'y en a aucune, écris « Aucune zone de flou ».
B. DÉCISIONS PRISES SEUL : tout choix non explicitement demandé (nom de champ, valeur par défaut, comportement d'un cas limite, libellé inventé).
C. LAISSÉ EN SUSPENS : ce qui n'a pas été fait et pourquoi (hors périmètre, donnée manquante, dépend d'un autre lot).
D. À VÉRIFIER PAR ESTELLE : les points qui méritent une relecture humaine avant de considérer la tâche close.
E. MIGRATIONS / BUILD : migration(s) à appliquer (nom de fichier exact) ; confirmation que `npm run build` passe.

But : ne plus jamais combler une zone de flou en silence. Tout trou comblé par défaut doit être visible pour qu'Estelle puisse le corriger immédiatement.