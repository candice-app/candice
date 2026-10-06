# ✅ Corrections post-test Wishlist V2 — R1-R4 (retours device Estelle)

Commit `6fe370b` poussé, **Vercel vert**, compte QA nettoyé.

## R1 — BLOQUANT : l'ajout ne s'affichait jamais → corrigé et prouvé

Diagnostic : l'INSERT était **rejeté par la RLS**, erreur avalée.

- **Wishlist** : `user_id` était typé en prop mais **jamais utilisé** dans l'insert → RLS `auth.uid() = user_id` échouait. Ajouté.
- **Carnet** : `pilot_id` venait d'un `getUser()` client fragile (null → rejet). Remplacé par une **prop serveur `pilotId` déterministe**.
- Les erreurs sont désormais **surfacées** (plus d'échec silencieux).
- **Prouvé end-to-end (local, build prod)** : ajout wishlist **ET** carnet → card visible **+ ligne créée en base**, zéro erreur console.

## R2 — Sheets non responsive → corrigé

- **Viewport verrouillé** (`user-scalable=no`) au layout racine → plus de pinch-zoom.
- Corps de sheet qui **scrolle vraiment** (`flex:1` + `min-height:0`) + **bouton d'action ancré en footer sticky** (`.shFoot`).
- **z-index sheet/backdrop au-dessus de la bottom-nav** : la 2ᵉ option carnet « Renseigner moi-même » était masquée par la nav → maintenant accessible (vérifié : clic OK).

## R3 — Typo carnet « bizarre » → corrigé (2 causes)

1. Polices littérales `Fraunces`/`'DM Sans'` → **`var(--font-serif)`/`var(--font-sans)`** (next/font).
2. Règle globale `label{text-transform:uppercase}` (globals.css) qui **fuyait** sur les `<label>` conteneurs (« AJOUTER UNE PHOTO », « PRENDRE EN PHOTO ») → neutralisée (`!important`, problème d'ordre de couches confirmé). Vérifié : `textTransform = none`.

## R4 — Reco IA (sécurisée, non traitée au fond)

Résultat présenté comme **hypothèse faible** (« Peut-être : … ? », « souvent imprécise — vérifie et corrige ») + **ressaisie manuelle en un tap**. Avertissement « à vérifier » bien visible. **Noté en mémoire pour un traitement dédié** (prompt vision + fallback).

## Preuves prod (captures device-like examinées)

- **Wishlist form** : « Ajouter une photo » en casse normale (R3 ✓), bouton « Ajouter à ma wishlist » ancré en footer (R2 ✓).
- **Carnet mode** : sheet au-dessus de la nav, **deux options visibles** en casse normale (R2 + R3 ✓).

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : aucune — les 4 retours sont reproduits, corrigés et vérifiés.

**B. DÉCISIONS PRISES SEUL** : `!important` sur le reset de casse (override légitime d'un `label` global qui fuit via l'ordre de couches Next) ; erreurs d'ajout surfacées via un petit message (`.errMsg`) ; footer sticky pour les boutons d'action (comportement demandé, s'écarte de la maquette où le bouton scrollait).

**C. LAISSÉ EN SUSPENS** : R4 au fond (prompt vision + fallback) → lot dédié, mémorisé.

**D. À VÉRIFIER PAR ESTELLE** : retest device (ajout wishlist + carnet visibles ; sheets scrollent + bouton ancré ; typo normale ; plus de zoom).

**E. MIGRATIONS / BUILD** : aucune migration ; `npm run build` ✓ ; commit `6fe370b` poussé, Vercel **success** ; QA nettoyé.

**STOP.** R1 (ajout visible) prouvé, R2+R3 corrigés et confirmés en captures prod, R4 sécurisé. À toi de retester sur device.
