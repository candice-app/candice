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
