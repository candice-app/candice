# ÉTAT AU 13 NOVEMBRE — à lire avant de reprendre

Ton dernier rapport est celui du volet A du lot 105. Depuis, plusieurs choses ont été
tranchées ou faites : les relire t'évite de refaire, et t'évite une instruction qu'on sait
désormais fausse.

## Ce qui est acquis, et que tu n'as plus à faire

- **Les deux migrations sont certifiées sur l'octet.** `sha256(104) = d51a0bc5ce4e…81ea63`
  (154 lignes, 9 176 o), `sha256(105) = 5bdaa571b358…fee398` (134 lignes, 8 962 o). Le bloc
  d'assertion est bien là, `'PUBLIC'` aux lignes 134 et 152. **Tu avais raison, c'était la
  transmission** — l'accusation d'absence était fausse, et elle est retirée. Tu n'attends
  plus la relecture : avance.
- **Le volet B est rendu**, par lecture directe du dépôt. Ne le refais pas. Les sept champs
  obligatoires de `knowledge_evidences` sont relevés : `evidence_role` = `'primary'`
  (`extract-free-text.ts:116`), `confidence` = `'low'` (§48bis, provenance niveau 5),
  `assertion_status` = `'inferred'`, `assertion_basis` = `'self_report'`,
  `target_construct` = `normalizeLabel(label)` et **`preference_path` vaut le même champ**
  (`rows.ts:172`), `source_id` = la ligne de `knowledge_sources`. **La divergence
  `assertion_status` n'existe pas** : la migration 83 (l.121-129) supprime les contraintes
  de la 82 et pose `explicit|inferred` — historique et base vivante concordent.
- **Le transport courriel local est écrit** : `src/lib/mail/transport.ts`,
  `transport-local.ts`, `transport-resend.ts`, plus un test qui assère **zéro appel sortant**
  en espionnant `fetch` lui-même. Il te reste seulement à **router les envois existants**
  (`src/lib/resend.ts` et ses appelants) par `envoyerCourriel`.
- **Les quatre scénarios d'essai sont écrits** dans `scripts/local/`, avec le montage de la
  pile, l'aller-retour du journal (1 200 preuves, 250 sources) et le document que tu lis.
  Ils refusent d'avancer tant que leurs préalables manquent, en disant lequel.

## Une instruction de ton rapport qui est fausse, et qu'il faut corriger

Ta correction 4 prescrit `psql -1 -v ON_ERROR_STOP=1 -f "$f"` pour **chaque** fichier.
**13 des 105 migrations portent déjà leur propre `BEGIN;`/`COMMIT;`.** Avec `-1`, leur
`COMMIT` interne referme la transaction externe de psql : le reste du fichier s'exécute hors
transaction, et l'atomicité annoncée est fausse précisément là où on croyait l'avoir.
`scripts/local/ordre-migrations.py` détecte le mode par fichier et exclut nommément
`supabase-migration-101-ROLLBACK-grants.sql`, que le glob incluait — il aurait défait la 101
juste après l'avoir posée.

Et `sort -V` n'existe pas sur le `sort` BSD de macOS : l'ordre est produit en Python.

## Ce qui change dans la consolidation, et qui touche ton lot

`source_type` **n'est pas une colonne de `knowledge_evidences`** — il vit sur
`knowledge_sources`, et `provenanceLevel` l'écrit : « ne jamais le lire au read ». Idem pour
`timestamp` : `knowledge_evidences` est la seule table du journal **sans colonne `ts`**. Un
lecteur dédié (`src/lib/knowledge/read-journal.ts`) les réhydrate par `source_id` et lève sur
source absente. Si ton manifeste relit des evidences, passe par lui.

---

# Pour Claude Code — `hard-delete.ts` et le point d'injection (lot 105)

Ce document est la spécification des deux préalables des scénarios 3 et 4. Les scénarios
eux-mêmes sont écrits et t'attendent dans `scripts/local/03-cron-quatre-scenarios.mts` :
ils refusent d'avancer tant que ce qui suit n'est pas en place, et disent lequel manque.

Le transport local de la partie 1 est **déjà écrit** — `src/lib/mail/transport.ts`,
`transport-local.ts`, `transport-resend.ts`, et son test assère zéro appel sortant en
espionnant `fetch` lui-même. Il ne te reste de cette partie qu'à **router les envois
existants** (`src/lib/resend.ts` et ses appelants) par `envoyerCourriel`, pour que le lien
d'annulation soit capturé.

Ce qui t'appartient en propre : la partie **1 bis** (erreurs Storage) et la partie **2**
(point d'injection).

---

# Préalables des scénarios 3 et 4 — à écrire avant de pouvoir les jouer

Ces deux scénarios restent **BLOQUÉS** jusqu'à leur exécution réelle. Ce document dit
exactement ce qui manque, pour que leur mise en place ne soit pas improvisée le jour venu.
