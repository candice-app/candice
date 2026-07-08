# Audit — banque Discovery (questions actives)

> Dump généré depuis la base (68 questions actives). Revue ligne par ligne
> par Estelle → deviendra la spec du lot Discovery Push.

## attention (7)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `attention.reception` | self | Comment tu te sens vraiment aimé·e ? | Par les mots · Par les actes · Par des cadeaux · Par le temps partagé · Par les petites attentions · Par les surprises | — | — |
| `attention.detail_quality` | self | Quand tu dis aimer les petites attentions, qu'est-ce qui te touche le plus concrètement ? | Que l'autre se souvienne d'un détail que j'ai dit · Qu'il/elle anticipe un besoin avant que je demande · Qu'il/elle fasse quelque chose de simple mais régulier · Qu'il/elle choisisse quelque chose uniquement pour moi · Qu'il/elle pense à moi dans un moment ordinaire · Qu'il/elle m'enlève une petite charge du quotidien | petites_attentions selected or detected | — |
| `attention.words_quality` | self | Les mots qui te touchent vraiment sont plutôt… | Très précis sur ce que l'autre aime chez moi · Courts mais sincères · Longs et détaillés · Écrits pour que je puisse les relire · Dits spontanément · Liés à un effort qu'on a remarqué · Liés à une période difficile | mots selected or detected | — |
| `attention.words_avoid` | self | Les mots peuvent tomber à plat quand… | Ils sont trop génériques · Ils arrivent trop tard · Ils ne sont pas suivis d'actes · Ils sont trop grandiloquents · Ils évitent le vrai sujet · Ils ressemblent à une formule toute faite | mots selected | — |
| `attention.service_quality` | self | Quand quelqu'un t'aide, ce qui te touche vraiment c'est qu'il/elle… | Voie ce qu'il y a à faire sans que je demande · Prenne en charge quelque chose jusqu'au bout · Me libère du temps · Me facilite une journée compliquée · Fasse quelque chose d'utile mais avec délicatesse · N'attende pas de reconnaissance immédiate | actes / aide concrète / service selected | — |
| `attention.gift_precision` | self | Un cadeau pensé pour toi doit surtout montrer que… | L'autre connaît mes goûts · L'autre a retenu quelque chose que j'ai dit · L'autre a cherché quelque chose de précis · L'objet a une histoire ou un sens · Le cadeau n'aurait pas pu être offert à n'importe qui · La qualité est au rendez-vous | cadeau choisi / cadeau symbolique selected | — |
| `attention.experience_quality` | self | Une expérience réussie pour toi, c'est surtout… | Un moment qui sort du quotidien · Un lieu vraiment beau · Une organisation fluide · Une émotion forte · Une découverte · Un moment de qualité à deux · Une parenthèse où je n'ai rien à gérer | experience selected | — |

## brands (3)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `brands.favorites` | self | Des marques, enseignes ou créateurs que tu adores ? |  | — | — |
| `brands.reference_free` | self | Cite 3 marques ou créateurs que tu aimes vraiment — même très différents. |  | marques aimées non détaillées | — |
| `brands.beauty_reference` | self | Une marque beauté, parfum ou soin que tu aimes vraiment ? |  | marques beauté non renseignées | — |

## conflicts (3)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `conflicts.style` | self | Face à une tension, comment tu réagis ? | J'en parle directement · J'ai besoin de recul · Je préfère éviter · Je dédramatise | — | — |
| `conflicts.repair_strategy` | self | Après une tension, ce qui aide vraiment à réparer pour toi, c'est… | Des excuses précises · Un message écrit · Une discussion calme · Une preuve que l'autre a compris · Un geste concret · Un moment ensemble · Un peu de temps · Pas de cadeau, surtout une vraie parole | conflit / réparation non précisé | — |
| `conflicts.repair_avoid` | self | Après une dispute, ce qui serait maladroit… | Faire comme si rien ne s'était passé · Offrir un cadeau sans parler · Mettre de l'humour trop vite · Insister alors que j'ai besoin d'espace · Dramatiser · Se justifier · Attendre trop longtemps | conflit / réparation non précisé | — |

