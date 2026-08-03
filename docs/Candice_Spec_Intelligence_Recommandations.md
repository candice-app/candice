# Candice — Spec Intelligence des Recommandations & Interaction Proche

> Document de vérité pour le **lot Espace Proche V2 + moteur de reco (couche certaine)**.
> Gravé le 14/07/2026. À reprendre intégralement dans le prompt Claude Code (design **ET** technique).

---

## 1. Principe fondateur : « selon le proche, pas selon nous »

Candice ne devine jamais « à notre place ». Toute reco s'appuie sur **ce que le proche
est / aime / a déclaré**, jamais sur une supposition du pilote. Quand le pilote veut
refuser une idée, Candice a le droit (avec tact) de **le contredire** au nom de ce que le
proche a lui-même manifesté. C'est la valeur centrale du produit.

**Règle de pudeur maintenue** : on ne dévoile JAMAIS qu'une envie a été exprimée par le
proche lui-même. On traduit toujours en **niveau de certitude** (voir §2).

---

## 2. Système de certitude affiché sur chaque reco

Chaque reco porte un indicateur de fiabilité, au ton différent selon sa **source**
(`source_trace`) :

| Source | Affichage | Ton |
|---|---|---|
| **Envie déclarée** par le proche (sa wishlist) | « Sûr à 100% — fais-moi confiance » | Affirmatif, jamais « c'est lui qui l'a demandé » |
| **Envie repérée** (carnet du pilote) | « Sûr — tu l'avais repéré pour lui » | Affirmatif |
| **Déduction forte** du moteur (plusieurs données croisées) | « Sûr à ~85% que ça lui plaira » + **pourquoi** | Argumenté (les critères) |
| **Déduction exploratoire** (faible certitude, cohérent profil) | « Thibaud aime ce genre de choses… Candice se dit qu'elle pourrait le surprendre. On tente, juste cette fois ? » | Invitation à tenter |

Le **pourquoi** (les critères/données ayant mené à la reco) doit être consultable —
surtout au moment d'un refus « pas son goût ».

---

## 3. Flow « Pas ça » — 4 raisons, chacune argumentée + traitée techniquement

Cliquer « Pas ça » n'écarte pas sèchement : Candice demande **pourquoi** (menu de raisons),
et réagit **différemment** selon la raison. Chaque refus est **stocké** et **exploité**.

### 3.1 « Ce n'est pas son goût / il n'aimerait pas »
- Candice **s'interroge** et **affiche son % de certitude** + **pourquoi** elle a proposé ça.
- Si **envie déclarée** → « À 100%, fais-moi confiance : c'est exactement ce qui lui plairait. »
  (sans dévoiler qu'il l'a demandé)
- Si **déduction** → montre les critères (« il aime X, et Y, donc… ») et **pousse gentiment** :
  « Et si tu tentais, juste cette fois ? L'app est faite pour suivre ce qu'il aime, lui. »
- Stockage : si le pilote maintient, on enregistre le rejet **de goût** → ajuste le moteur.

### 3.2 « C'est trop cher / hors budget »
Ce n'est PAS un rejet de goût — Candice traite la **contrainte financière** :
- **Plan de financement** : si l'attention a été configurée (dans la **console admin**, par
  Estelle) comme **payable en plusieurs fois**, on l'affiche (« payable en 3× »).
- **Épargne personnelle** (pas de flux d'argent chez nous — le pilote met de côté lui-même) :
  « Si tu mets X€ de côté chaque semaine, dans X mois tu peux lui offrir. » Candice calcule le
  plan à partir du prix et d'un rythme d'épargne.
- **Question** : « On garde l'idée en mémoire, ou on la retire ? »
  - **Garder** → l'attention reste, marquée « en projet / épargne ».
  - **Retirer définitivement** → on enregistre la **raison = financière** ; on ne la re-propose
    pas à court terme ; **réapparition automatique ~6 mois plus tard**, pour une **occasion plus
    grande** (anniversaire, Noël) où le budget est plus naturel.

### 3.3 « Je l'ai déjà / je lui ai déjà offert »
- On **note** que c'est fait (trace d'attention accomplie).
- On demande : **« Super — et est-ce qu'il a aimé ? »** avec une **échelle** :
  un peu · beaucoup · énormément (échelle de "love").
