# ⛔ STOP GROUPÉ — D4 mesuré + reformulation coupée + document de revue

## 1. D4 (fusion des étages discovery) — mesures avant/après

| discovery, tap→contenu réel | AVANT D4 (post-D1/D3) | **APRÈS D4** |
|---|---|---|
| froid (session vierge) | 2 320 ms | **2 314 / 2 329 ms** |
| chaud (2e passage) | 2 317 ms | **56 / 66 ms** |

**Verdict honnête, deux constats :**

- **Le froid ne bouge pas (~2,3 s).** D4 supprime bien des allers-retours en série (les 3 lectures partent ensemble, `profile_completion` lu une seule fois, session + marquage en une passe), **mais ces hops sont serveur↔base — très courts et non soumis à la latence mobile.** Sur un premier affichage à froid, le mur de temps, c'est le démarrage serveur + le rendu RSC complet + la latence réseau du document, pas les requêtes de sélection. D4 est un assainissement structurel juste (et il aide la charge base), mais son gain en ms sur ton ressenti à froid est marginal. **Le vrai gain discovery, c'était D1** (retrait du LLM : 3,3–4,3 s → 2,3 s stable).
- **Le chaud s'effondre à ~60 ms** : sur cette série, le cache client Next a servi la re-visite instantanément. C'est exactement le point que **D2** doit trancher — pourquoi ce cache joue parfois (60 ms) et parfois pas (2,3 s) chez moi. **Tes beacons v2 sont l'arbitre** : navigue en normal puis en privé, dis « beacons envoyés », je te sortirai le comparatif chaud/froid réel de ton appareil avant tout fix D2.

## 2. Reformulation IA coupée — fait

Commit dédié (`0f4cb87`). Toutes les questions servent leur **texte de banque mot pour mot** (`PERSONALIZATION_ACTIVE = false`). Le pré-calcul D1 et la migration 63 restent en place mais **inactifs** — ils ne resserviront que si tu réactives une personnalisation à gabarits validés. `locked_text` et anti-lyrisme inchangés (sans objet désormais).

## 3. Document de revue — livré

