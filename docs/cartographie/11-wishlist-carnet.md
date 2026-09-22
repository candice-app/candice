# Cartographie 11 — Wishlist & Carnet d'envies

> Ce document décrit **ce qui EST** dans le code aujourd'hui, sans jugement ni recommandation.
> Sources : `(fichier: …)` ou `(base: …)`. Textes visibles cités **mot pour mot**.
>
> **Rappel du lexique verrouillé (CLAUDE.md) :**
> - **WISHLIST** = la liste personnelle de l'utilisateur, sur SON profil (ce qu'IL aimerait recevoir). Strictement privée.
> - **CARNET D'ENVIES** = les envies REPÉRÉES pour un proche, sur la fiche du proche. On ne dit JAMAIS « wishlist » côté proche.
>
> **Légende des statuts :** ✅ visible/actif · 🟡 partiel/conditionnel · ⚫ code mort · ❌ absent.

---

## (a) Wishlist perso — l'écran `/moi/wishlist`

Sources : `(fichier: src/app/moi/wishlist/page.tsx)` (serveur) et `(fichier: src/app/moi/wishlist/WishlistV2Client.tsx)` (interface). Reproduction de la maquette gelée `Candice_Maquette_Wishlist_V2.html`.

### La table `my_wishlist_items` `(base: my_wishlist_items)`
Colonnes réelles (schéma live) :
- `id` uuid (PK)
- `user_id` uuid NOT NULL — le propriétaire (RLS `auth.uid() = user_id`)
- `title` text NOT NULL — « Ce que c'est »
- `url` text NULL *(legacy)*
- `note` text NULL *(legacy)*
- `created_at` timestamptz NOT NULL
- `photo_url` text NULL — chemin bucket (`contact-photos`, URL signée 1 h) ou URL OpenGraph
- `brand` text NULL
- `web_link` text NULL
- `size_ref` text NULL
- `price_indicative` text NULL — texte libre (ex. « 1 900 € »)
- `occasion` text NULL
- `note_text` text NULL
- `envy_level` text NULL — `dream` / `pleasure`
- `target_recipients` uuid[] NOT NULL défaut `{}` — destinataires ciblés (vide = n'importe qui)
- `source_trace` text NOT NULL défaut `'declared'`
- `reservation_status` text NOT NULL défaut `'available'` (voir (c))
- `reserved_by` uuid NULL
- `reserved_at` timestamptz NULL
- `reservation_expires_at` timestamptz NULL

**Volume : 0 ligne** au relevé `(base: my_wishlist_items)`.

### Règles d'accès — en français simple
- **Strictement privée** : la RLS n'autorise que le propriétaire (`auth.uid() = user_id`). Personne d'autre ne peut lire cette table. À l'insertion, `user_id` est OBLIGATOIRE, sinon l'écriture est rejetée `(fichier: WishlistV2Client.tsx, commentaire R1)`.
- **Jamais montrée telle quelle** : Candice s'en inspire pour recommander sans jamais dévoiler que la personne l'a demandée (matrice de visibilité : wishlist = `never` pour tous les tiers — voir doc 10).
- Les colonnes de **réservation** (`reservation_status`, etc.) sont **invisibles du pilote** : l'écran `/moi/wishlist` ne les lit pas (le `WL_SELECT` de la page ne les inclut pas) `(fichier: src/app/moi/wishlist/page.tsx)`.

### L'interface ✅
En-tête :
- Marque « Candice », lien « Profil » (retour `/moi`)
- Titre « Ma wishlist »
- Texte : « Ce que **toi** tu aimerais recevoir. Candice s'en inspire pour guider tes proches — sans jamais leur dire que tu l'as demandé. »
- Badge : « Privé — traduit en suggestions, jamais montré tel quel »

Bouton « Ajouter une envie ».

**Filtres** (chips) : « Toutes » puis les occasions `WISHLIST_FILTER_OCCASIONS` : « Sans occasion », « Anniversaire », « Noël », « Anniv. de mariage », « Saint-Valentin », « Fête des mères ».

**État vide** : « Ta wishlist est vide » + « Dépose ici tes envies — tes proches pourront viser juste, sans jamais te demander. »

**Carte d'un item** : photo (avec tag niveau d'envie « J'en rêve » / « Petit plaisir »), marque, titre, taille, prix, « Pour : {destinataires ou "n'importe qui"} », boutons « Modifier » et « On me l'a offert ».

**Panneau formulaire** (« Nouvelle envie » / « Modifier l'envie ») :
- Rappel de pudeur : « **Rassure-toi :** personne ne verra cette liste. Candice s'en sert seulement pour souffler la bonne idée au bon proche, au bon moment. »
- « Photo — optionnel » (avec « Sinon, Candice utilisera l'image du lien web ci-dessous. ») — upload via `/api/wishlist/photo`
- « Ce que c'est » (placeholder « ex. Bague Love or rose »)
- « Marque — optionnel » (« ex. Cartier »)
- « Lien web — optionnel, pour retrouver l'objet exact » — si pas de photo, tentative d'image OpenGraph via `/api/wishlist/og`
- « Taille ou référence — optionnel » (« ex. taille 52, ou l'ISBN d'un livre »)
- « Prix indicatif — optionnel » (« ex. 1 900 € »)
- « Niveau d'envie » : pastilles « J'en rêve » (`dream`) / « Petit plaisir » (`pleasure`)
- « Pour quelle occasion ? » : pastilles `WISHLIST_FORM_OCCASIONS` (« Sans occasion », « Anniversaire », « Noël », « Anniv. de mariage », « Saint-Valentin », « Fête des mères », « Fête des pères », « Naissance », « Crémaillère », « Diplôme »)
- « De qui aimerais-tu la recevoir ? » : une pastille par contact + « N'importe qui » — note : « Cette envie n'apparaîtra que chez les proches choisis. Une bague ne sera jamais suggérée à ta grand-mère si tu la réserves à ton mari. »
- Bouton « Ajouter à ma wishlist » / « Enregistrer »

**Panneau « On te l'a offert ? »** :
- « Génial. **Qui te l'a offert ?** Candice pourra retenir cette belle attention. »
- Liste des contacts + « Autre »
- Si un contact est choisi : « En le notant, Candice retiendra que **{nom}** a visé juste — et pourra te demander si ça t'a plu, pour l'aider à mieux te connaître encore. »
- Bouton « C'est {nom} → » ou « Noter comme offert → »
- Effet : POST `/api/wishlist/offered` (trace d'attention dans `attention_log` si un contact est identifié) PUIS suppression de la ligne de la wishlist (`.delete()`).

Statut : ✅ (écran complet, aligné maquette).

---

## (b) Carnet d'envies — le code carnet

Le Carnet vit **sur la fiche du proche** (intégré à `/contacts/[id]`, section « À retenir »), pas sur un écran dédié.

Sources :
- Composant : `(fichier: src/app/contacts/[id]/CarnetV2Section.tsx)`
- Chargement des données : `(fichier: src/app/contacts/[id]/page.tsx, lignes ~462-490)`
- API d'identification photo : `(fichier: src/app/api/carnet/identify/route.ts)`

### La table `carnet_envies_items` `(base: carnet_envies_items)`
Colonnes réelles (schéma live) :
- `id` uuid (PK)
- `contact_id` uuid NOT NULL — le proche concerné
- `pilot_id` uuid NOT NULL — le propriétaire (RLS `pilot_id = auth.uid()`)
- `description` text NOT NULL — « Ce que c'est »
- `photo_url` text NULL
- `source_link` text NULL — « Où / le lien »
- `brand_name` text NULL
- `brand_option` text NULL *(non utilisé par l'UI V2)*
- `confidence_level` text NULL défaut `'moyenne'` *(legacy)*
- `location_hint` text NULL *(legacy)*
- `occasion_links` text[] NULL *(legacy)*
- `statut` text NULL défaut `'actif'` — `actif` / `offert`
- `created_at` timestamptz NULL
- `requires_payment_sourcing` boolean NOT NULL défaut false *(sourcing paiement — non câblé UI V2)*
- `payment_modalities` jsonb NULL *(idem)*
- `size_ref` text NULL
- `price_indicative` text NULL
- `occasion` text NULL
- `note_text` text NULL
- `source` text NULL — `heard` / `seen` / `link` (badge « Entendu » / « Vu »)
- `heard_quote` text NULL — phrase entendue
- `source_trace` text NOT NULL défaut `'spotted'`

**Volume : 0 ligne** au relevé `(base: carnet_envies_items)`.
Note : c'est la table renommée en migration 57, fusionnée avec le legacy `contacts.gift_wishlist` en migration 67 (le legacy est **déprécié**, jamais droppé).

### L'interface `CarnetV2Section` ✅
- Intro : titre « Carnet d'envies de {Prénom} » + « Photo, lien, phrase entendue, boutique : note ici tout ce que tu repères pour {Prénom}. Candice le garde pour le bon moment. »
- Bouton « Ajouter une envie ».
- État vide : « Rien noté pour l'instant » + « Tu n'as encore rien noté pour {Prénom}. Ajoute une envie repérée, même floue : Candice pourra la retrouver, la sourcer ou s'en inspirer plus tard. »
- Carte d'un item : badge source (« Vu » avec icône caméra / « Entendu » avec icône micro / rien si `source` null), marque, description, citation « … », prix, occasion, boutons « Modifier » et « Offert ».
- « Offert » → passe `statut` à `offert` et retire l'item de la liste.

**Deux modes d'ajout** (panneau « Repérer une envie ») :
1. **« Prendre en photo »** — « Tu es devant l'objet, en vitrine ou en boutique. Candice tente de retrouver la marque et le produit. » + astuce « Idéal sur le vif — un cadeau vu au passage. »
   - Upload via `/api/wishlist/photo` (scope `carnet`), puis identification IA via `/api/carnet/identify`.
   - Résultat affiché avec prudence (jamais affirmatif) : « Candice regarde… », puis « Peut-être : {marque} {produit} ? » ou « Pas sûre de reconnaître » + « Simple supposition, souvent imprécise — vérifie et corrige à l'étape suivante, ou ressaisis tout à la main. »
   - Boutons « Continuer et corriger → » / « Ressaisir moi-même ».
2. **« Renseigner moi-même »** — « Une phrase entendue, un lien, une boutique, une idée — tu notes ce que tu sais. »

**Panneau formulaire** (« Envie pour {Prénom} » / « Modifier l'envie ») :
- « Photo — optionnel »
- « Ce que c'est » (« ex. Montre BR 03 »)
- « Marque — optionnel » (« ex. Bell & Ross »)
- « Où / le lien — optionnel » (« Boutique, ou https://... »)
- « Ce que tu as repéré — une phrase, un contexte » (« Il s'est arrêté devant la vitrine… »)
- « Prix indicatif — optionnel » (« ex. 3 900 € »)
- « Pour quelle occasion ? » : pastilles `CARNET_FORM_OCCASIONS` (« Sans occasion », « Anniversaire », « Noël », « Anniv. de mariage », « Fête des pères », « Juste pour lui faire plaisir »)
- Bouton « Ajouter au carnet de {Prénom} » / « Enregistrer »

La `source` est **déduite automatiquement** : photo → `seen` ; sinon phrase entendue → `heard` ; sinon lien → `link` `(fichier: CarnetV2Section.tsx, computedSource)`.

### L'API `/api/carnet/identify` `(fichier: src/app/api/carnet/identify/route.ts)` ✅
- POST avec le `path` d'une photo (doit commencer par `{user.id}/`, sinon 400).
- Télécharge l'image (bucket `contact-photos`), l'envoie au modèle `claude-haiku-4-5-20251001` (Anthropic) qui répond UNIQUEMENT en JSON `{brand, product}`. En cas de doute → `null`. Aucune phrase, juste le JSON.
- Toujours faillible → l'UI affiche « vérifie avant d'enregistrer ».
- Note : le seul fichier sous `src/app/api/carnet/` est `identify/route.ts` ; les écritures du carnet (insert/update/delete) se font **directement** en base depuis le composant client via le client Supabase (RLS `pilot_id = auth.uid()`), pas via une route API dédiée.

Statut : ✅ (carnet complet, aligné maquette).

---

## (c) Réservation invisible — les RPC

Mécanisme identique sur deux surfaces : la wishlist du proche (migration 68) et les recos de l'Espace Proche (migration 69). Principe : **intention molle → confirmation d'achat**, avec **péremption**.

### En français simple
- Un proche qui décide d'offrir « pose une intention » sur l'item (état `intended`). L'item **disparaît** alors pour les autres proches — mais on ne leur dit JAMAIS qu'il est « déjà pris », il disparaît simplement, sans mention.
- Cette intention a une **date de péremption** (30 jours par défaut). Si personne ne confirme l'achat avant, l'item **redevient disponible** automatiquement.
- Quand le proche confirme avoir acheté, l'item passe à `purchased` (définitif).
- Tout est **invisible du pilote** (le propriétaire de la wishlist ne voit jamais ces états).
- Les transitions sont **atomiques** (`SELECT … FOR UPDATE` dans des fonctions `SECURITY DEFINER`), pour éviter que deux proches réservent en même temps.

### Wishlist — migration 68 `(fichier: supabase-migration-68-wishlist-reservation.sql)`
Trois états : `available`, `intended`, `purchased` (colonne `my_wishlist_items.reservation_status`).

- **`reserve_wishlist_item(p_item, p_days=30)`** → renvoie `reserved` / `already_taken` / `not_found`.
  - `already_taken` si déjà `purchased`, ou si `intended` non expiré par un AUTRE proche.
  - Sinon pose `intended`, `reserved_by = auth.uid()`, expiration `now() + p_days`.
- **`confirm_wishlist_purchase(p_item, p_outcome, p_days=30)`** — `p_outcome` : `purchased` / `not_yet` / `declined`.
  - `not_yours` si le caller n'est pas le réservataire.
  - `purchased` → état final ; `not_yet` → prolonge la péremption (`extended`) ; `declined` → relâche l'item (`released`, redevient disponible).
- Droits : `EXECUTE` accordé aux `authenticated` seulement.

### Recos Espace Proche — migration 69 `(fichier: supabase-migration-69-contact-reco-items.sql)`
Même pattern sur `contact_reco_items.reservation_status` (`available`/`intended`/`purchased`).
Deux dimensions **orthogonales** : `status` (`active`/`refused` — le refus) vs `reservation_status` (le cadeau). « Offered » = dérivé de `purchased`, jamais stocké.

- **`reserve_reco_item(p_item, p_days=30)`** → `reserved` / `already_taken` / `not_found` (même logique).
- **`confirm_reco_purchase(p_item, p_outcome, p_days=30)`** → `purchased` / `extended` / `released` / `not_yours` / `not_found`.
- Droits : `EXECUTE` accordé aux `authenticated`.

**Utilisation réelle dans l'UI :** dans l'Espace Proche, la voie 1 « Je m'en occupe personnellement » appelle `reserve_reco_item` `(fichier: EspaceProcheShell.tsx, reserveSelf)`. La confirmation d'achat (`confirm_*`) et la surface proche-facing (réclamation) relèvent du **moteur de reco / conciergerie à venir** — pas encore atteignables. 🟡 pour `confirm_*` (RPC présentes, pas d'appel UI trouvé).

Volume `contact_reco_items` : **0 ligne** au relevé `(base: contact_reco_items)`.

---

## (d) Refus & attentions écartées

### La table `reco_refusals` `(base: reco_refusals)`
Migrations 70 `(fichier: supabase-migration-70-reco-refusals.sql)` et 75 `(fichier: supabase-migration-75-reco-refusal-occasion.sql)`.
Colonnes réelles (schéma live) :
- `id` uuid (PK)
- `pilot_id` uuid NOT NULL (RLS owner-only)
- `contact_id` uuid NOT NULL
- `reco_id` uuid NOT NULL — référence `contact_reco_items(id)`
- `reason` text NOT NULL — `gout` / `budget` / `deja` / `moment`
- `sub_reason` text NULL — pour `moment` : l'horizon choisi
- `note_free` text NULL — champ « Autre » libre
- `reactivable` boolean NOT NULL défaut true
- `reappear_at` timestamptz NULL — date de réapparition (financier : +6 mois ; moment : +1/+4/+12 mois)
- `created_at` timestamptz NOT NULL
- `reserved_for_occasion` boolean NOT NULL défaut false — « gardée pour une occasion » : mise en réserve SANS date (réveil événementiel)

**Volume : 0 ligne** au relevé `(base: reco_refusals)`.

**Réapparition PARESSEUSE** : il n'y a AUCUN job/cron. Un refus « budget » ou « moment » dont la `reappear_at` est passée rend le reco de nouveau proposable **à la lecture**, sans réécrire le statut `(fichier: src/app/proche/[id]/page.tsx, fonction reappeared)`.

### Le flow « Pas ça » — `EspaceProcheShell.tsx` ✅
Déclenché par le bouton « Pas ça » sur une reco. Panneau à étapes.

**Menu — 4 raisons** (titre « Qu'est-ce qui te fait hésiter ? ») :
- Sous-texte : « Dis-m'en un peu plus — ça m'aide à mieux viser pour {Prénom}. »
- Les 4 options (verbatim) :
  1. « Ce n'est pas son goût » (`gout`)
  2. « C'est trop cher pour moi » (`cher` → raison `budget`)
  3. « Je lui ai déjà offert » (`deja`)
  4. « Ce n'est pas le bon moment » (`moment`)

**Raison « Ce n'est pas son goût »** (titre « Es-tu sûr ? ») :
- Candice ré-argumente selon la source : si `declared` → « Je te la propose parce que **{Prénom} l'a lui-même laissé entendre** — c'est exactement ce qui lui plairait. » ; sinon si `why` → « Je te la propose parce que : **{why}** » ; sinon « Je te la propose parce qu'elle colle à ce que Candice sait de {Prénom}. »
- Si `certainty_pct` : anneau + « Sûre à {n}% que ça lui plairait, d'après ce qu'il a laissé deviner. »
- Boutons : « Allez, je tente pour cette fois » (referme sans écarter) / « Non, je ne veux vraiment pas » → écrit `reco_refusals` (reason `gout`, reactivable) + passe la reco à `status='refused'`.
- Écran de confirmation (titre « C'est noté ») : « Très bien, je l'écarte. Merci de me l'avoir dit — **je continue d'affiner** pour ne te proposer que le plus juste pour {Prénom}. » + bouton « Parfait ».

**Raison « C'est trop cher pour moi »** (titre « Le budget ») :
- « Je comprends. On peut garder l'idée de côté sans pression. »
- Si un prix est lisible : plan d'épargne — « Mettre un peu de côté » + « Si tu mets **{X} € de côté chaque semaine**, tu pourras lui offrir **dans {n} semaines**. »
- Boutons « On garde l'idée » / « Retirer » (→ `reco_refusals` reason `budget`, `reappear_at = now()+6 mois`, reco `refused`).
- Note : « Si tu retires : Candice met l'idée de côté et te la représente dans quelques mois, pour une grande occasion. »

**Raison « Je lui ai déjà offert »** (titre « Déjà offert ») :
- « Super ! Et dis-moi : **est-ce qu'il a aimé ?** Ça m'aide à mieux le connaître. »
- Échelle de « love » (`LOVE`) : « Un peu » / « Beaucoup » / « Énormément »
- Bouton « Enregistrer » → insère dans `(base: attention_log)` (`status='done'`, `love_level`) + passe la reco à `reservation_status='purchased'`.

**Raison « Ce n'est pas le bon moment »** (titre « Le moment ») :
- « Ce n'est pas le bon moment. Tu la reverrais quand ? »
- Les horizons (`HORIZONS`, verbatim) :
  - « Dans quelques semaines » (`semaines`, +1 mois)
  - « Dans quelques mois » (`mois`, +4 mois)
  - « Beaucoup plus tard » (`plus_tard`, +12 mois)
  - « Je la garde pour une occasion » (`occasion`, **sans date** → `reserved_for_occasion=true`, réveil événementiel)
- Effet : `reco_refusals` (reason `moment`, `sub_reason=horizon`, `reappear_at` = date sauf option « occasion », `reserved_for_occasion`) + reco `refused`.

### Panneau « Attentions écartées » ✅
Ouvert depuis le lien « Attentions écartées » (+ compteur) de l'onglet « Faire plaisir ».
- Vide : « Plus rien d'écarté — tout est de retour dans tes idées. »
- Sinon : « Tu peux les remettre dans tes idées à tout moment. » + liste avec tag de raison :
  - Tags (`REASON_LABEL` / cas occasion) : « Pas son goût », « Trop cher », « Déjà offert », « Pas le bon moment », ou « Gardée pour une occasion »
  - Bouton « Réactiver » par item → passe la reco à `status='active'`. Les lignes `reco_refusals` ne sont **pas** supprimées (le compteur de refus « goût » reste intact pour un « workflow croisé » prévu en Phase 7, non câblé).

Note produit `(fichier: page.tsx + EspaceProcheShell.tsx)` : le comptage du 2e refus « goût » et le workflow croisé invisible sont **stockés mais pas déclenchés** aujourd'hui (Phase 7 à venir). 🟡

Statut d'ensemble (d) : ✅ pour le flow « Pas ça » et les attentions écartées (interface complète) ; 🟡 pour le workflow croisé (stocké, non déclenché).

---

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU**
- « le code carnet (src/app/api/carnet, composants) » : sous `src/app/api/carnet/` il n'existe QUE `identify/route.ts`. Hypothèse : les écritures du carnet passent par le client Supabase directement (visible dans `CarnetV2Section.tsx`), il n'y a pas d'autre route API carnet. Je l'ai indiqué explicitement.
- Les migrations demandées « 68 et 69 » : la demande dit « reserve_wishlist_item/confirm_wishlist_purchase et reserve_reco_item/confirm_reco_purchase (migrations 68 et 69) ». C'est cohérent avec les fichiers réels (`68` = wishlist, `69` = reco). Aucune ambiguïté.

**B. DÉCISIONS PRISES SEUL**
- J'ai marqué `confirm_wishlist_purchase` / `confirm_reco_purchase` en 🟡 (RPC présentes en base, mais aucun appel trouvé dans l'UI — seul `reserve_reco_item` est appelé). Ce constat repose sur une recherche de code, pas sur un test exhaustif de toutes les surfaces.
- J'ai listé les colonnes legacy (`url`, `note`, `brand_option`, `confidence_level`, `location_hint`, `occasion_links`, `requires_payment_sourcing`, `payment_modalities`) en les signalant *(legacy)* / *(non utilisé UI V2)* d'après leur absence dans les composants V2. Jugement de lecture, pas certitude absolue.

**C. LAISSÉ EN SUSPENS**
- Les routes `/api/wishlist/photo`, `/api/wishlist/og`, `/api/wishlist/offered` : mentionnées (utilisées par l'UI) mais non ouvertes en détail (hors périmètre — la demande cible wishlist + carnet + RPC + refus).
- Le contenu de `attention_log` (colonnes) : non relevé (non demandé ; seul son usage dans le flow « Déjà offert » / « On me l'a offert » est décrit).

**D. À VÉRIFIER PAR ESTELLE**
- Confirmer que la confirmation d'achat (`confirm_*`) est bien volontairement non branchée à l'UI aujourd'hui (attendue avec la conciergerie / moteur de reco).
- Confirmer que les colonnes legacy de `carnet_envies_items` et `my_wishlist_items` doivent rester (jamais droppées, conformément à la règle « migrations additives »).

**E. MIGRATIONS / BUILD**
- Aucune migration ni build : tâche en LECTURE SEULE. Toutes les requêtes en base étaient des SELECT (schéma + `count(*)`), aucune écriture.
- Toutes les tables relevées sont vides (0 ligne), sauf `profile_share_links` (1 ligne, cf. doc 10) — cohérent avec un environnement sans données réelles.
