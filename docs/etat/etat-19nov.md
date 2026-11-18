# État au 19 novembre au matin — trois chantiers, tenus séparément

Branche `hsg-respirations-serveur`, sur le Mac d'Estelle. **Non poussée** depuis `fee8dab`.
Commits de la nuit : `b30e9e7`, `1e92831`, puis celui qui porte ce fichier (voir `git log`).
Production : seule la migration 115 a été appliquée (18 nov. 22h23, par Estelle). **Commit servi non confirmé.**

Mandat de la nuit, verbatim : `docs/etat/mandat-nuit-18nov.md`.

---

## 1. Discovery

Source de vérité : `docs/discovery/Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_3.xlsx`,
SHA-256 `1b326ff4ea28d83cc8880e8451d30acff7d31a93962f8c73d3a738fdc5093425` (révision 3, approuvée le 18 nov.).
Le classeur n'a pas été modifié cette nuit. Effectifs recalculés : `docs/discovery/etat-19nov/effectifs.json`.

### 1.1 Causes trouvées (parcours tracé, dix profils en personnage)

| # | Ce qui était observé | Cause exacte | Correction |
|---|---|---|---|
| 1 | « Art & culture » coché, aucune question d'art | La case écrit l'intérêt `art` ; la condition dit « Intérêt *art, musées et expositions* sélectionné ou détecté ». Les deux noms étaient comparés tels quels. « Lecture » ne marchait que parce que les deux noms coïncidaient. | Le nom écrit par la condition désigne la branche des questions qui l'emploient ; un intérêt qui ouvre cette branche satisfait la condition. |
| 2 | « Voyage » coché, les 19 questions de voyage fermées | « Voyage, week-end ou hôtellerie actifs » était lue comme un **contexte de vie** inconnu, au même titre qu'« Achat concret ». | C'est une liste de domaines : un seul suffit ; un nom qu'on ne sait pas rattacher reste non résolu. « Achat concret » reste un contexte. |
| 3 | Un intérêt lu dans un texte libre n'ouvrait pas la branche | Deux vocabulaires jamais reliés : domaine du journal (`books_literature`) et domaine de la banque (`reading`). | Pont écrit pour les seules correspondances sans ambiguïté (22). Six domaines sans correspondance sûre n'ouvrent rien ; la parentalité est laissée dehors volontairement. |
| 4 | Treize branches de la refonte (CRE-, FOO-, THE-…) fermées | Elles s'ouvrent sur `INTEREST.<domaine de la banque>` ; l'intérêt est écrit sous son sujet. | Un intérêt qui ouvre une branche pose le tag du domaine de cette branche. |
| 5 | « Tu préfères pratiquer la céramique… » posé à quelqu'un qui veut apprendre la reliure | Le nom d'une sous-partie (« céramique », « Pratiquant ») était pris pour un autre nom de la branche entière. | « Sous-branche : X (0615) » : la question dépend de la réponse X à la question 0615. 107 dépendances, 75 rapprochées d'une option, 32 non résolues. Table : `docs/discovery/dependances.json`. |
| 6 | « Le romantisme, pour toi… » ouvert avec la branche Relation | « Sous-branche Couple : uniquement si un partenaire existe… » n'est écrit que sur la première question ; les suivantes, réduites au nom, s'ouvraient seules. | Une question qui ne porte que le nom de sa sous-partie hérite de la condition de celle qui l'ouvre. Ici : non résolue, donc non posée. |
| 7 | 202 questions de niveau C ouvertes après huit réponses | Le niveau C était traité comme une profondeur. Le référentiel écrit : « niveau C exige un objet, une action ou une occasion nommés ». | Niveau C = un projet en cours dans le domaine (décision n° 4). Vaut pour la question, quelle que soit l'écriture de sa condition. |
| 8 | Deux générations d'une branche posées comme deux branches | L'onglet 13 n'était pas lu. | Question remplacée jamais proposée d'initiative ; question « distincte et conditionnée » : après la nouvelle, si une facette manque, jamais à sa suite ; un seul pool par domaine ; nouvelle génération devant. |
| 9 | Une réponse en cours de session ne changeait pas la suite | Le lot était figé au début de la session. | Onglet 8 : après chaque réponse, les questions à venir sont réévaluées ; une question fermée entre-temps est sautée sans être marquée posée. |
| 10 | Un double envoi doublait chaque preuve | L'identifiant de source d'une réponse fermée était tiré au hasard. | L'identité d'une réponse est ce qui a été choisi. Même réponse : rien n'est réécrit. Réponse différente : nouvelle source, l'ancienne supersédée et conservée. |
| 11 | L'écran affichait « travel2 », « sportp » | L'identifiant technique servait de titre. | Le nom que le référentiel donne à la branche, ou rien. |

### 1.2 Ce qui a été développé

