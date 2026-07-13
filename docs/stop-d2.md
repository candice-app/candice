# ⛔ STOP DIAGNOSTIC D2 — le cache client, chiffré et prouvé

Tes 43 beacons v2 (iPhone iOS 18.7) tranchent net. Ton intuition est la bonne : **ce n'est pas un problème de vitesse de rendu, c'est un problème de cache client.** La preuve est binaire.

## Le fait chiffré

| Navigation (tap → contenu réel) | médiane | moyenne | n |
|---|---|---|---|
| **Cache SERVI** (pas de squelette) | **36 ms** | 34 ms | 32 |
| **Cache RATÉ** (squelette affiché) | **2 054 ms** | 2 391 ms | 20 |

**38 % de tes navigations ratent le cache** (20 sur 52). Et le résultat est **binaire** : soit ~36 ms (instantané), soit ~2 s. Rien entre les deux. La *même* transition `/moi → /moi/discovery` donne **32 ms quand c'est caché, 1 966 ms de moyenne quand ça ne l'est pas**. La lenteur n'est donc pas dans le rendu — elle est entièrement dans le **ratage de cache** qui force un aller-retour serveur complet.

## L'asymétrie qui révèle la cause

- **Retour vers `/moi`** (`discovery → /moi`, `wishlist → /moi`) : **toujours instantané**, 35 ms médian, 18/18 sans squelette.
- **Aller vers `/moi/discovery`** : **raté 78 % du temps** (14 sur 18), 1 902 ms médian, squelette à chaque fois.

Pourquoi cette asymétrie ? C'est le mécanisme du Router Cache de Next 16 :

1. **Le retour arrière** (`→ /moi`) est servi depuis le cache back/forward — `/moi` a été rendu plus tôt dans la session, il y reste. Instantané.
2. **L'aller en avant** vers une route **dynamique** (`/moi/discovery` lit `searchParams` + les cookies d'auth) repose sur le *prefetch*. Or, **pour une route dynamique derrière un middleware, Next ne met en cache QUE le squelette (`loading.tsx`), jamais la page complète.** Donc chaque aller affiche le squelette instantanément… puis va chercher le vrai contenu au serveur → 2 s.

## Ta piste « cookies Supabase » — verdict

**Directionnellement juste, mécanisme précis à corriger.** Ce ne sont pas les cookies qui « purgent » un cache déjà rempli. C'est que **la machinerie d'auth rend ces routes dynamiques et non-préchargeables en entier**, et surtout que **chaque aller-retour serveur paie deux vérifications d'auth réseau** :