## dreams (4)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `dreams.current` | self | Tu as des envies ou des rêves en ce moment ? |  | — | — |
| `dreams.destination` | self | Une destination, un hôtel ou une expérience dont tu rêves en ce moment ? |  | destination rêve non renseignée | — |
| `dreams.wish_priority` | self | Parmi tes envies du moment, laquelle te ferait le plus plaisir si quelqu'un t'aidait à la réaliser ? |  | envies / rêves du moment renseignés | — |
| `dreams.wishlist_first` | self | Une chose que tu aimerais recevoir, vivre ou faire dans les prochains mois ? |  | wishlist vide | — |

## food (6)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `food.restaurants` | self | Tu préfères quel type de table ? | Bistrot convivial · Gastronomique · Bonne adresse décontractée · Cuisine du monde · Végétarien / healthy · Tout si c'est bon | — | — |
| `food.deal_breakers` | self | Pour un restaurant surprise, qu'est-ce qui peut vraiment gâcher l'expérience ? | Trop bruyant · Tables trop serrées · Service froid · Cuisine moyenne · Lieu sans charme · Mauvaise lumière · Trop prétentieux · Trop simple / cheap · Trop loin · Menu trop limité · Mauvais rapport qualité-prix | gastronomie / restaurant / belles tables selected | — |
| `food.success_driver` | self | Un restaurant réussi pour toi, c'est d'abord… | La cuisine · L'ambiance · Le service · Le lieu · La vue · Le confort · La rareté de l'adresse · Le fait que ce soit vivant · Le fait que ce soit intime | restaurant selected | — |
| `food.cuisine_preferences` | self | Côté cuisine, ce qui te ferait vraiment plaisir en ce moment serait plutôt… | Français · Italien · Japonais · Libanais · Méditerranéen · Thaï · Indien · Mexicain · Tapas · Fruits de mer · Pâtisserie / tea time · Cuisine végétale · Je préfère être surpris·e si c'est très bon | cuisine du monde / gastronomie / restaurant selected | — |
| `food.reference_address` | self | Donne une adresse que tu adores, même simple. Candice s'en servira comme référence de goût. |  | restaurants aimés non renseignés | — |
| `food.reco_strategy` | self | Pour une recommandation restaurant, Candice doit plutôt viser… | Très bien noté, même simple · Beau lieu avant tout · Cuisine excellente avant tout · Ambiance vivante · Adresse chic · Adresse cachée · Valeur sûre · Surprise originale | restaurants score fort | — |

## fragrance (4)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `fragrance.perfume_risk` | self | Recevoir un parfum, pour toi, c'est… | Je préfère choisir moi-même · Possible si la personne connaît très bien mes goûts · Seulement une marque que j'aime déjà · Plutôt une bougie ou un parfum d'intérieur · Je n'aime pas recevoir de parfum | parfum / beauté detected | Éviter les cadeaux beauté à côté · 30 sec |
| `fragrance.families` | self | Les familles olfactives qui te plaisent le plus | Poudré · Musqué propre · Floral blanc · Floral frais · Ambré doux · Vanillé léger · Boisé · Hespéridé · Thé-aromatique · Peau propre · Je ne sais pas | — | Des cadeaux parfum qui te ressemblent · 20 sec |
| `fragrance.gender_orientation` | self | Pour les parfums, tu te guides plutôt vers… | Les parfums rayon femme · Les parfums rayon homme · Les parfums mixtes / unisexes · Peu importe le rayon si j'aime le parfum · Je préfère ne pas préciser | — | — |
| `fragrance.scent_deal_breakers` | self | À éviter absolument | Trop sucré · Patchouli · Très entêtant · Trop fruité · Trop vanillé · Trop masculin · Trop floral · Parfum trop connu · Je ne sais pas | odeurs / parfums detected | Écarter ce qui gâche un parfum · 20 sec |

