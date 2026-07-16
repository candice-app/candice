# ⛔ STOP FINAL — Espace Proche V2, Phases 2 à 5 (coquille + 3 onglets)

Route `/proche/[id]`, plein écran, nav 3 onglets. Phases 2-5 livrées, poussées, déployées (Vercel vert). Décisions du STOP données respectées (option B, ProfileV2 réutilisé, aucune génération LLM).

## Ce qui est livré (fidèle à Candice_Espace_Proche_COMPLET.html)

**Coquille (Phase 2)** — header aplat vert, nav 3 onglets ([Prénom]/Nous/Faire plaisir), **bouton Accueil** (sortie → `/dashboard`) sur chaque onglet. Vert dominant, champagne accent, aucun vert criard.

**Onglet [Prénom] (Phase 3)** — header identique pilote (avatar+caméra, jauge « Candice commence à le connaître », CTA « Améliorer encore sa connaissance de [Prénom] »), **épingle dynamique** (anniversaire depuis `date_de_naissance` → « Son anniversaire dans X semaines », sinon générique), bloc **« Comment va [Prénom] » compact** → sheet (champ texte + micro au bout + états à cocher) **écrivant `person_states`** (prouvé end-to-end : subject_kind=contact, state=stress). **Sections profil = ProfileV2 réutilisé** (`embedded` : masque header/wrapper) → identique au pilote (§15), zéro duplication. Vue `proche_espace` (matrice de visibilité). Contact non-utilisateur → faits + **accroche d'enrichissement** (« Souhaites-tu développer ce que Candice sait de [Prénom] ? », questions = lot Discovery, non figées).

**Onglet Nous (Phase 4)** — duo **sans cœur** (séparateur discret §14.3), « Vous deux » + « prendre soin de lui » (§14.4). **Jauges superposées** (dimension_scores pilote vs proche, même échelle À doser/Présent/Dominant, légende Toi/Lui) quand les deux profils ont des scores ; sinon accroche d'enrichissement (proche non-utilisateur = pas de comparatif, décision B).

**Onglet Faire plaisir (Phase 5)** — filtre source = **`<select>` classique** (Toutes/Candice/Repéré, §14.4), recos depuis `contact_reco_items` (multi-types, certitude en **%**, tags source **sobres** — « Idée de Candice » sage / « Repéré par toi » champagne, aucun vert criard §14.5), **carnet intégré** en liste (« Repéré par toi » / « Sûr — tu l'avais repéré », §14.13), lien **« Attentions écartées »** (`reco_refusals`). États vides élégants (Candice, jamais « informations insuffisantes »).

## Preuves & vérifs

- **person_states** : écriture du bloc « comment il va » prouvée end-to-end (pas de RLS silencieuse), nettoyée.
- Captures prod examinées : onglet [Prénom] (épingle verte, ProfileV2 embedded, enrichissement), Nous (duo sans cœur + enrichissement), Faire plaisir (recos + carnet, avec données démo insérées puis **nettoyées**).
- `npm run build` ✓ · **165 tests** ✓ (test matrice mis à 5 vues).

## Écarts / décisions (dans le périmètre validé)

- **Actions « Je veux l'offrir » / « Pas ça »** = **placeholders** — les flows (offrir 2 voies, refus argumenté, workflow croisé) sont **Phases 6-9**, hors de ce STOP.
- **Réglages / Modifier** (header) = placeholders (Réglages câblé en Phase 7, §12.17).
- **QA (Thibaud non-utilisateur, 0 analyse)** : [Prénom] = faits + enrichissement ; Nous = enrichissement ; Faire plaisir = vide → **état ATTENDU (décision 5)**, pas un bug. La richesse s'active avec un proche-utilisateur partagé (chemin câblé) ou l'analyse contact (lot ultérieur).
- **Micro-questions « Pour mieux viser »** = lot Discovery (non figées).

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : aucune bloquante — les décisions A-E du STOP données ont cadré l'implémentation.
**B. DÉCISIONS PRISES SEUL** : vue `proche_espace` ajoutée à la matrice (rendu identique pilote, 3e pers.) ; `ProfileV2.embedded` (masque header) ; reset `.wrap :where(button)` (correctif spécificité : l'épingle/save s'affichaient blancs) ; jauges mappées sur MOT/CAD_C/EXP/GES/SER/SUR.
**C. LAISSÉ EN SUSPENS** : Phases 6-10 (détail reco, flow « Pas ça » + workflow croisé, miroir d'état fiche pilote, surface proche-facing, harmonisation univers pilote).
**D. À VÉRIFIER PAR ESTELLE** : ouvre `/proche/<id>` (les 3 onglets, la nav, le bouton Accueil, le bloc « comment il va » qui enregistre). Le rendu te convient-il avant d'attaquer les flows (Phase 6+) ?
**E. MIGRATIONS / BUILD** : aucune nouvelle migration (69-74 déjà appliquées) ; build ✓ ; 165 tests ✓ ; commits Phases 2-5 poussés, Vercel success ; données QA propres.

**STOP FINAL des Phases 2-5.** Coquille + 3 onglets fidèles et navigables. Restent les flows (Phases 6-9) + harmonisation (Phase 10) — à ton signal.