- Le `proxy.ts` (ex-middleware) tourne sur **chaque** requête RSC (le matcher couvre tout) et appelle **`supabase.auth.getUser()`** — qui fait un **appel réseau à l'API Auth de Supabase** (`GET /auth/v1/user`), pas une simple lecture de cookie. Sur token-refresh il repose des cookies → la réponse devient non-cacheable, ce qui **confirme et renforce** que ces RSC ne sont jamais stockés côté client.
- Puis la page `/moi/discovery` **rappelle `getUser()`** (c'est le cas dans 34 pages) → **deuxième** aller-retour Auth.

Ces deux hops réseau Auth, ajoutés au RTT mobile et à l'invocation de la fonction Vercel, composent l'essentiel des ~2 s d'un cache raté.

## Fixes proposés (ranking — AUCUN appliqué, j'attends ton GO)

**FIX A1 — dé-réseauter l'auth du proxy (recommandé, isolé, mesurable).** Remplacer `getUser()` dans `proxy.ts` par une **validation locale du JWT** (`getClaims()` — présent dans ta version `@supabase/ssr` 0.10.2 — qui vérifie la signature sans appel réseau). Retire **un** aller-retour Auth de **chaque** navigation. Réversible en une ligne.

**FIX A2 — éviter le 2e `getUser()` réseau des pages** en faisant confiance aux claims déjà validés par le proxy (transmis via en-tête). Retire le **second** hop. Plus invasif (touche le chemin d'auth des pages) — à ne faire que si A1 ne suffit pas, mesures à l'appui.

**FIX B — squelette qui stream (perçu).** Faire peindre le shell discovery instantanément (le squelette prefetché devient le vrai `loading`, le contenu arrive en streaming). N'abaisse pas le « tap→contenu réel » mais supprime la sensation de blocage sur les 2 s résiduelles.

**Ma reco : A1 seul d'abord**, puis re-mesure cache-raté avant de décider A2/B. On ne touche pas au cache lui-même (comportement Next voulu) — on rend le *ratage* peu coûteux.

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : `getClaims()` est local **uniquement si ton projet Supabase utilise les clés de signature JWT asymétriques** (défaut récent). S'il est encore sur le secret partagé legacy, `getClaims()` fait aussi un aller-retour → le fix devient `getSession()` (lecture cookie, sans vérif) en gardant le `getUser()` autoritatif dans les pages. **À confirmer avant d'implémenter A1** (je peux le vérifier côté projet Supabase).

**B. DÉCISIONS PRISES SEUL** : j'ai lu tes beacons directement dans `perf_beacons` (ton « beacons envoyés ») plutôt que d'attendre un collage — 43 mesures iOS 18.7 exploitées. Les mesures `HARD` (14 s, 20 s) sont des artefacts (onglet en arrière-plan / flux de login), écartées ; seules les `SOFT` comptent.

**C. LAISSÉ EN SUSPENS** : le fix (ton GO) ; la clôture (dépose 60/62, la 63 reste ; vérif commit bascule Phase D) vient après D2.

**D. À VÉRIFIER PAR ESTELLE** : valides-tu **A1 seul en premier** ? Veux-tu que je confirme d'abord le mode de signature JWT de ton projet Supabase (ça conditionne A1 vs repli `getSession`) ?

**E. MIGRATIONS / BUILD** : aucun code touché ce STOP (diagnostic seul) ; aucune migration.

**STOP diagnostic.** Ton GO sur A1 (et sur la vérif JWT préalable) déclenche le fix.

---

## Annexe — données brutes exploitées

### Stats agrégées (soft nav, iOS 18.7, 3 derniers jours)

```
=== tap→contenu réel, par transition ===

/moi/discovery → /moi
   SANS squelette (cache SERVI): n=18  min=23  med=36  max=46  moy=35

/moi → /moi/discovery
   AVEC squelette (cache RATÉ) : n=14  min=1488  med=1902  max=2479  moy=1966
   SANS squelette (cache SERVI): n=4   min=23    med=32    max=45    moy=32

/dashboard → /moi
   AVEC squelette (cache RATÉ) : n=3   min=1344  med=2054  max=2180  moy=1859
   SANS squelette (cache SERVI): n=1   25 ms

/moi/wishlist → /moi
   SANS squelette (cache SERVI): n=3   min=23  med=38  max=42  moy=34

/moi → /moi/wishlist
   AVEC squelette (cache RATÉ) : n=1   891 ms
   SANS squelette (cache SERVI): n=2   min=26  max=40  moy=33

/login → /dashboard
   SANS squelette (cache SERVI): n=2   min=21  max=48  moy=35

=== GLOBAL ===
Cache RATÉ  (squelette=oui): n=20  min=891  med=2054  max=7318  moy=2391
Cache SERVI (squelette=non): n=32  min=21   med=36    max=48    moy=34
Part des navigations avec cache raté : 20/52 (38 %)
```

### Extrait chronologique révélateur (même transition, résultats opposés)

```
08:24:19 SOFT /moi → /moi/discovery   tap→contenu 2479ms · squelette:true
08:24:25 SOFT /moi → /moi/discovery   tap→contenu 2129ms · squelette:true
08:24:29 SOFT /moi → /moi/discovery   tap→contenu 1806ms · squelette:true
...
08:29:09 SOFT /moi → /moi/discovery   tap→contenu   28ms · squelette:false   ← caché
08:29:13 SOFT /moi → /moi/discovery   tap→contenu   32ms · squelette:false   ← caché
08:29:18 SOFT /moi → /moi/discovery   tap→contenu 2132ms · squelette:true    ← raté
08:29:23 SOFT /moi → /moi/discovery   tap→contenu   23ms · squelette:false   ← caché

# retour /moi : TOUJOURS instantané
08:24:21 SOFT /moi/discovery → /moi   tap→contenu   39ms · squelette:false
08:24:26 SOFT /moi/discovery → /moi   tap→contenu   40ms · squelette:false
08:27:26 SOFT /moi/discovery → /moi   tap→contenu   24ms · squelette:false
```

### Chemin de code impliqué

- `src/proxy.ts` (Next 16 : ex-middleware) — matcher couvre toutes les routes ; appelle `supabase.auth.getUser()` (réseau) sur chaque requête RSC.
- `src/utils/supabase/middleware.ts` — `setAll` repose les cookies sur token-refresh → réponse non-cacheable.
- `src/utils/supabase/server.ts` — client serveur ; chaque page rappelle `getUser()` (34 pages).
- Versions : Next 16.2.4 · `@supabase/ssr` 0.10.2 · `@supabase/supabase-js` 2.110.1 (`getClaims()` disponible).