- Ce retour **nourrit l'analyse relationnelle** et le moteur (calibrage de ce qui marche).

### 3.4 « Ce n'est pas le bon moment »
- **Menu déroulant de raisons** (deuil, séparation, maladie, période difficile, surcharge,
  déménagement, autre…) — à cocher, pour **stocker** et savoir comment réagir.
- Candice **regarde l'état déclaré du proche** :
  - Si le proche a déclaré que « en ce moment ça ne va pas » → Candice **s'interroge**, vérifie
    si elle a fait une erreur de timing.
  - Cas **deuil** (ou circonstance intime) → Candice regarde **comment le proche a déclaré
    aimer qu'on prenne soin de lui dans ces circonstances**, et se permet de **contredire avec
    tact** :
    > « Cette attention ne te paraît sûrement pas adaptée — le deuil est quelque chose de très
    > intime. Mais Thibaud a justement manifesté qu'il aimait ce type d'attention dans ces
    > moments-là. »
- Stockage de la raison de timing → réajuste la temporalité des futures recos.

---

## 4. Catégorie « Refusées » (réactivables)

- Toute attention refusée (quelle que soit la raison) s'affiche dans une **catégorie
  « Refusées »** dédiée.
- **Réactivable en un clic** à tout moment (le pilote change d'avis).
- Les refus **financiers** y attendent leur réapparition à +6 mois.

---

## 5. Miroir pilote ↔ proche : la déclaration d'état influence les recos

**Nouveau bloc sur la FICHE PILOTE** : « Comment vas-tu en ce moment ? »
- Le pilote y déclare des choses personnelles : fatigue, période difficile, **deuil**,
  événement important à venir, bonne nouvelle…
- Ces déclarations **alimentent la section « Comment il va » que ses proches voient** sur sa
  fiche, ET **influencent les recos** que Candice pousse aux proches le concernant.
- C'est la **symétrie** : ce que le proche voit de « comment va le pilote » vient de ce que le
  pilote a lui-même déclaré. Ça rend la contradiction du §3.4 possible et légitime (le proche a
  vraiment manifesté quelque chose).

---

## 6. Vue détail d'une reco (ce qui s'ouvre au clic sur une carte)

Au tap sur une reco → page/sheet détail :
- **Photo en grand** (ou aperçu du lien / picto)
- **Titre + marque + prix** (et plan de financement si configuré)
- **Niveau de certitude** explicité + **pourquoi Candice la propose** (les critères)
- **Tag « besoin »** (voir §7)
- **Actions** : « Je veux l'offrir » (→ §8) · « Pas ça » (→ §3) · éventuellement « Garder pour
  plus tard »

---

## 7. Recos non-objet + tag « besoin » (pas « moments »)

On abandonne le vocabulaire « moments » au profit des **besoins / langages d'attention**.
Un **tag** en tête de reco indique le besoin visé, ex. **« En ce moment = ce dont il a besoin »**.

Types de recos à savoir afficher (pas que des objets) :
- **Objet / cadeau** (avec photo, prix)
- **Resto / sortie** (lieu, ambiance, pourquoi lui)
- **Expérience / surprise** (activité, à vivre ensemble)
- **Message / mot** (ex. un mot pour le réconforter dans une période difficile) — pas de prix,
  l'attention est relationnelle

Chaque type garde le système de certitude et le tag besoin.

---

## 8. Action « Je veux l'offrir » — deux voies (wordings définitifs)

Au clic « Je veux l'offrir » → sheet avec deux choix :

1. **« Je m'en occupe personnellement »**
   Sous-texte : « Tu réalises l'attention toi-même. Candice la réserve pour Thibaud et n'en
   reparle plus aux autres proches. »

2. **« Je veux que Candice s'en charge »**
   Sous-texte **adapté au type d'attention** (pas un texte figé) :
   - objet → « Candice commande et te le fait livrer »
   - resto/expérience → « Candice réserve pour toi »
   - etc.
   Marqué **« Bientôt — à l'ouverture de la conciergerie »** (interface construite maintenant,
   sourcing/commande activés plus tard).

