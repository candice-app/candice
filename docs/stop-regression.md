# ⛔ DIAGNOSTIC RÉGRESSION — verdict : aucun commit n'est coupable

Régression signalée (device) : chargements très longs sur tous les clics, squelette visible ~3 s à chaque ouverture, scroll de nouveau perdu au retour — identique en normal ET en privé. Demande : beacons device réels, bisect des 3 derniers commits, cause de la régression AVANT tout fix.

## 1. Tes beacons device, segmentés autour du déploiement (08:44 UTC)

| Fenêtre | `moi→discovery` (médiane) | `discovery→moi` (médiane) | squelette |
|---|---|---|---|
| **AVANT** déploiement (08:22–08:29) | 1 850 ms | **37 ms** | 12/36 |
| **Transitoire** (juste après le push) | *cluster « tout squelette »* | *tout squelette* | **tout** |
| **SETTLED** ~50 min après (09:33–09:34) | 1 819 ms | **35 ms** | 8/16 |

**Le steady-state avant et après le déploiement est identique** : `discovery→moi` reste instantané (37 → 35 ms), `moi→discovery` reste ~1,8 s (1 850 → 1 819 ms). Rien n'a empiré une fois les caches réchauffés.

Ce que tu as ressenti, c'est le **cluster transitoire** : une série de rechargements durs de `/dashboard` où **tout affiche le squelette**. C'est la signature d'un contexte **froid** (navigation privée à chaque fois, et/ou juste après un déploiement).

## 2. Bisect des 3 commits — verdict clair

Les 3 commits (`43948c4` D4, `0f4cb87` coupure, `61f14fa` doc) n'ont touché que **deux fichiers** : `src/lib/discovery/engine.ts` (code **serveur** de sélection discovery) et `docs/revue-banque-questions.html`. **Aucun** ne touche `layout.tsx`, `ScrollMemory`, `PerfBeacon`, `next.config`, ni aucune page/shell/`loading.tsx`.

- **ScrollMemory est toujours monté au layout racine** (ligne 35 de `layout.tsx`) et son fichier est **byte-identique** (modifié le 8 juil, avant ces commits). Aucun commit ne l'a déplacé ni cassé.
- `staleTimes` (cache client) inchangé (180 s).
- **Conclusion : impossible qu'un de ces 3 commits ait re-cassé le scroll ou changé le cache client.** Ce sont des changements 100 % serveur sur la logique discovery.

Détail par commit :

| Commit | Fichiers | Nature |
|---|---|---|
| `43948c4` D4 | `src/lib/discovery/engine.ts` (+83 −52) | serveur — fusion des étages de sélection |
| `0f4cb87` coupure | `src/lib/discovery/engine.ts` (+3 −2) | serveur — flag reformulation |
| `61f14fa` doc | `docs/revue-banque-questions.html` (+1623) | documentation |

## 3. « 56 ms tout à l'heure → squelette maintenant » — je corrige mon propre chiffre

**Le « 56 ms chaud » n'était PAS ton device : c'était mon harnais Playwright** (boucle de mesure D4). Sur **ton** device, `moi→discovery` a **toujours** été ~1,8 s — vérifiable dès 08:24 (2 479 / 2 129 / 1 806 ms), identique à 09:34. Les **seuls** vrais hits device sur cette transition sont une fenêtre fugace à 08:29 (28–45 ms) — un coup de chance du cache back/forward pendant des tapes très rapprochées, jamais fiable. Il n'y a donc **pas** de régression device 56 ms→2 s : j'avais sur-généralisé mon chiffre de harnais, je l'assume.