## gifts (6)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `gifts.what_works` | self | Quel type de cadeau te touche vraiment ? | Expériences · Personnalisé · Utile et beau · Beauté / bien-être · Livres / culture · Fait main · Surprise totale | — | — |
| `gifts.to_avoid` | self | Des cadeaux ou attentions à éviter absolument ? |  | — | — |
| `gifts.object_quality` | self | Quand on t'offre un objet, qu'est-ce qui fait la différence entre "sympa" et "vraiment réussi" ? | La qualité de la matière · La marque ou le créateur · Le fait que ce soit exactement mon style · Le fait que ce soit rare ou difficile à trouver · Le fait que ce soit personnalisé · Le fait que ce soit utile au quotidien · Le fait que ça ait une histoire | cadeau matériel selected | — |
| `gifts.risky_categories` | self | Quel type d'objet est le plus risqué à t'offrir sans te demander ? | Vêtement · Bijou · Parfum · Décoration · Livre · Beauté / skincare · Tech · Accessoire · Tout objet trop personnel est risqué · Rien, je suis assez facile | objet / mode / beauté / bijou / déco detected | — |
| `gifts.quality_non_negotiable` | self | Dans quelles catégories la qualité est non négociable pour toi ? | Hôtel · Restaurant · Bijou · Vêtement · Sac / maroquinerie · Parfum · Beauté / soin · Literie · Spa / massage · Alimentaire · Je suis assez flexible | qualité / standing / raffinement detected | — |
| `gifts.impersonal_definition` | self | Pour toi, un cadeau devient impersonnel quand… | Il pourrait être offert à n'importe qui · Il ne tient pas compte de mon style · Il est acheté à la dernière minute · Il vient d'une enseigne trop générique · Il n'a aucun mot ou contexte · Il ne correspond pas à ce que je vis en ce moment | cadeau impersonnel mentioned in avoidances | — |

## hobbies (11)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `hobbies.main` | self | Qu'est-ce qui te ressource vraiment ? |  | — | — |
| `hobbies.book_conditions` | self | Un livre en cadeau peut vraiment te plaire si… | C'est un auteur que j'aime déjà · C'est une très belle édition · C'est recommandé avec un mot personnel · C'est un livre qui correspond à une période de ma vie · C'est une BD / un roman graphique choisi avec soin · C'est un livre rare ou signé · C'est plutôt risqué, je préfère choisir moi-même | lecture / livre / BD detected | — |
| `hobbies.book_avoidance` | self | Un livre risque de tomber à plat si… | Il est trop "développement personnel" évident · Il est trop intellectuel · Il est trop léger · Il ne correspond pas à mon style · Il est choisi parce qu'il est à la mode · Il ressemble à une leçon déguisée · Il parle d'un sujet sensible | lecture detected | — |
| `hobbies.book_reference` | self | Cite un auteur, une autrice, une BD ou un livre que tu aimes vraiment. |  | auteur / livre préféré non renseigné | — |
| `hobbies.home_gift_safe` | self | Pour la maison, ce qui est le moins risqué à t'offrir… | Bougie / parfum d'intérieur · Art de la table · Linge de maison · Beau livre · Petit objet design · Plante · Céramique · Rien, je préfère choisir moi-même | déco / maison detected | — |
| `hobbies.home_deal_breakers` | self | En déco, ce qui peut vite tomber à côté pour toi… | Objet trop kitsch · Mauvaise couleur · Mauvaise matière · Objet trop imposant · Style trop froid · Style trop rustique · Objet sans utilité · Cadeau qui encombre | déco / maison detected | — |
| `hobbies.wellness_gift` | self | Une attention bien-être réussie pour toi, c'est plutôt… | Massage · Spa · Cours privé · Retraite · Moment de calme · Accessoire de qualité · Abonnement · Expérience douce · Je préfère éviter les cadeaux bien-être | sport / bien-être detected | — |
| `hobbies.sport_risk` | self | Un cadeau sport est risqué si… | Il n'est pas adapté à ma pratique · Il est trop technique · Il est trop bas de gamme · Il suppose que je veux performer · Il touche au corps / au poids · Il est choisi sans connaître mes habitudes · Je préfère choisir moi-même | sport detected | — |
| `hobbies.culture_success` | self | Une sortie culturelle réussie pour toi, c'est surtout… | Une très belle œuvre · Un lieu magnifique · Une émotion forte · Une découverte · Un moment élégant · Une sortie facile à organiser · Une discussion après · Un événement rare | culture / art detected | — |
| `hobbies.concert_criteria` | self | Pour un concert ou spectacle, ce qui compte le plus… | L'artiste · La qualité des places · L'ambiance · Le lieu · Le confort · Y aller avec la bonne personne · Ne pas être trop loin / mal placé · Le côté événement rare | musique / concert detected | — |
| `hobbies.artist_reference` | self | Un artiste, spectacle ou lieu culturel que tu aimerais voir ? |  | artiste non renseigné | — |

