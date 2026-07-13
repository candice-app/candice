# ⛔ STOP — leviers 1 + 2 livrés, chiffres

Deux leviers déployés (commits `6674f4a` levier 1, `54541cd` levier 2), Vercel vert sur `54541cd`. D2 + scroll adaptatif (livrés avant) : gardés.

## Ce qui a été livré

- **Levier 1 — GET discovery sans effet de bord.** Le rendu de `/moi/discovery` créait une session (INSERT) + écrivait `last_asked` + la rétro-alimentation **à chaque GET** : une mutation qui empêchait Next de mettre la page en cache client (aller toujours en cache-raté). Désormais :
  - `getNextMicroQuestion` est en **lecture seule** — sélection déterministe du lot, zéro écriture. Rétro-alimentation calculée **en mémoire** (garde exacte), persistée ailleurs (sur `/moi`).
  - La session **naît à la première réponse** (`createDiscoverySession`, route answer), avec le lot déterministe.
  - `DiscoveryFlow` envoie le contexte (lot + position + mode) à la 1re réponse ; ensuite, chemin inchangé.
  - **Validé en local** (build prod) : réponse `/api/discovery/answer` → **200**, avancement question 1 → question 2 correct, **zéro erreur console**. Garde anti-redemande / statuts / « Passer » / complétion : inchangés.
- **Levier 2 — getClaims local sur `/moi` et `/moi/discovery`.** Comme le proxy (D2), ces pages vérifient le JWT **en local** (ES256) au lieu de `getUser()` (aller-retour réseau Auth). Helper partagé `src/utils/supabase/claims.ts` (cache JWKS module unique).

## Mesure — coût du rendu à froid (chemin cache-RATÉ)

Playwright mesure **valablement le cache-raté** (rendu serveur complet). Le chemin cache-SERVI (aller instantané), lui, ne se mesure QUE sur ton device — voir plus bas.

| froid, 4G (170 ms RTT) | avant D2 | après D2 | **après leviers 1+2** |
|---|---|---|---|
| `/moi` | ~1 336–1 838 ms | 1 456 ms | **1 188 ms** |
| `/moi/discovery` | ~2 314–2 329 ms | 2 076 ms | **1 376 ms** |

**Discovery à froid : 2 076 → 1 376 ms (−700 ms).** Plus gros que le seul hop auth : le levier 1 a retiré **les écritures** (session + statuts) du chemin de rendu. Trajectoire complète depuis le début du chantier perf : discovery ~3,3–4,3 s (Haiku) → 2,3 s (D1) → **1,4 s** (leviers 1+2).

## Ce qui reste à confirmer — sur TON device uniquement

Le but du levier 1 n'est pas seulement d'abaisser le raté : c'est de rendre discovery **cacheable** pour que l'aller devienne un cache-SERVI (~36 ms), comme le retour `/moi`. **Playwright ne sait pas reproduire ce cache** (tu l'as montré) — seul ton device tranche.

**Navigue maintenant (normal + privé)**, je lis tes beacons et je confirme :
1. `moi→discovery` : passe-t-il en **cache-servi** (~36 ms, `squelette:false`) au 2e aller, ou reste-t-il un raté (~1,4 s) ? → c'est le verdict du levier 1.
2. Le **scroll tient-il à froid** désormais (budget adaptatif) ?

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : le levier 1 rend le GET pur (condition nécessaire à la cacheabilité), mais c'est Next qui décide in fine de servir l'aller depuis le cache — je ne peux pas le prouver sans ton device. Si l'aller reste un raté malgré tout, on aura quand même gagné les −700 ms de froid ; on avisera.

**B. DÉCISIONS PRISES SEUL** : la rétro-alimentation n'est plus écrite par le GET discovery (elle l'est sur `/moi`) ; si tu ouvres `/moi/discovery` en lien direct sans passer par `/moi`, la garde reste exacte (calcul mémoire) mais la persistance attend une visite `/moi` — sans impact fonctionnel. Levier 2 limité à `/moi` + `/moi/discovery` (tes pages chaudes) ; les 32 autres pages gardent `getUser()`.

**C. LAISSÉ EN SUSPENS** : le verdict device (ta navigation) ; puis la clôture (dépose instrumentation 60/62, la 63 reste ; vérif commit bascule Phase D).

**D. À VÉRIFIER PAR ESTELLE** : navigue normal + privé → « beacons envoyés ». Si `moi→discovery` passe sous la seconde et le scroll tient à froid → **on clôture juste après**.

**E. MIGRATIONS / BUILD** : aucune migration ; `npm run build` ✓ ; 165 tests ✓ (dont le test de garde adapté au GET pur) ; 2 commits poussés (`6674f4a`, `54541cd`), Vercel **success**.

**STOP.** Le froid discovery est passé de 2 076 à 1 376 ms, le flux de réponse est validé fonctionnellement, le scroll a un budget adaptatif. Le verdict « aller instantané » + « scroll tient à froid » est sur ton device — ta navigation le donne, et on clôture si c'est bon.
