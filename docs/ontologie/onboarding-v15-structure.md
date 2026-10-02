# Onboarding Candice V15 — structure du socle

Ce que le questionnaire doit devenir. Accompagne `onboarding-v15-clos.md` (les règles) et `onboarding-v15-mappings.md` (les 128 lignes).

## CONTRAINTE ABSOLUE SUR L'EXISTANT

Le questionnaire d'onboarding actuel a une direction artistique, des transitions et des animations qui ont été travaillées et validées. **Elles sont conservées intégralement.**

Ce lot modifie **ce que les questions mesurent et ce qu'elles produisent**, pas la manière dont elles se présentent. Concrètement :

- aucune modification de la DA, des couleurs, de la typographie, des espacements ;
- aucune modification des transitions entre étapes, des animations d'apparition, des micro-interactions, du comportement de sélection des options ;
- aucune modification de la barre de progression, des libellés d'étape, du ton des écrans ;
- les composants existants sont réutilisés tels quels pour toute question ajoutée. Une nouvelle question prend l'apparence et le comportement d'une question existante du même type, elle n'introduit aucun style nouveau ;
- une question retirée disparaît du parcours sans laisser de trou visuel ni casser la numérotation perçue ;
- si une modification de structure semble exiger un changement visuel, **tu t'arrêtes et tu demandes**. Tu ne le décides pas.

Le texte des questions et des options est en revanche **la source de vérité du contenu** : il est repris mot pour mot depuis `onboarding-v15-mappings.md`, et toute divergence entre l'écran et ce fichier est une erreur.

---

## Les questions fermées du socle

| Question | Intitulé exact | Options | Statut | Destination |
|---|---|---|---|---|
| `q1` | Je me sens le plus aimé(e) quand … | 7 | `ACTIF` | — |
| `q2` | Une attention réussie, pour moi, c'est surtout … | 7 | `ACTIF` | — |
| `q3` | Ce qui me touche le plus durablement … | 7 | `REMOVED_FROM_ONBOARDING_CORE` | — |
| `q4` | Entre deux attentions, je préfère … | 7 | `ACTIF` | — |
| `qe` | Et toi, comment montres-tu naturellement ton attention aux autres ? | 7 | `ACTIF` | — |
| `q5` | Quand je recharge mes batteries… | 5 | `ACTIF` | — |
| `q6` | Quand je suis stressé(e), j'ai tendance à… | 5 | `ACTIF` | — |
| `q7` | Face à un désaccord, je… | 5 | `ACTIF` | — |
| `q8` | Dans une relation, ce dont j'ai le plus besoin… | 6 | `ACTIF` | — |
| `q9` | Pour communiquer, je préfère… | 5 | `ACTIF` | — |
| `q10` | Pour mes grandes décisions, je… | 5 | `ACTIF` | — |
| `q11` | J'exprime mes émotions… | 5 | `ACTIF` | — |
| `q12` | Quand quelqu'un m'invite ou m'offre quelque chose… | 5 | `REMOVED_FROM_ONBOARDING_CORE` | — |
| `q13` | Pour les cadeaux, je préfère… | 5 | `ACTIF` | — |
| `q14` | Pour les cadeaux matériels, ce qui me touche le plus… | 5 | `ACTIF` | — |
| `q15` | Ma relation à la nourriture et aux restaurants… | 5 | `MOVED_TO_DISCOVERY_FOOD` | Discovery Food |
| `q16` | Si on m'offre un week-end, ce qui compte le plus… | 5 | `MOVED_TO_DISCOVERY_VOYAGE` | Discovery Voyage |
| `q4a` | Mon rapport au temps et à l'organisation… | 5 | `ACTIF` | — |
| `q4b` | Dans ce que je choisis ou apprécie, qu'est-ce qui te ressemble le plus ? | 6 | `ACTIF` | — |
| `q4c` | Quand on organise quelque chose pour moi… | 5 | `ACTIF` | — |
| `q4d` | Pour rester en contact, je préfère… | 5 | `ACTIF` | — |
| `q18` | Le type de surprise que je détesterais… | 5 | `ACTIF` | — |
| `q19` | Ce qui me blesse le plus dans une relation… | 6 | `ACTIF` | — |

