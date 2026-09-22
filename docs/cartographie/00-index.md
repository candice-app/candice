# Cartographie complète de Candice — Index

> Document de référence, purement descriptif. Il traduit en langage humain ce qui existe réellement dans le code et dans la base, tel quel, sans recommandation (sauf les chapitres 16 et 17 qui listent des constats factuels, toujours sans recommandation).
> Généré le 2026-09-22. Lecture seule : aucun code ni aucune donnée modifiés.

## Note sur la base de données interrogée

Tous les volumes cités dans ces chapitres proviennent de la **base réelle du projet**, atteinte via la variable d'environnement `SUPABASE_DB_URL` (le même accès a renvoyé, par exemple, `discovery_questions` = 70 lignes, `discovery_sessions` = 57, `cadence_log` = 31, `profile_analysis` = 2, `contacts` = 3). Ce n'est **pas** un environnement de test distinct. La base est en **état pré-lancement** : certaines tables sont peuplées, beaucoup d'autres sont encore vides (0 ligne). Quand un chapitre indique « 0 ligne », cela signifie que la fonctionnalité n'a pas encore produit de données, pas que la base serait fausse ou vide dans son ensemble.

## Chiffres bruts

| Élément | Nombre | Source |
|---|---|---|
| Sauvegardes Git (commits) | **309** | `git log` |
| Pages de l'application | **48** | `find src/app -name page.tsx` |
| Routes API | **87** | `find src/app/api -name route.ts` |
| Composants React | **100** | `find src/components -name *.tsx` |
| Tables en base (schéma public) | **42** | (base : pg_tables) |
| Fichiers de migration | **78** | `supabase-migration-*.sql` |
| Questions du questionnaire initial | **26 items à réponse contrainte obligatoires** + ~31 champs optionnels (singularité + pratique) | (fichier : src/lib + composants questionnaire) |
| Micro-questions Discovery en banque | **70** (68 actives, 2 archivées) | (base : discovery_questions) |
| Emails transactionnels | **14** envois distincts | `grep resend.emails.send` |
| Tâches automatiques (crons) | **4** | (fichier : vercel.json) |
| Tests automatisés | **165** tests dans **10** fichiers | `vitest run` |

## Sommaire des chapitres

- **00-index.md** — ce fichier : sommaire + chiffres bruts.
- **01-historique.md** — chronologie depuis le premier commit : les 17 lots successifs, dates, apports, commits.
- **02-stack-comptes-outils.md** — chaque service externe (Vercel, Supabase, Anthropic, Resend, Web Push…), les variables d'environnement (noms seulement), les dépendances et leur rôle.
- **03-pages.md** — les 48 pages, une par une : rôle, accès, liens, textes verbatim.
- **04-acces-authentification.md** — toutes les modalités d'accès et d'authentification, écrans, emails, erreurs.
- **05-parcours.md** — chaque typologie d'utilisateur, étape par étape.
- **06-questionnaire-initial.md** — toutes les questions verbatim, dans l'ordre, options, stockage.
- **07-analyse-profil.md** — le pipeline d'analyse, déterministe vs LLM, prompts verbatim, sorties.
- **08-micro-questions.md** — la banque des 70 micro-questions verbatim, sélection, statuts, jauge, incitations.
- **09-recommandations.md** — moteur reco, signaux, suggestions proactives, prompts verbatim, ce qui est branché ou non.
- **10-proches-partage.md** — ajout d'un proche, fiches, espace proche et ses onglets, partage, consentements, visibilité.
- **11-wishlist-carnet.md** — wishlist, carnet d'envies, réservation invisible, refus, attentions écartées.
- **12-emails-notifications.md** — chaque email : déclencheur, destinataire, objet et corps verbatim, traçabilité.
- **13-automatismes.md** — chaque cron : fréquence, rôle, coût, garde-fous.
- **14-base-de-donnees.md** — chaque table : rôle, colonnes, volume, règles d'accès en clair, tables mortes.
- **15-api.md** — les 87 routes par domaine : accès, rôle, client utilisateur ou admin, validation.
- **16-securite.md** — constats de sécurité factuels, avec gravité. Sans recommandation.
- **17-dette-et-incoherences.md** — code mort, TODO, doublons, incohérences, colonnes vides. Sans recommandation.
- **18-tests.md** — ce qui est testé, ce qui ne l'est pas.
- **CARTOGRAPHIE_COMPLETE.md** — les 19 chapitres assemblés en un seul fichier, pour impression.
