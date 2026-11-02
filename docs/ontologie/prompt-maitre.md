<!-- ═══════════════════════════════════════════════════════════════════════════
     EN-TÊTE AJOUTÉ (hors document source) — RÈGLES D'AUTORITÉ
     Tout ce qui suit la ligne « ───── DÉBUT DU DOCUMENT VERBATIM ───── » est la
     transcription VERBATIM de l'export Pages → .docx d'Estelle (2026-11-02).
     Aucun mot n'a été reformulé, résumé ni corrigé ; seul le balisage (styles de
     titre, listes, tables) a été rendu en Markdown. Les niveaux de titre Word ont
     été aplatis en paragraphes : la numérotation « 0. … 38. », « 30.2 bis », etc.
     reste la navigation du document. Source d'autorité UNIQUE : ni le .pages ni le
     .docx ne sont committés à côté — un seul fichier fait foi.
     ═══════════════════════════════════════════════════════════════════════════ -->

# PROMPT MAÎTRE — document d'autorité (spec produit)

> **RÈGLES D'AUTORITÉ (dictées par Estelle, inscrites en tête) :**
>
> 1. Ce document **remplace toute version antérieure** de cette spécification.
> 2. Ses **parties 29 à 38 prévalent sur les parties 0 à 28** en cas de divergence.
>
> **Garde d'exécution :** au démarrage de **chaque lot**, énoncer en deux lignes
> quelles règles des parties 29-38 remplacent ce que disent 0-28 pour ce lot précis.
> (cf. `hsg-architecture.md` et la mémoire `feedback_prompt_maitre_deux_etages`.)
>
> Référence : `docs/ontologie/prompt-maitre.md`. Il commande les lignes 4 à 7ter du
> chantier (cf. la SÉQUENCE DU CHANTIER dans `hsg-architecture.md`).

───── DÉBUT DU DOCUMENT VERBATIM ─────

CANDICE — PROMPT MAÎTRE POUR CLAUDE CODE

Refonte exhaustive de « Ma fiche », « Fiche proche », partage et « Nous deux » — V3, sept arbitrages intégrés

Nature : spécification UX, UI, contenu éditorial et règles produit. Ce document n'est PAS une maquette HTML.

Tu es simultanément Head of Product Design, UX Writing Lead, Design Systems Lead et architecte d'intégration de Candice. Ta mission est d'enrichir et finaliser l'interface existante, et non de créer un profil simplifié. Tu dois examiner le code réel et les fichiers de référence AVANT toute modification. Produis une implémentation fidèle, élégante, cohérente, progressive, intégrée aux données existantes.

## 0. Sources de vérité et hiérarchie

1. Maquette Profil V2 — référence gelée.html : référence visuelle et structurelle impérative. Conserver ses graphiques, analyses, barres, cartes, catégories, marqueurs, blocs « Lire plus », « Tes mondes », « Ce qui marche avec toi », « Ton territoire idéal », « Ton univers », « Infos pratiques », « Pour mieux viser », et la navigation. Aucun remplacement par des cartes génériques minimalistes. Examiner aussi le code de l'application actuelle : la maquette n'est pas un prétexte pour écraser les améliorations déjà intégrées.

2. Candice_Questionnaire_Onboarding_V15DEF.xlsx : questions actives, socle, signaux, libellés et nuances. Ne pas réintroduire des constructs DEPRECATED.

3. Human Signal Graph — Architecture de connaissance, règles de raisonnement et de consolidation : evidence, FACT, consolidation, UNKNOWN, contextes, confiance, corrections, provenance, stabilité.

4. Dictionnaire canonique Candice — Human Signal Graph : 10 familles et codes officiels ; ne jamais inventer un PROFILE/NEED/DRIVER ou un tag fermé.

5. Document définitif Discovery / banque de microquestions : enrichissement continu, branches, progression, fatigue, SKIP, DEFERRED, DO_NOT_PROBE, SUFFICIENTLY_KNOWN.

6. Les composants, routes, permissions et patterns réellement présents dans le dépôt : les réutiliser, préserver compatibilité, migrations et données. En cas de contradiction, remonter la divergence et proposer une adaptation minimale, sans suppression silencieuse.

Règle absolue : conserver l'architecture riche du profil existant, ses visualisations et catégories ; réviser leur sémantique, leur complétude, leur organisation et leur comportement. Le texte de la maquette V2 est illustratif, pas une vérité sur tous les utilisateurs. Ne jamais hardcoder le portrait d'Estelle pour d'autres comptes.

## 1. Vision produit et navigation

Candice ne présente ni un test de personnalité ni un « dossier » médical ou psychologique. La fiche est un portrait vivant, esthétique, compréhensible et utile à l'action. Une même connaissance, alimentée par onboarding, Discovery, conversations, Wishlist, Carnet d'envies, corrections et contributions autorisées, nourrit les recommandations et les vues. Une information n'est jamais « perdue » faute de tag.

Trois expériences distinctes :

    •    Ma fiche : « Ce que Candice a compris de moi », espace privé, profond, explicable et corrigeable. L'utilisateur peut décider ce qu'il partage avec chaque personne, indépendamment.

    •    La fiche de [Prénom] : ce que j'ai le droit de voir de son profil et ce que moi, je sais de cette personne dans mon carnet privé ; deux origines distinctes et visuellement identifiables.

    •    Nous deux : une lecture des convergences, complémentarités et différences, basée uniquement sur les connaissances auxquelles j'ai légitimement accès et sur mes propres données. Jamais de déduction dévoilant une information masquée.

Navigation à conserver ou articuler avec l'existant : « Le fil », « Proches », « Candice », « Agenda », « Profil ». Dans Profil : onglets/ancres « Mon portrait », « Mes univers », « Mes envies », « Infos pratiques », « Partage ». Dans un proche : « Son portrait », « Ce que je sais », « Ses envies », « Nous deux » (activé uniquement à la ligne 7ter) ; ne pas inventer une section vide sans usage. Les libellés doivent être stables et courts.

## 2. Grammaire UI — non négociable

Conserver les graphiques existants, jauges, barres de progression, cartes, chips, nuages d'indices, sections visuelles, hiérarchie typographique, rythmes, contrastes et animations sobres. Conserver la profondeur des analyses de la V2 ; ne pas la remplacer par « 4 cartes et une bio ». Les familles d'information doivent pouvoir être parcourues par scan rapide puis ouvertes en détail.

Chaque section riche suit un pattern cohérent : titre + courte phrase d'interprétation + représentation visuelle si pertinente + indices concrets + action « Lire l'analyse » ou « Voir les détails » + provenance et correction accessibles sans surcharge. Les graphiques doivent être accessibles (étiquettes, alternative textuelle, couleurs non exclusives).

Contrôles d'affichage :

    •    Au niveau section : « Réduire » / « Développer ». Réduite = titre, phrase courte, 1 à 3 éléments clés, mini-jauge si elle existe, sans perdre les données. Développée = graphique complet, nuances, exemples, éléments qui soutiennent l'analyse et actions. Persister le choix d'affichage localement/par utilisateur si l'architecture le permet.

    •    Au niveau carte longue : « Lire plus » / « Lire moins » ; l'expansion se fait sur place, pas obligatoirement dans une modale. Si la V2 utilise une modale, conserver le pattern lorsqu'il est cohérent.

    •    Au niveau page : « Vue d'ensemble » / « Tout explorer » si utile, sans replier arbitrairement des informations déjà visibles.

    •    Ne jamais confondre « réduire l'affichage » et « masquer au partage » : deux actions différentes, deux états indépendants.

    •    Mobile : une colonne, graphiques lisibles, sections repliables, actions de partage toujours explicites ; desktop : respecter la densité et les mises en page riches existantes.

## 3. En-tête de « Ma fiche » — wording exact

Titre : « Ma fiche » (libellé produit définitif ; ne pas alterner avec « Mon profil »).

Nom et avatar : identité déclarée ; aucune inférence.

Accroche principale dynamique :

    •    Nouveau : « On commence à faire connaissance ? »

    •    Onboarding entamé : « Candice commence à te découvrir. »

    •    Onboarding terminé, Discovery léger : « Candice commence à bien te connaître. »

    •    Connaissance riche et diversifiée : « Candice te connaît de mieux en mieux. »

    •    Connaissance particulièrement solide : « Candice te connaît très bien. »

Ne pas lier ces phrases à un simple nombre de questions : qualité, diversité, indépendance et fraîcheur des evidences comptent. Ne pas afficher « très bien » sur la base d'un seul domaine très renseigné.

Sous-texte : « Un portrait qui évolue avec toi, au fil de ce que tu confies à Candice. »

CTA principal selon contexte : « Commencer à me découvrir », « Continuer à me découvrir », « Affiner mon profil ».

Actions secondaires : « Partager mon profil », « Ma wishlist » (conserver ce nom), « Modifier mes informations ».

Résumé éditorial, sous le nom : 2 à 4 phrases maximum, personnelles, naturelles, nuancées, générées depuis des connaissances suffisamment fiables et autorisées. Si le corpus est trop faible : « Candice n'a pas encore assez d'éléments pour dresser ton portrait. Quelques réponses suffiront pour commencer. ». Ne jamais inventer « tu es… » en l'absence d'evidence.

Chips sous résumé : 3 à 6 indices concrets justifiés, jamais de diagnostic, de pseudo-score de personnalité ou d'adjectif générique plaqué. CTA : « Lire l'analyse complète » ; panneau détaillé : titre « Ton portrait, en profondeur », bouton « Fermer ».

## 4. Tableau de bord de connaissance — progression honnête

Conserver les visualisations de la V2 et y intégrer, sans écraser la composition, un indicateur de progression de connaissance, non de « valeur personnelle » :

Titre « Ce que Candice connaît de toi » ; aide « Ton portrait se précise au fil de tes réponses et de vos échanges. Il n'a pas besoin d'être rempli à 100 % pour être utile. »

Quatre états par domaine : « À découvrir », « Premiers repères », « En cours d'exploration », « Bien documenté ». Un domaine peut être « Bien documenté » alors que d'autres sont inconnus. Aucune promesse de « profil terminé » : Discovery continu.

Les barres représentent la couverture de connaissances utiles, pas l'intensité d'un trait. Les barres de traits représentent la force consolidée du signal avec confiance/nuances distinctes ; ne jamais confondre ces deux familles de barres.

Tooltip couverture : « Ce niveau indique ce que Candice connaît déjà de ce domaine, pas l'importance qu'il a pour toi. »

Tooltip signal : « Cette lecture repose sur plusieurs éléments de ton profil et peut évoluer. »

Si données insuffisantes : barre non remplie ou état « À découvrir » ; jamais 0 % interprété comme « n'aime pas ».

Action par domaine : « Explorer ce sujet » ou « Affiner » ; ne pas promettre un nombre de questions exact si l'orchestrateur est adaptatif. Estimation possible seulement si calculée : « Environ 1 min ».

## 5. « Ton langage d'attention » — garder le graphique riche

Titre « Ton langage d'attention ». Sous-titre « Les gestes qui te font sentir que tu comptes » (formulation naturellement neutre, sans dépendance au champ sexe). Intro dynamique : « Les attentions ne te touchent pas toutes de la même manière. Voici celles qui semblent le plus compter pour toi. » uniquement si suffisamment établi ; sinon « Candice découvre peu à peu les gestes qui te touchent. ».

Visualiser les 7 modalités RECEIVE officielles, toutes distinctes :

1. « Les mots » — AFFECTION_RECEIVE_WORDS — aide « Des mots sincères, précis ou rassurants. »

2. « Les services rendus » — AFFECTION_RECEIVE_SERVICES — « Une aide concrète, parfois sans avoir à la demander. »