Rappel : la **réservation invisible avec confirmation d'achat** (déjà livrée au lot Wishlist
V2) s'applique — un « oui, offert » retire définitivement l'idée des autres proches.

---

## 9. Corrections d'interface de l'espace proche (retours device 14/07)

- **Header identique au pilote** (logo, Modifier, Réglages, avatar + caméra, photo transférable).
- **Sections du profil** : 100% identiques au pilote, toutes en **menus dépliables**. Dupliquer
  ces dépliables **aussi sur la fiche pilote** (lot Harmonisation).
- **Langage d'attention complet** (toutes les dimensions, comme le pilote).
- **Section masquée** → **ne pas l'afficher du tout** (jamais « Thibaud a masqué ça »). À la
  place : **bandeau en haut du profil** « Tu vois ici ce que Thibaud a choisi de partager. »
- **Infos pratiques** : identiques au pilote, **sans abréviations** (« Taille de vêtement :
  Medium », pas « M »).
- **Micro-questions d'enrichissement** : si le profil du proche est incomplet →
  « Souhaites-tu développer ce que Candice sait de Thibaud ? » → questions **au pilote** sur ce
  qu'il connaît du proche.
- **Sous-titre « Comment il va »** : « Comment se sent-il en ce moment ? A-t-il un événement
  important à venir, traverse-t-il une période difficile, est-il fatigué… Parle-moi de lui. »
- **Onglet Nous** : remonter **« Pour viser juste avec lui »** en haut. **Deux photos** dans le
  header (au lieu des initiales) si les deux profils ont une photo partagée — sinon initiales.
- **Onglet Faire plaisir** : réduire le champagne (plus de blanc/vert).

---

## 10. Ordre de construction recommandé (pour le prompt)

1. Espace proche à onglets (Thibaud / Nous / Faire plaisir) — coquille + nav.
2. Onglet Thibaud (profil = design pilote, sections dépliables, bandeau partage, épingles +
   CTA anniversaire, micro-questions).
3. Onglet Nous (comparative complète, conseils en haut, radar photos).
4. Onglet Faire plaisir (filtres besoin, catégories, recos multi-types + tag besoin, certitude).
5. Vue détail d'une reco.
6. Flow « Pas ça » (4 raisons argumentées + stockage + catégorie Refusées + réapparition).
7. Action offrir (2 voies, wordings définitifs).
8. Bloc « Comment vas-tu ? » sur la fiche pilote + câblage influence recos.

Les **données** (tables refus, raisons, échelle de satisfaction, plan de financement, état
pilote) sont à modéliser dès le début — STOP données comme d'habitude.

---

## 11. Raffinements de ton & wording (retours 14/07 — prioritaires)

- **Couleur** : le **vert profond satin reste dominant partout**. Le champagne n'est qu'un
  accent (lumière), jamais une masse. Corriger toutes les surfaces trop champagne.
- **Titre du flow refus** : pas « Qu'est-ce qui ne va pas » (trop sûr de soi). Préférer une
  formule douce : **« Qu'est-ce qui te fait hésiter ? »** / « Dis-m'en un peu plus ».
- **« Pas son goût »** : NE JAMAIS dire « tu le connais mieux que personne » (c'est Candice/le
  pilote qui est censé bien le connaître). **Justifier avec les tags réels du questionnaire de
  Thibaud** : « Thibaud a déclaré aimer <tag> et <tag> — c'est pour ça que j'y crois à ~85%. »
  On **réutilise les données déclarées du proche** pour argumenter le pourcentage.
