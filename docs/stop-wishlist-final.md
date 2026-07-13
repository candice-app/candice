# ⛔ STOP FINAL — lot Wishlist V2 + Carnet d'envies (Phases C·D·E)

Phases C → D → E livrées, poussées, déployées (Vercel vert). Migrations 65/66/67 (B) + 68 (E) appliquées et vérifiées. Commits : `00719cd` (C), `44912c2` (D), `0e30044` (E).

## Fidélité aux maquettes (captures prod vérifiées)

| Écran | Verdict |
|---|---|
| **Ma wishlist** (`/moi/wishlist`) | Fidèle : header aplat vert (brand + Profil + « Ma wishlist » + badge « Privé — traduit en suggestions, jamais montré tel quel »), bouton Ajouter, filtres occasion, cards (envieTag **J'EN RÊVE** / **PETIT PLAISIR**, marque, titre Fraunces, meta taille/prix/destinataire, actions Modifier / On me l'a offert). |
| **Sheet Nouvelle envie** | Fidèle : hint pudeur, zone photo (« Sinon, Candice utilisera l'image du lien web »), Ce que c'est / Marque / Lien web / Taille ou référence / Prix indicatif / Niveau d'envie / Occasion / De qui aimerais-tu la recevoir. |
| **Carnet d'envies** (fiche proche) | Fidèle : intro « Carnet d'envies de {Prénom} », bouton Ajouter, « N ENVIES REPÉRÉES », cards avec badge **VU** (champagne/caméra) et **ENTENDU** (pine/casque), citation italique, meta prix+occasion, Modifier / Offert. |
| **Sheets carnet** | Fidèle : mode (Prendre en photo / Renseigner moi-même), IA (« Candice pense avoir reconnu ce produit — vérifie avant d'enregistrer »), formulaire. |

## Ce qui est branché

- **Wishlist** : ajout DIRECT (pas d'IA), photo (bucket contact-photos, URL signée 1h), aperçu de lien OpenGraph si pas de photo, niveau d'envie, occasion, ciblage destinataire (`target_recipients`, vide = n'importe qui). « On me l'a offert » → trace `attention_log` (status `done`) + retrait de la liste.
- **Carnet** : deux modes — photo → identification IA (Haiku vision, toujours « à vérifier ») + manuel. Backing `carnet_envies_items` (fusion faite). Badge source Vu/Entendu, **état neutre (sans badge) pour `source=NULL`** (lignes W2). « Offert » → `statut='offert'`.
- **Réservation invisible (Phase E)** : machine à états sur `my_wishlist_items` (available → intended → purchased) via RPC atomiques SECURITY DEFINER (`reserve_wishlist_item`, `confirm_wishlist_purchase`). **Vérifiée** (2 proches simulés) : atomicité (already_taken), garde propriété (not_yours), relâche (declined→released), achat définitif, garde-fou de péremption (intention expirée redevient réservable). Invisible du pilote (l'UI wishlist ne lit pas ces colonnes).

## ⚠ ÉCARTS SIGNALÉS (je ne tranche pas — ton arbitrage)

1. **Carnet intégré dans la fiche proche existante** (DashboardShell + sections `À retenir`), **pas** dans le header/onglets de la maquette carnet. Ceux-ci relèveraient d'une **refonte de la fiche proche** (header proche, tabs Aperçu/Carnet/Idées/Dates/Infos) — hors périmètre du lot Carnet. Le *contenu* carnet est au pixel ; le *chrome* est celui de la fiche actuelle.
2. **Placeholder photo des cards** : une seule icône neutre (livre côté wishlist, image côté carnet) au lieu des icônes variées par item de la maquette (personne/cadeau/livre). Purement cosmétique.
3. **Surface proche de réservation (Phase E)** : la machine à états + RPC sont en place et testées, mais **le point d'entrée où un proche réclame un cadeau n'existe pas** (la surface de reco proche-facing n'est pas construite). C'est un **lot ultérieur** — je n'ai rien inventé.
4. **« Ça t'a plu ? » (satisfaction)** : la trace d'attention est enregistrée à l'« offert » ; la question de satisfaction (feedback `juste`/`a_cote`/`pas_le_moment`) est un **prompt Candice futur**, pas une UI construite ici.

## Arbitrage demandé — péremption réservation

Délai par défaut proposé : **30 jours** (paramètre `p_days` des RPC). Au-delà, une intention non confirmée redevient disponible (garde-fou anti-blocage). **Tu tranches** — je peux ajuster en une ligne.

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : source du carnet inférée au save (photo→seen, sinon phrase→heard, sinon lien→link, sinon neutre) — heuristique fidèle à la sémantique de la maquette.
**B. DÉCISIONS PRISES SEUL** : modules CSS scopés (transcription verbatim des maquettes) plutôt qu'inline ; `attention_log` réutilisé pour la trace « offert » (structure existante, rien inventé) ; identification IA via Haiku vision ; contact synthétique « Thibaud » créé sur le compte QA pour les captures (données [DEMO] nettoyées après).
**C. LAISSÉ EN SUSPENS** : écarts 1-4 ci-dessus ; le délai de péremption (ton arbitrage).
**D. À VÉRIFIER PAR ESTELLE** : retest device des deux écrans vs maquettes ; validation des 4 écarts ; arbitrage péremption 30 j.
**E. MIGRATIONS / BUILD** : **65/66/67 + 68 appliquées et vérifiées** ; `npm run build` ✓ ; 165 tests ✓ ; commits C/D/E poussés, Vercel **success**.

**STOP FINAL.** Lot livré et fidèle. Restent ton retest, la validation des 4 écarts et l'arbitrage péremption — puis clôture.
