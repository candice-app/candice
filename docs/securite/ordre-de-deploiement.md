# Ordre de déploiement — mise à jour du 19 nov. (soir) : migrations 113 à 122

**État de départ, selon Estelle (19 nov., 18h54)** : la 115 est déjà appliquée en production. Le commit
réellement servi n'est pas confirmé. Le contrôle en lecture seule (`etat-production-lecture-seule.sql`)
reste la première étape.

**Ce que le contrôle SQL prouve, et ce qu'il ne prouve pas** (correction du 19 nov., 19h56) : il confirme
l'état du SCHÉMA — migrations présentes, empreinte de la garde, clés étrangères, politiques. Il ne
confirme PAS le commit servi : une base ne sait pas quel code tourne. La preuve du déploiement est
séparée : chez l'hébergeur, le commit du déploiement en production et son statut, relevés par Estelle.
Tant qu'elle n'est pas faite, on écrit « commit servi non confirmé ».

| Étape | Action | Code qui tourne | Rejoué localement |
|---|---|---|---|
| 0 | Contrôle lecture seule de la production | A (non confirmé) | — |
| 1 | **113** | A | A × 113 (18 nov.) |
| 2 | **114** | A | A × 114 (18 nov.) |
| 3 | **116** | A | A × 116 (18 nov.) |
| 4 | **118** | A | A × 118 (18 nov.) |
| 5 | **119** | A | inclus dans A × 122 |
| 6 | **120** — stabilité non établie | A | inclus dans A × 122 |
| 7 | **121** — réglage d'usage par le proche, sans client privilégié | A | inclus dans A × 122 |
| 8 | **122** — prénoms des partages, sans client privilégié | A | A × 122 : 18/18 |
| 9 | **Déploiement de B** (commit figé dans le paquet final) | A puis B | B × 122 : 18/18 |
| 10 | **117** — en dernier | B | B × 117 : 18/18 |

États ajoutés le 19 nov. au soir (sorties : `preuves-transition/`), modèle simulé :

| État | Régler un usage | Lien de partage | Résultat |
|---|---|---|---|
| A × 122 — ancien code, toutes les migrations avant le déploiement (coexistence) | route absente (404) | marche | 18/18 |
| B × 120 — nouveau code avant la 121 (déployé trop tôt) | **503, refusé fermé** | marche | 18/18 |
| B × 122 — nouveau code avant la 117 | marche (200) | marche | 18/18 |
| B × 117 — état final | marche | marche | 18/18 |
| B × 117, 121 et 122 retirées (retour arrière des fonctions) | **503, refusé fermé** | marche | 18/18 |
| A × 117 — retour à l'ancien code après la 117 | route absente | **suspendu, refusé fermé** (connu : 117-ROLLBACK) | 17/17 |

Les invariants (« un tiers ne lit rien », « sans autorisation rien du proche ne part au modèle », etc.)
tiennent dans les six états. Le retrait de la 122 n'est pas couvert par cette preuve : la page
/moi/partage affiche alors « Quelqu'un » — établi par lecture du code, non rejoué.

---

# (Historique) Ordre de déploiement — migrations 113 à 119

État de départ, relevé en production le 18 nov. à 15 h 26 (requête en lecture seule) : code `680f896`
(« A »), schéma jusqu'à la 112, garde `5a0703b0…`, **0 consentement, 0 fiche reliée, 0 invitation
utilisée, 0 lien de partage réclamé**. Code à déployer : la branche `hsg-respirations-serveur` (« B »).

## L'ordre

| Étape | Action | Code qui tourne | Dépend du code ? |
|---|---|---|---|
| 1 | **115** — effacer un compte emporte ses consentements | A | non |
| 2 | **113** — confirmation du lien par le proche | A | non |
| 3 | **114** — portée figée avant acceptation | A | non |
| 4 | **116** — deux sens, deux lignes ; fermeture des lectures directes | A | non : compatible A **et** B |
| 5 | **118** — ce qui a été calculé avec les données d'un proche suit son autorisation | A | non : compatible A, **requise par B** |
| 6 | **119** — limites d'envoi des courriels | A | non : compatible A, **requise par B** |
| 7 | **Déploiement de B** (après `npm install` : deux dépendances ajoutées) | A puis B | — |
| 8 | **117** — le serveur nomme toujours le titulaire | B | oui : après B seulement |