## practical (6)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `practical.dietary` | self | Côté repas, y a-t-il des règles que tes proches doivent absolument connaître ? | Végétarien·ne · Vegan · Halal · Casher · Sans alcool · Allergie alimentaire · Aucune | — | — |
| `practical.mobility` | self | Y a-t-il quelque chose que ton corps te demande de respecter ? (marche, escaliers, station debout…) | Oui · Non | — | — |
| `practical.logistics_relief` | self | Quand quelqu'un veut te faire du bien, qu'est-ce qui t'enlève un vrai poids des épaules ? | Qu'on réserve à ma place · Qu'on gère le trajet · Qu'on s'occupe des enfants · Qu'on pense au repas · Qu'on fasse les courses · Qu'on gère le ménage · Qu'on cale le bon moment · Qu'on prenne la décision pour moi · Qu'on règle les détails · Qu'on assure le suivi après | charge mentale / fatigue / besoin d'organisation detected | — |
| `practical.control_delegation` | self | Quand quelqu'un organise pour toi, tu préfères… | Qu'il décide vraiment · Qu'il me propose 2 options · Qu'il me laisse valider les détails · Qu'il gère tout sauf la date · Qu'il me surprenne mais me rassure · Qu'il ne décide pas à ma place | aime qu'on organise / surprise / charge mentale detected | — |
| `practical.important_dates` | self | Y a-t-il une date que tes proches ne devraient pas oublier ? |  | dates importantes incomplètes | — |
| `practical.date_attention` | self | Pour cette date, tu aimerais plutôt… | Un message · Un moment ensemble · Un cadeau · Une surprise · Une expérience · Rien de grand, juste qu'on y pense · Quelque chose organisé à l'avance | date ajoutée sans préférence d'attention | — |

## style (9)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `style.clothing` | self | Tu te décrirais avec quel style ? | Classique · Bohème · Minimaliste · Chic parisien · Décontracté · Sportswear · Mode / tendance | — | — |
| `style.colors` | self | Tes couleurs et matières préférées pour te faire plaisir ? |  | — | — |
| `style.fashion_gift_risk` | self | Si quelqu'un veut t'offrir quelque chose lié à la mode, le moins risqué serait… | M'emmener choisir · Carte cadeau d'une marque que j'aime · Accessoire · Bijou · Foulard / belle matière · Sac / petite maroquinerie · Vêtement uniquement si taille et style sûrs · Ne pas m'offrir de mode | mode / vêtements / marques detected | — |
| `style.jewelry_style` | self | Un bijou réussi pour toi, c'est plutôt… | Fin et discret · Visible / affirmé · Doré · Argenté · Avec pierre · Personnalisé / gravé · Symbolique · Très mode · Intemporel · D'une marque précise | bijoux detected | — |
| `style.fashion_deal_breakers` | self | Côté style, ce qu'il faut éviter absolument… | Trop classique · Trop cheap · Trop voyant · Trop discret · Mauvaise matière · Mauvaise coupe · Mauvaise taille · Trop "cadeau par défaut" · Marque que je n'aime pas | mode / style detected | — |
| `style.material_preferences` | self | Les matières qui te donnent vraiment une impression de qualité… | Cachemire · Soie · Cuir · Daim · Lin · Coton épais · Laine mérinos · Céramique · Bois · Verre soufflé · Métal doré · Pierre naturelle | mode / déco / beauté / matières detected | — |
| `style.material_avoidance` | self | Les matières qui peuvent te déplaire… | Synthétique · Laine qui gratte · Polyester · Matière trop rigide · Matière trop fragile · Faux cuir · Fourrure · Plastique · Je ne sais pas | mode / déco / matières detected | — |
| `style.cross_gender` | self | Pour les vêtements et accessoires, tu te repères plutôt dans… | Le rayon femme · Le rayon homme · Les deux — je mélange · Les pièces unisexes avant tout · Ça dépend de la pièce · Je préfère ne pas préciser | — | — |
| `style.color_safe` | self | Si on t'offre un objet, un vêtement ou un accessoire, les couleurs les plus sûres sont… | Noir · Blanc · Beige · Bleu ciel · Marine · Vert · Rouge · Rose pâle · Doré · Argenté · Tons neutres · Couleurs fortes · Je préfère choisir | mode / déco / objet detected | — |

