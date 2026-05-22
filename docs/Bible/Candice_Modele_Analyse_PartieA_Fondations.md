# Modèle d'Analyse Candice — Partie A : Fondations & méthode

> **Statut : v1 — source de vérité unique.**
> Ce document fige la méthode. Aucun code (ni prompt Claude Code) ne doit s'en écarter.
> En cas de doute pendant l'implémentation, c'est ce document qui tranche, pas la mémoire ni un ancien tracker.
> La **Partie B** (questionnaire final écran par écran, avec micro-copy et analyse interne) découle de ce document.

---

## 0. Principe directeur

Candice n'est pas un moteur à cadeaux. C'est une **couche d'intelligence relationnelle** qui aide à comprendre un proche, anticiper ce qui le touche, éviter les maladresses, mieux communiquer, et comparer deux fonctionnements relationnels.

La promesse finale : **« Candice ne sait pas seulement quoi offrir. Candice comprend comment aimer cette personne sans tomber à côté. »**

Le questionnaire ne produit pas un score, il produit **un profil relationnel** en trois couches, qui alimentent ensuite : une fiche profil, des recommandations d'attentions, des alertes, et un matching relationnel.

---

## 1. Les trois couches (+ le matching qui les fusionne)

| Couche | Ce qu'elle capte | Forme | Usage |
|---|---|---|---|
| **1. Attention** | Comment la personne aime *recevoir* de l'attention | **Score chiffré** sur 7 dimensions | Prioriser et personnaliser les types d'attention |
| **2. Tempérament** | Comment la personne *fonctionne* relationnellement | **Traits / étiquettes / intensités** (pas de score 7D) | Régler le ton, le timing, l'intensité ; alerter ; matcher |
| **3. Singularité** | Ce qui rend la personne *unique* | **Texte libre + préférences concrètes** lus par l'IA | Remplir l'attention de contenu réel ; filtrer |

Le **matching relationnel** (section 9) **fusionne les trois couches** de deux personnes pour produire une analyse comparative. Il est fondateur, pas secondaire.

**Principe transversal :** toute donnée collectée est pensée aussi pour alimenter le matching, pas seulement la fiche individuelle. Candice est un miroir et un traducteur relationnel, pas seulement un générateur d'idées cadeaux.

**Distinction non négociable :** seule la couche 1 est scorée chiffré. Le tempérament n'est pas un score 7D. C'est l'erreur qui a tout brouillé jusqu'ici.

---

## 2. Couche 1 — Profil d'attention (scoré)

### Les 7 dimensions

| Code | Dimension | Définition |
|---|---|---|
| **MOT** | Mots valorisants | Compliments, déclarations, reconnaissance verbale |
| **SER** | Services rendus | Aide concrète, allègement de la charge |
| **CAD_C** | Cadeaux choisis | Cadeau personnalisé, précis, qui prouve qu'on écoute |
| **CAD_S** | Cadeaux symboliques | Objet de valeur, chargé de sens, qui dure |
| **EXP** | Expériences | Temps de qualité, moments vécus ensemble |
| **GES** | Petits gestes | Attentions régulières du quotidien |
| **SUR** | Surprises | Imprévu, spontanéité |

**COM (canal de communication)** est une dimension annexe (message / vocal / appel / visio / courrier / en personne) : non scorée chiffré, stockée comme préférence, utilisée pour choisir le *canal* d'une attention MOT ou GES.

### Règle de scoring (verrouillée)

- L'utilisateur choisit **jusqu'à 3 réponses par question, classées** par ordre d'importance.
- **Rang 1 = +5 · Rang 2 = +3 · Rang 3 = +1.**
- Chaque option est reliée à **1 ou 2 dimensions maximum**, à **poids égal**.
- Le score d'une option = le coefficient de son rang, appliqué à chacune de ses dimensions.

> Exemple : option « Quelqu'un qui pense à moi sans faire de bruit » → taguée `GES` + `SER`. Choisie en rang 1 → `GES +5` **et** `SER +5`.

- **Interdits :** pas de pondération asymétrique intra-option (pas de « GES +5, SER +2 »), pas de dimension hors des 7 (pas de « sensibilité contextuelle +2 »), pas plus de 2 dimensions par option.
- Scoring **individuel, non comparatif** entre utilisateurs. **Normalisé sur 100 par dimension.**

### Profils issus du score