3. « Les cadeaux personnalisés » — AFFECTION_RECEIVE_PERSONALIZED_GIFT — « Quelque chose choisi vraiment pour toi. »

4. « Les cadeaux symboliques » — AFFECTION_RECEIVE_SYMBOLIC_GIFT — « Un geste chargé de sens ou d'histoire. »

5. « Les moments partagés » — AFFECTION_RECEIVE_QUALITY_TIME — « Du temps et une présence de qualité. »

6. « Les petites attentions » — AFFECTION_RECEIVE_MICRO_ATTENTIONS — « Les détails et gestes du quotidien. »

7. « Les surprises » — AFFECTION_RECEIVE_SURPRISE — « Une initiative inattendue, quand elle te convient. »

Ne pas fusionner cadeaux personnalisés et symboliques dans un seul score ; la V2 peut regrouper visuellement des modalités pour lisibilité, mais le détail et les signaux doivent rester séparés. « Esthétique · qualité » n'est PAS un langage affectif canonique : déplacer cette information vers moteurs de valeur/choix sans perdre sa représentation graphique. « Présence » et « Moments partagés » ne doivent pas dupliquer AFFECTION_RECEIVE_QUALITY_TIME sans justification.

Barres : afficher l'intensité relative uniquement si evidence suffisante. Libellés éditoriaux : « Très présent », « Présent », « À nuancer », « Encore à découvrir » ; « Dominant » seulement si dominance réellement soutenue, sans imposer un unique langage principal. Ne pas classer UNKNOWN comme « faible ».

Sous-graphique : « Ce que Candice a compris » ; 2 à 4 interprétations contextualisées. Lien « Comprendre cette analyse » ; « Corriger ». Une deuxième visualisation peut montrer « Comment tu montres ton affection » avec les 7 modalités GIVE, séparées de RECEIVE, sans déduction entre les deux. Afficher seulement lorsque suffisamment documenté ou en état découverte. Cadence séparée : « Ton rythme d'attentions » : « De petits gestes réguliers », « Des moments rares mais marquants », « Cela dépend du contexte », « À découvrir ».

## 6. « En profondeur » — sections éditoriales de la V2 à préserver

Conserver les quatre cartes narratives majeures avec leur espace graphique/chips, résumé court, version développée et sources :

A. « Ce qui te touche »

Sous-texte : « Les gestes et les détails qui résonnent particulièrement pour toi. »

Contenu : moteurs symboliques et mémoriels réellement justifiés (sens, souvenir, histoire, transmission, lien, effort, anticipation, justesse du moment), contextualisés ; ne pas dupliquer les modalités RECEIVE déjà représentées dans le graphique et la carte B. État vide : « Candice explore encore ce qui donne un sens particulier aux attentions que tu reçois. » CTA « Lui donner quelques indices ».

B. « Les gestes qui te font sentir que tu comptes »

Sous-texte : « Les signes d'affection que tu reconnais le plus facilement. »

Contenu : manifestation concrète des sept modalités RECEIVE dans la vie relationnelle, situations et exemples prouvés, besoins explicitement établis si pertinents. Le graphique §5 indique les modalités et leur signal ; cette carte explique comment elles se manifestent concrètement, sans répéter les barres. État vide : « Quelques réponses aideront Candice à comprendre comment tu reconnais l’attention des autres. ».

C. « Ce qui pourrait te faire plaisir »

Sous-texte : « Des idées qui ont de bonnes raisons de te correspondre. »

Contenu : intérêts, goûts, entités, wishlist, expériences, drivers, contexte ; préférer des catégories et exemples étayés à des recommandations précises inventées. Si confiance faible : « Des pistes à explorer ». CTA « Voir mes envies ».

D. « Ce qui tombe à côté »

Sous-texte : « Les erreurs que Candice apprend à éviter. »

Contenu : aversions explicites, GUARDRAIL SOFT/HARD et conditions d'exécution ; distinguer « À éviter » (HARD applicable), « À manier avec précaution » (SOFT/contextuel) et « On ne sait pas encore ». Ne jamais créer un guardrail à partir d'un simple intérêt faible ou d'un SKIP. État vide : « Candice n'a pas encore identifié de préférence à éviter ici. Cela ne signifie pas que tout te convient. ».

Pour chaque carte : une phrase courte générée, chips justifiées, « Lire plus », détails et nuances, « Ce n'est pas tout à fait moi » qui ouvre une correction, sans obliger à recommencer le questionnaire.

6.1 « Ta façon de fonctionner » — PROFILE, SOCIAL_ENERGY et BEHAVIOR

Cette section est un chapitre éditorial de premier rang de Ma fiche, et non une annexe discrète. Elle accueille les neuf dimensions PROFILE canoniques, chacune selon sa définition et son échelle réelle, sans inventer de traits ni confondre force, confiance et couverture. Reprendre les codes exacts du dictionnaire lors de la cartographie, sans fabriquer de nouvelles dimensions.

SOCIAL_ENERGY est l’unique axe bipolaire : recharge plutôt solitaire ↔ recharge plutôt sociale. Un positionnement central décrit un équilibre réel, jamais un score médiocre ; UNKNOWN affiche « À découvrir » sans point médian inventé. Représentation distincte des neuf autres dimensions, avec bornes et aide explicites.

Tous les contextes BEHAVIOR canoniques doivent disposer d’une destination : décision, conflit, changement, expression émotionnelle, difficulté, deuil, vulnérabilité ou autres contextes effectivement définis. Aucun contexte n’est interdit par son intitulé ; la sensibilité est déterminée par le contenu, la provenance et la vue. Les analyses sont nuancées, non cliniques, sans diagnostic, flatterie artificielle ni occultation paternaliste.

Grammaire visuelle : alternance de graphes pertinents, cartes de situations, analyses narratives et expansions « Lire l’analyse ». Chaque comportement se lit dans son contexte ; une anecdote ne devient pas un trait stable. États vide/partiel/riche, correction et traçabilité au niveau des affirmations.

6.2 « Tes nuances » — tensions structurantes et coexistences

Réserver un espace éditorial explicite aux relations entre constructs : par exemple spontanéité × maîtrise, besoin de solitude × goût du lien, exigence × souplesse lorsque les données le justifient. Une tension n’est ni une onzième famille HSG ni un nouveau construct canonique : c’est une relation documentée entre signaux.

Ne jamais moyenner deux signaux indépendants pour les faire disparaître, inventer une opposition ou présenter la tension comme une incohérence personnelle. Montrer dans quelles situations chaque facette apparaît, les indices qui soutiennent cette lecture et les points encore à préciser. Si les contextes ne suffisent pas, indiquer une coexistence observée sans lui inventer d’explication.

Format privilégié : carte à deux facettes, texte de liaison contextualisé, « Ce que Candice comprend », « Ce qui reste à préciser » et « Lire l’analyse ». Les tensions sensibles sont soumises aux mêmes règles de visibilité que leurs informations sous-jacentes.

6.3 « Ta vie en ce moment » — CONTEXT et temporalité

Créer dans Ma fiche l’équivalent personnel de « Sa situation en ce moment » : projets, transitions, événements, contraintes, périodes chargées, changements et objectifs réellement connus. CONTEXT ne doit pas être orphelin. Distinguer les éléments actuels des événements passés, et les faits déclarés des impressions.

Proposer un bloc vivant, temporel, avec cartes de projets et changements lorsque renseignés ; « Ajouter un changement », « Mettre à jour », « Ce n’est plus d’actualité ». Les situations sensibles sont accessibles dans Ma fiche selon les règles de provenance et de sensibilité, sans exposition à autrui. Ne pas transformer un contexte temporaire en trait permanent.

6.4 « Ce que Candice a retenu » — connaissance ouverte structurée

Prévoir une destination visible et corrigeable aux informations ouvertes pertinentes qui ne se rangent pas dans un construct fermé. Conserver la richesse sémantique et les relations d’origine ; ne pas inventer un tag pour remplir une case. La couche ouverte peut nourrir des cartes existantes si sa sémantique le permet, ou un module éditorial dédié sans répétition.

Pour chaque connaissance ouverte : qualification de la provenance, date, contexte, portée, sensibilité, statut et correction. La couverture exhaustive du graphe ne signifie pas exposition exhaustive au premier écran : prioriser le scan, puis la découverte en profondeur. Les observations incognito de tiers sur le sujet ne sont jamais rendues visibles au sujet, y compris dans cette section.

## 7. « Tes mondes » — conserver toutes les catégories, enrichir depuis la banque

Titre « Tes mondes » ; sous-texte « Les univers qui t'intéressent et les détails qui font la différence. ». Conserver au minimum les catégories visibles dans la V2 : « Tes tables », « Tes voyages », « Tes passions », « Tes goûts esthétiques ». Elles doivent être des cartes éditoriales, pas un inventaire plat. Les catégories complémentaires proviennent des branches réelles de la banque Discovery, jamais d'une liste arbitrairement rétrécie.

Taxonomie UI proposée (regroupements de navigation, non nouveaux tags HSG) :

    •    « Style & beauté » : mode, accessoires, bijoux, montres, parfums, soins, coiffure, ongles selon branches présentes.

    •    « Maison & art de vivre » : décoration, design, mobilier, plantes, fleurs, jardin, art de recevoir.

    •    « Tables & saveurs » : cuisine, gastronomie, restaurants, brunch, préférences alimentaires ; boissons détaillées café, thé, matcha, vin, champagne, cocktails, bière, spiritueux, boissons sans alcool, infusions, chocolat chaud selon les branches effectivement conservées. « Boissons » peut être un titre UI, jamais l'unique intérêt enregistré.

    •    « Voyages & escapades » : destinations, hébergements, rythmes, ambiances, contraintes, rêves, expériences.

    •    « Culture & découvertes » : livres, BD, mangas, cinéma, séries, musique, podcasts, spectacles, théâtre, concerts, art, musées, photo selon la banque.

    •    « Loisirs & créativité » : jeux, jeux vidéo, activités manuelles, écriture, artisanat, collections ; éviter de dupliquer « Photographie » dans deux catégories UI.

    •    « Sport & mouvement » : pratiques réelles, nature, randonnées, danse, yoga, etc. ; distinguer intérêt, pratique et expertise.

    •    « Nature & animaux » : plein air, jardins, animaux, relation avec animaux, contextes réels.

    •    « Tech & curiosités » : technologies, mobilité, sciences, entrepreneuriat et autres branches réellement présentes.

    •    « Liens & moments de vie » : famille, souvenirs, transmission, hospitalité, moments partagés lorsque le Discovery les documente.

Règle d'exhaustivité : parcourir intégralement `Ouverture`/`Banque` du Discovery et la table « Intérêts et branches » de l'onboarding ; produire un mapping chaque branche → catégorie UI → sous-catégorie → composant → états. Ne supprimer ni fusionner silencieusement aucune branche. Une famille UI n'est pas un INTEREST HSG. Les sujets fins et les ENTITY sont conservés.

Pour chaque univers : nom, résumé personnalisé, 3 à 8 chips maximum avant expansion, éventuelle jauge de connaissance, sections internes « Ce que tu aimes », « Ce que tu préfères », « Ce que tu aimerais découvrir », « Ce que tu évites », « Tes références » ; ne rendre que celles étayées. Boutons « Lire plus », « Ajouter un détail », « Affiner cet univers ». Un univers sans données n'est pas affiché comme passion ; dans « Explorer d'autres univers », CTA « Découvrir ».

## 8. « Ce qui marche avec toi » — graphiques de moteurs et d'arbitrage