- **Rejet ferme** : pas « il n'aimerait vraiment pas » → **« Non, je ne veux vraiment pas »**,
  qui ouvre la **liste de raisons à cocher** (goût / budget / déjà offert / moment / autre…).
- **« Trop cher »** : pas « pas de souci » → **« Je comprends. Comme c'est quelque chose que
  Thibaud souhaite vraiment, et si on essayait un plan de financement ? Ce cadeau se paie en X
  fois sans frais… »** — sinon proposer de mettre de côté (épargne perso).
- **« Pas le bon moment »** : proposer **beaucoup plus de raisons** (deuil, séparation/rupture,
  maladie, hospitalisation, perte d'emploi, période de stress, déménagement, examens/charge,
  conflit récent, il vient déjà de recevoir beaucoup, budget serré familial, autre…). Si
  **« Autre »** → **champ libre** à compléter, stocké tel quel.
- **% de certitude** : à valider avec Estelle — chiffre précis (« 85% ») vs formule (« quasi
  sûr / probable »). *[EN ATTENTE]*
- **Emojis échelle de love** : à valider — emojis vs texte premium seul. *[EN ATTENTE]*

---

## 12. RETOURS TEST COMPLET (14/07) — à intégrer, gravés mot pour mot

### ONGLET THIBAUD
1. **Header identique pilote + CTA connaissance** : sous la jauge « Candice le connaît
   bien », ajouter le petit CTA « **Améliorer encore sa connaissance de Thibaud** » (comme le
   `knowMore` du pilote). Présent dans les DEUX modes (proche normal + incognito).
   - **Mode incognito** → le CTA demande de compléter des **questions supplémentaires** non
     remplies côté proche.
   - **Mode proche/questionnaire** → questions plus personnelles au pilote : « Sais-tu ce
     qu'il aime ? », « Quelle est votre histoire ? »… (micro-questions à ajouter).
2. **Bandeau partage** → PAS un bloc/encart. Juste une **petite phrase en italique discrète**
   qui se glisse (« Tu vois ici ce que Thibaud a choisi de partager avec toi »).
3. **Fusionner les 2 épingles** : « On pense à lui — son anniversaire approche dans 3 semaines »
   ET « Faire plaisir à Thibaud » = **UN SEUL bloc** : « Son anniversaire approche dans 3
   semaines — faire plaisir à Thibaud », un seul CTA.
4. **Langage d'attention — noms EXACTS du pilote** (mêmes libellés, même présentation) :
   Mots justes · Cadeaux choisis · Moments partagés · Expériences (esthétique/qualité) ·
   Surprise · Actes de service · Attentions symboliques.
5. **« Comment il va » remonté TOUT EN HAUT** : format « prends des nouvelles » — un module
   qui invite le pilote à **renseigner lui-même** l'état du proche (« As-tu des nouvelles de
   Thibaud ? Période chargée, fatigue, événement à venir… »). On donne la main au pilote pour
   qu'il ajoute des infos sur « comment il va en ce moment ».
6. **Catégories du profil = les MÊMES que la page proche pilote**, avec à chaque fois un
   **résumé + les tags déterminés** (pas seulement des tags). Catégories exactes :
   - **Ce qui le touche**
   - **Ce qui pourrait lui faire plaisir**
   - **Ce qui tombe à côté**
   - **Son monde** (catégorie large) → dedans : **ses tables, ses voyages, ses passions,
     ses goûts esthétiques**.
7. **Infos pratiques** : ne s'affiche QUE si le proche a choisi de l'afficher (sinon cachée).
   Reprendre **à la virgule près** le bloc infos pratiques du pilote :
   - **Taille** (taille de vêtements + taille de chaussures), Alimentation, Parfum,
     Livraison (avec adresse enregistrée), Mobilité/confort, Dates clés, Santé, Handicap,
     Religion. Mêmes mots, même ordre.
8. **« Aller plus loin »** peut rester en bas, MAIS le CTA d'enrichissement doit AUSSI être en
   header sous « Candice le connaît bien » (cf. point 1).

