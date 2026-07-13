# ⛔ STOP DUR — Phase B : modèle de données livré et vérifié

Migrations **65/66/67 appliquées et vérifiées** via `SUPABASE_DB_URL`, commit `055863d`.

## Ce qui est en base (vérifié)

- **`my_wishlist_items`** : +10 colonnes (`photo_url, brand, web_link, size_ref, price_indicative, occasion, note_text, envy_level, target_recipients, source_trace`).
- **`carnet_envies_items`** : +7 colonnes (`size_ref, price_indicative, occasion, note_text, source, heard_quote, source_trace`).
- **CHECKs** posés : `occasion` (enum 12 valeurs), `envy_level` (dream/pleasure), `source` (heard/seen/link), `source_trace` (declared/spotted/deduced) — sur les deux tables.
- **RLS** : `enabled=true` sur les deux, policy `ALL` owner-only (`auth.uid()=user_id` / `pilot_id=auth.uid()`). Aucune lecture tierce nulle part. Une wishlist ne fuit jamais, même en requête directe.
- **Fusion** : `gift_wishlist` conservée (**pas de DROP**) + commentaire de dépréciation posé ; **0 ligne migrée** (les 2 contacts avaient un tableau vide → zéro perte).
- **Bucket** : `contact-photos` privé, signé `createSignedUrl(path, 3600)` = **1h** (pattern déjà en place) — réutilisé pour les photos wishlist/carnet.

## Mapping détaillé (champ maquette → colonne)

**Wishlist V2** (`my_wishlist_items`) :

| Champ maquette | Colonne |
|---|---|
| « Ce que c'est » | `title` |
| Marque | `brand` |
| Lien web | `web_link` |
| Taille ou référence | `size_ref` |
| Prix indicatif | `price_indicative` (texte libre « 1 900 € ») |
| Niveau d'envie (J'en rêve / Petit plaisir) | `envy_level` (`dream`/`pleasure`) |
| Occasion | `occasion` (scalaire, enum) |
| « De qui aimerais-tu la recevoir ? » | `target_recipients` (uuid[]) |
| Photo | `photo_url` (path `contact-photos`) |
| — (traçabilité) | `source_trace` = `declared` |

**Carnet V2** (`carnet_envies_items`) :

| Champ maquette | Colonne |
|---|---|
| « Ce que c'est » | `description` (existant) |
| Marque | `brand_name` (existant) |
| « Où / le lien » | `source_link` (existant) |
| « Ce que tu as repéré » (phrase/contexte) | `heard_quote` |
| Prix indicatif | `price_indicative` |
| Occasion | `occasion` (scalaire) |
| Source (badge Entendu/Vu) | `source` (`heard`/`seen`/`link`) |
| Photo | `photo_url` (existant) |
| — (traçabilité) | `source_trace` = `spotted` |

**Fusion gift_wishlist → carnet** : `title→description`, `note→note_text`, `url→source_link`, `source='link'` si url, `source_trace='spotted'`, `statut='actif'`.

## Réconciliation du chemin W2 (`/api/memories/w2`)

**Aucun conflit, aucun double-écriture.** W2 et la future UI Carnet V2 sont **deux points d'entrée INSERT distincts** dans `carnet_envies_items` — ils créent des lignes séparées (pas de clé partagée, jamais d'UPDATE croisé). Concrètement :

- Les colonnes que W2 écrit (`confidence_level`, `brand_option`, `location_hint`) sont **conservées** (flou 2) — rien cassé.
- Les nouvelles colonnes se remplissent **par défaut safe** pour les lignes W2 : `source_trace='spotted'` (défaut migration 66), `source=NULL`. Une ligne W2 est donc une envie repérée valide, juste sans badge source explicite.
- **Je n'ai pas touché `w2/route.ts` en Phase B** (il fonctionne, additif à défaut safe). En Phase D, je m'assurerai que l'UI Carnet et les lignes W2 s'affichent de façon cohérente (fallback du badge source quand `source=NULL`).

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : aucune bloquante. Note : `target_recipients` = `uuid[]` où **tableau vide = « n'importe qui »** (pas de sentinelle 'anyone' textuelle — impossible dans un uuid[]) ; les groupes de la maquette (« Mes parents/amies ») seront résolus en contact_ids côté UI.

**B. DÉCISIONS PRISES SEUL** : `occasion` scalaire ajouté aux DEUX tables (la maquette sélectionne UNE occasion) ; `occasion_links` (array W2) conservé sur carnet mais non utilisé par l'UI V2 ; `price_indicative` en **texte** (la maquette montre « 1 900 € », pas un nombre) ; colonnes V1 `url`/`note` de `my_wishlist_items` superseded par `web_link`/`note_text` (0 ligne, conservées — droppables plus tard si tu veux) ; CHECKs en TEXT+CHECK plutôt qu'ENUM natif (plus facile à faire évoluer, additif).

**C. LAISSÉ EN SUSPENS** : tout l'UI (Phases C→D→E) ; les colonnes de réservation (Phase E) viendront en migration 68 ; la réconciliation d'affichage W2 (badge source) traitée en Phase D.

**D. À VÉRIFIER PAR ESTELLE** : valides-tu (1) `target_recipients` = uuid[] vide = n'importe qui, (2) `occasion` scalaire (une seule occasion par item), (3) `url`/`note` V1 laissées dépréciées ? Si oui → j'enchaîne C→D→E sans stop.

**E. MIGRATIONS / BUILD** : **65/66/67 appliquées et vérifiées** ; aucun code touché (Phase B = données) ; poussées (`055863d`).

**STOP.** Sur GO (et validation des 3 points D), enchaînement Phases C → D → E au pixel près, sans stop intermédiaire, jusqu'au STOP final avec captures.
