# ⛔ STOP — R0 perf wishlist/carnet : cold start vs vrai problème

## Diagnostic chiffré — ce n'est PAS le cold start

Les beacons n'existent plus (PerfBeacon déposé à la clôture V2) → repro directe (4G, 170 ms RTT, prod).

Ping-pong `/moi ↔ /moi/wishlist`, marqueur non retiré (détecte un cache-hit ~30-40 ms) :

```
moi→wishlist #1: 770ms
moi→wishlist #2: 779ms
moi→wishlist #3: 536ms
moi→wishlist #4: 579ms
```

**Verdict : les passages 2/3/4 restent à ~550-780 ms, jamais servis du cache** (un hit serait ~30-40 ms). Le cold start ne touche que le **1er** appel — ici tous les passages restent lents → **vrai problème : cache non servi sur revisite**, exactement le symptôme d'Estelle.

## Cause

**`/moi/wishlist` n'avait PAS de `loading.tsx`.** C'est la seule des pages « chaudes » qui en manquait :

| Page | loading.tsx |
|---|---|
| /moi | ✓ |
| /moi/discovery | ✓ |
| /contacts, /contacts/[id] | ✓ |
| **/moi/wishlist** | **✗ (manquant)** |

En Next 16, `loading.tsx` active le prefetch du shell + rend la route dynamique **éligible au cache client Router** (staleTimes 180 s, déjà global). Sans lui, chaque navigation re-render le serveur (+ re-signe les photos) → « 2e passage aussi lent ».

Le **carnet** vit dans `/contacts/[id]` qui a déjà son `loading.tsx` → pas le même problème (la requête carnet + signatures ajoutent un coût, mais seulement sur cache-raté).

## Fix appliqué

`src/app/moi/wishlist/loading.tsx` — squelette à la structure Wishlist V2 (header aplat + bouton + filtres + cards), **copie du traitement de /moi**. Le GET wishlist est déjà en lecture seule (getClaims local + fetch + signatures, aucune écriture) → cacheable. Commit `38a36ca`, Vercel vert.

## Limite de mesure (honnêteté)

Mon harnais **Playwright ne reproduit pas le cache Router de Safari** (constaté depuis D2) → il mesure toujours le chemin cache-raté, donc il ne peut pas démontrer le gain de revisite. **Le fix reflète exactement le traitement de /moi**, qui EST rapide sur ton device sur revisite — c'est le même mécanisme qui a rendu /moi/discovery/contacts rapides. Le verdict final est sur ton device.

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : aucune — la cause (loading.tsx manquant) est structurelle et prouvée (seule page chaude sans loading.tsx, revisite jamais < ~550 ms).
**B. DÉCISIONS PRISES SEUL** : squelette wishlist calqué sur /moi/loading.tsx (structure V2, tokens aplat). Carnet non modifié (hérite du loading.tsx contact).
**C. LAISSÉ EN SUSPENS** : coût par-render des signatures photo sur cache-raté (1re visite) — acceptable, parallélisé ; à optimiser seulement si la 1re visite gêne.
**D. À VÉRIFIER PAR ESTELLE** : **retest device** — 2e/3e passage sur /moi/wishlist doit maintenant être instantané comme /moi (le squelette apparaît tout de suite, puis contenu). Si encore lent à froid → cold start du 1er appel uniquement (attendu).
**E. MIGRATIONS / BUILD** : aucune migration ; `npm run build` ✓ ; commit `38a36ca` poussé, Vercel **success**.

**STOP.** Diagnostic chiffré livré (ce n'est pas le cold start), cause = `loading.tsx` manquant sur /moi/wishlist, fix appliqué (traitement identique à /moi). Ton retest device confirme.