Note technique : Playwright ne reproduit pas le cache Router de Safari (il clique sans laisser le prefetch se faire pendant l'idle). Mes chiffres « chauds » à moi ne valent donc rien pour la question du cache — **seuls tes beacons device font foi**.

## 4. Le scroll perdu — symptôme, pas régression indépendante

ScrollMemory restaure avec un budget de **20 essais × 60 ms = 1,2 s max** (lignes 60/68/73 de `ScrollMemory.tsx`). Sur un rendu **froid**, le vrai contenu arrive derrière le squelette en **1,3–2,4 s** — **au-delà du budget** : ScrollMemory abandonne, mesure la hauteur du squelette (courte), et revient en haut. Sur un cache servi (instantané), la restauration réussit.

Donc **squelette-3 s et scroll-perdu partagent UNE seule cause : le rendu froid dépasse le budget de restauration.** C'est pire en privé (froid systématique) et juste après un déploiement (caches invalidés). Le code de scroll n'a pas bougé.

## 5. Normal vs privé

Les beacons n'ont pas de drapeau normal/privé, mais **la navigation privée est froide à chaque session par définition** → toujours le chemin raté (squelette + scroll reset). D'où « identique en normal ET privé » : ton test normal tournait aussi à froid (caches vidés par le déploiement récent).

## Cause racine (résumé)

**Le déclencheur de ton ressenti, c'est l'acte de déployer lui-même** : un nouveau build Vercel change le build-ID → **invalide le cache de prefetch de tous les clients** + fonctions serverless froides → pendant ~quelques minutes, **chaque** navigation est froide (squelette partout + scroll qui saute). C'est **transitoire** et ça s'auto-résorbe (tes beacons 09:34 le montrent : `discovery→moi` déjà réchauffé à 35 ms). En dessous, la lenteur persistante de `moi→discovery` est le **problème D2 pré-existant** (route dynamique, cache raté), pas une nouveauté.

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : le cluster « tout squelette » tombe dans une zone où le fuseau d'affichage (`to_char`) et le filtre `::time` divergent d'~2 h ; peu importe le label horaire exact, sa **signature** (rechargements durs répétés + squelette systématique) = contexte froid, non-steady-state.

**B. DÉCISIONS PRISES SEUL** : j'ai relu tes beacons directement dans `perf_beacons` (ton « beacons envoyés »), sans attendre un collage.

**C. LAISSÉ EN SUSPENS** : aucun fix appliqué (STOP demandé). Deux leviers proposés pour ton GO — (i) le **fix D2** (rendre le cache raté peu coûteux : dé-réseauter l'auth du proxy) qui soigne froid + privé + post-déploiement d'un coup ; (ii) **élargir le budget ScrollMemory** (1,2 s → ~3 s) pour que le scroll survive à un rendu froid.

**D. À VÉRIFIER PAR ESTELLE** : refais un aller-retour **maintenant** (déploiement réchauffé depuis ~1 h) — `discovery→moi` doit être instantané et le scroll doit tenir ; si le froid te gêne encore, c'est exactement ce que D2 vise.

**E. MIGRATIONS / BUILD** : aucun code touché, aucune migration — diagnostic seul.

**Aucun des 3 commits n'est coupable d'une régression de code.** La dégradation ressentie = transitoire de déploiement (froid) sur fond de problème D2 pré-existant, plus un budget ScrollMemory trop court pour les rendus froids. Ton GO sur D2 (+ éventuellement l'élargissement ScrollMemory) traite la cause.

---

## Annexe — données brutes exploitées

### Chronologie device (iOS 18.7) — même transition, résultats opposés selon la chaleur du cache

```
# AVANT déploiement — steady-state chaud, discovery raté / retour moi instantané
08:24:19 SOFT /moi → /moi/discovery   2479ms · squelette:true
08:24:21 SOFT /moi/discovery → /moi     39ms · squelette:false
08:24:25 SOFT /moi → /moi/discovery   2129ms · squelette:true
08:24:29 SOFT /moi → /moi/discovery   1806ms · squelette:true

# fenêtre fugace où discovery est servi du cache back/forward (tapes rapprochées)
08:29:09 SOFT /moi → /moi/discovery     28ms · squelette:false   ← hit rare
08:29:13 SOFT /moi → /moi/discovery     32ms · squelette:false   ← hit rare
08:29:18 SOFT /moi → /moi/discovery   2132ms · squelette:true    ← redevient raté
08:29:23 SOFT /moi → /moi/discovery     23ms · squelette:false

# TRANSITOIRE post-déploiement — rechargements durs répétés, TOUT froid, TOUT squelette
08:55:42 HARD /dashboard              ttfb 360ms · navigate
08:55:43 SOFT /dashboard → /moi        771ms · squelette:true
08:55:45 SOFT /moi → /moi/discovery   1998ms · squelette:true
08:55:54 HARD /dashboard              ttfb 207ms · navigate
08:55:56 SOFT /dashboard → /moi       1048ms · squelette:true
08:55:59 SOFT /moi → /moi/discovery   2043ms · squelette:true
08:56:03 HARD /dashboard              ttfb 233ms · navigate
08:56:10 HARD /dashboard              ttfb 174ms · navigate

# SETTLED ~50 min après — retour au steady-state : identique à l'AVANT
09:33:52 SOFT /moi → /moi/discovery   2431ms · squelette:true
09:33:53 SOFT /moi/discovery → /moi     42ms · squelette:false
09:34:05 SOFT /moi → /moi/discovery   1751ms · squelette:true
09:34:06 SOFT /moi/discovery → /moi     36ms · squelette:false
09:34:12 SOFT /moi → /moi/discovery   1507ms · squelette:true
09:34:13 SOFT /moi/discovery → /moi     36ms · squelette:false
09:34:54 SOFT /moi → /moi/discovery   1819ms · squelette:true
09:34:58 SOFT /moi/discovery → /moi     34ms · squelette:false
```

### Stats agrégées par fenêtre (soft nav, iOS 18.7)

```
Déploiement 3 commits (D4/coupure/doc) = 08:44 UTC

AVANT déploiement (08:22–08:29) — 36 soft navs, squelette sur 12/36
   moi→discovery : n=11 med=1850 moy=1321
   discovery→moi : n=11 med=37   moy=36

SETTLED ~50 min après (09:33–09:34) — 16 soft navs, squelette sur 8/16
   moi→discovery : n=7  med=1819 moy=1874
   discovery→moi : n=7  med=35   moy=34
```

### État du code vérifié (non modifié par les 3 commits)

```
src/app/layout.tsx        : ScrollMemory monté ligne 35, PerfBeacon ligne 37 (intacts)
ScrollMemory.tsx          : byte-identique (modifié 8 juil, avant les commits du 13)
next.config.ts            : staleTimes { dynamic: 180, static: 300 } (inchangé)
loading.tsx présents      : moi, moi/discovery, contacts, contacts/[id] (inchangés)
Périmètre des 3 commits   : engine.ts (serveur) + revue-banque-questions.html (doc) UNIQUEMENT
```
