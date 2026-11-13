# Décisions — 13 novembre, 11h25

Tes trois questions sont tranchées. Aucune n'allait à Estelle : ce sont des décisions
techniques, et tu as eu raison de demander plutôt que d'inventer — mais la réponse ne lui
appartenait pas.

## 1. Lien d'annulation → JETON STOCKÉ

Le modèle recommandé, pour tes raisons : révocable, à usage unique, aucun secret
d'environnement de plus à gérer ni à risquer de confondre avec `CRON_SECRET`. Colonne
`deletion_cancel_token uuid` sur `my_profile`, posée par `/api/account/delete`, **nullée à
l'annulation ET à l'achèvement**. Migration 106 ; lot 1 bis glisse en 107.

**Un point que tu n'as pas relevé, et qui doit figurer dans l'en-tête du handler.** Un lien
GET qui change un état est exposé au **préchargement** : clients mail et navigateurs
suivent les liens sans que personne ne clique. Ici c'est acceptable — et **uniquement
ici** — parce que l'action préchargée serait *l'annulation*, c'est-à-dire la direction
protectrice : au pire la suppression est annulée plus tôt que voulu, jamais déclenchée.

Un lien GET qui *déclencherait* une suppression serait inadmissible pour exactement la même
raison. Écris-le, pour que personne ne généralise le motif en croyant suivre un précédent.

Deux exigences de plus : le jeton est consommé **une seule fois** (nullé dans la même
transaction que l'annulation, pas après), et le handler rend la même réponse qu'il ait
trouvé un jeton valide ou non — on ne dit pas à un visiteur si un compte est en cours de
suppression.

## 2. Oui — tu écris tout le moteur et la garde

Le document ne l'attribuait pas explicitement, et tu as bien fait de poser la question.
Mais les scénarios testent la machine à états complète : `TENTATIVE` →
`ECHEC_PARTIEL`/`ACHEVEMENT_VERIFIE`, la reprise avec `attempt_no = 2` et
`inventory_before == résidu précédent`, et la garde `ORPHANED_DELETION_DEADLINE`. Rien de
tout ça ne serait éprouvé si personne ne l'écrivait. En commits distincts, comme prévu.

## 3. Oui pour `erasure_inventory(uid)` — avec quatre contraintes non négociables

Une fonction `SECURITY DEFINER` qui fait du SQL dynamique sur des tables arbitraires est
**exactement** la surface qu'on a passé trois jours à fermer. Donc :

1. `SET search_path = public, pg_temp` — figé, sinon un schéma temporaire peut détourner un
   nom non qualifié ;
2. `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` puis `GRANT EXECUTE ... TO
   service_role` — et un bloc d'assertion `has_table_privilege`/`has_function_privilege`
   avant `COMMIT`, comme dans la 104 : `REVOKE ... FROM anon, authenticated` ne retire pas
   un privilège détenu via `PUBLIC` ;
3. **aucun paramètre autre qu'un `uuid`.** La liste des tables se dérive du catalogue
   **dans** la fonction, par la fermeture transitive. Elle n'est jamais passée par
   l'appelant : un paramètre textuel sur une fonction DEFINER qui construit du SQL, c'est
   une injection avec une invitation ;
4. `STABLE` — aucune écriture possible, et la propriété est lisible dans la signature.

Et le rattachement au compte doit couvrir **les deux voies** : les tables qui portent
`user_id`, et celles qui n'en ont pas mais portent `contact_id` (jointure sur
`contacts.user_id`). Une table de la fermeture qui ne tombe dans ni l'une ni l'autre doit
**faire échouer** la fonction, pas être ignorée : un inventaire incomplet rend
`ACHEVEMENT_VERIFIE` mensonger. Le harnais applique déjà cette règle
(`03-cron-quatre-scenarios.mts`, fonction `inventaire`) — aligne-toi dessus, le même calcul
des deux côtés rend la comparaison opposable.

## Sur l'arbre de travail mixte — c'est ma faute, pas la tienne

Tu as raison de refuser de revendiquer un vert sur un arbre qui porte mes éditions. Elles
sont à moi : `consolidate.ts` (comptage des preuves explicites, ordre temporel par
instants), `persist.ts` (contrôle d'instant avant la RPC), `read-journal.ts` (lecteur de
consolidation), `extract-free-text.ts` (le correctif ENTITY), `preseance.ts` (une ligne de
commentaire), plus `src/lib/mail/` et `scripts/local/`.

Elles passent `tsc --noEmit` et la suite de tests chez Estelle. Ne les défais pas, ne les
commite pas : elles partiront sur `fix/entity-relation-sans-invention`. Si un build échoue
à cause d'elles, dis-le-moi avec le message exact plutôt que de contourner.

## Ce qui a changé sous tes pieds pendant que tu écrivais

La pile locale **tourne**, sur Colima. Les 105 migrations sont appliquées, **104 et 105
comprises** — c'est la première fois qu'elles s'appliquent quelque part. Tu n'as plus à
attendre qu'Estelle les applique.

Et la **85 a échoué**, pour une raison qui te concerne : elle se déclare elle-même
« one-shot, non rejouable » — elle renomme une policy créée à la main dans la console, et
sur une base neuve `supabase-schema.sql` la crée déjà sous son nom final. **Le dépôt ne
peut donc pas reconstruire sa base depuis zéro.** Elle est exclue avec son motif dans
`scripts/local/ordre-migrations.py`.

Il faut une convention : un marqueur explicite en en-tête, du genre `-- REJOUABLE: non`,
que l'outillage puisse lire. Trois autres fichiers se déclarent one-shot en prose
(`23b`, `46`, `84`) — et attention, **la 84 crée `applied_migrations`** : une heuristique
qui chercherait « one-shot » dans le texte l'écarterait et ferait tomber tout ce qui suit.
J'ai failli poser ce piège. Le marqueur doit être explicite, pas deviné.