- **Dominant** = dimension au score le plus élevé.
- **Secondaire** = toute dimension > 45 / 100.
- **Tertiaire** = toute dimension > 30 / 100.
- Une personne peut cumuler plusieurs profils (c'est fidèle à la réalité).

### Couverture

Le bloc d'attention doit couvrir les **7 dimensions sans redondance excessive**. Une question « cadeaux » nuancée suffit à couvrir CAD_C / CAD_S / EXP — on ne re-score pas les cadeaux trois fois. Le lifestyle (food, voyage, standing) **enrichit le contexte, il ne re-score pas** le profil.

---

## 3. Couche 2 — Moteur de tempérament (traits, non scoré chiffré)

Les questions de personnalité **ne sont ni un score 7D, ni une donnée morte**. Elles alimentent un second moteur, qui fonctionne par **traits, intensités, étiquettes, oppositions**.

### Axes de tempérament

- introversion ↔ extraversion
- besoin d'espace ↔ besoin de proximité
- spontanéité ↔ besoin de contrôle / structure
- communication directe ↔ indirecte
- expressivité émotionnelle ↔ réserve
- rapport au conflit : direct / évitant / temporisateur / humour
- besoin de stabilité ↔ besoin de nouveauté
- sensibilité aux détails
- besoin de reconnaissance
- niveau d'exigence / standing
- rythme émotionnel rapide ↔ lent

### Exploitation active (obligatoire)

Chaque trait **doit** être utilisé, jamais seulement stocké :

- **Ton** des messages rédigés (un « analytique » → mot réfléchi, pas déclaration émotive).
- **Timing / intensité** (un « besoin d'espace » → ne pas envahir ; « rythme lent » → laisser respirer).
- **Alertes** (un « déteste être contrôlé » → ne jamais imposer un planning).
- **Matching** (comparer les tempéraments de deux personnes — section 9).

---

## 4. Couche 3 — Singularité (texte libre + préférences, lus par l'IA)

Tout ce que le scoring ne peut pas digérer : centres d'intérêt, passions, goûts précis, marques, tailles, wishlist, anecdotes, « le plus beau cadeau qu'on m'ait offert », « le détail qui me fait me sentir compris ».

Ces champs sont **lus et structurés par l'IA** (Claude), pas calculés. Ils donnent le **contenu concret** des attentions :
- le profil dit le *registre* (ex. dominant EXP) ;
- la singularité dit le *contenu* (ex. adore le tennis, rêve d'un sac Sandro) ;
- l'attention naît du croisement registre × contenu × filtre.

**Règle :** un champ de singularité écrit n'est jamais ignoré. (Le bug historique = `additional_notes` et `shared_profile_responses` écrits puis jamais relus. Interdit désormais.)

---

## 5. Filtres durs (jamais scorés, toujours bloquants)

Certaines données ne deviennent **jamais** un score. Ce sont des **filtres durs** qui peuvent annuler une suggestion même si le profil la recommande :

- allergies alimentaires
- régime (dont halal / casher = information religieuse)
- alcool (oui / non / occasionnel / éviter les lieux centrés alcool)
- grossesse / post-partum / allaitement
- handicap / mobilité / santé / phobies
- religion & convictions
- contraintes diverses (deuil, burn-out, distance, budget serré…)

> Exemples : « halal » → jamais de restaurant non compatible. « pas d'alcool » → pas de bar à vin. « mobilité réduite » → pas de randonnée. « déteste les surprises publiques » → jamais de fête surprise.

Ces données relèvent de l'**Art. 9 RGPD** (santé, religion, etc.) : collecte symétrique (la personne concernée saisit elle-même), réassurance explicite à l'écran, jamais affichées au Proche, jamais dans le matching.

---

## 6. Le toucher (donnée secondaire, volontairement minimale)

Candice n'est pas une application de thérapie affective ni de sexualité. Le contact physique **n'est donc ni une 8ᵉ dimension, ni un filtre architectural, ni un objet de recommandations**. On évite toute dérive « test affectif » : pas d'analyse centrée dessus.

Ce qu'on cherche réellement à comprendre derrière cette notion — démonstratif ↔ discret, besoin d'espace, présence ↔ autonomie, manière d'exprimer l'affection, sensibilité émotionnelle, confort relationnel — est **déjà capté par le moteur de tempérament** (section 3).

En pratique :
- **pas de question dédiée pesante** ; on supprime « Je suis tactile » / « Le contact physique c'est surtout avec » (redondant avec le tempérament) ;
- au plus, un **signal léger et optionnel** si une formulation naturelle se présente, sans poids dans le modèle ;
- aucune recommandation à composante physique n'est générée à partir de cette donnée.

---

## 7. Combinaison : du profil à l'attention (où l'IA intervient)

```
Couche 1 (calcul déterministe)   → registre : quel TYPE d'attention
Couche 2 (traits)                → ton / timing / intensité / alertes
Couche 3 (texte libre, IA)       → contenu concret de l'attention
Filtres durs                     → annulent ce qui est incompatible
```

**Le calcul détermine le profil. L'IA n'intervient qu'ensuite** — pour habiller le profil en langage chaleureux et générer les attentions concrètes. L'IA ne décide jamais du profil d'attention. La couche 3 peut **contredire** la couche 1 (si le texte dit « je déteste recevoir des objets » alors que le score dit CAD, le texte prime).

---

## 8. Fiche profil individuelle (le livrable utilisateur)

À la fin du questionnaire, afficher une **vraie fiche** (pas un « merci »), belle, lisible, partageable :

1. Synthèse relationnelle courte
2. Langages d'attention dominants (principal / secondaire / tertiaire)
3. Ce qui te touche le plus (4-5 insights)
4. Ton style relationnel
5. Ton style de communication
6. Ce qu'il vaut mieux éviter avec toi (4-5 alertes)
7. Les attentions qui te correspondent
8. Boutons : *Partager mon profil* · *Comparer avec un proche* · *Enrichir mon profil*

Ton : « tu sembles », « ton profil indique plutôt », « il est possible que ». Jamais de diagnostic, jamais de cases fermées.

---

## 9. Matching relationnel (fondation, pas option)

Le matching **fusionne les trois couches** de deux personnes (A et B). Il ne produit **jamais** un simple « compatibilité 82 % ». Il produit une **analyse narrative actionnable**.

### Ce qu'il compare

- profil d'attention A vs B
- tempérament A vs B (rythme émotionnel, espace, spontanéité, conflit)
- style de communication A vs B
- goûts communs
- zones de fluidité / zones de friction
- attentions recommandées de A vers B, et de B vers A

### Ce qu'il produit

- résumé relationnel
- points communs
- différences utiles
- zones de friction (concrètes)
- comment faire plaisir à l'autre
- comment mieux communiquer
- ce qu'il vaut mieux éviter

> Exemple : « Vous partagez un besoin fort de profondeur, mais pas le même rythme émotionnel : Julie verbalise vite, Thomas traite seul avant d'en parler. »

### Ce qu'il n'affiche JAMAIS

Données sensibles brutes : tailles, santé, allergies détaillées, religion, adresse, confidences libres non autorisées. Le matching n'affiche que des **insights synthétiques**.

Vocabulaire : « zones de fluidité », « points de vigilance », « manière naturelle de fonctionner ». Jamais « fait / pas fait pour vous entendre ».

---

## 10. Parcours du Proche & symétrie des données

- Un Proche doit pouvoir **remplir le même profil** que le Pilote, sans le refaire deux fois → les jeux de champs `my_profile` et le questionnaire Proche doivent être **strictement symétriques** (mêmes champs, mêmes types).
- Le matching exige cette symétrie : on ne compare que ce qui est comparable.
- Le parcours Proche ne doit **pas être un cul-de-sac** : ses réponses doivent nourrir une fiche et l'analyse (corriger `shared_profile_responses` jamais relue).
- Données du Proche = saisies par le Proche lui-même (base de l'argument RGPD).

---

## 11. Principes UX / UI (couche expérience)

- **Mobile-first**, une question (ou petit groupe cohérent) par écran, 4-7 options max.
- Navigation **Suivant / Retour** + **reprendre plus tard**. Pas de scroll interminable.
- **Auto-save** : supprimer l'icône disquette et le gros bouton « Sauvegarder » → sauvegarde automatique + mention discrète « Enregistré ».
- **Barre de progression** sticky, terra, **sans pourcentage** ; progression par module (« Étape 1/7 », « Question 2/4 »), jamais « 2/49 ».
- **Micro-analyse** à la fin de chaque module (écran de respiration : un aperçu du profil + « Continuer » / « Reprendre plus tard »).
- **Micro-copy obligatoire et non négociable** sous chaque option : **titre + sous-texte visible (8-14 mots) + analyse interne invisible** (dimensions / signaux / filtres). Fait partie de l'ADN de Candice.
- Ton : premium, humain, chaleureux, élégant. Jamais SaaS froid, jamais quiz BuzzFeed, jamais test psy clinique, jamais gamifié.
- Mode vocal conservé mais traité comme une fonction moderne et discrète (« répondre à l'oral »), pas un gros micro daté.

---

## Ce qui vient en Partie B

- Le **questionnaire final, écran par écran** : chaque question retenue (attention / tempérament / lifestyle / singularité / pratique), avec pour chaque option : titre + sous-texte + analyse interne (dimensions, traits, filtres).
- Les **7 étapes** et leurs micro-analyses.
- La cartographie précise question → couche → ce qu'elle alimente.

*(La Partie B ne réintroduira aucune décision ; elle applique strictement les règles de la Partie A.)*
