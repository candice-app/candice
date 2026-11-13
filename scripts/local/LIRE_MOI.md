# Scénarios locaux — commandes exactes

Tous ces scénarios sont **EN ATTENTE** tant que Docker et le CLI Supabase ne sont pas
installés. Ils vérifient leurs propres préalables et s'arrêtent en disant ce qui manque,
plutôt que de rendre un vert qui ne prouve rien.

## 1. Monter et contrôler la pile

```bash
bash scripts/local/01-monter-la-pile.sh
```

Refuse d'aller plus loin tant que les composants n'ont pas été prouvés locaux **à
l'exécution** : nom d'hôte **exact**, protocole et port, pas une recherche de « localhost »
dans la chaîne. L'ordre des migrations est produit par `ordre-migrations.py` — `sort -V`
n'existe pas sur le `sort` BSD du Mac — qui **exclut explicitement**
`supabase-migration-101-ROLLBACK-grants.sql` et **refuse** tout fichier hors forme attendue.

Chaque fichier est appliqué dans le mode qui lui convient : **92 fichiers** sont enveloppés
par `psql -1`, **13 portent déjà leur propre `BEGIN;`/`COMMIT;`** et sont passés **sans
`-1`** — sinon leur `COMMIT` refermerait la transaction externe et l'atomicité annoncée
serait fausse.

## 2. Aller-retour du journal (1 200 preuves, 250 sources)

```bash
export SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_SERVICE_ROLE_KEY=…      # tapée à la main, jamais commitée
npx tsx scripts/local/02-journal-aller-retour.mts
```

Prouve ce que le banc en mémoire ne peut pas : la pagination réelle de PostgREST, l'absence
de doublons et de manquants, l'égalité des signaux avant écriture et après relecture, et que
trois formes du même instant se relisent comme un seul instant.

## 3. Les quatre scénarios du cron

```bash
export CRON_SECRET=… ; export APP_URL=http://localhost:3000
npm run dev &                            # application pointée sur le local
npx tsx scripts/local/03-cron-quatre-scenarios.mts
```

| # | Scénario | Auth | Base | Storage | Trace attendue |
|---|---|---|---|---|---|
| 1 | demande échue | compte absent | zéro ligne sur la fermeture transitive | zéro objet, tous godets | `ACHEVEMENT_VERIFIE`, résidu vide |
| 2 | encore dans le délai | compte intact | lignes intactes | objets intacts | `DEMANDE` seule, aucune tentative |
| 3 | annulée par le lien reçu | compte intact | lignes intactes | objets intacts | refus journalisé si horodatage orphelin |
| 4 | échec partiel puis reprise | compte absent au 2ᵉ tour | — | résidu au 1ᵉʳ tour | `ECHEC_PARTIEL` puis `ACHEVEMENT_VERIFIE` |

Le contrôle préalable **n'appelle pas la route du cron** : l'appeler « pour voir » agirait
sur tous les comptes échus de la base. Le premier appel a lieu dans le scénario 1, après
préparation du compte fictif. Le préalable vérifie à la place, par `lsof`, que le processus
qui sert l'application **n'a aucune connexion hors de la boucle locale** — une route qui
répond sur localhost peut parler à une base distante.

L'inventaire passe par **`psql` en lecture seule** (`default_transaction_read_only=on`), il
est **rattaché à l'identifiant du compte fictif**, comparé avant et après, et les tables de
la fermeture **sans colonne `user_id`** sont nommées plutôt qu'ignorées. Toute erreur
d'inventaire, d'Auth, de Storage ou de lecture de la trace **fait échouer** — en particulier,
une erreur Storage n'est jamais comptée comme « zéro fichier restant ».

**Scénarios 3 et 4 : bloqués jusqu'à leur exécution réelle.** Ce qui leur manque est décrit
dans `TRANSPORT-ET-INJECTION.md` — transport de test qui capture le lien sans appeler
Resend, et point d'injection contrôlé pour couper Storage à mi-chemin.

## Ce qu'aucun de ces scripts ne prouve

L'équivalence entre le schéma local et celui de la production. Tant qu'elle n'est pas
établie — relevé du catalogue des deux côtés, en lecture seule — un résultat obtenu ici ne
transfère pas.