La 116 passe AVANT le déploiement. C'est ce qui corrige l'ordre annoncé le 18 nov. après-midi, où le
code de la branche aurait écrit un type (`profile_usage`) que le schéma ne connaissait pas encore.
La seule règle incompatible avec A — le serveur doit nommer celui qui accorde, alors que A crée ses
liens de partage de fiche sans le faire — est isolée dans la 117, appliquée en dernier.

**Les numéros ne sont pas l'ordre** : 115 d'abord ; 118 et 119 avant le déploiement ; 117 en dernier.

## Chaque état, observé

Preuve : `scripts/local/23-preuve-transition.mts`, jouée contre le vrai code (A extrait de
`origin/main`, B la branche) sur une base reconstruite depuis la baseline, migration par migration,
dans l'ordre ci-dessus. Modèle de recommandation **simulé** : il sert à lire ce qui lui est envoyé.
Sorties complètes : `docs/securite/preuves-transition/`.

| État | Lien de partage | Demande de fiche | Lecture directe de l'analyse entière | Invitation | Proposer son analyse | Régler un usage | Effacer un compte | Résultat |
|---|---|---|---|---|---|---|---|---|
| A × 112 (production aujourd'hui) | marche | marche | **ouverte** (défaut ancien) | marche | marche | route absente | **échoue** | 17/17 |
| A × 115 | marche | marche | ouverte | marche | marche | absente | réussit | 17/17 |
| A × 113 | marche | marche | ouverte | marche | marche | absente | réussit | 17/17 |
| A × 114 | marche | marche | ouverte | marche | marche | absente | réussit | 17/17 |
| A × 116 | marche | marche | **fermée** | marche | marche | absente | réussit | 17/17 |
| A × 118 | marche | marche | fermée | marche | marche | absente | réussit | 18/18 |
| B × 118 | marche | marche | fermée | marche | marche | **marche** | réussit | 18/18 |
| B × 117 (état final) | marche | marche | fermée | marche | marche | marche | réussit | 18/18, puis les scripts de preuve : 0 échec |

La dix-huitième vérification (« la recommandation est enregistrée ») a été ajoutée avec la 118 : les
états A × 112 à A × 116 ont été joués avant, à 17 vérifications.

Sept invariants sont vérifiés dans **tous** les états, y compris ceux ci-dessous : un tiers ne lit
rien ; le proche ne lit pas l'analyse du pilote avant proposition et acceptation ; sans autorisation
rien du profil du proche ne part au modèle ; autoriser un usage n'ouvre pas l'analyse du pilote ; la
version A garde la lecture du profil lié désactivée ; ce qui part au modèle est exactement ce qui a
été autorisé ; la fiche servie ne déborde pas de la section partagée.

**Aucun intervalle ne rouvre une lecture.** La lecture directe de l'analyse entière est un défaut
ancien, ouvert aujourd'hui en production ; elle reste ouverte jusqu'à l'étape 4 et se ferme là. Rien
ne s'ouvre qui était fermé.

## Ce qui est suspendu, et quand

| Moment | Flux suspendu | Comportement |
|---|---|---|
| A × 116 (entre les étapes 4 et 5) | Sur la page d'un proche relié, le bloc « ce que Candice a compris de lui » lu par l'ancienne voie | n'affiche rien — établi par lecture du code, non rejoué ; la fiche partagée `/fiche/…` marche (rejoué) |
| Pendant le déploiement (A et B coexistent sur 116) | aucun | un lien de partage créé par A pendant cet intervalle reste **sans preuve** : B ne l'ouvrira pas, il faudra le recréer |
| Après 117 | aucun avec B | — |

## Si quelque chose tourne mal

| Cas | Observé | Que faire |
|---|---|---|
| Le déploiement de B échoue ; A continue sur 116 | A × 116 : 17/17, tout marche | rien ; ne pas appliquer la 117 |
| On revient à A **après** la 117 | A × 117 : le lien de partage de fiche est refusé (fermé, « ce lien n'est plus valide ») ; tout le reste marche (16/16) | si le retour dure : `supabase-migration-117-ROLLBACK-tolerance-de-transition.sql` — rejoué : A × 116 de nouveau 17/17 |
| Une migration échoue en cours | chaque fichier est transactionnel : tout ou rien | corriger, rejouer ; toutes sont rejouables |
| La 116 trouve une ligne `contact_analysis` portant autre chose que « analysis » | elle **s'arrête** et le dit (essayé) | inventorier ; en production la table est vide |
| B déployé trop tôt, avant la 116 (B × 114) | régler un usage → 500, **fermé** ; rien d'autre ne casse (17/17) | appliquer la 116 |
| B déployé avant la 118 (B × 116) | une recommandation n'est **pas enregistrée** (la branche écrit sa provenance, les colonnes manquent) ; si elle dépendait du proche, elle n'est pas renvoyée non plus (500) ; le réglage d'usage marche (18/18) | appliquer la 118 |
| B déployé avant la 119 | aucun courriel déclenché par un utilisateur ne part (invitation, rappel, relance, demande, export) : la réservation échoue, **fermée** — établi par test unitaire, non rejoué par les routes | appliquer la 119 |
| B déployé sans aucune migration (B × 112) | invitation, proposition d'analyse et réglage d'usage **suspendus** ; aucune lecture ouverte (16/16) | appliquer 115, 113, 114, 116 |

## Contrôles à chaque étape (lecture seule)

Relancer `docs/securite/etat-production-lecture-seule.sql` après chaque migration. Empreintes
attendues de la garde (`fonction_md5`) :

| Après | Empreinte |
|---|---|
| 112 (aujourd'hui) et 115, 113 | `5a0703b02faf45f9dec4fed8feebf3d8` |
| 114 | `356ee05b790f64fe5b5edfaabf3f7ad5` |
| 116 et 118 | `0c565f746e16cbdc14de220f1c0ba6f4` |
| 117 | `c2b4eff6e095c87bc10d8d22783083ac` |

Après la 115 : `cles_etrangeres` vaut « c » sur les cinq lignes. Après la 113 : `colonnes_lien` contient
`proche_lien_confirme_par` et `proche_lien_confirme_le`. Après la 116 : `politiques` ne contient plus
`viewer_read_shared_self_analysis` ni `proche_reads_pilot_self_state`.

## Limites de cette preuve

Base locale reconstruite depuis les fichiers du dépôt : sa garde, ses clés étrangères et ses
politiques coïncident avec le relevé de production, mais ce n'est pas la base de production. Les
tables du service d'authentification sont celles de la pile locale. Le déploiement lui-même
(commit servi, réussite) ne se lit que chez l'hébergeur.

## Ce que le déploiement de la branche change en dehors de la base

- **Deux dépendances** : `heic-decode` (décodage des photos d'iPhone) et `sharp` déclarée directement (elle n'était présente que par Next). `npm install` avant le build.
- **Variables d'environnement** : aucune nouvelle. `CRON_SECRET` doit exister et faire au moins 16 caractères, sinon toutes les tâches planifiées répondent 401 (c'est voulu).
- **Limite de l'hébergeur** : une requête de dépôt ne dépasse pas ~4,5 Mo sur une fonction Vercel. Le serveur accepte jusqu'à 20 Mo, mais une photo plus lourde que la limite de l'hébergeur sera refusée avant d'atteindre le code. À vérifier sur un vrai iPhone après déploiement.