**Q4B est reformulée.** Ancien intitulé : « Mon rapport à la qualité et au standing… ». Nouvel intitulé : « Dans ce que je choisis ou apprécie, qu'est-ce qui te ressemble le plus ? ». Le mot « standing » disparaît de l'interface.

**L'option 28 est reformulée.** Ancien libellé : « Un objet choisi avec précision ». Nouveau : « Un objet choisi vraiment en fonction de moi et de mes goûts ». La reformulation lève l'ambiguïté qui faisait lire cette option comme une valorisation du savoir-faire plutôt que de la justesse personnelle du choix.

**L'option 106 est scindée en deux options distinctes** : `106` « Je suis sensible à certaines marques ou maisons » et `106b` « Je suis attiré(e) par les lieux ou expériences d'exception ». Q4B passe donc de 5 à 6 options.

**Q3 et Q12 sortent du parcours.** Leurs options restent dans les données avec le statut `REMOVED_FROM_ONBOARDING_CORE` pour la migration, mais elles ne sont plus posées et ne contribuent à aucun calcul.

**Q15 et Q16 sortent du socle vers le Discovery.** Elles ne sont plus posées à l'onboarding. Leurs mappings voyagent avec elles : c'est le moment de l'acquisition qui change, pas le sens des réponses.

---

## Les deux questions à ajouter


### `soutien` — « Quand ça ne va pas, qu'est-ce qui t'aide vraiment ? »

- Type : 5 options, 2 choix maximum
- Pourquoi : La lacune la plus coûteuse du questionnaire actuel. On mesure très bien COMMENT la personne réagit au stress (q6), et pas du tout COMMENT elle veut être soutenue. Or Candice en aura besoin tout le temps : maladie, mauvaise journée, deuil, échec, rupture, période chargée. Le Discovery ne devrait pas avoir à attendre des semaines pour apprendre comment prendre soin de quelqu'un qui va mal.
- Options :
    - « Qu'on m'écoute » → `support_ecoute` · se sentir soutenu et entouré
    - « Qu'on me rassure » → `support_reassurance` · se sentir rassuré
    - « Qu'on m'aide concrètement » → `support_action` · se sentir aidé et soulagé
    - « Qu'on reste simplement près de moi » → `support_presence` · se sentir soutenu et entouré
    - « Qu'on me laisse un peu tranquille » → `support_espace` · se sentir respecté dans son rythme

### `moteurs` — « Qu'est-ce qui compte particulièrement pour toi dans ta vie ? »

- Type : 6 options, 3 choix maximum
- Pourquoi : Récupère une première couche de moteurs profonds sans prétendre faire tout le niveau 4 dès l'onboarding. C'est aussi le seul endroit où « se sentir utile / contribuer » devient collectable — il n'apparaissait nulle part ailleurs, et faire une question dédiée à ce seul besoin serait disproportionné.
- Options :
    - « La famille » → `moteur_famille` · se sentir en lien / proche
    - « La liberté » → `moteur_liberte` · se sentir libre
    - « Apprendre et découvrir » → `moteur_apprentissage` · se sentir stimulé / nourri
    - « Construire et accomplir » → `moteur_accomplissement` · se sentir reconnu et valorisé
    - « Prendre soin des autres » → `moteur_soin` · se sentir utile / contribuer
    - « Contribuer ou transmettre » → `moteur_transmission` · se sentir utile / contribuer

### `anniversaire_ideal` — « Ta journée d'anniversaire idéale, elle ressemblerait à quoi ? »

- Type : texte libre, long
- Pourquoi : Socialité · intimité · rythme · planification · surprise · type d'expérience · personnes souhaitées · cadre · attention attendue. Pas de budget implicite : trop spéculatif sans signal explicite.
- Spécification : Textarea avec trois exemples contrastés en placeholder. Bouton vocal comme les autres champs de l'étape 6.
- Options :

### `adresses_preferees` — « As-tu des adresses préférées ? Dans ta ville ou ailleurs. »