- **Décision 4** — projets « achat » et « séjour » : saisis par la personne, début et fin, clos ou échus ils n'ouvrent plus rien. Route `/api/discovery/projet`, écran dans `/moi/discovery`.
- **Décision 7** — « Explorer un sujet » dans `/moi/discovery` : choix révocable, un sujet par domaine ; choisir n'écrit aucune connaissance sur la personne.
- **Onglet 13** (coexistence), **onglet 8** (recalcul, niveaux), **onglet 9** (contrats des questions ouvertes : une relation hors contrat n'est jamais écrite comme entité ; deux questions archivées jamais servies).
- Un domaine dont la dernière réponse sur sa place est un rejet n'est plus proposé d'initiative ; sa démarche le rouvre.

### 1.3 Tests réellement exécutés (pile locale, modèle simulé)

| Essai | Résultat |
|---|---|
| `tsc --noEmit` | 0 erreur (copie de travail et Mac) |
| `vitest` complet | 91 fichiers, 928 tests, 0 échec |
| `scripts/local/30` — portes, niveau C, recalcul, contre-exemples, routes HTTP | 34 vérifications, 0 échec |
| `scripts/local/31` — double envoi, réponse modifiée | 5 / 0 |
| `scripts/local/15` — dix comptes, plomberie | 208 / 0 |
| `scripts/local/10`, `12`, `13` — non-régression | 15 / 0, 14 / 0, 40 / 0 |
| `scripts/local/28` — dix profils en personnage, deux lots de réponses | relevé : `docs/discovery/etat-19nov/preuve-dix-profils.md` |
| `next build` (copie de travail, variables locales factices) | réussi, code 0, sur l'état commité |

Contre-exemples couverts : domaine non renseigné, rejet explicite, réponse contradictoire, non-réponse, question retirée de la banque, donnée d'un autre compte.

### 1.4 Onglets du classeur : où va chaque chose

| Onglet | Destination | État |
|---|---|---|
| 00_SYNTHESE | Documentation ; **politique de saturation → logique** | Niveau C : fait. Plafonds (3 par branche, 8 par session, 1 proactive par visite) : la sélection sert 6 par session et 2 par branche, sous les plafonds ; la règle « 1 proactive par visite » n'a pas été vérifiée cette nuit. |
| 0_FICHE_CANONIQUE | Données versionnées (`banque.json`) + logique (conditions, producteur) | Importé, validé. |
| 1_CONTRATS_PAR_REPONSE | Données (options : voie, famille, attribut, valeur, polarité, stabilité) | Porté par la banque ; 71 colonnes non confrontées une à une cette nuit. |
| 2_JOURNAL_V4_V5 | Historique conservé | Non lu par le code, par nature. |
| 3_MATRICE_ATTRIBUTS | Validation à l'import | À confronter (non fait cette nuit). |
| 4_ARBITRAGES_RESIDUELS, 15_REGISTRE_M1_M9 | Documentation des décisions | M1 à M9 dites « appliquées » par le classeur ; application dans le code non reprouvée cette nuit. |
| 5_QUESTIONS_RESTRUCTUREES | Données (questions retirées, remplaçantes) | 114 retirées absentes de la banque active. |
| 6_ALIAS_OPTIONS | Logique de lecture des réponses historiques | **Non raccordé** (4 lignes). Aucune réponse historique à ces questions n'existe ; à raccorder avant qu'il y en ait. |
| 7_CONTROLE_SEMANTIQUE, 10_COUVERTURE | Validation / test | Non rejoués cette nuit. |
| 8_QUALITE_QUESTIONNAIRE | Logique | Q4 (niveaux, recalcul) : fait. Q2 (39 paires « une seule question par intention ») : couvert en partie par l'onglet 13 ; les paires hors onglet 13 **non raccordées**. Q1, Q3 : non reprouvés. |
| 9_CONTRATS_OUVERTS | Données + logique | Relations admises et archives : fait. Schéma d'écriture, portée, permissions `_v2` : importés, **non exécutés**. |
| 11_TABLE_DE_MIGRATION | Historique | Migre à l'intérieur de la banque ; aucune réponse à migrer aujourd'hui. Non raccordé. |
| 12_CONTRAT_DE_QUESTION | Logique (conditions canoniques de la refonte) | **Non confronté** aux conditions de la banque (100 lignes). |
| 13_COEXISTENCE_GENERATIONS | Données + logique | Fait. |
| 14_MATRICE_EXTENSIONS | Logique (5 attributs : `tradeoff_willingness`, `protected_domain`…) | Le classeur dit lui-même « code non raccordé ». Non fait. |
| 16_POLITIQUE_PARAMETRES | Logique (437 lignes : saisies, paramètres `{activité}`) | Un paramètre non résolu n'écrit rien (comportement existant). Politique ligne à ligne non confrontée. |
| 17_DESTINATIONS_CONDITIONNELLES | Logique | Importées (15), **non exécutées** : il faut un lecteur qui qualifie chaque segment. |

### 1.5 Blocages et décisions à prendre

1. **L'onglet « Branches » n'est pas dans le classeur.** 57 questions d'ouverture de branche y renvoient (« Ouverture branche X (voir onglet Branches) »), dont « Quelle place le sport occupe-t-il dans ta vie aujourd'hui ? ». Elles restent non résolues. Il faut l'onglet, ou la règle.
2. **96 énoncés à gabarit sont mal formés** : « Quelle place culture — lecture occupe-t-il réellement dans ta vie ? », « Qu'est-ce que tu recherches d'abord dans sport et activité physique ? ». Ils sont servis tels quels. Liste : identifiants `*.0nnn` des branches historiques (art, cinéma, lecture, musique, séries, théâtre, sport, nature, tech, bien-être, travail…). Réécriture à valider, ou retrait de la rotation en attendant.
3. **« Très peu de place » a deux polarités** dans le référentiel pour la même question à gabarit : `rejet` dans 5 branches (consumption, fragrance, home, nature, work), `absence_de_critere` dans 14 (dont sport, art, lecture). Seul le rejet arrête les questions du domaine. À harmoniser.
4. **Décision 6** (bien-être, déco, vin) — correspondances proposées, non activées : bien-être → `wellbeing` (9 q.) ; déco → `home2` (28) et `home` (10) ; vin → `drinks` (22), sous la garde « ne boit pas ». « Ciné & séries » n'ouvre que le cinéma : séries (`series`, `series2`) à ajouter si tu le confirmes. Manon (déco) n'a aujourd'hui aucune question.
5. **32 dépendances non résolues**, dont « Axe Pratiquant » et « Axe Fan/acheteur » (aucune option ne porte ce mot) : 19 questions de création restent fermées. Il faut dire quelle option de `craft.0614` ouvre quel axe.
6. **Le pont journal → banque** (22 correspondances) et la règle « dernier rejet d'un domaine » sont des lectures que j'ai faites ; elles n'ouvrent que des questions et ne créent aucune connaissance. À relire.
7. **Réponses rattachées au projet** (décision 4) : non fait. Une réponse de niveau C est écrite avec le contrat de son option ; rien ne la lie encore au projet qui l'a ouverte.
8. **Décision 5** (geste « ajouter au Carnet d'envies »), **décision 3** (« Réussite — axe sécurité »), **décision 8** (31 motivations, 11 aides), **600 options de fait**, **68 questions en arbitrage** : non repris cette nuit.
9. La route `/api/discovery/answer` accepte une question que le moteur n'a pas proposée (elle n'écrit que sur le compte de l'appelant). À fermer.

---

## 2. HSG / dictionnaire

- **`normalizeLabel` retirait « thé »** : les accents étaient dépliés avant de reconnaître les articles ; « thé » devenait « the », article anglais. « Thé en vrac » s'enregistrait « en vrac ». Corrigé (un mot accentué n'est jamais un article). Conséquence : la clé d'un libellé contenant « à » ou « thé » change ; aucune donnée réelle n'est concernée (aucun client), des comptes de test peuvent l'être.
- **Le domaine parent d'un intérêt lu** : la consigne du lecteur donne désormais la liste du dictionnaire (29 domaines) au lieu de trois exemples ; s'il n'en trouve aucun, il laisse vide.
- **Ce qu'une personne refuse en texte libre** (« surtout pas de fleurs coupées ») reste en verbatim et en connaissance ouverte. La recommandation le lit par le champ de profil d'origine, pas par le journal. **Une réponse ouverte du Discovery** (« ce qu'il faut éviter dans une attention liée au sport ») n'arrive, elle, ni à la recommandation ni au portrait. Point de dictionnaire à trancher : comment une connaissance ouverte nourrit une recommandation.
- Sur les dix profils : aucun degré inventé (les degrés écrits sont ceux que la phrase établit : « expert » pour « incollable, c'était mon métier », « passion » pour le trail), aucune connaissance sur un proche inscrite comme déclaration personnelle (le souhait de Yasmina pour ses parents reste une connaissance ouverte, marquée comme telle). Ces lectures sont celles de Claude en session, pas celles de l'API servie.

---

## 3. Sécurité

Rien n'a été modifié cette nuit dans le code de sécurité. État inchangé depuis `4f357af`, plus la 115.

- **115 : appliquée en production**, constatée sur relevé (cinq cascades, garde `5a0703b02faf45f9dec4fed8feebf3d8` inchangée, 0 consentement avant et après).
- **Reste à faire avant le paquet final** : parcours permettant au propriétaire de recréer un partage dont le lien, créé par l'ancien code, est sans preuve ; correction de `docs/securite/ordre-de-deploiement.md` (l'intervalle de coexistence n'est pas « aucun flux suspendu ») ; paquet figé (commit exact, migrations et empreintes, ordre 113 → 114 → 116 → 118 → 119 → installation et déploiement → 117, vérifications rejouées sur ce commit, procédure de retour).
- **Preuves de production manquantes** : commit servi ; présence de `CRON_SECRET` ; porte bêta ; dépôts `avatars` et `contact-photos` privés ; sort d'un lien signé après remplacement ; limite de taille de l'hébergeur.
- **Points signalés, non tranchés** : `shared-profile/complete` sans appelant ; `/profil/[id]` transmet l'identifiant du pilote ; fonctions `answer_cross_validation` et `get_pending_cross_validations` appelables par `anon`, non relues ; export sans ce qu'un autre pilote note (avis juridique).
- `git push` et `npm install` (pour `heic-decode`) restent à faire par Estelle.