### ONGLET NOUS
9. **Initiales dans les jauges = problème** (2 prénoms en « E » se confondent). Trouver autre
   chose : afficher le **prénom** ou la **photo** (si dispo/partagée).
10. **Comparer le comparable** : reprendre EXACTEMENT les dimensions du langage d'attention des
    pages profil (Mots justes, Cadeaux choisis, Moments partagés, Esthétique/qualité, Surprise,
    Actes de service, Attentions symboliques). Pour chaque dimension : une **jauge commune**
    (dominant / très présent…) où l'on **cale le proche ET le pilote sur la même échelle**, côte
    à côte. (Pas un radar à axes différents — des **jauges superposées sur les mêmes
    dimensions**.)
11. « Ce qui vous lie » et « Là où vous vous ratez » : OK. Peut-être un petit ajout à trouver.

### ONGLET FAIRE PLAISIR
12. **Un SEUL filtre = par ÉVÉNEMENT** (plus de double tag besoin/typologie qui mélange tout —
    « un vrai cadeau »/« un mot qui touche » ne sont PAS des besoins). Filtres = Sans occasion
    particulière · Son anniversaire · Anticiper Noël · Fête des mères · Fête des pères · etc.
    - **MAIS prédominance au QUOTIDIEN** : Candice n'est pas qu'un célébrateur d'occasions
      prédéfinies. La priorité d'affichage va aux **petites attentions du quotidien**, calibrées
      selon le profil (une personne qui aime les attentions fréquentes → en proposer plus ; le
      type d'attention dépend du profil).
13. **Carnet d'envies pas relégué en bas** : afficher la **liste des envies** (comme le carnet),
    chaque item portant un **tag à code couleur** distinguant la source :
    - reco Candice VS **« le carnet d'envie que tu as toi-même renseigné »** (formulation
      explicite, pas juste « carnet » — sinon les gens s'y perdent). Adapter le code couleur.

### FLOW « PAS ÇA » — technique à écrire noir sur blanc (pas du coup de pinceau)
14. **Contradiction impossible** : après « ce n'est pas son goût » → « non je ne veux vraiment
    pas », NE PAS reproposer « ça ne lui ressemble pas / il a changé de goût » comme si de rien
    n'était (on a nous-mêmes déterminé que ça lui ressemblait — se contredire est étrange).
    **Workflow technique de résolution croisée** :
    - Si le pilote maintient **2 fois** « ça ne lui ressemble pas » sur une reco →
      **Candice va interroger le proche (Thibaud)** : « Tu m'as parlé de ce cadeau, mais
      certains de tes proches pensent que ça ne te ressemble pas. Est-ce qu'ils visent à côté,
      ou juste ? »
    - Thibaud répond :
      - « Si, c'est vraiment ce que je veux » → **notification au pilote** : « Tu nous avais
        indiqué que ça ne lui ressemblait pas. On en a discuté avec Thibaud : il semblerait que
        ce soit pourtant vraiment ce qu'il veut. »
      - « Non, je ne veux pas ce genre de choses » → **on améliore la connaissance** (ajuste le
        profil + moteur).
    - Écrire la technique de CHAQUE action (stockage, déclenchement, notif croisée). Technique
      puissante exigée.
15. « Trop cher » / « Déjà offert » / structure « Pas le moment » : OK.
16. **« Pas le bon moment » — textes dynamiques pour CHAQUE raison** (pas seulement le deuil) :
    séparation/rupture, maladie/hospitalisation, période de stress, déménagement, perte
    d'emploi, etc. → un texte adapté à chaque cas. **Techniquement : textes DYNAMIQUES** générés
    selon la **personnalité détectée du proche** (pas des textes figés).
    - **« Conflit récent entre vous »** → Candice réagit : « Je ne savais pas qu'il y avait un
      conflit. Tu veux que je t'aide à écrire un petit mot pour le résoudre ? Explique-moi d'où
      il vient, je peux peut-être t'aider. » → flux d'aide à la réconciliation à construire.
17. **Paramètres (icône réglages)** : ne clique pas / on ne sait pas à quoi ça correspond.
    Définir le contenu du menu Réglages du proche + le rendre fonctionnel.
18. **« Attentions écartées »** en bas : OK, conserver.

---

## 13. RETOURS 2e PASSE (14/07 soir) — corrections maquette

1. **« Comment va Thibaud »** : le bloc est **trop large / prend trop de place**. Le réduire à
   une ligne compacte. Au clic → **une page/sheet s'ouvre** avec soit **mode micro (dictée /
   discussion)**, soit **champ libre** pour écrire ce qui se passe, + éventuellement **menu
   déroulant d'événements** à cocher.