## surprises (4)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `surprises.preference` | self | Tu es plutôt… | J'adore les surprises · Ça dépend du contexte · Je préfère être prévenu·e · Les surprises me stressent | — | — |
| `surprises.conditions` | self | Tu peux aimer une surprise si… | Je connais au moins l'horaire · Je sais comment m'habiller · Je sais combien de temps ça dure · Je peux refuser sans gêne · Ce n'est pas devant trop de monde · C'est organisé par quelqu'un de très proche · C'est très bien préparé | surprise ouverte / partielle detected | — |
| `surprises.briefing_needed` | self | Avant une surprise, tu as besoin de savoir au minimum… | L'heure · La tenue · La durée · Le lieu approximatif · Si je dois prévoir une garde d'enfant · Si c'est intime ou social · Rien, j'aime la surprise totale | surprise detected | — |
| `surprises.deal_breakers` | self | La surprise à éviter absolument pour toi, ce serait… | Une surprise en public · Une surprise avec trop de monde · Une surprise qui change mon planning · Une surprise où je ne sais pas comment m'habiller · Une surprise trop chère · Une surprise trop intime · Une surprise qui ne me ressemble pas | surprise négative ou prudente detected | — |

## travel (5)

| question_key | cible | texte exact | options | follow-up (trigger) | nudge (bénéfice · durée) |
|---|---|---|---|---|---|
| `travel.style` | self | Quand tu voyages, tu cherches… | L'aventure · La culture · Le repos total · La nature · Les villes animées · La gastronomie locale · Le luxe discret | — | — |
| `travel.hotel_criteria` | self | Quand tu parles d'un "bel endroit", qu'est-ce qui compte vraiment ? | Literie parfaite · Décoration / architecture · Service impeccable · Spa / piscine · Vue · Calme · Chambre spacieuse · Très bon restaurant · Emplacement idéal · Atmosphère intime · Palace / grand luxe · Boutique-hôtel de charme | voyage / week-end / hôtel / luxe detected | — |
| `travel.deal_breakers` | self | Ce qui peut vraiment gâcher un week-end pour toi… | Mauvaise literie · Hôtel moyen · Trop de route · Trop de logistique · Lieu sans charme · Programme trop chargé · Mauvaise nourriture · Trop rustique · Pas assez confortable · Trop isolé · Trop touristique · Pas assez premium | voyage / week-end detected | — |
| `travel.hotel_standard` | self | Pour un week-end surprise, ton niveau de confort minimum serait plutôt… | Peu importe si l'expérience est forte · Hôtel confortable et propre · Très bon 4 étoiles · 5 étoiles si possible · Boutique-hôtel très soigné · Palace / très luxe pour les grandes occasions | hôtel / confort / luxe detected | — |
| `travel.distance_tolerance` | self | Pour une surprise week-end, tu es prêt·e à faire combien de trajet ? | Moins d'1h · 1 à 2h · 2 à 3h · 3 à 5h · Train OK · Avion OK · Ça dépend si le lieu vaut vraiment le coup | week-end / voyage surprise detected | — |

