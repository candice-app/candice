# ⛔ STOP FINAL — Espace Proche V2, Phase 6 (détail reco + flows offrir / pas-ça / refusées)

Route `/proche/[id]`, onglet Faire plaisir. Phase 6 livrée, poussée, déployée (Vercel vert), **prouvée end-to-end sur prod** (compte QA, données nettoyées). 5 commits atomiques.

## Commits (dans l'ordre)

| Commit | Contenu |
|---|---|
| `8562076` | (pré-Phase 6) fix CAD_S réintégré aux jauges Nous — les 7 dims via PODIUM_LABELS |
| `ab7cf3f` | fix collision `.ph` (boîte blanche vignette + hero) + docs (maquette + spec versionnées) |
| `9624954` | **offrir** — 2 voies (§8) |
| `32a577c` | **pas-ça** — 4 raisons (§3) |
| `09a7de0` | **refusées** — Attentions écartées réactivables (§4) |

## Ce qui est livré (fidèle à Candice_Espace_Proche_COMPLET.html + spec Intelligence Reco)

**Détail reco (§6)** — tap sur une carte → sheet : photo grand (`photo_url`), marque/titre/prix, **bloc certitude selon `source_trace`** (§2 : declared « Sûr à 100% » / spotted « tu l'avais repéré » / deduced « ~X% » anneau + pourquoi / exploratory « on tente »), **pourquoi** (`why_json`, rendu défensif), **tag besoin** (`need_tag`), actions.

**« Je veux l'offrir » — 2 voies (§8)**
- Voie 1 « Je m'en occupe personnellement » → `reserve_reco_item` (RPC atomique, réservation invisible) → `reservation_status=intended` + `reserved_by`. Le reco sort des propositions (filtre `available` serveur + optimiste). *Preuve : reservation intended + reserved_by set.*
- Voie 2 « Candice s'en charge » → **sous-texte adapté au type** (objet = commande/livraison, expérience/resto = réservation, message = écriture), badge **« Bientôt — à l'ouverture de la conciergerie »**, action désactivée proprement.

**« Pas ça » — 4 raisons (§3)** — toutes prouvées en base :
- **goût** → « Es-tu sûr ? » (critère réel `why_json` + certitude % en **vert `--pine`**, jamais `#2A7B5C`) · « Allez, je tente » (garde, aucune écriture) / « Non » → `reco_refusals(gout)` + `status=refused` + **accusé doux « C'est noté »**. Compteur de refus goût **stocké, aucun déclenchement** (workflow croisé = Phase 7).
- **trop cher** → plan d'épargne calculé depuis le prix · « Retirer » → `reco_refusals(budget, reappear_at=+182j)` masqué, **réapparition paresseuse** au filtre lecture (pas de cron).
- **déjà offert** → échelle de « love » premium (un peu/beaucoup/énormément, jamais d'emoji) → `attention_log(status=done, love_level)` + `reservation_status=purchased` (écarté définitivement, fait stocké).
- **pas le bon moment** → **horizon** (Bientôt / quelques mois / grande occasion / plus tard) → `reco_refusals(moment, sub_reason=horizon, reappear_at)` réapparition paresseuse.

**« Attentions écartées » réactivables (§4)** — liste des recos écartées (hors déjà-offert), badge raison sobre, **« Réactiver » en un clic** → `status=active`. Les lignes `reco_refusals` **ne sont pas supprimées** (compteur goût intact pour Phase 7). *Preuve : Refus-gout repassé active, refus conservé.*

## Preuves end-to-end (prod, via l'UI, compte QA)

5 recos DEMO exercées à travers l'interface, écritures vérifiées en base puis **nettoyées** :

| Flow | Écriture confirmée |
|---|---|
| Offrir-self | `reservation_status=intended`, `reserved_by` set |
| Refus-goût | `status=refused` + `reco_refusals(gout, reappear=null)` |
| Refus-budget | `status=refused` + `reco_refusals(budget, reappear≈182j)` |
| Déjà-offert | `reservation_status=purchased` + `attention_log(done, love=beaucoup)` |
| Refus-moment | `status=refused` + `reco_refusals(moment, sub=quelques_mois, reappear≈90j)` |
| Réactiver | `status=active`, refus **conservé** |

Captures examinées : détail, offrir (2 voies), menu pas-ça, goût, accusé, budget, déjà, moment, écartées + après réactivation. Build ✓ · **165 tests** ✓ · QA remis à 0 partout.

## 🔒 DÉCISION VERROUILLÉE (arbitrage Estelle) — « pas le bon moment » = horizon seul

**On garde l'horizon. Le menu de circonstances est REPORTÉ en Phase 8.**

**Raison :** deuil, séparation, période difficile ne sont PAS des raisons de refus d'une reco, mais des **ÉTATS du proche**. Ils appartiennent à `person_states` (bloc « Comment va [Prénom] »), pas à `reco_refusals`. Un état posé une fois doit filtrer **en amont** toutes les recos, plutôt que d'être redéclaré à chaque idée écartée.

**Chaîne cible :**
> état posé (Phase 8, `person_states`) → **filtrage amont des recos** → « pas le bon moment » ne sert plus qu'au **décalage temporel d'une idée précise** (l'horizon actuel).

Conséquence : le `sh-moment` de la maquette gelée (menu deuil/séparation/… + textes tactful) ne sera **jamais** câblé dans `reco_refusals`. Sa logique migre vers le miroir d'état (Phase 8). L'horizon livré en Phase 6 reste tel quel.

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU**
1. ~~« Pas le bon moment » : horizon vs menu de circonstances.~~ **TRANCHÉ** — voir « Décision verrouillée » ci-dessus : horizon conservé, menu de circonstances reporté en Phase 8 (relève de `person_states`, pas de `reco_refusals`).
2. ~~Libellés d'horizon placeholder.~~ **VALIDÉS** (Estelle). Question : « Ce n'est pas le bon moment. Tu la reverrais quand ? ». Dans quelques semaines (+1 mois) / Dans quelques mois (+4) / Beaucoup plus tard (+12) → `reappear_at` (décalage temporel). **4e option « Je la garde pour une occasion » = CONDITION, pas horizon** : réserve SANS date (`reserved_for_occasion`, migration 75), réveil événementiel (moteur reco, futur), libellé écartées distinct « Gardée pour une occasion ». Zéro « Bientôt » dans le wording (réservé aux badges de fonctionnalité à venir, ex. conciergerie). Prouvé end-to-end : temporel `reappear≈120j occasion=false` vs occasion `reappear=NULL occasion=true`.

**B. DÉCISIONS PRISES SEUL**
- **Échelle de « love » incluse** dans « déjà offert » (§3.3, migration 74) : ton cadre disait juste « écarté + fait stocké », mais la maquette + la migration 74 la prévoient → je l'ai câblée (un peu/beaucoup/énormément → `attention_log.love_level`). Dis-moi si tu la voulais hors Phase 6.
- **Anneaux de certitude en `var(--pine)`** (#173E31), pas `#2A7B5C` : la maquette utilise `#2A7B5C` (que tu interdis) → j'ai basculé sur pine. (Les 2 `#2A7B5C` restants du repo sont dans `Podium.tsx`/`ui.tsx` = profil gelé REFERENCE_GELEE, hors périmètre.)
- **Réactiver = `status=active` seul** (sans supprimer les `reco_refusals`) pour préserver le compteur goût de la Phase 7.
- **Réapparition paresseuse** : tri propositions/écartées calculé en JS au rendu à partir de `reappear_at`, **zéro écriture au rendu** (cohérent avec la règle Discovery lazy).

**C. LAISSÉ EN SUSPENS (hors périmètre Phase 6)**
- **Financement échelonné** (« payable en 3× », §3.2) : **omis** — aucun lien `contact_reco_items → finance_plans` n'existe dans le schéma. À câbler quand la config console admin (Estelle) reliera un reco à un `finance_plans` (migration additive à prévoir alors). L'épargne perso, elle, est calculée et affichée.
- **Actions sur les cartes carnet** : retirées (le carnet se gère dans son lot Wishlist V2 CLOS). Le détail d'un item carnet affiche une note au lieu des actions.
- **Exclusion cross-proches** (un reco réservé/offert disparaît pour les *autres* proches) : `contact_reco_items` est owner-only (un pilote) ; la surface proche-facing = **Phase 9**.
- **Workflow croisé invisible** (2e refus goût → validation silencieuse auprès du proche) = **Phase 7**. Le compteur est stocké, rien ne se déclenche.
- **Réglages / Modifier** (header) = placeholders (§12.17, Phase 7).

**D. À VÉRIFIER PAR ESTELLE**
- Ouvre `/proche/<id>` → Faire plaisir : tape une reco (détail), « Je veux l'offrir » (2 voies), « Pas ça » (les 4 raisons), « Attentions écartées » (réactiver).
- ~~La divergence « horizon » est le point qui mérite ton arbitrage.~~ **TRANCHÉ** (décision verrouillée ci-dessus).
- Reste à valider : les libellés d'horizon placeholder (A.2).

**E. MIGRATIONS / BUILD**
- **Migration 75** `supabase-migration-75-reco-refusal-occasion.sql` (`reco_refusals.reserved_for_occasion boolean`, additive) — **appliquée** (validation horizons). 69–74 déjà en place.
- `npm run build` ✓ · **165 tests** ✓ · commits poussés, Vercel vert · QA nettoyé (0 partout).

**PHASE 6 CLOSE.** Détail reco + les 3 flows fidèles et prouvés end-to-end. Arbitrage « horizon » verrouillé. Restent : Phase 7 (workflow croisé invisible + Réglages), Phase 8 (miroir d'état fiche pilote **+ menu de circonstances reporté ici, avec filtrage amont des recos**), Phase 9 (surface proche-facing), Phase 10 (harmonisation univers pilote) — **je n'enchaîne pas, j'attends ton signal.**
