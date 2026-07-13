# ⛔ STOP DUR — Phase A : audit + plan de migration (lot Wishlist V2 + Carnet d'envies)

Maquettes gelées et poussées (`5e6004c`).

## 1. Relevé de fidélité (tokens communs aux deux maquettes)

Palette `:root` **identique** dans les deux — à reprendre telle quelle :

```
--canvas:#FEFEFB  --surface:#FFFFFF  --mist:#EEF3F0
--ink:#16150E  --ink2:#5F5A51  --ink3:#ABA699
--pine:#173E31  --pine2:#1B4D3E  --glow:#3E7361  --sage:#8DA697  --sage-bg:#E9F0EC
--champ:#CDB987  --gold:#C7A85A  --champ-soft:#FBF8F0  --coral:#B9583F
--aplat:linear-gradient(157deg,#1D5040,#0C2A20)
--line:rgba(23,62,49,.11)  --line2:rgba(23,62,49,.06)  --shadow:0 10px 30px rgba(23,62,49,.07)
```

- **Typos** : Fraunces (titres/prix, *italic* pour le brand Candice), DM Sans (corps). SVG stroke 1.6.
- **Composants partagés** : header aplat vert `border-radius:0 0 28px 28px` + halo champagne ; cards `.item` (photo 104px + body) ; sheets bottom (`translate(-50%,102%)→0`, cubic-bezier `.32,.72,.28,1`) ; pills ; `.addBtn` pine min-height 52 ; nav 5 items avec orbe centrale ; `.sectTitle` (point glow + trait).
- **Wordings exacts relevés** (à la virgule) : titres, sous-titres header, badge « Privé — traduit en suggestions, jamais montré tel quel », hint pudeur, occasions, « De qui aimerais-tu la recevoir ? » + phrase ciblage grand-mère, flow « On te l'a offert ? », deux modes carnet, avertissement IA « Candice pense avoir reconnu ce produit — vérifie avant d'enregistrer », état vide.

## 2. Cartographie de l'existant

| Élément | État actuel | Sort |
|---|---|---|
| `my_wishlist_items` | table **minimale** (6 col : id, user_id, title, url, note, created_at), **0 ligne**, RLS `users_own_wishlist` (owner-only) | à enrichir (Phase B) |
| `carnet_envies_items` | table **riche** déjà là (15 col : description, photo_url, source_link, brand_name/option, confidence_level, location_hint, occasion_links[], statut, requires_payment_sourcing, payment_modalities), **0 ligne**, RLS `owner_wishlist_items` (pilot_id) | cible du carnet (Phase B/D) |
| `contacts.gift_wishlist` (jsonb) | **legacy** — carnet actuel, **2 lignes** non-null, rendu par `WishlistSection.tsx` (form brut « Idée de cadeau / Note / Lien ») | **fusion → carnet_envies_items** puis dépréciation (Phase B) |
| `/api/memories/w2/route.ts` | écrit déjà dans `carnet_envies_items` (chemin parallèle « W2 ») | à réconcilier avec le nouveau carnet |
| `/moi/wishlist` (`WishlistClient.tsx`) | rendu V1 (ajout rapide + édition inline) | **remplacé** par maquette Wishlist V2 (Phase C) |
| `WishlistSection.tsx` (fiche proche, monté 4× lignes 802/832/854/873) | form brut gift_wishlist | **remplacé** par maquette Carnet V2 (Phase D) |
| Section partageable « Sa wishlist » (ProfileV2 tiers) | **déjà retirée** en clôture V2 (`ca8e456`) | ✓ rien à faire |
| Buckets storage | `avatars`, `contact-photos` — **privés** | `photo_url` wishlist/carnet → réutiliser `contact-photos` ou nouveau bucket privé (à trancher) |

**Constat clé : duplication carnet** — deux backings coexistent (`contacts.gift_wishlist` jsonb legacy **et** table `carnet_envies_items`). La fusion consolide tout vers `carnet_envies_items`.

## 3. Plan de migration (Phase B — à appliquer après GO)

**Migration 65 — enrichissement `my_wishlist_items`** (additive, `ADD COLUMN IF NOT EXISTS`) :
`photo_url`, `brand`, `web_link`, `size_ref`, `price_indicative`, `occasion` (enum : `none/birthday/christmas/wedding_anniversary/valentine/mothers_day/fathers_day/naissance/cremaillere/diplome/retraite/just_because`), `note_text`, `envy_level` (`dream/pleasure`), `target_recipients` (uuid[] ou sentinelle `anyone`), `source_trace` (`declared/spotted/deduced`, défaut `declared`).

**Migration 66 — enrichissement `carnet_envies_items`** :
champs communs manquants (`size_ref`, `price_indicative`, `occasion` aligné, `note_text` — plusieurs existent déjà : `photo_url`✓, `brand_name`✓, `source_link`✓, `occasion_links`✓) + `source` (`heard/seen/link`), `heard_quote`, `source_trace` (défaut `spotted`).

**Migration 67 — fusion `gift_wishlist` → `carnet_envies_items`** :
backfill des 2 lignes existantes (mapping colonne par colonne détaillé au STOP B : `title→description`, `note→note_text`, `url→source_link`, `source_trace=spotted`), **sans DROP** — `gift_wishlist` conservée puis marquée dépréciée (commentaire SQL), code basculé sur la table.

**RLS** : les deux tables ont déjà une policy owner-only stricte (`ALL`). Vérif/renfort en Phase B qu'**aucune** lecture tierce n'existe (une wishlist ne fuit jamais, même par requête directe) — la wishlist n'a aucune vue tierce dans le code.

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU (à trancher au STOP B)** :
1. **Bucket photos** — réutiliser `contact-photos` (déjà privé + route upload existante) ou créer un bucket dédié `wishlist-photos` ? Je pencherais pour réutiliser l'infra existante.
2. `carnet_envies_items` a déjà `confidence_level`, `requires_payment_sourcing`, `payment_modalities` (chemin W2) que la maquette n'utilise pas — je les **conserve** (additif, ne rien casser) mais ne les câble pas dans l'UI V2.
3. La fiche proche monte `WishlistSection` **4×** (tabs/états de proximité) — le remplacement Carnet V2 devra couvrir ces 4 points d'intégration ; détaillé à l'implémentation.

**B. DÉCISIONS PRISES SEUL** : maquettes committées sous leurs noms exacts (`Candice_Maquette_Wishlist_V2.html` / `..._Carnet_Envies_V2.html`) sans suffixe `_GELEE` (pour matcher les références de la spec) ; `source_trace` = nom de colonne proposé pour declared/spotted/deduced.

**C. LAISSÉ EN SUSPENS** : tout le code + migrations (Phase B+, après GO). Aucune écriture base.

**D. À VÉRIFIER PAR ESTELLE** : valides-tu le plan de migration (65/66/67) et les 3 flous A ? Notamment **bucket photos réutilisé vs dédié**.

**E. MIGRATIONS / BUILD** : aucune migration appliquée (Phase A = audit) ; aucun code touché ; maquettes gelées poussées (`5e6004c`).

**STOP.** Phase B (données + RLS + fusion) lancée seulement après validation du plan et des 3 arbitrages.