2. **Épingle événement** : la remonter **au-dessus**. **Dynamique** : s'il y a un événement à
   venir → l'afficher (« Son anniversaire dans 3 semaines — Faire plaisir à Thibaud »). Sinon →
   afficher juste **« Faire plaisir à Thibaud »** avec en **sous-titre une petite phrase**
   rappelant son **mode d'attention préféré** + que ce serait chouette de lui faire plaisir.
3. **⚠️ SECTIONS DE PROFIL À REPRODUIRE À L'IDENTIQUE DE LA MAQUETTE GELÉE** (`Candice_Maquette
   _Profil_V2_REFERENCE_GELEE.html`) : « Son monde » ET **toutes** les sections de profil.
   Même design, mêmes couleurs, même structure — pour que le pilote **retrouve ses repères**.
   NE PAS réinventer les sections : les **copier** de la maquette gelée. (Estelle l'a répété
   plusieurs fois — c'est un point dur.)
4. **Page « Nous »** : **centrer le cœur (lien) au milieu** entre les deux. Remplacer
   « pour t'aider à l'aimer comme il le ressent » → « pour t'aider à **prendre soin de lui**
   comme il le ressent ».
5. **Tags de source** (« Repéré par toi » / « Proposition de Candice ») : les rendre
   **beaucoup plus visibles**, et permettre de **filtrer par source**.
6. **Filtres Faire plaisir** : remplacer « Sans occasion » par **« Au quotidien »** (les petites
   expériences). Supprimer anniversaire/Noël/fêtes de la barre → ne garder que **« Au
   quotidien »** et **« Occasion particulière »**. Au clic sur « Occasion particulière » →
   **menu déroulant** pour choisir le type d'occasion/attention, ou **« Voir tout »**.
7. **⚠️ WORKFLOW CROISÉ — ne JAMAIS l'afficher au pilote** : le texte « C'est la 2e fois que tu
   écartes… je vais lui poser la question » est **bien trop accusateur**. Cette logique est
   **interne** (entre nous, pour la technique). Côté pilote, on affiche seulement un **accusé
   doux** (« C'est noté, merci — je m'en occupe »). Toute la « tambouille » (interroger le
   proche, ré-ancrer, notifier) se fait **en coulisses, invisible**. Le pilote ne doit jamais
   voir qu'on va questionner le proche.

---

## 14. RETOURS 3e PASSE (14/07 nuit) — derniers ajustements

1. **Champ « Des nouvelles de Thibaud »** : pas de gros micro ni gros champ. **Un seul champ
   texte avec l'icône micro au bout** (dictée intégrée), + les propositions à cocher en dessous.
   Compact.
2. **Section « Ton univers » (marques/logos)** : elle **n'existe pas** dans la maquette pilote
   gelée, mais Estelle **l'aime**. → Demander à Claude Code d'**uniformiser les deux profils** :
   ajouter cette section (logos de marques) AUSSI au profil pilote. Les deux fiches doivent être
   identiques en structure. (Point d'harmonisation à porter dans le prompt.)
3. **Onglet « Nous »** : **PAS de cœur au milieu** (déjà dit). Retirer l'icône cœur centrale.
   Et **pousser plus loin l'étude comparative** maintenant qu'on a toutes les sections du profil
   — analyse plus riche (au-delà des 7 jauges + 3 cartes).
4. **Filtres source Faire plaisir** : les tags/boutons « Tout / Idées de Candice / Repéré par
   toi » sont **moches**. → Les remplacer par un **filtre déroulant classique** (un `<select>`
   standard comme sur tous les sites).
5. **Balance des couleurs** : le **vert plein `#2A7B5C`** du tag « Idée de Candice » est
   **atroce**. À supprimer. Revenir à la palette DA (vert profond satin dominant, champagne
   accent doux). Aucun aplat de vert criard.