- Type : liste de lieux · Google Places
- Pourquoi : Deux usages : proposer un moment dans ces lieux — sauf si la personne aime les surprises, où le lieu devient un indice de goût ; et lire la personne par ses lieux.
- Spécification : Autocomplétion Google Places, carte sous le champ. On stocke place_id, nom, adresse formatée, lat/lng, types, niveau de prix. Champ libre « pourquoi tu l'aimes » facultatif par lieu. Clé API restreinte au domaine candice.app.
- Options :

### `adresse_livraison_travail` — « Ton adresse au travail »

- Type : adresse · Google Places
- Pourquoi : Permet une livraison au bureau, souvent le seul endroit où la personne est en journée.
- Spécification : Même composant. Stocké séparément de l'adresse personnelle, jamais affiché à un proche. Ne s'affiche que si la case ci-dessous est à oui.
- Options :

### `accepte_livraison_travail` — « Si quelqu'un veut te faire livrer quelque chose au travail, tu es d'accord ? »

- Type : 2 choix
- Pourquoi : Filtre dur sur le canal de livraison. Si non, aucune attention livrée ne cible l'adresse professionnelle.
- Spécification : « Oui, avec plaisir » / « Non, je ne préfère pas mélanger vie privée et vie pro ».
- Options :

Ces deux questions comblent les deux seuls besoins que le socle actuel ne mesure jamais : `NEED_SUPPORT` dans sa forme « comment je veux être soutenu » et `NEED_CONTRIBUTION`. Leurs mappings canoniques vers les dix familles ne sont pas encore arbitrés — **tu crées les questions, leurs options et leur stockage, mais tu ne mappes rien vers le vocabulaire canonique.** Les colonnes de mapping restent vides et un arbitrage suivra.

---

## Les champs libres et pratiques

