# ✅ Clôture — lot Refonte Profil V2

Commit de clôture `ca8e456`, Vercel vert. Vérifié en prod.

## 1. Instrumentation perf déposée

- `PerfBeacon.tsx` + `/api/perf-log` supprimés du code, retirés du layout racine ; endpoint bien mort en prod (**404**).
- **Migration 64** appliquée : `DROP perf_beacons` (table temporaire des migrations 60/62).
- **Migration 63 conservée** (`profile_completion.personalized_text`, pré-calcul D1 inactif) — vérifié.
- **Marqueurs `data-page-ready` gardés** : ScrollMemory en dépend désormais pour son budget de restauration adaptatif (retirer les beacons ne devait pas casser le scroll).

## 2. Wishlist partageable retirée

Jamais validée — la wishlist ne s'exprime QUE fondue dans les idées de Candice.

- `invite_filtre.wishlist` : `filtered_off` → `never` (jamais montrée aux tiers).
- Retirée de `SHARE_GROUPS` (plus cochable au partage).
- Rendu wishlist partagée retiré de `ProfileV2` ; fetch retiré de `fiche/[consentId]`.
- **Wishlist pilote (`/moi/wishlist`) intacte** — lien présent en prod ✓.

## 3. Bascule Phase D vérifiée

Commit `f15ca68` (déjà en place) : ancienne maquette `REFERENCE_VALIDEE` supprimée (229 lignes, absente disque + git), `CLAUDE.md` pointe sur la V2 gelée. Rien à corriger.

## Vérifications

- **Smoke prod** : `/moi` ✓, `/moi/discovery` ✓, lien « Ma wishlist » pilote présent ✓, aucune erreur console hormis le 404 attendu du beacon déposé.
- `npm run build` ✓ · **165 tests** ✓.

## Le chantier perf en une ligne

Discovery : ~3,3–4,3 s (reformulation Haiku dans le rendu) → **aller instantané ~21 ms au 2e passage** sur device (levier 1 : GET rendu cacheable via création de session déférée), scroll qui tient à froid (budget de restauration adaptatif). Objectif atteint, confirmé par les beacons device.

### Trajectoire complète (froid, 4G, harnais)

| étape | `/moi/discovery` à froid |
|---|---|
| départ (Haiku dans le rendu) | ~3 300–4 300 ms |
| D1 (reformulation hors rendu) | ~2 320 ms |
| D4 (fusion des étages) | ~2 320 ms |
| D2 (auth proxy locale) | 2 076 ms |
| leviers 1+2 (GET pur + auth pages) | **1 376 ms** |
| **device, 2e passage (cache servi)** | **~21 ms** |

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : aucune.

**B. DÉCISIONS PRISES SEUL** : commit de clôture unique (comme demandé « dernier commit ») regroupant les 3 volets + les docs `stop-*.md` du lot ; marqueurs `data-page-ready` conservés (load-bearing pour ScrollMemory) plutôt que supprimés avec le reste de l'instrumentation.

**C. LAISSÉ EN SUSPENS** : deux mockups non-suivis `Candice_Maquette_Carnet_Envies_V2.html` et `Candice_Maquette_Wishlist_V2.html` — **pas de moi, hors périmètre, non touchés** (probablement le travail pour les lots Carnet d'envies / Wishlist à venir). `.claude/settings.local.json` modifié laissé tel quel.

**D. À VÉRIFIER PAR ESTELLE** : rien de bloquant — le lot est clos. Éventuel ultime aller-retour normal + privé pour confirmer le ressenti, mais les beacons l'ont déjà tranché.

**E. MIGRATIONS / BUILD** : migration **64 appliquée et vérifiée** (perf_beacons supprimée, 63 conservée) ; `npm run build` ✓ ; 165 tests ✓ ; commit `ca8e456` poussé, Vercel **success**.

**Lot Refonte Profil V2 : clos.** 🎯
