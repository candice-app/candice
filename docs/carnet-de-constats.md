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

### [2026-09-28] `orchestrator.ts` : la fonction `log()` avale le `.error` de supabase-js
- **Constat** : le helper `log()` du cerveau écrit dans `processing_log` via `supabase.from('processing_log').insert(...)` sans jamais lire le `.error` retourné, et enveloppe l'appel dans un `catch { /* log failure must never break the orchestrator */ }` qui n'attrape rien (supabase-js ne lève pas d'exception sur erreur DB). Même motif que le `logStep` corrigé dans le Lot A, mais dans un autre module. Une écriture de log rejetée y resterait silencieuse.
- **Preuve** : `src/lib/brain/orchestrator.ts:16` (déf. `async function log(`) et `:28` (l'`insert`), `catch` sans lecture d'erreur.
- **Périmètre** : hors chantier 0 / Lot A (Lot A ne corrige que `logStep` du moteur d'analyse).
- **Statut** : ouvert.