Conserver les barres de la V2 pour les facettes d’arbitrage justifiées : « Le beau », « Le personnel », « L’expérientiel », « L’utile », « Le premium », « La surprise », et prévoir explicitement les quatre orientations manquantes (appétence objet, importance de l’authenticité, spontanéité, maîtrise) selon les codes exacts du dictionnaire. Les libellés sont des facettes UI, pas de nouveaux tags. Les barres d’arbitrage ne doivent pas redire les moteurs symboliques/mémoriels de la carte « Ce qui te touche ».

    •    « Le beau » : IMPORTANCE_AESTHETIC, DRV_AESTHETIC contextualisé.

    •    « Le personnel » : DRV_PERSONALIZATION, DRV_ATTENTIVENESS, affection personnalisée.

    •    « L'expérientiel » : APPETENCE_EXPERIENCE, DRV_SHARED_EXPERIENCE, préférences pertinentes.

    •    « L'utile » : IMPORTANCE_FUNCTIONAL, DRV_UTILITY, éventuellement DRV_RELIEF si prouvé.

    •    « Le premium » : APPETENCE_PREMIUM uniquement si étayé ; ne pas assimiler qualité, luxe ostentatoire, prestige et premium.

    •    « La surprise » : AFFECTION_RECEIVE_SURPRISE, DRV_SURPRISE, guardrails de planning/exécution ; « À doser » n'est autorisé que si des nuances le justifient.

Chaque barre est un résumé éditorial contextualisé, pas une mesure clinique. Ne pas forcer une compétition entre dimensions indépendantes ; les deux « objet » et « expérience », « beau » et « fonctionnel », « spontanéité » et « maîtrise » peuvent être simultanément élevés. Libellés : « Très marqué », « Marqué », « À nuancer », « À découvrir ». Afficher le niveau de confiance séparément dans « Comprendre ».

## 9. « Ton territoire idéal » — matrice de contextes

Conserver le format visuel de la V2 (types d'expériences, niveau d'adéquation, raison). Titre « Ton territoire idéal » ; sous-texte « Les ambiances et expériences dans lesquelles tu pourrais vraiment te retrouver. ». Cartes issues de préférences/contextes réels, jamais les trois exemples fixes de la maquette pour tout le monde. Libellés d'adéquation « Très prometteur », « À explorer », « À vérifier », « À éviter » (ce dernier uniquement avec contrainte explicite). « Pourquoi ? » affiche les critères, sans dévoiler une information privée dans une vue partagée.

## 10. « Ton univers » — entités, inspirations, rêves

Conserver les modules V2 : « Marques repères », « Lieux & ambiances », « Matières & esthétique », « Rêves & envies ». Ajouter si étayé « Œuvres & artistes », « Saveurs & boissons », « Activités & pratiques », « Personnes & souvenirs importants » (privé par défaut, attention aux tiers). Les cartes ENTITY affichent nom précis, type, relation « J'adore » / « J'aime » / « J'aimerais essayer » / « J'aimerais avoir » / « J'aimerais visiter » / « J'évite » uniquement selon relation réellement connue. Ne pas déduire une passion générale d'une marque aimée.

## 11. « Mes envies » — distinguer wishlist et carnet

Sur Ma fiche :

    •    « Ma wishlist » : mes souhaits déclarés, que Candice peut exploiter pour recommander à mes proches sans révéler automatiquement qu'ils viennent de moi. Carte : image, nom, marque, variante, taille, couleur, lien, priorité si déclarée, occasion si utile, date/validité, notes privées. CTA « Ajouter une envie » ; « Modifier », « Retirer ».

    •    « Carnet d'envies » : les envies que je repère chez mes proches, pas mes propres souhaits. Depuis une fiche proche : « Ajouter une envie repérée », photo en premier si disponible, objet précis, phrase entendue, lien, date, contexte, fiabilité de l'observation. CTA « Ajouter une photo », « Noter ce qu'il/elle a dit », « Enregistrer ».

Ne jamais fusionner les deux ni transformer automatiquement une envie repérée par un tiers en désir confirmé par le propriétaire.

Dans la fiche d'un proche, section « Ses envies » : présenter des recommandations ou envies autorisées ; ne pas montrer sa wishlist privée ni sa source sans permission. Si l'utilisateur a repéré une envie : afficher dans « Mon carnet sur [Prénom] », avec badge de provenance « Repéré par moi », jamais « [Prénom] souhaite » comme fait confirmé. Le moteur peut utiliser des souhaits privés pour calculer une recommandation sans exposer le souhait source ; ne pas garantir l'anonymat absolu si l'item recommandé lui-même rend la source évidente.

## 12. « Infos pratiques » — visible par moi, utile à l'action

Conserver le module V2 et ses catégories : « Tailles », « Alimentation », « Parfums », « Livraison », « Mobilité & confort », « Dates clés », « Informations sensibles » uniquement après validation du filtre de sensibilité, des droits et des parcours de confidentialité ; aucune exposition automatique. Ajouter de manière contextuelle « Préférences cadeaux », « Contraintes d'organisation », « Allergies & restrictions » sans multiplier les champs redondants. Ces informations peuvent être FACT/CONTEXT/GUARDRAIL, pas nécessairement PROFILE.

Titre « Infos pratiques » ; sous-texte « Les détails qui aident Candice à éviter les erreurs. » ; label « Privé par défaut ». Boutons « Ajouter », « Modifier », « Supprimer », « Gérer la confidentialité ». Pour les données sensibles, ne jamais afficher le détail dans une prévisualisation partagée par défaut. Exemple « Mobilité & confort » : résumé visible à soi « Éviter l'attente debout prolongée » ; détail source privé si sensible ; recommandations filtrées sans révélation du diagnostic.

## 13. « Pour mieux viser » — Discovery adaptatif et non scolaire

Conserver les suggestions V2, sous le titre « Pour mieux viser », texte « Quelques précisions peuvent aider Candice à être encore plus juste. À ton rythme. ». À la LIGNE 5, l’orchestrateur Discovery de la ligne 9 n’existe pas encore : alimenter cette section uniquement par les questions et lacunes de l’onboarding effectivement opérationnels, en vérifiant les états SKIP/DEFERRED/DO_NOT_PROBE connus ; ne pas inventer une éligibilité Discovery. Si aucune source fiable n’est disponible, afficher un état éditorial léger « Candice te proposera bientôt d’explorer de nouveaux sujets » sans CTA inopérant. À la LIGNE 9 seulement, brancher les suggestions adaptatives sur l’orchestrateur et ses branches réellement éligibles, sans parcours figé ni promesse de nombre de questions restant.

États : « À découvrir » ; « À préciser » ; « Bien compris pour le moment » ; « Mis de côté » uniquement si l'utilisateur a explicitement demandé le report. Ne pas transformer SKIP en manque ou désintérêt ; DEFERRED n'impose pas une relance ; DO_NOT_PROBE interdit toute sollicitation spontanée ; LOW_INTEREST réduit la pression, sans interdiction définitive. Un « Je ne sais pas » est UNKNOWN, pas un rejet. Chaque question doit proposer « Passer cette question » et « J'y répondrai plus tard ». Note discrète : « 🔒 Tes réponses restent privées. Tu choisis ce que tu partages. » uniquement si cette promesse est techniquement vraie.

## 14. États de la fiche — 0 %, onboarding, Discovery, maturité

S0 — rien renseigné : identité déclarée seulement, intro chaleureuse, carte de démarrage ; aucun graphique rempli artificiellement. Les catégories peuvent être visibles sous forme de navigation « À découvrir », sans faux résultats. CTA « Commencer à me découvrir ».

S1 — onboarding partiel : afficher immédiatement chaque connaissance étayée ; graphiques partiels avec « Premiers repères » ; laisser les autres en UNKNOWN. CTA « Continuer mon profil » ; reprise au bon endroit.

S2 — onboarding terminé : afficher portrait initial, langages et domaines soutenus ; Discovery prend le relais sans faire croire que « tout est terminé ». CTA « Affiner mon profil ».

S3 — Discovery progressif : chaque nouvelle evidence pertinente actualise la bonne carte, les barres et les nuances, sans animation intrusive ni réordonner toute la page en permanence. Conserver une mise en page stable ; les contenus deviennent plus précis.

S4 — profil riche : analyses narratives développées, contradictions contextualisées, visuels détaillés, univers fins, références, recommandations mieux étayées. Toujours « Affiner », « Corriger », « Ajouter ».

S5 — information ancienne ou contradictoire : ne pas écraser ; « À confirmer » / « Tu nous avais dit… Est-ce toujours vrai ? » si approprié et autorisé, avec choix « Oui », « Ça a changé », « Pas maintenant ». Ne pas exposer les contradictions comme un défaut de la personne.

S6 — refus de sujet / données supprimées : ne pas réintroduire la question ni la donnée via une autre vue ; respecter les limites d'orchestration et de suppression.

Règle visuelle : pas de graphique à zéro pour un UNKNOWN, pas de faux « profil complété à 100 % », pas de textes de personnalité stéréotypés. Le contenu doit être utile dès les premières réponses, sans attendre un seuil global artificiel.

## 15. FICHE PROCHE — architecture complète

En-tête : « [Prénom] », nature du lien si déclarée (« Mon conjoint », « Mon amie », « Mon père »…), avatar, anniversaire si connu/autorisé, actions « Préparer une attention », « Ajouter une information », « Ajouter une envie repérée », « Nous deux », menu « Gérer ce proche ».

Bandeau d'origine clair : « Ce que [Prénom] a choisi de partager » pour la partie de son profil ; « Mon carnet sur [Prénom] » pour les observations privées du visiteur. Ne jamais amalgamer. Si pas de compte relié ou partage inexistant : « [Prénom] n'a pas partagé de profil avec toi. Tu peux quand même noter ce que tu connais de ses goûts pour que Candice t'aide à lui faire plaisir. ». Si partage partiel : « Tu vois uniquement les éléments que [Prénom] a choisi de partager avec toi. ». Si lien non accepté : « En attente de connexion » ; ne pas montrer de données avant autorisation.

Sections de « Son portrait » (seulement si partagées) : « En quelques mots », « Son langage d'attention », « Ce qui lui fait plaisir », « Ce qu'il vaut mieux éviter », « Ses mondes », « Ce qui marche avec lui/elle », « Son univers », « Infos pratiques partagées ». Conserver les graphiques et barres correspondants uniquement pour les dimensions autorisées ; ne jamais afficher des barres cachées grisées dont la forme révèle la valeur. Si section non partagée : pas de teasing « secret », seulement une indication neutre si nécessaire « Cette partie du profil n'est pas partagée. ». Les textes d'analyse doivent être régénérés sur le sous-ensemble autorisé ; jamais tronquer un texte privé qui laisse deviner le reste.

Sections privées pour le visiteur : « Ce que je sais de [Prénom] », « Mes observations », « Ses envies repérées », « Sa situation en ce moment », « Nos souvenirs et idées », « Mes idées d'attentions ». Chaque élément précise son origine (« Noté par moi », « Dit par [Prénom] selon moi », « Déduit par Candice — à confirmer »). Ne pas faire passer une observation subjective pour une déclaration de la personne.

### 15.1 — Modules relationnels de la V2 : propriété exclusive de la ligne 7ter

La maquette gelée comporte « Vos langages comparés », « Le mode d’emploi de votre duo », « Ce qui vous lie » et « Là où vous vous ratez parfois ». Ils sont préservés comme spécifications de « Nous deux », sans suppression ni réécriture en cartes génériques. À la ligne 6, préserver leurs points d’ancrage et interfaces sans afficher de comparaisons ni implémenter prématurément leur logique. Leur réalisation complète et leurs tests d’autorisations appartiennent exclusivement à la ligne 7ter, après la ligne 7 et 7bis. Toute formulation de difficulté relationnelle doit être descriptive, non culpabilisante et soutenue par des preuves partagées des deux côtés.