## 15. HARMONISATION À PORTER DANS LE PROMPT (pilote ↔ proche)
- Les deux profils (pilote et proche) doivent être **structurellement identiques**.
- Ajouter « Son univers / Ton univers » (logos marques) au **profil pilote** aussi.
- Les menus dépliables (folds) et toutes les sections : mêmes composants des deux côtés.
- Design étalon = `Candice_Maquette_Profil_V2_REFERENCE_GELEE.html`.

---

## 16. Reco PROACTIVE — Candice moteur (l'élément manquant)

> Les §1–§15 décrivent l'affichage **réactif** : le pilote ouvre « Faire plaisir » et consulte
> les recos. Cette section décrit la posture **proactive** : Candice **prend l'initiative** de
> pousser une attention, sans que le pilote ait rien demandé. C'est ce qui distingue Candice d'un
> simple catalogue — elle **anticipe**.

### 16.1 Deux postures, à ne pas confondre
- **Réactive / à la demande** : « j'ai envie de faire plaisir » → le pilote ouvre l'onglet, voit
  les recos (couvert par §1–§8).
- **Proactive / initiée par Candice** : Candice détecte un signal et **pousse** une attention
  (notification, épingle « On pense à lui »), au bon moment, sans sollicitation.

### 16.2 Déclencheurs de la reco proactive
- **Occasion datée à venir** : anniversaire, dates clés renseignées → notif + épingle « Son
  anniversaire approche dans X semaines — Faire plaisir à [Prénom] » (fenêtre d'anticipation
  calibrée selon le type d'attention : un objet à commander se pousse plus tôt qu'un mot).
- **Rythme du quotidien selon le profil** : c'est le cœur. Candice **calibre une cadence
  d'attentions** propre à chaque proche. Un proche qui valorise les attentions fréquentes et le
  quotidien → Candice pousse **plus souvent** de petites attentions ; un proche plus sobre → moins
  souvent, mais plus juste. La fréquence n'est jamais générique : elle est **dérivée du profil**.
- **Changement d'état déclaré** : si le pilote (ou le proche) déclare un état (période difficile,
  deuil, belle nouvelle…) → Candice peut proposer spontanément l'attention adaptée (ex. « un mot
  pour le soutenir ») — cf. miroir §5 et textes dynamiques §12.16.
- **Signal relationnel** : long silence sans attention envers un proche important, réciprocité
  détectée (il vient de faire un geste), etc. → nudge doux.