| Champ | Libellé | Décision | Pourquoi |
|---|---|---|---|
| `interests` | Mes centres d'intérêt | **GARDER** | C'est le routeur du Discovery. Les 13 catégories classées ouvrent les branches. |
| `passion_sujet` | Il y a une passion ou un sujet dont tu pourrais parler pendant des heures ? | **REMPLACE 2 CHAMPS** | Fusionne « ce que j'adore faire » et « les sujets qui me stimulent vraiment », qui se recouvraient tous les deux avec les centres d'intérêt. Récupère F1, histoire de l'art, pâtisserie, IA, architecture, sneakers — sans demander deux fois ses intérêts. |
| `adore_faire` | Ce que j'adore faire | **SUPPRIMER** | Recouvre les centres d'intérêt et la nouvelle question passion. |
| `sujets_stimulants` | Les sujets qui me stimulent vraiment | **SUPPRIMER** | Idem. |
| `evite_deteste` | Ce que j'évite ou déteste | **GARDER** | Contraintes et rejets : rien d'autre ne les collecte. |
| `peu_savent` | Ce que peu de gens savent sur moi | **GARDER** | Psychologiquement distinct des deux autres champs de la même famille. |
| `remarquer` | Ce que j'aimerais qu'on remarque davantage chez moi | **GARDER++** | Particulièrement puissant pour « se sentir reconnu et valorisé » — le besoin que le questionnaire fermé ne collecte pas. |
| `sentir_special` | Ce qui me fait me sentir spécial(e) | **SORTIR DU SOCLE** | Trois champs libres successifs sur la même famille, c'est lourd. Le Discovery y reviendra plus naturellement. |
| `plus_beau_cadeau` | Le plus beau cadeau ou moment qu'on m'ait offert | **GARDER ABSOLUMENT** | Probablement le meilleur champ de tout l'onboarding. Il donne un cas comportemental réel au lieu d'une déclaration abstraite : l'IA y observe le canal, la personnalisation, l'effort, le symbolique, les personnes présentes, la surprise, la valeur matérielle, le souvenir, le contexte. |
| `anniversaire_ideal` | Ta journée d'anniversaire idéale, elle ressemblerait à quoi ? | **GARDER — fonction corrigée** | Extraire : socialité · intimité · rythme · planification · surprise · type d'expérience · personnes souhaitées · cadre · attention attendue. NE PAS extraire le budget implicite : c'est trop spéculatif sans signal explicite. Correction de ma spécification précédente. |
| `detail_compris` | Le genre de détail qui me fait me sentir compris(e) | **GARDER** | Alimente directement « se sentir vu et compris ». |
| `marques_lieux` | Les marques et objets que j'aime | **GARDER — recentré** | Les lieux partent dans « adresses préférées », qui est structuré avec un place_id. |
| `adresses_preferees` | As-tu des adresses préférées ? | **À AJOUTER** | Sélecteur Google Places. Deux usages : proposer un moment dans ces lieux, sauf si la personne aime les surprises ; et lire la personne par ses lieux. |
| `cadeaux_non` | Les cadeaux que je n'aimerais pas recevoir | **GARDER** | Contraintes bloquantes. |
| `envies_reves` | Mes envies ou rêves du moment | **GARDER** | Porte ouverte pour le Discovery. |
| `prenom` | Prénom | **garder** | — |
| `sexe` | Sexe | **garder** | — |
| `date_naissance` | Date de naissance | **REMPLACE le champ Âge** | L'âge périme et ne sert pas aux occasions ; la date de naissance sert aux deux. |
| `profession` | Profession | **garder** | Contexte, et porte ouverte vers la branche Travail. |
| `allergies` | Allergies | **garder** | Contrainte dure. |
| `regime` | Régime | **garder** | Contrainte dure. |
| `alcool` | Alcool | **garder** | Contrainte dure. |
| `mobilite_sante` | Mobilité et santé | **garder** | Contrainte dure. |
| `tailles` | Tailles vêtements / chaussures / pantalon / bague | **garder** | — |
| `parfums` | Parfums aimés | **SUPPRIMÉ** | — |
| `odeurs_detestees` | Odeurs détestées | **SUPPRIMÉ** | — |
| `couleurs_matieres` | Couleurs et matières | **SUPPRIMÉ** | — |
| `adresse_livraison` | Adresse de livraison | **garder** | Logistique, jamais affichée. |
| `animaux` | Animaux | **garder** | Déclencheur de la branche Animaux. |
| `dates_importantes` | Dates importantes | **garder** | Déclenche Célébration. |
| `role_familial` | Rôle familial | **garder** | Porte ouverte vers la branche Rapport à la famille. |
| `vetos` | Vetos | **garder** | Filtres durs consolidés. |

**Trois champs disparaissent par fusion** : « Ce que j'adore faire » et « Les sujets qui me stimulent vraiment » sont remplacés par un seul champ, « Il y a une passion ou un sujet dont tu pourrais parler pendant des heures ? ». « Ce qui me fait me sentir spécial(e) » sort du socle vers le Discovery.

**Trois champs sont supprimés** : parfums aimés, odeurs détestées, couleurs et matières.

**Le champ Âge devient Date de naissance.** L'âge périme et ne sert à aucune occasion ; la date sert aux deux.

**Trois champs à composant Google Places sont à ajouter** : les adresses préférées (liste de lieux, avec carte sous le champ, stockage de `place_id`), l'adresse au travail (même composant, stockée séparément de l'adresse personnelle et jamais affichée), et la case « si quelqu'un veut te faire livrer quelque chose au travail, tu es d'accord ? » qui agit comme filtre dur sur le canal de livraison.

**La question d'intérêts est conservée telle quelle**, avec son classement par ordre de clic. C'est le routeur du Discovery et elle ne produit aucune dimension de personnalité. Deux catégories sont à ajouter : **Animaux** et **Collection** — sans elles, environ 100 questions de la banque de micro-questions n'ont aucun déclencheur possible.

**La question sur le genre** : une seule est conservée, celle sur la manière dont Candice peut s'adresser à la personne. La seconde a déjà été supprimée.

---

## Ce qui n'est pas dans ce lot

Les mappings canoniques des champs libres et des deux nouvelles questions. Les réponses ouvertes seront traitées par le moteur d'extraction, qui est un lot à part : ici on crée les champs, on conserve le texte brut, et on n'extrait rien.