## 16. « Ajouter une information sur [Prénom] » — parcours intégral et wording

Point d'entrée visible dans la fiche proche : « Ajouter une information » ; raccourcis « Noter un goût », « Signaler un changement », « Ajouter une envie repérée », « Raconter quelque chose sur lui/elle ».

Ouverture du panneau :

Titre : « Qu'aimerais-tu me dire sur [Prénom] ? »

Sous-texte : « Un détail, une envie, une habitude ou un changement dans sa vie : tout peut m'aider à mieux le/la comprendre. »

Choix (cartes ou chips, pas formulaire interminable) :

1. « Un goût ou une préférence » — « Ce qu'il/elle aime, n'aime pas ou choisit souvent. »

2. « Une envie repérée » — « Quelque chose qu'il/elle a mentionné ou remarqué. »

3. « Sa situation en ce moment » — « Un événement, un projet ou un changement important. »

4. « Une habitude ou une réaction » — « Comment il/elle fonctionne dans certaines situations. »

5. « Un souvenir ou une anecdote » — « Quelque chose qui compte pour lui/elle ou pour vous. »

6. « Autre chose » — « Raconte-le simplement avec tes mots. »

Question principale adaptée :

    •    Goût : « Qu'as-tu remarqué chez [Prénom] ? » ; placeholder « Par exemple : il adore les cafés tranquilles, mais déteste les endroits bruyants… ».

    •    Envie : « Qu'est-ce qui lui a fait envie ? » ; placeholder « Le produit, le lieu, l'expérience… » ; actions « Ajouter une photo », « Coller un lien », « Préciser la variante ».

    •    Situation : « Qu'est-ce qui se passe dans sa vie en ce moment ? » ; placeholder « Un nouveau travail, un déménagement, une période chargée… ».

    •    Habitude : « Dans quelle situation as-tu remarqué cela ? » puis « Comment réagit-il/elle généralement ? » ; ne pas inférer un trait global d'une anecdote.

    •    Souvenir : « Quel souvenir ou détail aimerais-tu que Candice retienne ? ».

    •    Autre : « Je t'écoute. » ; placeholder « Raconte-moi avec tes mots… ».

Question de provenance, légère mais essentielle : « Comment le sais-tu ? » Choix : « [Prénom] me l'a dit », « Je l'ai observé », « C'est mon impression », « Je ne sais plus exactement ». Ne pas imposer cette question si la provenance est déjà explicite dans le texte ; l'IA peut préremplir puis demander confirmation.

Question de temporalité si utile : « C'est toujours d'actualité ? » Choix : « Oui », « C'était à une période précise », « Je ne sais pas ».

Question de portée si utile : « Est-ce quelque chose de général, ou plutôt lié à une situation ? » Choix « Plutôt général », « Dans cette situation », « Je ne sais pas ». Ne pas demander trois questions de qualification à chaque ajout : adaptatif, une clarification seulement si nécessaire.

Sensibilité : si deuil, santé, conflit, rupture, religion, vulnérabilité ou autre donnée sensible : message « C'est une information personnelle. Candice peut en tenir compte avec discrétion, sans l'afficher ni la partager. » ; choix « Enregistrer dans mon carnet privé », « Ne pas enregistrer » ; si nécessaire, demander une confirmation de confidentialité spécifique. Ne pas encourager l'utilisateur à collecter des diagnostics ou secrets de tiers. Ne pas inférer une pathologie ou une cause psychologique.

Écran de confirmation avant enregistrement lorsque l'interprétation est ambiguë : « Voilà ce que je retiens » + reformulation factuelle + badge « D'après toi » ; boutons « C'est juste », « Modifier », « Annuler ». Si c'est une impression : « Je le garderai comme ton observation, pas comme un fait confirmé par [Prénom]. ».

Succès : « C'est noté. Je m'en servirai pour te proposer des attentions plus justes. » Actions « Voir dans mon carnet », « Ajouter un autre détail », « Terminer ». Éviter la promesse absolue d'utilisation si l'information est peu fiable, sensible ou non pertinente : variante « Je garderai ce détail en tête quand il sera pertinent. ».

Gestion : chaque note a « Modifier », « Supprimer », « Corriger la provenance », « Marquer comme plus d'actualité ». Suppression réelle suivant politique de rétention ; invalidation des dérivés concernés. Aucun partage automatique de cette note avec le proche ou avec d'autres personnes.

## 17. Deux perspectives sur une même personne — règle de confiance