`docs/revue-banque-questions.html` (commit `61f14fa`, tableau lisible thème par thème, ouvrable au navigateur). **Deux faits structurels remontés du réel :** la banque ne contient **aucun follow-up structuré** (`trigger_key`/`trigger_from_main_question` vides sur les 68 — l'enchaînement se fait par score, pas par arbre) ; `locked_text` sur 3 questions, `benefit_label` sur 67/68. Le contenu complet des 68 questions est reproduit ci-dessous (section « Contenu complet »).

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU** : « fusion des étages » — j'ai gardé la création de session synchrone (le rendu a besoin du `sessionId`) et parallélisé le marquage `last_asked` avec elle ; alternative écartée : déporter aussi le marquage en `after()` (gain nul, il est déjà en parallèle). Le « contexte de déclenchement en français clair » du document = texte brut de `trigger_condition` + garde par présence de donnée (source `dataPresence.ts`), sans reformulation de ma part.

**B. DÉCISIONS PRISES SEUL** : document livré en HTML autonome (doctype + thème clair/sombre) puisqu'ouvert au navigateur, pas via l'outil Artifact ; version compacte du fil dérivée du même export ; `fragrance.gender_orientation` [44] est la **seule** question sans `benefit_label` (nudge vide) — signalé tel quel, non « corrigé ».

**C. LAISSÉ EN SUSPENS** : **D2** (verdict cache client, en attente de tes beacons v2) ; la clôture (dépose instrumentation 60/62 — la **63 reste** ; vérif commit bascule Phase D) attend ton signal « clôture ». La revue de banque elle-même est pour après clôture.

**D. À VÉRIFIER PAR ESTELLE** : ressenti sur `/moi/discovery` (la question doit s'afficher sans attente d'IA) ; **navigue normal + privé → « beacons envoyés »** pour que je te livre D2 ; parcours le document `docs/revue-banque-questions.html`.

**E. MIGRATIONS / BUILD** : migration **63 déjà appliquée** (lot précédent) ; aucune nouvelle migration ce STOP ; `npm run build` ✓ ; 164 tests ✓ ; 4 commits poussés (`43948c4` D4, `0f4cb87` coupure, `61f14fa` doc), **Vercel success**.

**STOP.** J'attends tes beacons v2 (D2) et ton signal « clôture ».

---

## Contenu complet — 68 questions actives

Export brut de `discovery_questions` (prod, target=self, statut=active). Aucune interprétation.

```
═══ Langage d'attention ═══

[1] attention.reception — type multiple · prio 50 · ordre 10
  Q: « Comment tu te sens vraiment aimé·e ? »
  Options: Par les mots[MOT] · Par les actes[SER] · Par des cadeaux[CAD_C] · Par le temps partagé[EXP] · Par les petites attentions[GES] · Par les surprises[SUR]
  Déclench.: toujours (si donnée absente)
  Nudge: « Des attentions qui te ressemblent vraiment » · 1 min

═══ Cadeaux ═══

[2] gifts.what_works — type multiple · prio 50 · ordre 20
  Q: « Quel type de cadeau te touche vraiment ? »
  Options: Expériences[experiences] · Personnalisé[personalized] · Utile et beau[practical] · Beauté / bien-être[beauty] · Livres / culture[culture] · Fait main[handmade] · Surprise totale[surprise]
  Déclench.: toujours (si donnée absente)
  Nudge: « Des idées cadeaux qui visent juste » · 30 sec

[3] gifts.to_avoid — type libre · prio 50 · ordre 30
  Q: « Des cadeaux ou attentions à éviter absolument ? »
  Déclench.: toujours (si donnée absente)  |  garde donnée: « cadeaux à éviter » / Q17
  Nudge: « Des idées cadeaux qui visent juste » · 30 sec

═══ Style ═══

[4] style.clothing — type multiple · prio 50 · ordre 40
  Q: « Tu te décrirais avec quel style ? »
  Options: Classique[classic] · Bohème[boho] · Minimaliste[minimal] · Chic parisien[chic] · Décontracté[casual] · Sportswear[sport] · Mode / tendance[trendy]
  Déclench.: toujours (si donnée absente)  |  garde donnée: couleurs/matières
  Nudge: « Des choix à ton goût, jamais à côté » · 30 sec

[5] style.colors — type libre · prio 50 · ordre 50
  Q: « Tes couleurs et matières préférées pour te faire plaisir ? »
  Déclench.: toujours (si donnée absente)
  Nudge: « Des choix à ton goût, jamais à côté » · 30 sec

═══ Marques ═══

[6] brands.favorites — type libre · prio 50 · ordre 60
  Q: « Des marques, enseignes ou créateurs que tu adores ? »
  Déclench.: toujours (si donnée absente)  |  garde donnée: marques/lieux
  Nudge: « Tes maisons préférées en tête des idées » · 20 sec

═══ Restaurants ═══

[7] food.restaurants — type multiple · prio 50 · ordre 70
  Q: « Tu préfères quel type de table ? »
  Options: Bistrot convivial[bistro] · Gastronomique[gastronomic] · Bonne adresse décontractée[casual_good] · Cuisine du monde[world] · Végétarien / healthy[veggie] · Tout si c'est bon[anything_good]
  Déclench.: toujours (si donnée absente)
  Nudge: « Des tables choisies comme tu les aimes » · 30 sec

═══ Voyages ═══

[8] travel.style — type multiple · prio 50 · ordre 90
  Q: « Quand tu voyages, tu cherches… »
  Options: L'aventure[adventure] · La culture[culture] · Le repos total[relax] · La nature[nature] · Les villes animées[city] · La gastronomie locale[gastro] · Le luxe discret[luxury]
  Déclench.: toujours (si donnée absente)
  Nudge: « Des escapades taillées pour toi » · 30 sec

═══ Loisirs ═══

[9] hobbies.main — type libre · prio 50 · ordre 100
  Q: « Qu'est-ce qui te ressource vraiment ? »
  Déclench.: toujours (si donnée absente)  |  garde donnée: « adore faire » / intérêts classés
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

═══ Rêves ═══

[10] dreams.current — type libre · prio 50 · ordre 110
  Q: « Tu as des envies ou des rêves en ce moment ? »
  Déclench.: toujours (si donnée absente)  |  garde donnée: envies/rêves
  Nudge: « Ce dont tu rêves, gardé pour le bon moment » · 20 sec

═══ Surprises ═══

[11] surprises.preference — type unique · prio 50 · ordre 120
  Q: « Tu es plutôt… »
  Options: J'adore les surprises[loves] · Ça dépend du contexte[depends] · Je préfère être prévenu·e[notice] · Les surprises me stressent[dislikes]
  Déclench.: toujours (si donnée absente)
  Nudge: « Des surprises bien dosées, jamais subies » · 20 sec

═══ Conflits ═══

[12] conflicts.style — type unique · prio 50 · ordre 130
  Q: « Face à une tension, comment tu réagis ? »
  Options: J'en parle directement[direct] · J'ai besoin de recul[space] · Je préfère éviter[avoids] · Je dédramatise[humor]
  Déclench.: toujours (si donnée absente)
  Nudge: « Des attentions justes, même les jours sensibles » · 20 sec

═══ Pratique ═══

[13] practical.dietary — type multiple · prio 50 · ordre 140
  Q: « Côté repas, y a-t-il des règles que tes proches doivent absolument connaître ? »
  Options: Végétarien·ne[vegetarian] · Vegan[vegan] · Halal[halal] · Casher[casher] · Sans alcool[no_alcohol] · Allergie alimentaire[food_allergy] · Aucune[none]
  Déclench.: toujours (si donnée absente)  |  garde donnée: allergies/régime/alcool / réponse constraints|dietary
  Nudge: « Zéro faux pas sur l'essentiel » · 30 sec

[14] practical.mobility — type unique · prio 50 · ordre 141
  Q: « Y a-t-il quelque chose que ton corps te demande de respecter ? (marche, escaliers, station debout…) »
  Options: Oui[yes] · Non[no]
  Déclench.: toujours (si donnée absente)  |  garde donnée: mobilité/santé / réponse
  Nudge: « Zéro faux pas sur l'essentiel » · 30 sec

═══ Langage d'attention ═══

[15] attention.detail_quality — type multiple · prio 50 · ordre 150
  Q: « Quand tu dis aimer les petites attentions, qu'est-ce qui te touche le plus concrètement ? »
  Options: Que l'autre se souvienne d'un détail que j'ai dit[remembers_details] · Qu'il/elle anticipe un besoin avant que je demande[anticipates_needs] · Qu'il/elle fasse quelque chose de simple mais régulier[regular_simple] · Qu'il/elle choisisse quelque chose uniquement pour moi[chosen_only_for_me] · Qu'il/elle pense à moi dans un moment ordinaire[thinks_in_ordinary] · Qu'il/elle m'enlève une petite charge du quotidien[relieves_daily_charge]
  Déclench.: petites_attentions selected or detected
  Nudge: « Des attentions qui te ressemblent vraiment » · 1 min

[16] attention.words_quality — type multiple · prio 50 · ordre 160
  Q: « Les mots qui te touchent vraiment sont plutôt… »
  Options: Très précis sur ce que l'autre aime chez moi[precise_about_me] · Courts mais sincères[short_sincere] · Longs et détaillés[long_detailed] · Écrits pour que je puisse les relire[written_to_reread] · Dits spontanément[spontaneous] · Liés à un effort qu'on a remarqué[effort_recognition] · Liés à une période difficile[support_in_hard_times]
  Déclench.: mots selected or detected
  Nudge: « Des attentions qui te ressemblent vraiment » · 1 min

[17] attention.words_avoid — type multiple · prio 50 · ordre 170
  Q: « Les mots peuvent tomber à plat quand… »
  Options: Ils sont trop génériques[too_generic] · Ils arrivent trop tard[too_late] · Ils ne sont pas suivis d'actes[need_actions] · Ils sont trop grandiloquents[too_dramatic] · Ils évitent le vrai sujet[avoid_real_topic] · Ils ressemblent à une formule toute faite[formulaic]
  Déclench.: mots selected
  Nudge: « Des attentions qui te ressemblent vraiment » · 1 min

[18] attention.service_quality — type multiple · prio 50 · ordre 180
  Q: « Quand quelqu'un t'aide, ce qui te touche vraiment c'est qu'il/elle… »
  Options: Voie ce qu'il y a à faire sans que je demande[proactive] · Prenne en charge quelque chose jusqu'au bout[end_to_end] · Me libère du temps[time_relief] · Me facilite une journée compliquée[day_smoothing] · Fasse quelque chose d'utile mais avec délicatesse[discreet_service] · N'attende pas de reconnaissance immédiate[no_recognition_needed]
  Déclench.: actes / aide concrète / service selected
  Nudge: « Des attentions qui te ressemblent vraiment » · 1 min

[19] attention.gift_precision — type multiple · prio 50 · ordre 190
  Q: « Un cadeau pensé pour toi doit surtout montrer que… »
  Options: L'autre connaît mes goûts[knows_taste] · L'autre a retenu quelque chose que j'ai dit[remembered_signal] · L'autre a cherché quelque chose de précis[search_effort] · L'objet a une histoire ou un sens[symbolic_object] · Le cadeau n'aurait pas pu être offert à n'importe qui[non_generic] · La qualité est au rendez-vous[quality]
  Déclench.: cadeau choisi / cadeau symbolique selected
  Nudge: « Des attentions qui te ressemblent vraiment » · 1 min

[20] attention.experience_quality — type multiple · prio 50 · ordre 200
  Q: « Une expérience réussie pour toi, c'est surtout… »
  Options: Un moment qui sort du quotidien[escape] · Un lieu vraiment beau[beautiful_place] · Une organisation fluide[logistics_smooth] · Une émotion forte[strong_emotion] · Une découverte[discovery] · Un moment de qualité à deux[quality_time] · Une parenthèse où je n'ai rien à gérer[no_logistics]
  Déclench.: experience selected
  Nudge: « Des attentions qui te ressemblent vraiment » · 1 min

═══ Cadeaux ═══

[21] gifts.object_quality — type multiple · prio 50 · ordre 210
  Q: « Quand on t'offre un objet, qu'est-ce qui fait la différence entre "sympa" et "vraiment réussi" ? »
  Options: La qualité de la matière[material_quality] · La marque ou le créateur[brand] · Le fait que ce soit exactement mon style[my_style] · Le fait que ce soit rare ou difficile à trouver[rare] · Le fait que ce soit personnalisé[personalized] · Le fait que ce soit utile au quotidien[useful] · Le fait que ça ait une histoire[has_story]
  Déclench.: cadeau matériel selected
  Nudge: « Des idées cadeaux qui visent juste » · 30 sec

[22] gifts.risky_categories — type multiple · prio 50 · ordre 220
  Q: « Quel type d'objet est le plus risqué à t'offrir sans te demander ? »
  Options: Vêtement[clothing] · Bijou[jewelry] · Parfum[perfume] · Décoration[decoration] · Livre[book] · Beauté / skincare[beauty] · Tech[tech] · Accessoire[accessory] · Tout objet trop personnel est risqué[all_personal] · Rien, je suis assez facile[none]
  Déclench.: objet / mode / beauté / bijou / déco detected
  Nudge: « Des idées cadeaux qui visent juste » · 30 sec

[23] gifts.quality_non_negotiable — type multiple · prio 50 · ordre 230
  Q: « Dans quelles catégories la qualité est non négociable pour toi ? »
  Options: Hôtel[hotel] · Restaurant[restaurant] · Bijou[jewelry] · Vêtement[clothing] · Sac / maroquinerie[bag] · Parfum[perfume] · Beauté / soin[beauty] · Literie[bedding] · Spa / massage[spa] · Alimentaire[food] · Je suis assez flexible[flexible]
  Déclench.: qualité / standing / raffinement detected
  Nudge: « Des idées cadeaux qui visent juste » · 30 sec

[24] gifts.impersonal_definition — type multiple · prio 50 · ordre 240
  Q: « Pour toi, un cadeau devient impersonnel quand… »
  Options: Il pourrait être offert à n'importe qui[could_be_for_anyone] · Il ne tient pas compte de mon style[ignores_style] · Il est acheté à la dernière minute[last_minute] · Il vient d'une enseigne trop générique[generic_store] · Il n'a aucun mot ou contexte[no_note] · Il ne correspond pas à ce que je vis en ce moment[not_current]
  Déclench.: cadeau impersonnel mentioned in avoidances
  Nudge: « Des idées cadeaux qui visent juste » · 30 sec

═══ Restaurants ═══

[25] food.deal_breakers — type multiple · prio 50 · ordre 250
  Q: « Pour un restaurant surprise, qu'est-ce qui peut vraiment gâcher l'expérience ? »
  Options: Trop bruyant[too_loud] · Tables trop serrées[too_crowded] · Service froid[cold_service] · Cuisine moyenne[average_food] · Lieu sans charme[no_charm] · Mauvaise lumière[bad_light] · Trop prétentieux[too_pretentious] · Trop simple / cheap[too_cheap] · Trop loin[too_far] · Menu trop limité[limited_menu] · Mauvais rapport qualité-prix[bad_value]
  Déclench.: gastronomie / restaurant / belles tables selected
  Nudge: « Des tables choisies comme tu les aimes » · 30 sec

[26] food.success_driver — type unique · prio 50 · ordre 260
  Q: « Un restaurant réussi pour toi, c'est d'abord… »
  Options: La cuisine[cuisine] · L'ambiance[ambiance] · Le service[service] · Le lieu[venue] · La vue[view] · Le confort[comfort] · La rareté de l'adresse[rarity] · Le fait que ce soit vivant[lively] · Le fait que ce soit intime[intimate]
  Déclench.: restaurant selected
  Nudge: « Des tables choisies comme tu les aimes » · 30 sec

[27] food.cuisine_preferences — type multiple · prio 50 · ordre 270
  Q: « Côté cuisine, ce qui te ferait vraiment plaisir en ce moment serait plutôt… »
  Options: Français[french] · Italien[italian] · Japonais[japanese] · Libanais[lebanese] · Méditerranéen[mediterranean] · Thaï[thai] · Indien[indian] · Mexicain[mexican] · Tapas[tapas] · Fruits de mer[seafood] · Pâtisserie / tea time[pastry] · Cuisine végétale[plant_based] · Je préfère être surpris·e si c'est très bon[surprise_me]
  Déclench.: cuisine du monde / gastronomie / restaurant selected
  Nudge: « Des tables choisies comme tu les aimes » · 30 sec

[28] food.reference_address — type libre · prio 50 · ordre 280
  Q: « Donne une adresse que tu adores, même simple. Candice s'en servira comme référence de goût. »
  Déclench.: restaurants aimés non renseignés
  Nudge: « Des tables choisies comme tu les aimes » · 30 sec

[29] food.reco_strategy — type unique · prio 50 · ordre 290
  Q: « Pour une recommandation restaurant, Candice doit plutôt viser… »
  Options: Très bien noté, même simple[well_rated] · Beau lieu avant tout[beautiful_venue] · Cuisine excellente avant tout[excellent_cuisine] · Ambiance vivante[lively] · Adresse chic[chic] · Adresse cachée[hidden] · Valeur sûre[safe_bet] · Surprise originale[original_surprise]
  Déclench.: restaurants score fort
  Nudge: « Des tables choisies comme tu les aimes » · 30 sec

═══ Voyages ═══

[30] travel.hotel_criteria — type multiple · prio 50 · ordre 300
  Q: « Quand tu parles d'un "bel endroit", qu'est-ce qui compte vraiment ? »
  Options: Literie parfaite[perfect_bedding] · Décoration / architecture[decor] · Service impeccable[service] · Spa / piscine[spa] · Vue[view] · Calme[quiet] · Chambre spacieuse[spacious] · Très bon restaurant[great_restaurant] · Emplacement idéal[location] · Atmosphère intime[intimate] · Palace / grand luxe[palace] · Boutique-hôtel de charme[boutique]
  Déclench.: voyage / week-end / hôtel / luxe detected
  Nudge: « Des escapades taillées pour toi » · 30 sec

[31] travel.deal_breakers — type multiple · prio 50 · ordre 310
  Q: « Ce qui peut vraiment gâcher un week-end pour toi… »
  Options: Mauvaise literie[bad_bedding] · Hôtel moyen[average_hotel] · Trop de route[too_much_driving] · Trop de logistique[too_much_logistics] · Lieu sans charme[no_charm] · Programme trop chargé[overloaded_schedule] · Mauvaise nourriture[bad_food] · Trop rustique[too_rustic] · Pas assez confortable[not_comfortable] · Trop isolé[too_isolated] · Trop touristique[too_touristy] · Pas assez premium[not_premium]
  Déclench.: voyage / week-end detected
  Nudge: « Des escapades taillées pour toi » · 30 sec

[32] travel.hotel_standard — type unique · prio 50 · ordre 320
  Q: « Pour un week-end surprise, ton niveau de confort minimum serait plutôt… »
  Options: Peu importe si l'expérience est forte[experience_first] · Hôtel confortable et propre[comfortable] · Très bon 4 étoiles[four_stars] · 5 étoiles si possible[five_stars] · Boutique-hôtel très soigné[boutique] · Palace / très luxe pour les grandes occasions[palace]
  Déclench.: hôtel / confort / luxe detected
  Nudge: « Des escapades taillées pour toi » · 30 sec

[33] travel.distance_tolerance — type unique · prio 50 · ordre 330
  Q: « Pour une surprise week-end, tu es prêt·e à faire combien de trajet ? »
  Options: Moins d'1h[under_1h] · 1 à 2h[1_2h] · 2 à 3h[2_3h] · 3 à 5h[3_5h] · Train OK[train_ok] · Avion OK[plane_ok] · Ça dépend si le lieu vaut vraiment le coup[depends]
  Déclench.: week-end / voyage surprise detected
  Nudge: « Des escapades taillées pour toi » · 30 sec

═══ Rêves ═══

[34] dreams.destination — type libre · prio 50 · ordre 340
  Q: « Une destination, un hôtel ou une expérience dont tu rêves en ce moment ? »
  Déclench.: destination rêve non renseignée
  Nudge: « Ce dont tu rêves, gardé pour le bon moment » · 20 sec

═══ Loisirs ═══

[35] hobbies.book_conditions — type multiple · prio 50 · ordre 350
  Q: « Un livre en cadeau peut vraiment te plaire si… »
  Options: C'est un auteur que j'aime déjà[known_author] · C'est une très belle édition[beautiful_edition] · C'est recommandé avec un mot personnel[with_personal_note] · C'est un livre qui correspond à une période de ma vie[matches_life_period] · C'est une BD / un roman graphique choisi avec soin[graphic_novel] · C'est un livre rare ou signé[rare_signed] · C'est plutôt risqué, je préfère choisir moi-même[prefer_choose]
  Déclench.: lecture / livre / BD detected
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

[36] hobbies.book_avoidance — type multiple · prio 50 · ordre 360
  Q: « Un livre risque de tomber à plat si… »
  Options: Il est trop "développement personnel" évident[too_self_help] · Il est trop intellectuel[too_intellectual] · Il est trop léger[too_light] · Il ne correspond pas à mon style[wrong_style] · Il est choisi parce qu'il est à la mode[too_trendy] · Il ressemble à une leçon déguisée[moralizing] · Il parle d'un sujet sensible[sensitive_topic]
  Déclench.: lecture detected
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

[37] hobbies.book_reference — type libre · prio 50 · ordre 370
  Q: « Cite un auteur, une autrice, une BD ou un livre que tu aimes vraiment. »
  Déclench.: auteur / livre préféré non renseigné
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

═══ Style ═══

[38] style.fashion_gift_risk — type unique · prio 50 · ordre 380
  Q: « Si quelqu'un veut t'offrir quelque chose lié à la mode, le moins risqué serait… »
  Options: M'emmener choisir[choose_together] · Carte cadeau d'une marque que j'aime[gift_card] · Accessoire[accessory] · Bijou[jewelry] · Foulard / belle matière[scarf] · Sac / petite maroquinerie[bag] · Vêtement uniquement si taille et style sûrs[clothing_if_sure] · Ne pas m'offrir de mode[avoid_fashion]
  Déclench.: mode / vêtements / marques detected
  Nudge: « Des choix à ton goût, jamais à côté » · 30 sec

[39] style.jewelry_style — type multiple · prio 50 · ordre 390
  Q: « Un bijou réussi pour toi, c'est plutôt… »
  Options: Fin et discret[delicate] · Visible / affirmé[bold] · Doré[gold] · Argenté[silver] · Avec pierre[with_stone] · Personnalisé / gravé[personalized] · Symbolique[symbolic] · Très mode[trendy] · Intemporel[timeless] · D'une marque précise[specific_brand]
  Déclench.: bijoux detected
  Nudge: « Des choix à ton goût, jamais à côté » · 30 sec

[40] style.fashion_deal_breakers — type multiple · prio 50 · ordre 400
  Q: « Côté style, ce qu'il faut éviter absolument… »
  Options: Trop classique[too_classic] · Trop cheap[too_cheap] · Trop voyant[too_flashy] · Trop discret[too_discreet] · Mauvaise matière[bad_material] · Mauvaise coupe[bad_fit] · Mauvaise taille[wrong_size] · Trop "cadeau par défaut"[default_gift] · Marque que je n'aime pas[wrong_brand]
  Déclench.: mode / style detected
  Nudge: « Des choix à ton goût, jamais à côté » · 30 sec

═══ Marques ═══

[41] brands.reference_free — type libre · prio 50 · ordre 410
  Q: « Cite 3 marques ou créateurs que tu aimes vraiment — même très différents. »
  Déclench.: marques aimées non détaillées
  Nudge: « Tes maisons préférées en tête des idées » · 20 sec

═══ Parfums ═══

[42] fragrance.perfume_risk — type unique · LOCKED · prio 50 · ordre 420
  Q: « Recevoir un parfum, pour toi, c'est… »
  Options: Je préfère choisir moi-même[choose_myself] · Possible si la personne connaît très bien mes goûts[if_knows_taste] · Seulement une marque que j'aime déjà[known_brand_only] · Plutôt une bougie ou un parfum d'intérieur[home_fragrance] · Je n'aime pas recevoir de parfum[avoid]
  Déclench.: parfum / beauté detected  |  garde donnée: réponse fragrance.perfume_risk
  Nudge: « Éviter les cadeaux beauté à côté » · 30 sec

[43] fragrance.families — type multiple · LOCKED · prio 50 · ordre 425
  Q: « Les familles olfactives qui te plaisent le plus »
  Options: Poudré[powdery] · Musqué propre[clean_musk] · Floral blanc[white_floral] · Floral frais[fresh_floral] · Ambré doux[soft_amber] · Vanillé léger[light_vanilla] · Boisé[woody] · Hespéridé[citrus] · Thé-aromatique[tea_aromatic] · Peau propre[clean_skin] · Je ne sais pas[unknown]
  Déclench.: toujours (si donnée absente)  |  garde donnée: parfums en fiche / réponse fragrance.families|family
  Nudge: « Des cadeaux parfum qui te ressemblent » · 20 sec

[44] fragrance.gender_orientation — type unique · prio 50 · ordre 425
  Q: « Pour les parfums, tu te guides plutôt vers… »
  Options: Les parfums rayon femme[femme] · Les parfums rayon homme[homme] · Les parfums mixtes / unisexes[mixte] · Peu importe le rayon si j'aime le parfum[indifferent] · Je préfère ne pas préciser[unspecified]
  Déclench.: toujours (si donnée absente)
  Nudge: — · —

[45] fragrance.scent_deal_breakers — type multiple · LOCKED · prio 50 · ordre 440
  Q: « À éviter absolument »
  Options: Trop sucré[too_sweet] · Patchouli[patchouli] · Très entêtant[too_heady] · Trop fruité[too_fruity] · Trop vanillé[too_vanilla] · Trop masculin[too_masculine] · Trop floral[too_floral] · Parfum trop connu[too_common] · Je ne sais pas[unknown]
  Déclench.: odeurs / parfums detected  |  garde donnée: odeurs détestées / réponse
  Nudge: « Écarter ce qui gâche un parfum » · 20 sec

═══ Marques ═══

[46] brands.beauty_reference — type libre · prio 50 · ordre 450
  Q: « Une marque beauté, parfum ou soin que tu aimes vraiment ? »
  Déclench.: marques beauté non renseignées
  Nudge: « Tes maisons préférées en tête des idées » · 20 sec

═══ Surprises ═══

[47] surprises.conditions — type multiple · prio 50 · ordre 460
  Q: « Tu peux aimer une surprise si… »
  Options: Je connais au moins l'horaire[know_schedule] · Je sais comment m'habiller[know_dress_code] · Je sais combien de temps ça dure[know_duration] · Je peux refuser sans gêne[can_decline] · Ce n'est pas devant trop de monde[not_too_public] · C'est organisé par quelqu'un de très proche[very_close_person] · C'est très bien préparé[well_prepared]
  Déclench.: surprise ouverte / partielle detected
  Nudge: « Des surprises bien dosées, jamais subies » · 20 sec

[48] surprises.briefing_needed — type multiple · prio 50 · ordre 470
  Q: « Avant une surprise, tu as besoin de savoir au minimum… »
  Options: L'heure[time] · La tenue[dress_code] · La durée[duration] · Le lieu approximatif[approx_location] · Si je dois prévoir une garde d'enfant[childcare] · Si c'est intime ou social[intimate_or_social] · Rien, j'aime la surprise totale[total_surprise]
  Déclench.: surprise detected
  Nudge: « Des surprises bien dosées, jamais subies » · 20 sec

[49] surprises.deal_breakers — type multiple · prio 50 · ordre 480
  Q: « La surprise à éviter absolument pour toi, ce serait… »
  Options: Une surprise en public[public] · Une surprise avec trop de monde[too_many_people] · Une surprise qui change mon planning[changes_plans] · Une surprise où je ne sais pas comment m'habiller[no_dress_code] · Une surprise trop chère[too_expensive] · Une surprise trop intime[too_intimate] · Une surprise qui ne me ressemble pas[not_me]
  Déclench.: surprise négative ou prudente detected
  Nudge: « Des surprises bien dosées, jamais subies » · 20 sec

═══ Pratique ═══

[50] practical.logistics_relief — type multiple · prio 50 · ordre 490
  Q: « Quand quelqu'un veut te faire du bien, qu'est-ce qui t'enlève un vrai poids des épaules ? »
  Options: Qu'on réserve à ma place[reservation] · Qu'on gère le trajet[transport] · Qu'on s'occupe des enfants[children] · Qu'on pense au repas[meal] · Qu'on fasse les courses[groceries] · Qu'on gère le ménage[cleaning] · Qu'on cale le bon moment[timing] · Qu'on prenne la décision pour moi[decision] · Qu'on règle les détails[practical_details] · Qu'on assure le suivi après[follow_up]
  Déclench.: charge mentale / fatigue / besoin d'organisation detected
  Nudge: « Zéro faux pas sur l'essentiel » · 30 sec

[51] practical.control_delegation — type unique · prio 50 · ordre 500
  Q: « Quand quelqu'un organise pour toi, tu préfères… »
  Options: Qu'il décide vraiment[decide_all] · Qu'il me propose 2 options[two_options] · Qu'il me laisse valider les détails[validate_details] · Qu'il gère tout sauf la date[all_except_date] · Qu'il me surprenne mais me rassure[surprise_but_reassure] · Qu'il ne décide pas à ma place[no_decide_for_me]
  Déclench.: aime qu'on organise / surprise / charge mentale detected
  Nudge: « Zéro faux pas sur l'essentiel » · 30 sec

═══ Conflits ═══

[52] conflicts.repair_strategy — type multiple · prio 50 · ordre 510
  Q: « Après une tension, ce qui aide vraiment à réparer pour toi, c'est… »
  Options: Des excuses précises[precise_apology] · Un message écrit[written_message] · Une discussion calme[calm_discussion] · Une preuve que l'autre a compris[proof_understood] · Un geste concret[concrete_gesture] · Un moment ensemble[time_together] · Un peu de temps[time_alone] · Pas de cadeau, surtout une vraie parole[words_not_gift]
  Déclench.: conflit / réparation non précisé
  Nudge: « Des attentions justes, même les jours sensibles » · 20 sec

[53] conflicts.repair_avoid — type multiple · prio 50 · ordre 520
  Q: « Après une dispute, ce qui serait maladroit… »
  Options: Faire comme si rien ne s'était passé[ignore_conflict] · Offrir un cadeau sans parler[gift_without_words] · Mettre de l'humour trop vite[humor_too_soon] · Insister alors que j'ai besoin d'espace[insist_when_need_space] · Dramatiser[dramatize] · Se justifier[justify] · Attendre trop longtemps[wait_too_long]
  Déclench.: conflit / réparation non précisé
  Nudge: « Des attentions justes, même les jours sensibles » · 20 sec

═══ Style ═══

[54] style.material_preferences — type multiple · prio 50 · ordre 530
  Q: « Les matières qui te donnent vraiment une impression de qualité… »
  Options: Cachemire[cashmere] · Soie[silk] · Cuir[leather] · Daim[suede] · Lin[linen] · Coton épais[thick_cotton] · Laine mérinos[merino] · Céramique[ceramic] · Bois[wood] · Verre soufflé[blown_glass] · Métal doré[gold_metal] · Pierre naturelle[natural_stone]
  Déclench.: mode / déco / beauté / matières detected
  Nudge: « Des choix à ton goût, jamais à côté » · 30 sec

[55] style.material_avoidance — type multiple · prio 50 · ordre 540
  Q: « Les matières qui peuvent te déplaire… »
  Options: Synthétique[synthetic] · Laine qui gratte[scratchy_wool] · Polyester[polyester] · Matière trop rigide[too_rigid] · Matière trop fragile[too_fragile] · Faux cuir[faux_leather] · Fourrure[fur] · Plastique[plastic] · Je ne sais pas[unknown]
  Déclench.: mode / déco / matières detected
  Nudge: « Des choix à ton goût, jamais à côté » · 30 sec

[56] style.cross_gender — type multiple · prio 50 · ordre 545
  Q: « Pour les vêtements et accessoires, tu te repères plutôt dans… »
  Options: Le rayon femme[femme] · Le rayon homme[homme] · Les deux — je mélange[mixte] · Les pièces unisexes avant tout[unisexe] · Ça dépend de la pièce[depends] · Je préfère ne pas préciser[unspecified]
  Déclench.: toujours (si donnée absente)
  Nudge: « Des choix à ton goût, jamais à côté » · 30 sec

[57] style.color_safe — type multiple · prio 50 · ordre 550
  Q: « Si on t'offre un objet, un vêtement ou un accessoire, les couleurs les plus sûres sont… »
  Options: Noir[black] · Blanc[white] · Beige[beige] · Bleu ciel[light_blue] · Marine[navy] · Vert[green] · Rouge[red] · Rose pâle[pale_pink] · Doré[gold] · Argenté[silver] · Tons neutres[neutral_tones] · Couleurs fortes[bold_colors] · Je préfère choisir[prefer_choose]
  Déclench.: mode / déco / objet detected
  Nudge: « Des choix à ton goût, jamais à côté » · 30 sec

═══ Loisirs ═══

[58] hobbies.home_gift_safe — type unique · prio 50 · ordre 560
  Q: « Pour la maison, ce qui est le moins risqué à t'offrir… »
  Options: Bougie / parfum d'intérieur[candle] · Art de la table[tableware] · Linge de maison[linen] · Beau livre[coffee_table_book] · Petit objet design[design_object] · Plante[plant] · Céramique[ceramic] · Rien, je préfère choisir moi-même[prefer_choose]
  Déclench.: déco / maison detected
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

[59] hobbies.home_deal_breakers — type multiple · prio 50 · ordre 570
  Q: « En déco, ce qui peut vite tomber à côté pour toi… »
  Options: Objet trop kitsch[too_kitsch] · Mauvaise couleur[bad_color] · Mauvaise matière[bad_material] · Objet trop imposant[too_imposing] · Style trop froid[too_cold] · Style trop rustique[too_rustic] · Objet sans utilité[useless] · Cadeau qui encombre[clutters]
  Déclench.: déco / maison detected
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

[60] hobbies.wellness_gift — type multiple · prio 50 · ordre 580
  Q: « Une attention bien-être réussie pour toi, c'est plutôt… »
  Options: Massage[massage] · Spa[spa] · Cours privé[private_class] · Retraite[retreat] · Moment de calme[quiet_time] · Accessoire de qualité[quality_accessory] · Abonnement[subscription] · Expérience douce[gentle_experience] · Je préfère éviter les cadeaux bien-être[avoid]
  Déclench.: sport / bien-être detected
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

[61] hobbies.sport_risk — type multiple · prio 50 · ordre 590
  Q: « Un cadeau sport est risqué si… »
  Options: Il n'est pas adapté à ma pratique[wrong_practice] · Il est trop technique[too_technical] · Il est trop bas de gamme[low_quality] · Il suppose que je veux performer[performance_assumption] · Il touche au corps / au poids[body_related] · Il est choisi sans connaître mes habitudes[unknown_habits] · Je préfère choisir moi-même[prefer_choose]
  Déclench.: sport detected
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

[62] hobbies.culture_success — type multiple · prio 50 · ordre 600
  Q: « Une sortie culturelle réussie pour toi, c'est surtout… »
  Options: Une très belle œuvre[great_artwork] · Un lieu magnifique[beautiful_venue] · Une émotion forte[strong_emotion] · Une découverte[discovery] · Un moment élégant[elegant] · Une sortie facile à organiser[easy_logistics] · Une discussion après[discussion_after] · Un événement rare[rare_event]
  Déclench.: culture / art detected
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

[63] hobbies.concert_criteria — type multiple · prio 50 · ordre 610
  Q: « Pour un concert ou spectacle, ce qui compte le plus… »
  Options: L'artiste[artist] · La qualité des places[seat_quality] · L'ambiance[ambiance] · Le lieu[venue] · Le confort[comfort] · Y aller avec la bonne personne[right_company] · Ne pas être trop loin / mal placé[good_position] · Le côté événement rare[rare_event]
  Déclench.: musique / concert detected
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

[64] hobbies.artist_reference — type libre · prio 50 · ordre 620
  Q: « Un artiste, spectacle ou lieu culturel que tu aimerais voir ? »
  Déclench.: artiste non renseigné
  Nudge: « Des moments qui te nourrissent vraiment » · 30 sec

═══ Rêves ═══

[65] dreams.wish_priority — type libre · prio 50 · ordre 630
  Q: « Parmi tes envies du moment, laquelle te ferait le plus plaisir si quelqu'un t'aidait à la réaliser ? »
  Déclench.: envies / rêves du moment renseignés
  Nudge: « Ce dont tu rêves, gardé pour le bon moment » · 20 sec

[66] dreams.wishlist_first — type libre · prio 50 · ordre 640
  Q: « Une chose que tu aimerais recevoir, vivre ou faire dans les prochains mois ? »
  Déclench.: wishlist vide
  Nudge: « Ce dont tu rêves, gardé pour le bon moment » · 20 sec

═══ Pratique ═══

[67] practical.important_dates — type libre · prio 50 · ordre 650
  Q: « Y a-t-il une date que tes proches ne devraient pas oublier ? »
  Déclench.: dates importantes incomplètes  |  garde donnée: ≥1 date importante
  Nudge: « Zéro faux pas sur l'essentiel » · 30 sec

[68] practical.date_attention — type multiple · prio 50 · ordre 660
  Q: « Pour cette date, tu aimerais plutôt… »
  Options: Un message[message] · Un moment ensemble[time_together] · Un cadeau[gift] · Une surprise[surprise] · Une expérience[experience] · Rien de grand, juste qu'on y pense[just_remember] · Quelque chose organisé à l'avance[planned_ahead]
  Déclench.: date ajoutée sans préférence d'attention
  Nudge: « Zéro faux pas sur l'essentiel » · 30 sec
```