### 16.3 Règles de tact (anti-« creepy », anti-spam)
- **Jamais harcelant** : plafond de fréquence, regroupement, respect du « ne pas déranger ».
- **Jamais anxiogène** : pas de relance culpabilisante (« tu n'as rien fait pour X »). Ton
  d'invitation, pas d'injonction.
- **Jamais creepy** : ne pas donner l'impression que Candice surveille. On formule côté bénéfice
  (« c'est le bon moment pour lui faire plaisir »), jamais côté surveillance.
- **Pudeur maintenue** : une notif proactive ne dévoile jamais qu'une envie vient du proche
  lui-même (traduction en certitude, comme §2).

### 16.4 Ce qui reste « en base » (non affiché)
La logique de **scoring / priorisation** (quelle reco pousser, à qui, quand, à quelle fréquence)
vit **en base**, jamais montrée au pilote sous forme de score ou de %. Le pilote ne voit que le
résultat premium (« ce qui semble compter pour lui »), jamais la mécanique. La cadence, les poids
de profil, l'historique d'attentions et de refus alimentent ce scoring interne.

### 16.5 Périmètre d'implémentation — À TRANCHER PAR ESTELLE
La **logique** est gravée ici pour ne pas la perdre. Reste à décider si l'**implémentation** de la
reco proactive (moteur de push + cadence + notifications) entre **dans ce lot** ou dans un **lot
ultérieur** (Moteur de reco + scoring). Par défaut, ce lot livre l'**affichage réactif** complet ;
la reco proactive suit une fois le scoring en place. → **Décision attendue.**

---

## 17. RETOURS 4e PASSE (15/07) — faire plaisir, sortie, uniformisation

1. **Filtre « Occasion particulière » — SUPPRIMÉ de l'onglet Faire plaisir.** On garde
   uniquement les **attentions générales / au quotidien**. Les occasions (Noël, fête des
   mères/pères, anniversaire…) exigeraient des recos réellement adaptées à chaque occasion —
   ce sera traité **en ponctuel via les notifications et les pages événementielles** (relève de
   la reco proactive, §16 / lot ultérieur), PAS d'un filtre dans le profil.
2. **Nettoyage visuel** : retirer le halo/ombre vert flou (« demi-cercle ») près de la bottom
   nav (CSS mort de l'ancienne nav + box-shadow vert de la barre).
3. **Sortie de l'espace proche** : ajouter un **bouton de retour** (et un point d'accès) pour
   **sortir du profil du proche et revenir à l'app globale** (liste des proches / accueil
   Candice). Présent sur les 3 onglets.
4. **Uniformisation page pilote (rappel ferme)** : les deux pages profil doivent être
   **identiques à 100%**. Les sections **« Territoire idéal »** et **« Univers »** existent sur la
   maquette proche mais **pas encore sur le profil pilote réel** → demander à Claude Code de les
   **ajouter au profil pilote**. Pour « Univers » : afficher de **vrais LOGOS de marque** (pas le
   nom en texte stylisé). → à porter dans le prompt (§15 harmonisation).

---

## 18. DÉCISION séquencement reco proactive (15/07)

**Reco proactive = lot ultérieur, à garder en tête.** Deux dépendances dures :
- **Notifications** : envoyables uniquement **sous Capacitor** (app native iOS/Android). Donc la
  reco proactive par notif ne peut pas exister avant le passage Capacitor.
- **Pages événementielles** (Noël, fêtes, occasions) : à construire **une fois l'app aboutie**,
  pas avant.

→ **Ce lot Espace Proche V2 = affichage RÉACTIF seul** (le pilote ouvre « Faire plaisir » et
consulte). La logique proactive (§16) reste gravée mais non implémentée ici.

---

## 19. RETOURS 5e PASSE (15/07) — nettoyage final maquette

1. **Double bloc langage d'attention** : garder UNIQUEMENT le premier (le podium, jauges
   colorées identiques au profil pilote). **Supprimer la section « Ce qui marche avec lui »**
   (les barres à segments qui se remplissent) — c'était un doublon.
2. **Onglet Nous** : **supprimer la section « Vos dynamiques »** (les axes Dire/Faire,
   Spontané/Préparé, Discret/Démonstratif) — pas aimée. Garder le reste de l'analyse comparative
   (jauges superposées, mode d'emploi du duo, ce qui vous lie, angle mort).
3. **Bouton de sortie** : « Mes proches » → remplacer par **« Accueil »** (retour à l'accueil de
   l'app).
4. **Page Nous — photos** : demander à Claude Code d'afficher les **vraies photos** des deux
   personnes (pilote + proche) sur la page Nous **si elles sont disponibles/partagées** (sinon
   fallback prénom).
5. **Section « Pour mieux viser »** : les questions **se généreront via les micro-questions**
   (Discovery) — Estelle a préparé un **prompt dédié** qu'elle lancera après cette session. Ne pas
   figer ces questions maintenant ; elles seront alimentées dynamiquement.
