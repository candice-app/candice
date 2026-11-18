# Ordre de déploiement — consentements (migrations 113 à 118)

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
| 6 | **Déploiement de B** | A puis B | — |
| 7 | **117** — le serveur nomme toujours le titulaire | B | oui : après B seulement |

La 116 passe AVANT le déploiement. C'est ce qui corrige l'ordre annoncé le 18 nov. après-midi, où le
code de la branche aurait écrit un type (`profile_usage`) que le schéma ne connaissait pas encore.
La seule règle incompatible avec A — le serveur doit nommer celui qui accorde, alors que A crée ses
liens de partage de fiche sans le faire — est isolée dans la 117, appliquée en dernier.

**Les numéros ne sont pas l'ordre** : 115 d'abord, 118 avant le déploiement, 117 en dernier.

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
