# ⛔ STOP — fixes D2 + scroll livrés, chiffres et vérité

Deux fixes déployés (commits `ae4185a` D2 auth, `1f99243` scroll), Vercel vert sur `1f99243`. **Le fix a atterri et fonctionne — mais il ne suffit pas, seul, à faire tomber les 1,8 s. Voici pourquoi, chiffré, sans enrobage.**

## Ce qui a été livré

- **D2 — auth du proxy dé-réseautée.** `proxy.ts` appelait `getUser()` (aller-retour réseau à l'API Auth Supabase) sur **chaque** requête. Remplacé par `getClaims()` qui **vérifie le JWT en local** (clés asymétriques ES256 du projet, confirmées : JWKS publiée, `alg=ES256`). JWKS mise en cache **au niveau module** et passée à `getClaims({ keys })` → zéro appel réseau par requête sur instance tiède. Sécurité intacte (vérification cryptographique locale). Rafraîchissement des cookies préservé.
- **Scroll — budget de restauration adaptatif.** ScrollMemory abandonnait à 1,2 s (20 × 60 ms). Désormais il retente **tant que le contenu réel n'est pas peint** (`[data-page-ready]`) et que la hauteur ne permet pas la cible, plafond dur 5 s. Un rendu froid (1,3–2,4 s) ne fait donc plus sauter le scroll en haut.

## Mesure — coût du rendu à froid (cache raté), avant/après D2

Playwright mesure **valablement le chemin cache-RATÉ** (rendu serveur complet) — c'est exactement ce que le fix auth cible. (Playwright reste inutile pour le chemin cache-SERVI ; ça, ce sont tes beacons device.)

| froid, 4G (170 ms RTT) | AVANT D2 | APRÈS D2 |
|---|---|---|
| `/moi` | ~1 336–1 838 ms | **1 456 ms** (moy) |
| `/moi/discovery` | ~2 314–2 329 ms | **2 076 ms** (moy) |

**Gain : ~240 ms sur discovery** — cohérent avec **un** aller-retour Auth retiré du proxy. C'est réel, ça profite à **tout** rendu froid (premier chargement, navigation privée, post-déploiement). Mais ce n'est **pas** le « tomber » que tu attends.

## La vérité que ces chiffres révèlent

Le problème n'est pas la vitesse du rendu — c'est que `moi→discovery` est **toujours un cache RATÉ**, et **un cache raté est un aller-retour serveur** : sur mobile, même avec zéro travail serveur, ça coûte plusieurs centaines de ms (round-trip RSC). **Seul un cache SERVI donne 36 ms** — et il fonctionne déjà pour `/moi` (retour), pas pour `discovery` (aller).

Dé-réseauter l'auth **abaisse le coût du raté** (D2 : −240 ms ; un fix jumeau côté pages en retirerait ~autant), mais **ne transforme jamais un raté en servi**. Tant que l'aller vers discovery reste un raté, le plancher est ~1,5 s, pas 36 ms.

**Pourquoi discovery est un raté permanent alors que `/moi` est servi :** Next ne précharge en entier que les routes « pures ». La page `/moi/discovery` **crée une session en base à chaque rendu** (écriture) et lit cookies + `searchParams` → Next la traite comme dynamique-avec-effet et ne met en cache que le squelette. D'où : squelette instantané, puis 2 s de fetch.

## Les vrais leviers pour faire tomber discovery (ta décision — clôture)

1. **Rendre discovery cacheable** : différer la création de session à la 1re *réponse* (le GET devient sans effet de bord) → Next peut précharger la page entière → aller instantané comme le retour. **C'est le seul levier qui vise 36 ms.** Changement d'architecture discovery, modéré, réversible.
2. **Dé-réseauter l'auth des pages chaudes** (`/moi`, `/moi/discovery`) comme le proxy : −~200 ms de plus sur chaque raté. Abaisse, ne supprime pas.
3. **Accepter le squelette + streaming** : shell peint tout de suite, contenu qui arrive en flux. Ne change pas le « tap→contenu réel » mais supprime la sensation de blocage.

Mon avis : **le levier 1 est le seul qui répond à ton objectif** (aller instantané). D2 (fait) + levier 2 sont des réductions de plancher utiles pour le froid/privé, mais pas le nœud de l'aller-discovery.

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : « dé-réseauter l'auth du proxy » était ta consigne exacte ; je l'ai faite telle quelle. La mesure device après-fix n'existe pas encore (tu n'as pas encore navigué depuis le déploiement) — les chiffres device « après » attendent ta navigation.

**B. DÉCISIONS PRISES SEUL** : cache JWKS TTL 10 min au niveau module ; plafond ScrollMemory à 5 s ; mesure froid via Playwright (valide pour le chemin raté uniquement, clairement étiqueté). Je n'ai **pas** touché aux 34 pages `getUser()` (levier 2) ni à l'architecture session (levier 1) — hors de ta consigne, ils attendent ton arbitrage.

**C. LAISSÉ EN SUSPENS** : leviers 1/2/3 (ta décision) ; la dépose de l'instrumentation (60/62, la 63 reste) + vérif commit bascule Phase D = clôture.

**D. À VÉRIFIER PAR ESTELLE** : **navigue maintenant (normal + privé)** → je lis tes beacons device après-fix et je confirme (a) le scroll survit désormais au froid, (b) le retour `/moi` reste ~36 ms. Puis dis-moi quel(s) levier(s) parmi 1/2/3 tu veux avant clôture — ou si on clôture avec D2+scroll seuls.

**E. MIGRATIONS / BUILD** : aucune migration ; `npm run build` ✓ ; 164 tests ✓ ; 2 commits poussés (`ae4185a`, `1f99243`), Vercel **success**.

**STOP.** Le fix est honnête mais partiel : il abaisse le froid de ~240 ms sans rendre l'aller-discovery instantané — seul le levier 1 le ferait. Ta navigation device + ton choix de levier closent le sujet.