Une fiche proche peut agréger pour le moteur (sous conditions d'accès) :

A. Ce que [Prénom] dit de lui-même : déclarations directes et HSG consolidé, visibles uniquement selon ses permissions.

B. Ce que moi, j'observe de [Prénom] : carnet privé rattaché à ma relation avec lui/elle, pas au profil public global de [Prénom].

C. Ce que Candice infère : conclusions justifiées, traçables, contextualisées, non affichées comme faits.

Si A et B divergent, ne jamais écraser la déclaration de la personne par l'avis du proche. Afficher dans mon carnet : « Ton observation diffère de ce que [Prénom] a choisi de partager. Candice gardera cette nuance à l'esprit. » uniquement si la comparaison est autorisée et ne révèle aucune donnée cachée. Sinon pas d'alerte de divergence. Ne jamais fusionner silencieusement des carnets de plusieurs proches ni révéler qui a dit quoi. Les observations peuvent améliorer mes recommandations concernant cette personne sans devenir automatiquement ses connaissances personnelles certifiées.

## 18. Partager « Ma fiche » — AU CAS PAR CAS, PAR PERSONNE

Le partage n'est ni global, ni automatique, ni réciproque. Il est décidé pour chaque proche individuellement, avec granularité des informations. Une autorisation donnée à Thibaud n'autorise rien pour une amie, un parent, un collègue ou un autre proche. Le fait de partager ne rend jamais publiques les réponses brutes de l'onboarding/Discovery, les evidences, les confidences, les notes des tiers, les textes privés ni les raisonnements internes.

Point d'entrée « Partager mon profil ». Panneau :

Titre : « Avec qui veux-tu partager ? »

Sous-texte : « Tu décides ce que chaque proche peut voir. Candice peut continuer à l'aider à te faire plaisir, même si tu ne partages rien. »

Sélecteur « Choisir un proche » / « Ajouter un proche ».

Pour [Prénom] : « Ce que [Prénom] peut voir » ; interrupteur principal « Autoriser le partage avec [Prénom] » (désactivé par défaut) ; action « Ne rien partager » toujours disponible.

Liste de permissions distinctes, toutes désactivées par défaut :

    •    « Mon portrait en quelques mots » — « Une présentation générale de ce que Candice comprend de moi. »

    •    « Mon langage d'attention » — « Les gestes qui me touchent, sans mes réponses personnelles. »

    •    « Ce qui me fait plaisir » — « Mes moteurs et mes préférences d'attentions. »

    •    « Ce que je préfère éviter » — « Les précautions que j'accepte de communiquer. »

    •    « Mes centres d'intérêt » — « Les univers que j'ai choisi de montrer. »

    •    « Mes goûts et références » — « Marques, lieux, matières, œuvres et autres préférences sélectionnées. »

    •    « Mes rêves et envies » — « Uniquement les envies que j'ai autorisées à afficher. »

    •    « Mes infos pratiques » — « Les détails pratiques que je choisis, un par un. »

    •    « Mes dates clés » — « Les dates que j'autorise à voir. »

« Ma façon de fonctionner » — « Les dimensions de mon fonctionnement et les comportements que j’accepte de partager, sans mes réponses brutes. » Permission autonome, désactivée par défaut, couvrant PROFILE, SOCIAL_ENERGY et les analyses BEHAVIOR non sensibles explicitement sélectionnées. La catégorie ne permet jamais de diffuser automatiquement un contenu sensible.

« Mes nuances » — « Les différentes facettes de ma personnalité que je choisis de montrer. » Permission autonome, désactivée par défaut. Chaque tension requiert les autorisations explicites sur les DEUX constructs qui la composent et sur la carte elle-même ; si une partie manque, ne pas afficher une demi-tension révélatrice ni la déduire indirectement.

Règle d’héritage des permissions : un résumé général, une carte de portrait ou une recommandation ne peut pas contourner ces deux permissions en reformulant PROFILE, SOCIAL_ENERGY, BEHAVIOR ou une tension. Les permissions de sections sont nécessaires mais non suffisantes : filtrage des evidences par destinataire, classification de sensibilité du contenu et exclusion des sources privées de tiers restent obligatoires. Aucun accès par défaut, même entre proches connectés.

Granularité à deux niveaux : catégorie → éléments. Par exemple « Mes goûts et références » ouvre les sous-catégories ; « Mes infos pratiques » ouvre chaque champ. Pour les données sensibles, jamais de partage par catégorie seule : opt-in par information individuelle, avec confirmation renforcée. « Mes rêves et envies » ne doit pas partager toute la wishlist par défaut : choisir les items visibles un par un. Si une catégorie est activée sans sous-sélection, montrer explicitement ce qui sera inclus et ce qui ne le sera pas.

Contrôles : « Tout désélectionner », « Prévisualiser ce que voit [Prénom] », « Enregistrer les choix », « Annuler », « Arrêter le partage ». Ne pas proposer « Tout partager » comme raccourci incluant les données sensibles ; si un « Sélectionner les catégories courantes » existe, exclure sensibles, wishlist et notes privées.

Avertissement : « Tu peux modifier ces choix à tout moment. Ils s'appliquent uniquement à [Prénom]. ». Après enregistrement : « Tes choix de partage avec [Prénom] sont enregistrés. ». Révocation : « [Prénom] n'aura plus accès aux éléments que tu partages. Les informations qu'il/elle a déjà vues ne peuvent pas être effacées de sa mémoire ou de ses captures. » ; confirmation « Arrêter le partage » / « Conserver ».

IMPORTANT : les permissions doivent porter sur les données et les sorties calculées, pas uniquement sur l'affichage. Toute analyse générée, recommandation expliquée, aperçu, export, notification, comparaison et API doivent respecter la même politique. Si une phrase résume plusieurs données et qu'une seule est interdite, régénérer le résumé sur la base autorisée ; ne pas utiliser la phrase d'origine. Ne jamais révéler un élément masqué par un score, un libellé de confiance ou une suggestion de question.

## 19. « Voir ma fiche partagée » — prévisualisation fidèle

Bouton « Voir ma fiche partagée » dans Ma fiche. Si aucun proche choisi : « Choisis un proche pour voir exactement ce qu'il peut consulter. ». Sélecteur « Voir en tant que : [Prénom] ». En-tête aperçu « Ta fiche, vue par [Prénom] » ; aide « Voici exactement les informations auxquelles [Prénom] a accès. ». Même mise en page et mêmes graphiques que la vraie vue du proche, filtrés par autorisations ; pas une maquette générique.

Si aucun partage : « Tu n'as rien partagé avec [Prénom]. Candice peut néanmoins l'aider à choisir une attention grâce à ce qu'elle connaît de toi, sans lui dévoiler tes informations privées. » Cette phrase n'autorise pas à afficher les faits ou leur source. Si aucune relation connectée, expliquer la différence entre recommandation et divulgation sans prétendre qu'une recommandation est impossible à deviner.

## 20. Paramètres de partage et confidentialité — arborescence complète

Dans Paramètres → Confidentialité et partage :

    •    « Mes partages » : liste des proches ; statut « Aucun partage », « Partage personnalisé », « Accès suspendu » ; CTA « Gérer ».

    •    « Ce que je partage avec [Prénom] » : permissions et sous-éléments, date de modification, « Prévisualiser », « Modifier », « Arrêter le partage ».

    •    « Mes informations personnelles » : « Voir et corriger », « Supprimer une information », « Gérer les informations sensibles ».

    •    « Les informations que d'autres ont notées sur moi » : ne pas promettre un droit de lecture automatique sur leurs carnets privés. Expliquer clairement le périmètre et les mécanismes légaux applicables sans inventer une fonction existante.

    •    « Comment Candice utilise mes réponses » : explication « Tes réponses aident Candice à personnaliser ses conseils. Elles ne sont pas automatiquement montrées à tes proches. ».

    •    « Gérer mes connexions » : invitation, acceptation, retrait, blocage selon modèle relationnel réel.

Texte de rappel : « Partager une partie de ton profil n'est jamais obligatoire. Tes choix sont propres à chaque proche. ».

## 21. « Nous deux » — comparaison sans pseudo-compatibilité

Titre « Nous deux » ; sous-texte « Ce qui vous rapproche, ce qui vous distingue et ce qui peut vous faire plaisir ensemble. ». Ne pas afficher « 92 % compatibles », « âme sœur », score de qualité de relation, diagnostic relationnel, ou classement des personnes. L'objectif est l'aide à la relation et aux attentions, pas une note.

Données autorisées : mes données propres + les éléments que [Prénom] a explicitement partagés avec moi, et, si prévu, mes observations privées clairement signalées. Ne jamais utiliser le profil caché de [Prénom] pour me révéler ses traits par une comparaison. Si un domaine est non partagé : « Pas assez d'informations partagées pour comparer ce sujet. » ; aucune valeur, aucun score ni indice implicite. Une donnée issue de mon carnet ne doit pas être présentée comme un accord confirmé par [Prénom].

Sections et wording :

1. « Nos points communs » — « Les goûts, activités ou façons de vivre que vous semblez partager. » Cartes avec intérêt/ENTITY précis et evidence de chaque côté ; statut « Confirmé des deux côtés » seulement si les deux déclarations le permettent, sinon « À confirmer ».

2. « Nos différences qui comptent » — « Des préférences différentes, à prendre en compte sans en faire un problème. » Jamais jugement de valeur, jamais oppositions artificielles entre constructs indépendants.

3. « Nos complémentarités » — « Des manières différentes de faire qui peuvent bien fonctionner ensemble. » Afficher seulement avec données suffisantes et contexte ; pas de spéculation psychologique.

4. « Comment on se montre de l'attention » — comparaison visuelle GIVE de moi ↔ RECEIVE de [Prénom] et GIVE de [Prénom] ↔ RECEIVE de moi lorsque les deux côtés sont autorisés et suffisamment établis. Les barres sont indépendantes ; ne jamais déduire GIVE de RECEIVE. Texte « Tu as tendance à montrer ton affection par… ; [Prénom] semble surtout reconnaître… » uniquement si étayé.

5. « Ce qu'on pourrait aimer faire ensemble » — 3 à 6 idées concrètes dérivées d'intérêts partagés et contraintes compatibles, avec « Pourquoi cette idée ? » et « Préparer ce moment ». Si contraintes privées de [Prénom] sont utilisées pour filtrer, ne pas les révéler dans l'explication.

6. « Les attentions à ajuster » — « Ce qui pourrait mieux fonctionner entre vous, selon ce que vous avez choisi de partager. » Conseils actionnables et modestes, jamais injonctions thérapeutiques.

7. « Ce qu'on connaît encore peu » — domaines partagés insuffisants ; CTA « Ajouter une observation » sur son carnet, ou « Inviter [Prénom] à partager davantage » uniquement sur action explicite, sans pression.

Visualisation : conserver graphiques et barres riches ; pour deux profils, deux séries visuelles lisibles, labels nominaux, contexte, confiance, et état UNKNOWN ; jamais aligner deux jauges sur des échelles incompatibles. Utiliser des barres comparatives uniquement pour le même construct ; les préférences non quantitatives se présentent en cartes côte à côte. Éviter le radar global de personnalité qui écrase les contextes. Graphique « affinités par univers » = chevauchement des intérêts déclarés et autorisés, pas une mesure d'amour ou d'entente.

Exemples de wording dynamiques :

    •    Commun : « Vous aimez tous les deux découvrir de nouveaux restaurants. » seulement si deux evidences.

    •    Différent : « Tu préfères les programmes spontanés ; [Prénom] aime anticiper les détails de ses voyages. » uniquement si les deux contextes sont comparables et les informations partagées.

    •    Attention : « Tu exprimes souvent ton affection par des services rendus. [Prénom] se sent particulièrement touché·e par les mots : un message personnel pourrait compléter tes gestes. » seulement si les deux modalités sont étayées et autorisées.

    •    Insuffisant : « Candice n'a pas encore assez de repères partagés pour analyser vos affinités sur ce sujet. ».

## 22. États et permissions de « Nous deux »

Aucun partage des deux côtés : « Vos profils ne sont pas partagés pour le moment. Tu peux toujours préparer une attention pour [Prénom]. » Pas de comparaison cachée.

Partage unilatéral ou insuffisant : « Il reste encore des choses à découvrir sur vous deux. Les comparaisons s’appuient uniquement sur ce que chacun a choisi de partager. » Ne pas révéler qui a refusé quelle catégorie.

Informations insuffisantes pour la comparaison : conserver une explication globale, neutre et non accusatoire. CTA « Gérer mon partage » ; invitation à enrichir le partage seulement sur action volontaire, sans relance automatique.

Partage partiel : montrer uniquement les sections comparables, les autres restent non révélées. Si un partage est retiré, supprimer les dérivés/affichages calculés non autorisés des caches et comparatifs ; ne pas continuer à montrer les anciens résultats.

## 23. Réglages d'une fiche proche

Menu « Gérer [Prénom] » : « Modifier le lien », « Gérer la connexion », « Voir les informations partagées », « Gérer mon carnet », « Exporter mes notes » si la fonction existe et la politique l'autorise, « Retirer de mes proches », « Bloquer » si prévu. Ne pas confondre retirer un proche, révoquer un partage et supprimer mes notes. Dialogues de confirmation explicites ; ne pas supprimer les données de [Prénom] appartenant à son compte.

## 24. Microcopy transverse — états, actions, erreurs

    •    Sauvegarde : « Enregistré » ; échec : « Impossible d'enregistrer pour le moment. Réessaie. » ; ne jamais afficher « Enregistré » avant confirmation serveur.

    •    Modification : « Modifier cette information » ; correction : « Ce n'est pas tout à fait ça » ; suppression : « Supprimer cette information ».

    •    Explicabilité : « Pourquoi Candice pense ça ? » → « Cette analyse s'appuie sur… » + sources autorisées dans le contexte, sans afficher les réponses brutes dans la vue d'un proche.

    •    Incertitude : « Candice a encore peu d'éléments sur ce point. », « C'est une piste, pas une certitude. », « Cette préférence semble dépendre du contexte. ».

    •    Évolution : « Tes goûts ont changé ? », « Mettre à jour ».

    •    Aucune donnée : « Rien à afficher pour le moment. » + CTA contextuel.

    •    Privé : « Visible uniquement par toi » ; partagé : « Partagé avec [Prénom] » ; tiers : « Note privée sur [Prénom] ».

    •    Partage désactivé : « Tu ne partages actuellement aucune information avec [Prénom]. ».

    •    Permission : « Tu gardes la main sur ce que tu montres. ».

    •    Attente : « Chargement de ton portrait… » / « Chargement de la fiche de [Prénom]… ».

    •    Suppression : « Supprimer ce détail ? Il ne sera plus utilisé pour personnaliser tes recommandations. » à adapter si d'autres evidences indépendantes subsistent ; ne pas promettre l'effacement de faits appris indépendamment.

### 24.1 — États de régénération des sections et politique de fraîcheur

État nommé « Cette partie de ton portrait se met à jour… » après correction, suppression, modification de provenance ou changement des règles de génération. Afficher l’ossature stable de la carte, son titre et un indicateur discret, avec action « Réessayer » si erreur ; ne jamais afficher un faux résultat ni un score de zéro. Les autres sections valides restent visibles. Ne pas bloquer toute la fiche pour une seule section.

Règle de fraîcheur : pour Ma fiche aussi, une analyse invalidée par une correction ou une suppression ne doit plus être présentée comme actuelle. Remplacer temporairement son texte généré par l’état de régénération ; les faits déclarés toujours valides peuvent rester visibles dans leurs propres composants si leur affichage est autorisé. Dans les vues partagées, appliquer une règle encore plus stricte : ne jamais servir une ancienne sortie lorsque permissions, sensibilité ou version de règles ont changé ; accès refusé ou attente de génération. Les caches et jobs concurrents respectent les versions en vigueur au moment de la publication.

États : updating (génération en cours), regeneration_failed (erreur avec relance), current (analyse valide), insufficient_evidence (pas assez d’éléments), access_revoked (vue partagée inaccessible). La vue doit distinguer « information inconnue » de « analyse momentanément indisponible ». Ne jamais montrer un contenu périmé sous un simple spinner.

## 25. Architecture de données, provenance et confidentialité

Ne pas créer trois profils disjoints. Utiliser le graphe de connaissance existant. Le HSG conserve les 10 familles `INTEREST`, `PREFERENCE`, `PROFILE`, `AFFECTION_LANGUAGE`, `NEED`, `DRIVER`, `BEHAVIOR`, `GUARDRAIL`, `ENTITY`, `CONTEXT`. `FACT` est hors familles ; `ONTOLOGY_GAP` n'est pas une famille. `UNKNOWN` est un état valide. Les scores de confiance et de force ne sont pas interchangeables.

Toute information affichée doit avoir : sujet/personne concernée, auteur/source, mode d'acquisition, date, contexte, statut de déclaration, sensibilité, niveau de confiance, portée temporelle, visibilité et liens aux evidences si applicable. Une observation d'un proche est rattachée à la relation et à son auteur ; elle ne devient pas automatiquement une affirmation de la personne observée. Un fait sensible déclaré n'est pas « vérifié ».

Autorisation par destinataire et par champ/section, y compris outputs dérivés : permissions explicites, opt-in, révocation, prévisualisation exacte, contrôle serveur, filtrage avant génération de texte, minimisation des données transmises aux modèles, pas de fuite dans logs/analytics/notifs/caches/exports. Les données privées peuvent aider le moteur à choisir une attention sans être divulguées au demandeur ; ne pas utiliser leur existence pour produire des indices révélateurs. Ne pas promettre une sécurité qui n'est pas réellement implémentée.

Règle de rendu : distinguer `evidence`, `FACT`, `signal`, `summary` et `view_permission`. L'analyse d'une vue partagée est recalculée sur les seules informations autorisées, pas copiée depuis le résumé privé. Les graphiques utilisent des valeurs autorisées et une confiance appropriée. Une correction utilisateur invalide ou révise les dérivés ; l'ancienne inference ne reste pas affichée.

## 26. Accessibilité, qualité éditoriale, design system

Typographie élégante et chaleureuse, sans infantilisation ; phrases courtes, précises, naturelles, pas de vocabulaire technique HSG visible dans l'interface. Préserver le caractère premium de la V2, ses visuels, graphes, respirations et niveaux de détail. Pas de « badge » décoratif partout, pas de questionnaires administratifs. Tous les états (vide, partiel, complet, partagé, non partagé, révoqué, erreur) doivent avoir un contenu soigné. Responsive, navigation clavier, labels d'écran, contrastes, alternatives aux graphiques, états de chargement, gestion du texte long, pluriels et accords.

## 27. Consignes d'exécution Claude Code — PAR LOTS DÉPENDANTS ET VALIDÉS

1. Auditer le dépôt et identifier composants/routing de Ma fiche, Fiche proche, partage, HSG, Discovery, wishlist, Carnet d'envies et comparatif. Lire les cinq sources listées en tête. Ne pas générer un HTML autonome.

2. Conserver et réutiliser l'interface V2 gelée et les composants existants, surtout graphiques, barres, cartes, catégories et analyses. Ajouter et corriger, ne pas remplacer.

3. Consommer la cartographie éditoriale VALIDÉE par la responsable produit (construct canonique → chapitre → section → composant → représentation → états vide/partiel/riche → permissions). Claude Code vérifie sa faisabilité et signale les écarts ; il ne décide pas seul de l’architecture éditoriale. Produire aussi un mapping de toutes les branches Discovery et des connaissances ouvertes structurées ; aucun domaine orphelin.

4. Ne PAS implémenter tous les modules en une seule passe. Suivre les dépendances du registre : ligne 4 génération ; ligne 5 Ma fiche après cartographie éditoriale validée ; ligne 6 Fiche proche ; ligne 7 suppression sécurisée de my_profile et de la double écriture ; puis 7bis partage individualisé/prévisualisation ; puis 7ter Nous deux. Ligne 8 carnet privé et ligne 9 Discovery conservent leurs références dans le registre ; vérifier leurs dépendances réelles. Chaque lot a sa recette et son feu vert.

5. Implémenter les textes comme microcopy dynamique et non exemples statiques. Formulations françaises naturellement neutres, sans points médians ni dépendance au champ sexe ; prénom, contexte, preuves disponibles, partage et UNKNOWN pilotent le rendu.

6. Ajouter des tests : absence de données, onboarding partiel, progression Discovery, 7 modalités GIVE/RECEIVE, infos sensibles, 2 proches aux permissions différentes, partage nul, partage partiel, révocation, note subjective, contradiction, wishlist privée, fuite par résumé/graphique/comparatif, SKIP/DEFERRED/DO_NOT_PROBE, responsive et accessibilité.

7. Livrer à la fin une synthèse unique : fichiers modifiés, sections conservées, sections ajoutées, mappings, tests exécutés, points bloquants précis. Ne pas demander de validation à chaque étape ; ne solliciter l'utilisatrice que pour un arbitrage réellement bloquant. Ne pas inventer un tag canonique ou une fonctionnalité backend non existante en la présentant comme opérationnelle.

## 28. Critères de recette non négociables

    •    La fiche personnelle est au moins aussi riche que la V2 gelée, avec graphiques, barres, catégories, textes longs et navigation approfondie conservés.

    •    Chaque section a un titre, son contenu, son wording et un comportement aux différents niveaux de connaissance.

    •    L'onboarding et le Discovery enrichissent le même portrait vivant ; aucune donnée inconnue présentée comme faible.

    •    Les 7 RECEIVE et les 7 GIVE sont distincts ; esthétique/qualité n'est pas un huitième langage affectif.

    •    Une fiche proche sépare partage de la personne et carnet privé de l'observateur ; les observations ne deviennent pas des faits certifiés.

    •    Le parcours « raconter quelque chose sur son proche » existe et sait qualifier goût, envie, contexte, habitude, souvenir, provenance, temporalité et sensibilité, sans lourdeur.

    •    Le partage est par proche, par catégorie et au besoin par information ; rien d'automatique, rien de réciproque ; aperçu fidèle et révocation effective.

    •    Les analyses comparatives n'exposent aucune donnée cachée et n'affichent aucun score simpliste de compatibilité.

    •    Les graphiques reflètent les données réelles et autorisées, avec états UNKNOWN et confiance distincts.

    •    La wishlist personnelle et le Carnet d'envies sur les proches restent distincts ; la recommandation n'expose pas automatiquement ses sources.

    •    Aucune section, catégorie, branche ou information de la V2 et des sources canoniques n'est supprimée sans justification et traçabilité.

38.1 — Tests supplémentaires obligatoires : six corrections finales

IDENTITÉ : créer un sujet A et un tiers B ayant une note incognito sur A ; vérifier que Ma fiche de A, ses explications et les API de consultation ne restituent ni la note ni une reformulation révélatrice. Tester les recommandations autorisées côté B sans contamination de A.

SENSIBILITÉ : fait sensible directement fourni par A → peut apparaître dans Ma fiche privée de A, de manière contrôlée ; le même fait → jamais nommé dans la prose de B ni dans la justification visible d’une recommandation. Vérifier le filtrage avant génération et les dérivés.

INTERPRÉTATION : les quatre niveaux sont calculés sur les affirmations générées, sans champ supplémentaire sur le journal ; provenance canonique, force, confiance et stabilité restent indépendantes.

TRAÇABILITÉ : chaque affirmation significative est reliée à son sous-ensemble exact d’evidences ; source_evidence_ids au niveau section reste un index de compatibilité, pas la preuve suffisante. Modifier une evidence et contrôler la mise à jour de la justification correspondante.

INCERTITUDE : carte lisible en lecture courte, détail « Ce que Candice comprend / Ce qui reste à préciser » ; aucun titre spéculatif rendu catégorique par une extraction hors contexte.

TENSIONS : deux constructs apparemment opposés et contextualisés sont conservés, non moyennés ; cas avec preuves insuffisantes = pas de récit de contradiction inventé. Vérifier leur présence dans la cartographie et leur comportement en partage.

Livrable attendu : l'expérience Candice existante enrichie et pleinement intégrée, pas une nouvelle maquette.


## 29. Arbitrages consolidés — statut et priorité

Les sections 0 à 28 demeurent le socle détaillé. Les corrections directement applicables ont été intégrées dans leur texte ; les sections 29 à 38 constituent les règles d’exécution complémentaires et prévalent en cas d’ambiguïté résiduelle. Aucune règle ne permet de contourner le HSG, le dictionnaire canonique, la maquette V2 ou les permissions serveur.

    •    Nom produit : « Ma fiche » pour l’espace personnel ; « Nous deux » pour le comparatif relationnel. « Nos affinités » n’est plus un nom de navigation.

    •    Le partage est opt-in, par personne et par élément lorsque nécessaire ; aucune case précochée. Une analyse partagée n’est jamais une réponse brute.

    •    Toutes les familles et tous les constructs ont une destination dans le portrait ; la profondeur et le poids visuel varient selon la pertinence, la connaissance et la sensibilité du contenu.

    •    BEHAVIOR est analysé et restitué avec la même ambition que les autres familles, y compris dans les situations difficiles, sans diagnostic ni jugement ; sensibilité du contenu et destinataire gouvernent la présentation.

    •    Le moteur génère à partir des seules evidences autorisées pour la vue, avant toute rédaction, et pas en masquant après coup des fragments privés.

    •    La cartographie éditoriale est arbitrée par la responsable produit, pas improvisée par Claude Code ; la ligne 4 prépare les fondations techniques pendant cet arbitrage.

## 30. Règle fondatrice : profondeur proportionnée aux preuves

Candice peut être profonde sans être catégorique. Elle doit chercher à comprendre toute la personne — goûts, besoins, moteurs, comportements, contradictions, sensibilités et contextes — mais ne jamais présenter comme certaine une lecture que ses preuves ne soutiennent pas. La qualité littéraire ne doit pas accroître artificiellement la certitude.

### 30.1 Quatre niveaux de lecture NON stockés sur les evidences

    1.    CONNAISSANCE EXPRIMÉE : restitution fidèle de la déclaration ou de l’observation, avec provenance, temps et contexte. Exemple : « Dans les périodes difficiles, tu préfères parfois avoir un moment pour toi. »

    2.    TENDANCE CONSOLIDÉE : convergence d’evidences suffisamment indépendantes, récentes et contextualisées. Exemple : « Tu sembles prendre un temps de recul avant de parler de ce que tu traverses. »

    3.    HYPOTHÈSE INTERPRÉTATIVE : lecture possible explicitement présentée comme telle, jamais une vérité psychologique. Exemple : « Cela pourrait refléter l’importance de ton autonomie, sans dire à lui seul comment tu souhaites être accompagné. »

    4.    LECTURE RELATIONNELLE ACTIONNABLE : conséquence pratique prudente fondée sur plusieurs signaux et compatible avec les guardrails. Exemple : « Une présence discrète peut mieux convenir qu’une série de questions immédiates, si cette préférence est confirmée. »

Ces quatre niveaux qualifient la portée interprétative de chaque phrase produite, calculée à la génération depuis les preuves éligibles. Ils ne sont ni un nouveau champ du journal d’evidence ni une quatrième échelle persistée à côté de provenance (six niveaux), force, confiance et stabilité. La section générée peut stocker la portée des affirmations et ses références de traçabilité ; ne pas écraser les échelles canoniques. Aucun passage automatique du niveau 1 au niveau 4. Une information précise et utile de niveau 1 vaut mieux qu’une interprétation de niveau 4 inventée. Les exemples sont fictifs et ne constituent jamais des textes à hardcoder.

### 30.2 Contrat de génération et de contrôle

    5.    Rassembler uniquement les evidences éligibles, avec identité du sujet, source, statut, contexte, temporalité, sensibilité, permissions et supersession.

    6.    Évaluer la diversité réelle des sources, leur indépendance, leur fraîcheur, les contradictions et la confiance ; plusieurs reformulations d’une même réponse ne comptent pas comme preuves indépendantes.

    7.    Séparer l’observable, la tendance, l’hypothèse, la recommandation. Ne jamais déduire automatiquement une peur, un traumatisme, un diagnostic, une motivation ou un besoin latent d’un seul comportement.

    8.    Chercher les explications alternatives et les conditions contextuelles ; ne pas résoudre artificiellement une contradiction non expliquée.

    9.    Produire une phrase proportionnée au niveau de preuve : ni étiquette définitive, ni flatterie automatique, ni brutalité, ni psychologisation gratuite.

    10.    Conserver une traçabilité interne au niveau de chaque affirmation significative : affirmation → sous-ensemble exact d’evidences autorisées → règles/version → contexte ; source_evidence_ids au niveau section (migration 91) ne suffit pas pour cette garantie. Permettre « Pourquoi Candice pense ça ? » et « Ce n’est pas tout à fait ça ».

    11.    Appliquer une validation post-génération : chaque affirmation importante doit être soutenue ; sinon la reformuler en hypothèse, revenir à la description ou la retirer. La vérification ne peut pas rendre admissible une evidence interdite.

Une correction utilisateur doit pouvoir réviser l’interprétation et invalider les dérivés, sans transformer automatiquement toutes les hypothèses associées en FACT. Ne pas confondre intensité du signal, confiance, fréquence, couverture et importance personnelle.

### 30.2 bis — Traçabilité au niveau des affirmations (décision d’architecture)

DÉCISION : la traçabilité sectionnelle source_evidence_ids (migration 91) est conservée pour compatibilité, mais ne satisfait pas « Pourquoi dis-tu cela ? » phrase par phrase. La ligne 4 doit produire une structure interne d’affirmations significatives, chacune avec identifiant stable, texte ou plage de texte, type (déclaration/tendance/hypothèse/implication), sous-ensemble exact des evidence_ids, versions/supersession et contexte admissibles. Une phrase comportant deux affirmations distinctes doit être segmentée ou porter deux justifications distinctes.

Ne pas exposer mécaniquement ces IDs à l’utilisateur : dans Ma fiche, l’explication peut montrer uniquement ses propres déclarations et sources autorisées ; dans une fiche proche, jamais de réponses brutes, d’evidences cachées ni d’observations incognito. Si une affirmation n’a pas de justification suffisamment fine, la retirer ou revenir à une formulation descriptive. Tests : attribution exacte, modification d’une evidence, révocation, supersession, observation de tiers, et impossibilité de reconstruire une source interdite.

### 30.2 ter — Incertitude structurée, pas une pluie de « semble »

Écrire une proposition principale lisible et calibrée ; placer les limites et questions ouvertes dans des sous-blocs progressifs « Ce que Candice comprend » et « Ce qui reste à préciser » lorsque le contenu le justifie. Une hypothèse importante reste clairement identifiable comme hypothèse, mais ne pas répéter « peut-être », « semble », « pourrait » dans chaque phrase. L’interface et la structure de la carte portent une part de l’incertitude ; ne jamais laisser une affirmation spéculative paraître certaine dans un titre isolé, un aperçu, une notification ou une citation extraite de son contexte.

### 30.3 Contradictions, honnêteté et style

Une personne peut aimer la spontanéité pour ses loisirs et l’anticipation pour les décisions importantes ; ces dimensions ne s’annulent pas. Candice cherche les contextes qui les rendent compatibles et accepte aussi de ne pas savoir. Elle peut dire qu’une exigence aide à soigner les détails tout en compliquant parfois l’acceptation de l’imprévu, si les preuves le soutiennent. Ne jamais transformer mécaniquement une difficulté en qualité ni une nuance en jugement.

## 31. BEHAVIOR et PROFILE — couverture intégrale et restitution

Aucun contexte BEHAVIOR canonique ne doit être exclu du portrait du seul fait qu’il évoque le conflit, l’expression des émotions, la détresse, le deuil, la demande d’aide ou les moments difficiles. Chaque contexte du dictionnaire a un emplacement éditorial et un état de connaissance. L’utilisateur doit pouvoir découvrir ce que Candice a compris, avec nuance et possibilité de correction.

L’intitulé du contexte ne décide pas de la sensibilité. La classification porte sur l’evidence, le contenu de l’analyse et son destinataire. Une restitution sur Ma fiche peut être riche, narrative et respectueuse ; une restitution à un proche requiert les permissions adéquates, y compris pour toute information sensible. Ne jamais utiliser « romancé » pour autoriser l’invention d’événements, de souvenirs ou de causalités.

    •    BEHAVIOR : prévoir notamment les représentations « Face aux décisions », « Dans les désaccords », « Face au changement », « Comment tu exprimes tes émotions », « Quand les choses deviennent difficiles » et les autres contextes du dictionnaire ; ces libellés sont éditoriaux et ne créent pas de codes.

    •    La carte « Quand tu as besoin de souffler » ne doit pas être artificiellement rattachée à BEHAVIOR ; la placer dans les contextes, besoins ou dimensions énergétiques réellement documentés.

    •    PROFILE : représenter distinctement les neuf dimensions transversales — ouverture, intensité, sensibilité, structure, autonomie, orientation relationnelle, exigence, adaptabilité, réflexivité — si ce sont bien les intitulés canoniques de la version utilisée ; ne pas inventer de dixième barre.

    •    SOCIAL_ENERGY : axe bipolaire autonome « Me ressourcer seul » ↔ « Me ressourcer avec les autres ». Le centre représente un équilibre/intermédiaire, jamais une intensité moyenne. UNKNOWN = « À découvrir », pas un curseur artificiellement centré.

    •    Les quatre orientations d’arbitrage précédemment orphelines — appétence objet, importance de l’authenticité, spontanéité, maîtrise — doivent recevoir une représentation effective, en plus des facettes déjà présentes ; reprendre les codes exacts du dictionnaire.

    •    BEHAVIOR, PROFILE et SOCIAL_ENERGY peuvent être présentés en mosaïques, cartes narratives, axes et approfondissements, sans rabattre toutes les dimensions sur un graphique unique.

### 31.1 — Identité des sources : frontière absolue

Le portrait personnel est complet sur le périmètre de connaissances dont la personne est l’auteur ou dont elle a autorisé l’intégration à son propre portrait. Une déclaration incognito ou une observation de Julie (ou de tout autre tiers) au sujet de cette personne appartient au carnet privé du tiers : elle ne doit JAMAIS être présentée au sujet, ni comme donnée brute, ni comme analyse attribuable, ni par « Pourquoi Candice pense ça ? ». Le moteur peut en tenir compte uniquement dans les usages légitimes et autorisés de l’observateur, sans transfert de provenance ni contamination du portrait visible du sujet.

## 32. Architecture éditoriale complète — variété et absence d’orphelins

La fiche est un portrait éditorial vivant, pas un rapport d’analyse. Chaque catégorie a une destination technique et un accès possible ; toutes ne doivent pas occuper autant d’espace au premier niveau. Préserver les composants et la densité visuelle de la V2 : barres, cartes, graphiques, chips, mosaïques, axes, blocs narratifs, carrousels utiles, espaces de respiration, expansions « Lire plus ». Pas de répétition mécanique de vingt cartes identiques.

Chapitre / section

Contenu couvert

Représentation privilégiée

Ton portrait

Synthèse, connaissance, provenance, couverture et progression

En-tête + résumé + dashboard, lecture approfondie

Ton langage d’attention

7 RECEIVE et 7 GIVE, cadence, carte B « Les gestes qui te font sentir que tu comptes »

Deux graphiques distincts + carte d’exemples relationnels

Ta façon de fonctionner

9 PROFILE, SOCIAL_ENERGY, tous les BEHAVIOR

Barres de dimensions + axe bipolaire + cartes narratives contextualisées

Ce qui compte pour toi

NEED établis, drivers symboliques et mémoriels, carte A « Ce qui te touche »

Cartes éditoriales et lectures croisées sans duplication

Ce qui marche avec toi

Facettes d’arbitrage, dont objet/authenticité/spontanéité/maîtrise

Barres d’arbitrage distinctes des moteurs symboliques

Tes mondes

INTEREST, PREFERENCE, branches Discovery

Mosaïques d’univers et sous-catégories explorables

Ce qui te fait plaisir

Carte C, envies, expériences, wishlist personnelle

Cartes d’inspiration, envies, recommandations justifiées

Ce qui tombe à côté

GUARDRAIL HARD/SOFT, aversions et limites

Carte D éditoriale visible, non reléguée aux infos pratiques

Ton territoire idéal

Contextes, ambiances, critères d’adéquation

Matrice visuelle V2 et raisons contextualisées

Ton univers

ENTITY, marques, lieux, œuvres, inspirations, rêves

Mosaïques d’entités et références contextualisées

Ta vie en ce moment

CONTEXT, transitions, projets, temporalité

Frise/cartes temporelles et mises à jour

Infos pratiques

FACT, contraintes, tailles, dates, informations utiles

Blocs pratiques avec sensibilité au contenu

Pour mieux viser

Lacunes de connaissance et Discovery éligible

Suggestions adaptatives, jamais dette de questions

Ce qui ne rentre pas dans une case

Connaissance ouverte structurée et ONTOLOGY_GAP éventuels

Placement contextuel dans le bon chapitre, ou espace éditorial « Autres détails » si nécessaire

La cartographie définitive doit être produite au niveau produit et validée avant la ligne 5 : chaque construct exact du dictionnaire → chapitre → section → composant → représentation → état vide/partiel/riche → permissions/sensibilité → source. Les lignes ci-dessus sont un cadre éditorial à confronter aux codes officiels et à la V2, pas une substitution au mapping construct par construct.

### 32.1 Frontières anti-redondance

    •    Graphique RECEIVE (§5) : QUELLES modalités touchent la personne et avec quelle solidité ; carte B : COMMENT ces gestes se manifestent dans sa vie, avec exemples et contextes.

    •    « Ce qui marche avec toi » (§8) : facettes d’arbitrage (esthétique, utilité, objet, expérience, authenticité, spontanéité, maîtrise, etc.).

    •    Carte A « Ce qui te touche » : POURQUOI certains gestes résonnent symboliquement ou mémoriellement (sens, histoire, souvenir, transmission, lien, effort, anticipation, justesse du moment).

    •    Carte D « Ce qui tombe à côté » : restitution éditoriale des limites et précautions ; les informations pratiques peuvent renvoyer à la contrainte, sans reproduire la carte.

    •    Une evidence peut soutenir plusieurs constructions si elle est pertinente, mais deux blocs ne doivent pas reformuler la même conclusion. Si le contenu différenciant manque, état « À découvrir » plutôt que répétition.

### 32.2 — Tensions structurantes : relations entre constructs

Ajouter dans la cartographie éditoriale une couche de RELATIONS entre constructs, sans créer de onzième famille HSG ni de construct fermé fictif. Exemple : spontanéité × maîtrise selon le contexte. Une tension structurante ne se résout jamais par une moyenne ni par l’effacement de l’un des pôles ; elle peut être plus informative que chacun des deux signaux. Sa restitution requiert des evidences distinctes, la comparabilité des contextes, l’analyse des explications alternatives et un niveau de confiance suffisant.

Prévoir une représentation « Tes nuances » / « Ce qui coexiste chez toi » : cartes contrastées, axes contextuels ou récit court avec conditions « dans telle situation / dans telle autre », puis développement. Ne pas fabriquer une tension à partir de deux préférences simplement différentes ; conserver les tensions non résolues sans interprétation forcée. Dans « Nous deux », seules les tensions fondées sur des informations mutuellement partageables peuvent être comparées. Mapping obligatoire : paire de constructs → contexte → evidences → section → représentation → états vide/partiel/riche → permissions.

## 33. Partage : expérience engageante, permissions strictes

Interrupteur principal OFF par défaut ; toutes les catégories et sous-options OFF par défaut ; rien n’est partagé sans action positive. Proposer de petites cases lisibles, des regroupements, une sélection rapide uniquement sûre et une prévisualisation fidèle. Le wording doit donner envie de partager sans minimiser la portée des analyses : « Tu choisis les analyses que [Prénom] peut découvrir. Tes réponses, confidences et notes privées ne sont jamais affichées telles quelles. »

La granularité est au minimum destinataire → catégorie → élément lorsque nécessaire ; les éléments sensibles exigent un opt-in spécifique et une confirmation adaptée. Le jugement de sensibilité s’applique au contenu, y compris aux réponses libres, à chaque evidence et à chaque sortie générée, quelle que soit sa catégorie. Une sélection rapide doit exclure catégories sensibles, éléments sensibles partout, éléments incertains, notes privées, confidences et wishlist non autorisée. Ne pas déployer ce raccourci avant validation du filtre de sensibilité et des contrôles serveur.

Libellé de sélection rapide possible après recette : « Sélectionner les catégories partageables » ; texte d’aide : « Les éléments sensibles et privés restent exclus. Vérifie l’aperçu avant de confirmer. » « Tout partager » ne peut signifier que sélectionner les catégories d’analyses explicitement partageables, jamais toutes les données.

### 33.1 Ce que signifie partager une analyse

Aucune réponse brute de l’onboarding, du Discovery, aucune evidence, note de tiers, confidence ou trace interne n’est exposée. Une analyse peut néanmoins révéler indirectement un fait sensible : le filtre de sensibilité et la vérification des permissions s’appliquent aussi aux résumés, scores, graphiques, explications, recommandations, notifications, exports et API. L’aperçu doit être produit par le même chemin serveur que la vraie vue du destinataire, sans mode dérogatoire.

## 34. Génération par destinataire, cache et révocation

Une analyse privée stockée une fois par section ne peut pas être réutilisée telle quelle pour les proches. Pour une vue partagée, filtrer AVANT génération l’ensemble des evidences autorisées au destinataire ; produire ensuite le texte et les graphiques sur ce seul ensemble. L’analyse est donc générée par périmètre d’autorisation, pas obligatoirement par personne si les périmètres sont rigoureusement identiques et vérifiés.

La clé de cache, si un cache est retenu, est construite de manière déterministe à partir d’un snapshot canonique comprenant : identifiant sujet, destinataire ou contexte d’autorisation, liste EXACTE des identifiants et versions des evidences éligibles, états de supersession/validité, versions de toutes les permissions et restrictions, version du filtre de sensibilité, version des règles de consolidation, version du prompt/modèle/règles de génération et tout contexte qui change la sortie. Le hachage est calculé sur une sérialisation canonique triée et stable. Ne pas inclure des données secrètes en clair dans la clé. Au moindre doute, ne pas réutiliser ; régénérer.

La clé de cache ne remplace jamais une vérification d’autorisation au moment de la lecture. Tester que le changement d’UNE permission, d’UNE evidence, d’UNE version, d’UN état de supersession ou d’UNE version de règle invalide la réutilisation. Ne pas déduire l’égalité de périmètre d’un simple nombre d’evidences ou d’un résumé textuel.

Révocation : bloquer immédiatement la lecture serveur, supprimer ou rendre irrévocablement inaccessibles les sorties dérivées et caches concernés, invalider aperçus, comparatifs, notifications en attente et liens ; régénérer au prochain accès autorisé. Les jobs concurrents doivent contrôler la version des permissions avant publication ; une sortie calculée avec une ancienne version est rejetée. Ne jamais servir une ancienne analyse pendant la régénération. Les copies déjà vues ou enregistrées hors de Candice ne sont pas effaçables par promesse produit.

## 35. « Nous deux » — comparaison strictement réciproque et progressive

Nom unique : « Nous deux » dans navigation, CTA, écrans, documentation et tests. Ce module n’est ni un score de compatibilité ni un diagnostic relationnel. Il compare seulement les dimensions pour lesquelles les DEUX personnes disposent d’informations pertinentes, comparables et autorisées pour CETTE relation. Aucune inférence issue d’un domaine non partagé ne peut enrichir la comparaison.

Règle d’interface de partage : « Plus vous choisissez tous les deux de partager des éléments de vos profils, plus Candice peut explorer vos points communs, vos différences et vos complémentarités dans Nous deux. Vous gardez chacun le contrôle. » Pour une comparaison aussi exhaustive que possible, les deux personnes peuvent sélectionner toutes les catégories d’analyse partageables ; cela ne révèle jamais les réponses brutes, confidences, notes privées ou éléments sensibles non autorisés.

Si la comparaison est partielle : « Il reste encore des choses à découvrir sur vous deux. Les comparaisons s’appuient uniquement sur ce que chacun a choisi de partager. » CTA « Gérer mon partage ». Ne jamais préciser quelle catégorie l’autre a refusée ni attribuer le manque à une personne. Une invitation à enrichir le partage ne peut être déclenchée que volontairement, sans pression ni relances automatiques.

Les observations de mon carnet sur l’autre restent des observations privées : elles peuvent soutenir des conseils dans leur périmètre autorisé mais ne constituent pas une déclaration réciproque, ne remplacent pas une permission et ne doivent pas être utilisées pour inférer un profil caché. Comparer GIVE↔RECEIVE seulement avec deux modalités et deux périmètres étayés ; comparer des constructs homologues sur des échelles compatibles.

## 36. Microcopy, neutralité et sensibilité

Utiliser un français fluide et naturellement neutre, sans points médians et sans faire dépendre les accords du champ sexe. Le sexe éventuellement demandé au début du profil n’est pas une source de personnalisation grammaticale. Exemples : « Les gestes qui te font sentir que tu comptes », « Ce que Candice a compris de toi », « Quand tu as besoin de recul ». Revoir tous les anciens « aimé·e », « touché·e », « seul·e », « il/elle » dans les écrans réellement livrés ; ne pas remplacer par une langue artificielle.

La sensibilité est une propriété du contenu, pas du nom du chapitre. AMENDEMENT EXPLICITE À LA RÈGLE ANTÉRIEURE : les faits sensibles provenant de l’utilisateur ou de sources qu’il a autorisées PEUVENT être nommés dans la prose de SA fiche privée, avec une présentation mesurée, contextualisée et contrôlable ; ils ne sont JAMAIS nommés dans la prose destinée à un autre utilisateur, ni dans une justification de recommandation visible d’un proche. Cette règle remplace la consigne ancienne « faits sensibles jamais nommés dans la prose générée », uniquement pour Ma fiche privée. Les données sensibles concernant un tiers et issues d’un carnet privé restent invisibles pour ce tiers, même s’il est le sujet. Dans Ma fiche, l’utilisateur peut consulter, corriger et supprimer les connaissances issues de ses propres déclarations et des sources qu’il a explicitement autorisées, y compris les analyses BEHAVIOR difficiles, avec présentation adaptée. Les déclarations et observations d’un tiers recueillies en mode incognito ou dans son carnet privé ne sont JAMAIS visibles par le sujet, y compris sous forme de sources, de citations, de justification ou de reconstitution indirecte ; elles ne sont pas absorbées dans un portrait personnel qui permettrait de les deviner. Dans une fiche partagée, seules les analyses autorisées et filtrées apparaissent. Pour les tiers, éviter la collecte inutile de données de santé, religion ou vulnérabilités ; ne jamais présenter un diagnostic comme un fait inféré.

## 37. Séquencement impératif et responsabilités

    12.    LIGNE 4 — Construire la génération rejouable depuis le sous-ensemble autorisé, les versions, la provenance, le filtre et les règles de suppression/révocation ; préparer les interfaces techniques des vues partagées sans les publier.

    13.    CARTOGRAPHIE PRODUIT EN PARALLÈLE — La responsable produit arbitre chaque construct → chapitre → section → composant → représentation → états → confidentialité. Claude Code peut auditer et proposer des écarts techniques, mais ne décide pas seul de la structure éditoriale.

    14.    LIGNE 5 — Ma fiche, après validation de la cartographie, en préservant la V2 gelée et les composants existants.

    15.    LIGNE 6 — Fiche proche, séparation entre profil partagé et carnet privé, sans activer prématurément les parcours de partage.

    16.    LIGNE 7 — Supprimer le chemin de double écriture et les lectures non gardées de my_profile ; migrer ou isoler les données héritées, contrôler les routes, jobs, exports et caches. Preuve d’absence de voie de contournement avant tout partage.

    17.    LIGNE 7bis — Partage par personne, permissions fines, sélection sûre, prévisualisation identique à la vue réelle, révocation et tests.

    18.    LIGNE 7ter — Nous deux, après 7bis et ses garanties de confidentialité. Lignes 8 (carnet) et 9 (Discovery) conservent leur numérotation du registre ; leurs dépendances et statut doivent être vérifiés, pas supposés.

L’expression « en une seule passe » de l’ancienne version est annulée. Chaque ligne possède une recette, des dépendances et un livrable ; aucun lancement parallèle de lots dépendants. Claude Code n’invente pas l’état du dépôt : il audite et signale précisément ce qui est déjà implémenté, ce qui manque et ce qui bloque.

LIGNE 10 — Modèle de recommandation : maintenir ce chantier dans le séquencement et vérifier ses dépendances exactes dans le registre, notamment les garanties de provenance, permissions, explications et non-divulgation. Ne pas le considérer livré parce que les cartes de profil existent.

LIGNE 11 — Remplissage / alimentation des données : maintenir ce chantier et son étape 0 préparatoire telle que définie dans le registre. Auditer ses sources, conditions de lancement et dépendances avant toute exécution ; ne pas confondre remplissage du HSG, génération des analyses et interface. Si le nom exact ou l’état de la ligne diffère dans le registre, conserver la source de vérité et remonter l’écart, sans supprimer le chantier.

### 37.1 — Conditions bloquantes avant 7bis et 7ter

Le registre adopte les noms 7bis (partage individualisé et prévisualisation) et 7ter (Nous deux), placés APRÈS la ligne 7. Toutes les mentions résiduelles « 6bis/6ter » dans spécifications, routes de projet, planification et livrables doivent être renommées. La ligne 7 doit démontrer l’arrêt effectif de la double écriture et l’absence de lecture non gardée via my_profile, y compris dans les jobs, exports et chemins hérités. 7ter dépend de 7bis validée, jamais l’inverse.

### 37.2 — Tests de recette complémentaires pour les sept arbitrages

Vérifier : (1) les deux permissions supplémentaires indépendantes et décochées par défaut ; aucune fuite de tension si un seul construct est partagé ; (2) présence effective dans les sections détaillées des quatre modules Ma fiche ; (3) les quatre modules relationnels V2 différés à 7ter sans suppression à la ligne 6 ; (4) section stale de Ma fiche remplacée par un état « se met à jour », sans texte périmé ; (5) « Pour mieux viser » ligne 5 sans orchestrateur Discovery fictif ; (6) absence de  inopérant ; (7) lignes 10 et 11 présentes dans le plan et étape 0 contrôlée. Ajouter tests de non-régression des permissions des neuf catégories initiales.

## 38. Recette renforcée et livrables de contrôle

    •    Test de traçabilité : 100 % des familles, constructs et branches Discovery réellement présents disposent d’une destination, y compris BEHAVIOR, PROFILE, SOCIAL_ENERGY, les quatre orientations d’arbitrage et la connaissance ouverte structurée.

    •    Test de profondeur : une seule evidence ne devient pas un diagnostic ni une motivation cachée ; preuves convergentes indépendantes → tendance prudente ; contradictions → nuances contextualisées ; preuve ancienne → vérification ou réserve.

    •    Test de rédaction : ni jugement brutal, ni flatterie systématique, ni fausse certitude ; toute affirmation importante est explicable par des evidences admissibles.

    •    Test de représentation : UNKNOWN n’est jamais zéro ; SOCIAL_ENERGY est bipolaire ; les neuf PROFILE ne sont pas mélangés à un continuum ; barres de couverture ≠ barres de signal.

    •    Test anti-redondance : graphique RECEIVE, carte B, carte A et barres d’arbitrage apportent chacun une information différente.

    •    Test confidentialité : 2 proches avec permissions différentes, partage nul, partiel et total des seules catégories partageables ; un contenu sensible caché dans une catégorie ordinaire est exclu de la sélection rapide.

    •    Test cache : changement d’une permission, evidence, supersession, sensibilité, prompt/règle ou version de contexte → clé différente ou régénération obligatoire ; autorisation revérifiée au rendu.

    •    Test révocation/concurrence : ancien cache inaccessible immédiatement, job démarré avant révocation non publiable, aperçu et Nous deux purgés, aucun retour à une version antérieure.

    •    Test architecture : aucune lecture/écriture my_profile non gardée avant ligne 7bis ; migration vérifiée ; absence de fuite par logs, exports, analytics, notifications, graphiques ou explications.

    •    Test « Nous deux » : seules les dimensions comparables et partagées par les deux personnes sont analysées ; absence expliquée sans révéler le choix individuel de l’autre ; pas de score relationnel.

    •    Test UX : V2 conservée, toutes les catégories accessibles, lecture rapide + exploration approfondie, ruptures visuelles, mobile, clavier, contrastes et textes naturellement neutres.

Livrables attendus de Claude Code pour chaque lot : inventaire des fichiers/flux modifiés, matrice de traçabilité, décisions respectées, tests exécutés avec résultats, écarts par rapport à la maquette et aux sources, dépendances et risques non résolus. Aucune fonctionnalité ne doit être annoncée comme sûre ou terminée sans preuve technique.
