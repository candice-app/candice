# Onboarding Candice V15 — les 128 mappings, ligne par ligne

Source de données du lot A. C'est ce fichier qui sert à générer `onboarding.ts`.

Les règles de lecture, les frontières et les chiffres de contrôle sont dans `onboarding-v15-clos.md`. Ici il n'y a que les données.

**Conventions.** `evidence_role` vaut `primary` sauf mention `secondary`. `context` vaut `GLOBAL` (statut `GLOBAL_DIRECT`) ou un domaine (statut `LOCAL/CONTEXTUAL`). Une ligne sans mention d'une famille ne produit rien pour cette famille, et ce vide est voulu. Les options au statut autre que `ACTIF` conservent leurs mappings mais sont exclues de tout calcul.

Le texte des questions et des options est **le texte exact affiché à l'utilisateur**. Il doit être conservé mot pour mot dans le code : c'est lui qui part dans la couche source à chaque réponse.

---


## Q1 — « Je me sens le plus aimé(e) quand … »

### Option `1` — « On me dit des mots sincères »

- `optionRef` : `1` · `questionCode` : `q1` · `domain` : `attention reçue`
- `questionText` : « Je me sens le plus aimé(e) quand … »
- `optionText` : « On me dit des mots sincères »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_WORDS` · `evidence_role` `primary`
- `retainedInformation` : « mots sincères comme modalité affective »

### Option `2` — « On m'aide concrètement sans que je demande »

- `optionRef` : `2` · `questionCode` : `q1` · `domain` : `attention reçue`
- `questionText` : « Je me sens le plus aimé(e) quand … »
- `optionText` : « On m'aide concrètement sans que je demande »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_SERVICES` · `evidence_role` `primary`
- `drivers` : `DRV_ANTICIPATION`
- `retainedInformation` : « aide concrète anticipée »

### Option `3` — « On me fait un cadeau pensé spécialement pour moi »

- `optionRef` : `3` · `questionCode` : `q1` · `domain` : `attention reçue`
- `questionText` : « Je me sens le plus aimé(e) quand … »
- `optionText` : « On me fait un cadeau pensé spécialement pour moi »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_OBJECT` · `value` +1 · `evidence_role` `secondary` · `context` `gift` → `LOCAL/CONTEXTUAL`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_PERSONALIZED_GIFT` · `evidence_role` `primary`
- `drivers` : `DRV_PERSONALIZATION`
- `retainedInformation` : « cadeau pensé spécialement pour la personne »

### Option `4` — « On me fait un cadeau chargé de sens »

- `optionRef` : `4` · `questionCode` : `q1` · `domain` : `attention reçue`
- `questionText` : « Je me sens le plus aimé(e) quand … »
- `optionText` : « On me fait un cadeau chargé de sens »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_OBJECT` · `value` +1 · `evidence_role` `secondary` · `context` `gift` → `LOCAL/CONTEXTUAL`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_SYMBOLIC_GIFT` · `evidence_role` `primary`
- `drivers` : `DRV_SYMBOLISM`
- `retainedInformation` : « valeur symbolique du cadeau »

### Option `5` — « On me consacre un vrai moment de qualité »

- `optionRef` : `5` · `questionCode` : `q1` · `domain` : `attention reçue`
- `questionText` : « Je me sens le plus aimé(e) quand … »
- `optionText` : « On me consacre un vrai moment de qualité »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_EXPERIENCE` · `value` +1 · `evidence_role` `secondary` · `context` `attention_received` → `LOCAL/CONTEXTUAL`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_QUALITY_TIME` · `evidence_role` `primary`
- `drivers` : `DRV_SHARED_EXPERIENCE`
- `retainedInformation` : « temps de qualité partagé »

### Option `6` — « On pense à moi dans les petits détails du quotidien »

- `optionRef` : `6` · `questionCode` : `q1` · `domain` : `attention reçue`
- `questionText` : « Je me sens le plus aimé(e) quand … »
- `optionText` : « On pense à moi dans les petits détails du quotidien »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_MICRO_ATTENTIONS` · `evidence_role` `primary`
- `drivers` : `DRV_ATTENTIVENESS`
- `retainedInformation` : « micro-attentions / détails du quotidien »

### Option `7` — « On me surprend avec quelque chose d'inattendu »

- `optionRef` : `7` · `questionCode` : `q1` · `domain` : `attention reçue`
- `questionText` : « Je me sens le plus aimé(e) quand … »
- `optionText` : « On me surprend avec quelque chose d'inattendu »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_SURPRISE` · `evidence_role` `primary`
- `drivers` : `DRV_SURPRISE`
- `retainedInformation` : « surprise inattendue »
- *Retiré en V14 : `APPETENCE_SPONTANEITY +1 sec`. Réception pure : « on me surprend ». Ne démontre pas qu'elle improvise.*


## Q2 — « Une attention réussie, pour moi, c'est surtout … »

### Option `8` — « Quelque chose qui montre qu'on m'a écouté(e) »

- `optionRef` : `8` · `questionCode` : `q2` · `domain` : `attention reçue`
- `questionText` : « Une attention réussie, pour moi, c'est surtout … »
- `optionText` : « Quelque chose qui montre qu'on m'a écouté(e) »
- `status` : `ACTIF`
- `drivers` : `DRV_ATTENTIVENESS`
- `retainedInformation` : « importance de l'écoute »

### Option `9` — « Quelque chose qui tombe au bon moment »

- `optionRef` : `9` · `questionCode` : `q2` · `domain` : `attention reçue`
- `questionText` : « Une attention réussie, pour moi, c'est surtout … »
- `optionText` : « Quelque chose qui tombe au bon moment »
- `status` : `ACTIF`
- `drivers` : `DRV_TIMING`
- `retainedInformation` : « importance du timing »

### Option `10` — « Quelque chose qui crée un souvenir »

- `optionRef` : `10` · `questionCode` : `q2` · `domain` : `attention reçue`
- `questionText` : « Une attention réussie, pour moi, c'est surtout … »
- `optionText` : « Quelque chose qui crée un souvenir »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_EXPERIENCE` · `value` +1 · `evidence_role` `secondary` · `context` `attention_received` → `LOCAL/CONTEXTUAL`
- `drivers` : `DRV_MEMORY`
- `retainedInformation` : « souvenir créé »

### Option `11` — « Quelque chose qui me facilite vraiment la vie »

- `optionRef` : `11` · `questionCode` : `q2` · `domain` : `attention reçue`
- `questionText` : « Une attention réussie, pour moi, c'est surtout … »
- `optionText` : « Quelque chose qui me facilite vraiment la vie »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_FUNCTIONAL` · `value` +1 · `evidence_role` `secondary` · `context` `attention_received` → `LOCAL/CONTEXTUAL`
- `drivers` : `DRV_RELIEF` · `DRV_UTILITY`
- `retainedInformation` : « facilite concrètement la vie »

### Option `12` — « Quelque chose de simple mais sincère »

- `optionRef` : `12` · `questionCode` : `q2` · `domain` : `attention reçue`
- `questionText` : « Une attention réussie, pour moi, c'est surtout … »
- `optionText` : « Quelque chose de simple mais sincère »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_AUTHENTICITY` · `value` +1 · `evidence_role` `secondary` · `context` `attention_received` → `LOCAL/CONTEXTUAL`
- `drivers` : `DRV_SIMPLICITY` · `DRV_AUTHENTICITY`
- `retainedInformation` : « simplicité et sincérité »

### Option `13` — « Quelque chose que je n'avais pas vu venir »

- `optionRef` : `13` · `questionCode` : `q2` · `domain` : `attention reçue`
- `questionText` : « Une attention réussie, pour moi, c'est surtout … »
- `optionText` : « Quelque chose que je n'avais pas vu venir »
- `status` : `ACTIF`
- `drivers` : `DRV_SURPRISE`
- `retainedInformation` : « effet de surprise »
- *Retiré en V14 : `APPETENCE_SPONTANEITY +1 sec`. Réception pure. L'effet de surprise est le mécanisme de résonance, pas une appétence à improviser.*

### Option `14` — « Quelque chose de beau, choisi avec goût »

- `optionRef` : `14` · `questionCode` : `q2` · `domain` : `attention reçue`
- `questionText` : « Une attention réussie, pour moi, c'est surtout … »
- `optionText` : « Quelque chose de beau, choisi avec goût »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_AESTHETIC` · `value` +2 · `evidence_role` `primary` · `context` `attention_received` → `LOCAL/CONTEXTUAL`
    - `PROFILE_SENSITIVITY.aesthetic` · `value` +1 · `evidence_role` `primary` · `context` `attention_received` → `LOCAL/CONTEXTUAL`
- `drivers` : `DRV_AESTHETIC`
- `retainedInformation` : « beau et goût du choix »


## Q3 — « Ce qui me touche le plus durablement … »

### Option `15` — « Une phrase qui reste en tête »

- `optionRef` : `15` · `questionCode` : `q3` · `domain` : `attention reçue`
- `questionText` : « Ce qui me touche le plus durablement … »
- `optionText` : « Une phrase qui reste en tête »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `retainedInformation` : « ce qui dure : les mots »

### Option `16` — « Un geste fait sans bruit, mais au bon moment »

- `optionRef` : `16` · `questionCode` : `q3` · `domain` : `attention reçue`
- `questionText` : « Ce qui me touche le plus durablement … »
- `optionText` : « Un geste fait sans bruit, mais au bon moment »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `retainedInformation` : « ce qui dure : le geste discret et bien timé »

### Option `17` — « Un objet qui a une histoire »

- `optionRef` : `17` · `questionCode` : `q3` · `domain` : `attention reçue`
- `questionText` : « Ce qui me touche le plus durablement … »
- `optionText` : « Un objet qui a une histoire »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `retainedInformation` : « ce qui dure : l'objet qui a une histoire »

### Option `18` — « Une expérience partagée dont on reparlera longtemps »

- `optionRef` : `18` · `questionCode` : `q3` · `domain` : `attention reçue`
- `questionText` : « Ce qui me touche le plus durablement … »
- `optionText` : « Une expérience partagée dont on reparlera longtemps »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `retainedInformation` : « ce qui dure : l'expérience partagée »

### Option `19` — « Une surprise parfaitement pensée »

- `optionRef` : `19` · `questionCode` : `q3` · `domain` : `attention reçue`
- `questionText` : « Ce qui me touche le plus durablement … »
- `optionText` : « Une surprise parfaitement pensée »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `retainedInformation` : « ce qui dure : la surprise bien préparée »

### Option `20` — « Une aide concrète quand j'en ai vraiment besoin »

- `optionRef` : `20` · `questionCode` : `q3` · `domain` : `attention reçue`
- `questionText` : « Ce qui me touche le plus durablement … »
- `optionText` : « Une aide concrète quand j'en ai vraiment besoin »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `retainedInformation` : « ce qui dure : l'aide concrète dans la difficulté »

### Option `21` — « Un détail qui prouve qu'on me connaît vraiment »

- `optionRef` : `21` · `questionCode` : `q3` · `domain` : `attention reçue`
- `questionText` : « Ce qui me touche le plus durablement … »
- `optionText` : « Un détail qui prouve qu'on me connaît vraiment »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `retainedInformation` : « ce qui dure : le détail qui prouve qu'on la connaît »


## Q4 — « Entre deux attentions, je préfère … »

### Option `22` — « Une petite attention régulière »

- `optionRef` : `22` · `questionCode` : `q4` · `domain` : `attention reçue`
- `questionText` : « Entre deux attentions, je préfère … »
- `optionText` : « Une petite attention régulière »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_MICRO_ATTENTIONS` · `evidence_role` `primary`
- `affectionCadence` : `regular_micro`
- `retainedInformation` : « préférence pour les petites attentions régulières »

### Option `23` — « Un grand moment rare mais marquant »

- `optionRef` : `23` · `questionCode` : `q4` · `domain` : `attention reçue`
- `questionText` : « Entre deux attentions, je préfère … »
- `optionText` : « Un grand moment rare mais marquant »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_EXPERIENCE` · `value` +1 · `evidence_role` `secondary` · `context` `attention_received` → `LOCAL/CONTEXTUAL`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_QUALITY_TIME` · `evidence_role` `secondary`
- `affectionCadence` : `rare_marking`
- `retainedInformation` : « préférence pour le rare et marquant »

### Option `24` — « Une aide concrète quand j'en ai besoin »

- `optionRef` : `24` · `questionCode` : `q4` · `domain` : `attention reçue`
- `questionText` : « Entre deux attentions, je préfère … »
- `optionText` : « Une aide concrète quand j'en ai besoin »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_FUNCTIONAL` · `value` +1 · `evidence_role` `secondary` · `context` `attention_received` → `LOCAL/CONTEXTUAL`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_SERVICES` · `evidence_role` `primary`
- `drivers` : `DRV_RELIEF`
- `retainedInformation` : « aide concrète »

### Option `25` — « Un mot sincère au bon moment »

- `optionRef` : `25` · `questionCode` : `q4` · `domain` : `attention reçue`
- `questionText` : « Entre deux attentions, je préfère … »
- `optionText` : « Un mot sincère au bon moment »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_WORDS` · `evidence_role` `primary`
- `drivers` : `DRV_TIMING`
- `retainedInformation` : « mot sincère au bon moment »

### Option `26` — « Un cadeau qui a du sens »

- `optionRef` : `26` · `questionCode` : `q4` · `domain` : `attention reçue`
- `questionText` : « Entre deux attentions, je préfère … »
- `optionText` : « Un cadeau qui a du sens »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_OBJECT` · `value` +1 · `evidence_role` `secondary` · `context` `gift` → `LOCAL/CONTEXTUAL`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_SYMBOLIC_GIFT` · `evidence_role` `primary`
- `drivers` : `DRV_SYMBOLISM`
- `retainedInformation` : « cadeau qui a du sens »

### Option `27` — « Une surprise qui casse la routine »

- `optionRef` : `27` · `questionCode` : `q4` · `domain` : `attention reçue`
- `questionText` : « Entre deux attentions, je préfère … »
- `optionText` : « Une surprise qui casse la routine »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_OPENNESS` · `value` +1 · `evidence_role` `secondary` · `context` `surprise` → `LOCAL/CONTEXTUAL`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_SURPRISE` · `evidence_role` `primary`
- `drivers` : `DRV_SURPRISE`
- `retainedInformation` : « surprise et rupture de routine »
- *Retiré en V14 : `APPETENCE_SPONTANEITY +1 sec`. Réception. « Casser la routine » qualifie ce qu'on lui fait, pas ce qu'elle fait.*

### Option `28` — « Un objet choisi vraiment en fonction de moi et de mes goûts »

> Libellé reformulé pour lever une ambiguïté. Ancien libellé : « Un objet choisi avec précision ».

- `optionRef` : `28` · `questionCode` : `q4` · `domain` : `attention reçue`
- `questionText` : « Entre deux attentions, je préfère … »
- `optionText` : « Un objet choisi vraiment en fonction de moi et de mes goûts »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_OBJECT` · `value` +1 · `evidence_role` `secondary` · `context` `gift` → `LOCAL/CONTEXTUAL`
    - `PROFILE_EXACTINGNESS` · `value` +1 · `evidence_role` `secondary` · `context` `gift` → `LOCAL/CONTEXTUAL`
- `affectionLanguage` :
    - `AFFECTION_RECEIVE_PERSONALIZED_GIFT` · `evidence_role` `primary`
- `drivers` : `DRV_PERSONALIZATION`
- `retainedInformation` : « objet précisément choisi »


## QE — « Et toi, comment montres-tu naturellement ton attention aux autres ? »

### Option `29` — « Je dis ce que je ressens, je complimente, je rassure »

- `optionRef` : `29` · `questionCode` : `qe` · `domain` : `attention donnée`
- `questionText` : « Et toi, comment montres-tu naturellement ton attention aux autres ? »
- `optionText` : « Je dis ce que je ressens, je complimente, je rassure »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_GIVE_WORDS` · `evidence_role` `primary`
- `retainedInformation` : « donne par les mots »

### Option `30` — « J'aide, je rends service sans qu'on me le demande »

- `optionRef` : `30` · `questionCode` : `qe` · `domain` : `attention donnée`
- `questionText` : « Et toi, comment montres-tu naturellement ton attention aux autres ? »
- `optionText` : « J'aide, je rends service sans qu'on me le demande »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_GIVE_SERVICES` · `evidence_role` `primary`
- `retainedInformation` : « donne par les services »

### Option `31` — « J'offre des cadeaux choisis avec soin »

- `optionRef` : `31` · `questionCode` : `qe` · `domain` : `attention donnée`
- `questionText` : « Et toi, comment montres-tu naturellement ton attention aux autres ? »
- `optionText` : « J'offre des cadeaux choisis avec soin »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_GIVE_PERSONALIZED_GIFT` · `evidence_role` `primary`
- `retainedInformation` : « donne par les cadeaux personnalisés »

### Option `32` — « J'offre des choses qui ont du sens, une histoire »

- `optionRef` : `32` · `questionCode` : `qe` · `domain` : `attention donnée`
- `questionText` : « Et toi, comment montres-tu naturellement ton attention aux autres ? »
- `optionText` : « J'offre des choses qui ont du sens, une histoire »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_GIVE_SYMBOLIC_GIFT` · `evidence_role` `primary`
- `retainedInformation` : « donne par le symbolique »

### Option `33` — « Je passe du vrai temps de qualité avec les gens »

- `optionRef` : `33` · `questionCode` : `qe` · `domain` : `attention donnée`
- `questionText` : « Et toi, comment montres-tu naturellement ton attention aux autres ? »
- `optionText` : « Je passe du vrai temps de qualité avec les gens »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_RELATIONALITY` · `value` +1 · `evidence_role` `secondary` · `context` `affection_given` → `LOCAL/CONTEXTUAL`
- `affectionLanguage` :
    - `AFFECTION_GIVE_QUALITY_TIME` · `evidence_role` `primary`
- `retainedInformation` : « donne par le temps partagé »

### Option `34` — « J'ai mille petites attentions au quotidien »

- `optionRef` : `34` · `questionCode` : `qe` · `domain` : `attention donnée`
- `questionText` : « Et toi, comment montres-tu naturellement ton attention aux autres ? »
- `optionText` : « J'ai mille petites attentions au quotidien »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_GIVE_MICRO_ATTENTIONS` · `evidence_role` `primary`
- `retainedInformation` : « donne par les micro-attentions »

### Option `35` — « J'aime faire des surprises »

- `optionRef` : `35` · `questionCode` : `qe` · `domain` : `attention donnée`
- `questionText` : « Et toi, comment montres-tu naturellement ton attention aux autres ? »
- `optionText` : « J'aime faire des surprises »
- `status` : `ACTIF`
- `affectionLanguage` :
    - `AFFECTION_GIVE_SURPRISE` · `evidence_role` `primary`
- `retainedInformation` : « donne par les surprises »


## Q5 — « Quand je recharge mes batteries… »

### Option `36` — « J'ai besoin de moments seul(e) »

- `optionRef` : `36` · `questionCode` : `q5` · `domain` : `énergie sociale`
- `questionText` : « Quand je recharge mes batteries… »
- `optionText` : « J'ai besoin de moments seul(e) »
- `status` : `ACTIF`
- `profileEvidences` :
    - `SOCIAL_ENERGY` · `value` 0 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
- `retainedInformation` : « recharge par solitude »

### Option `37` — « Je préfère les petits groupes »

- `optionRef` : `37` · `questionCode` : `q5` · `domain` : `énergie sociale`
- `questionText` : « Quand je recharge mes batteries… »
- `optionText` : « Je préfère les petits groupes »
- `status` : `ACTIF`
- `profileEvidences` :
    - `SOCIAL_ENERGY` · `value` 1 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
- `retainedInformation` : « recharge en petit comité »

### Option `38` — « Ça dépend des jours »

- `optionRef` : `38` · `questionCode` : `q5` · `domain` : `énergie sociale`
- `questionText` : « Quand je recharge mes batteries… »
- `optionText` : « Ça dépend des jours »
- `status` : `ACTIF`
- `contextDependent` : vraie réponse, **aucune evidence** — corrigé le 7 octobre 2026
- `retainedInformation` : « énergie variable selon les jours »

### Option `39` — « J'aime être entouré(e) »

- `optionRef` : `39` · `questionCode` : `q5` · `domain` : `énergie sociale`
- `questionText` : « Quand je recharge mes batteries… »
- `optionText` : « J'aime être entouré(e) »
- `status` : `ACTIF`
- `profileEvidences` :
    - `SOCIAL_ENERGY` · `value` 3 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
- `retainedInformation` : « recharge par lien social »

### Option `40` — « Plus c'est animé, mieux c'est »

- `optionRef` : `40` · `questionCode` : `q5` · `domain` : `énergie sociale`
- `questionText` : « Quand je recharge mes batteries… »
- `optionText` : « Plus c'est animé, mieux c'est »
- `status` : `ACTIF`
- `profileEvidences` :
    - `SOCIAL_ENERGY` · `value` 4 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
- `retainedInformation` : « recharge par stimulation »


## Q6 — « Quand je suis stressé(e), j'ai tendance à… »

### Option `41` — « Garder pour moi, faire bonne figure »

- `optionRef` : `41` · `questionCode` : `q6` · `domain` : `stress`
- `questionText` : « Quand je suis stressé(e), j'ai tendance à… »
- `optionText` : « Garder pour moi, faire bonne figure »
- `status` : `ACTIF`
- `behavior` : `context` `stress_response` · `pattern` `internalize`
- `retainedInformation` : « sous stress, intériorise »

### Option `42` — « Me retirer, avoir besoin de calme »

- `optionRef` : `42` · `questionCode` : `q6` · `domain` : `stress`
- `questionText` : « Quand je suis stressé(e), j'ai tendance à… »
- `optionText` : « Me retirer, avoir besoin de calme »
- `status` : `ACTIF`
- `needs` : `NEED_RHYTHM_RESPECT`
- `behavior` : `context` `stress_response` · `pattern` `withdraw_seek_calm`
- `retainedInformation` : « sous stress, se retire — besoin de calme »

### Option `43` — « En parler, me confier »

- `optionRef` : `43` · `questionCode` : `q6` · `domain` : `stress`
- `questionText` : « Quand je suis stressé(e), j'ai tendance à… »
- `optionText` : « En parler, me confier »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_RELATIONALITY` · `value` +1 · `evidence_role` `secondary` · `context` `stress` → `LOCAL/CONTEXTUAL`
- `needs` : `NEED_SUPPORT`
- `behavior` : `context` `stress_response` · `pattern` `confide`
- `retainedInformation` : « sous stress, se confie »

### Option `44` — « Agir, me mettre en mouvement »

- `optionRef` : `44` · `questionCode` : `q6` · `domain` : `stress`
- `questionText` : « Quand je suis stressé(e), j'ai tendance à… »
- `optionText` : « Agir, me mettre en mouvement »
- `status` : `ACTIF`
- `behavior` : `context` `stress_response` · `pattern` `take_action`
- `retainedInformation` : « sous stress, agit »

### Option `45` — « Chercher à contrôler ce que je peux »

- `optionRef` : `45` · `questionCode` : `q6` · `domain` : `stress`
- `questionText` : « Quand je suis stressé(e), j'ai tendance à… »
- `optionText` : « Chercher à contrôler ce que je peux »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_MASTERY` · `value` +2 · `evidence_role` `secondary` · `context` `stress` → `LOCAL/CONTEXTUAL`
- `behavior` : `context` `stress_response` · `pattern` `regain_control`
- `retainedInformation` : « sous stress, cherche à reprendre la main »
- *Retiré en V12 : `NEED_REASSURANCE`. Ne démontre pas un besoin émotionnel de réassurance : décrit une réaction sous stress. L'information passe en BEHAVIOR, elle n'est pas supprimée.*


## Q7 — « Face à un désaccord, je… »

### Option `46` — « En parle directement »

- `optionRef` : `46` · `questionCode` : `q7` · `domain` : `conflit`
- `questionText` : « Face à un désaccord, je… »
- `optionText` : « En parle directement »
- `status` : `ACTIF`
- `behavior` : `context` `conflict_response` · `pattern` `address_directly`
- `retainedInformation` : « conflit, aborde directement »

### Option `47` — « Ai besoin de temps avant d'en parler »

- `optionRef` : `47` · `questionCode` : `q7` · `domain` : `conflit`
- `questionText` : « Face à un désaccord, je… »
- `optionText` : « Ai besoin de temps avant d'en parler »
- `status` : `ACTIF`
- `needs` : `NEED_RHYTHM_RESPECT`
- `behavior` : `context` `conflict_response` · `pattern` `pause_before_responding`
- `retainedInformation` : « conflit, besoin de temps avant d'en parler »

### Option `48` — « Évite le conflit autant que possible »

- `optionRef` : `48` · `questionCode` : `q7` · `domain` : `conflit`
- `questionText` : « Face à un désaccord, je… »
- `optionText` : « Évite le conflit autant que possible »
- `status` : `ACTIF`
- `behavior` : `context` `conflict_response` · `pattern` `avoid_conflict`
- `retainedInformation` : « évitement du conflit »

### Option `49` — « Dédramatise avec l'humour »

- `optionRef` : `49` · `questionCode` : `q7` · `domain` : `conflit`
- `questionText` : « Face à un désaccord, je… »
- `optionText` : « Dédramatise avec l'humour »
- `status` : `ACTIF`
- `behavior` : `context` `conflict_response` · `pattern` `use_humor_to_defuse`
- `retainedInformation` : « utilise l'humour dans le conflit »
- *Retiré en V12 : `NEED_LIGHTNESS`. Une stratégie de gestion du désaccord n'est pas un besoin de légèreté. L'information passe en BEHAVIOR.*

### Option `50` — « Écris plus facilement que je ne parle »

- `optionRef` : `50` · `questionCode` : `q7` · `domain` : `conflit`
- `questionText` : « Face à un désaccord, je… »
- `optionText` : « Écris plus facilement que je ne parle »
- `status` : `ACTIF`
- `behavior` : `context` `conflict_response` · `pattern` `prefers_writing`
- `retainedInformation` : « préfère l'écrit en situation de conflit »


## Q8 — « Dans une relation, ce dont j'ai le plus besoin… »

### Option `51` — « De stabilité et de constance »

- `optionRef` : `51` · `questionCode` : `q8` · `domain` : `relation`
- `questionText` : « Dans une relation, ce dont j'ai le plus besoin… »
- `optionText` : « De stabilité et de constance »
- `status` : `ACTIF`
- `needs` : `NEED_REASSURANCE` · `NEED_TRUST`
- `retainedInformation` : « besoin relationnel de stabilité, constance, fiabilité »

### Option `52` — « De liberté et d'espace »

- `optionRef` : `52` · `questionCode` : `q8` · `domain` : `relation`
- `questionText` : « Dans une relation, ce dont j'ai le plus besoin… »
- `optionText` : « De liberté et d'espace »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_AUTONOMY` · `value` +2 · `evidence_role` `primary` · `context` `relationship` → `LOCAL/CONTEXTUAL`
- `needs` : `NEED_FREEDOM` · `NEED_RHYTHM_RESPECT`
- `retainedInformation` : « liberté et espace relationnel »

### Option `53` — « De profondeur et d'échanges vrais »

- `optionRef` : `53` · `questionCode` : `q8` · `domain` : `relation`
- `questionText` : « Dans une relation, ce dont j'ai le plus besoin… »
- `optionText` : « De profondeur et d'échanges vrais »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_RELATIONALITY` · `value` +2 · `evidence_role` `primary` · `context` `relationship` → `LOCAL/CONTEXTUAL`
    - `IMPORTANCE_AUTHENTICITY` · `value` +1 · `evidence_role` `primary` · `context` `relationship` → `LOCAL/CONTEXTUAL`
- `needs` : `NEED_CONNECTION`
- `retainedInformation` : « profondeur et échanges vrais »

### Option `54` — « De légèreté et de rire »

- `optionRef` : `54` · `questionCode` : `q8` · `domain` : `relation`
- `questionText` : « Dans une relation, ce dont j'ai le plus besoin… »
- `optionText` : « De légèreté et de rire »
- `status` : `ACTIF`
- `needs` : `NEED_LIGHTNESS`
- `drivers` : `DRV_PLAYFULNESS`
- `retainedInformation` : « légèreté et rire »

### Option `55` — « De loyauté dans les moments difficiles »

- `optionRef` : `55` · `questionCode` : `q8` · `domain` : `relation`
- `questionText` : « Dans une relation, ce dont j'ai le plus besoin… »
- `optionText` : « De loyauté dans les moments difficiles »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_RELATIONALITY` · `value` +1 · `evidence_role` `primary` · `context` `relationship` → `LOCAL/CONTEXTUAL`
- `needs` : `NEED_TRUST` · `NEED_SUPPORT`
- `retainedInformation` : « loyauté dans la difficulté »

### Option `56` — « De respect de mon rythme »

- `optionRef` : `56` · `questionCode` : `q8` · `domain` : `relation`
- `questionText` : « Dans une relation, ce dont j'ai le plus besoin… »
- `optionText` : « De respect de mon rythme »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_AUTONOMY` · `value` +1 · `evidence_role` `primary` · `context` `relationship` → `LOCAL/CONTEXTUAL`
- `needs` : `NEED_RHYTHM_RESPECT`
- `retainedInformation` : « respect du rythme »


## Q9 — « Pour communiquer, je préfère… »

### Option `57` — « Aller droit au but »

- `optionRef` : `57` · `questionCode` : `q9` · `domain` : `communication`
- `questionText` : « Pour communiquer, je préfère… »
- `optionText` : « Aller droit au but »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.communication.style = direct`
- `retainedInformation` : « communication directe »

### Option `58` — « Parler de ce que je ressens »

- `optionRef` : `58` · `questionCode` : `q9` · `domain` : `communication`
- `questionText` : « Pour communiquer, je préfère… »
- `optionText` : « Parler de ce que je ressens »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.communication.style = expressive`
- `retainedInformation` : « communication centrée sur l'expression des ressentis »

### Option `59` — « Tout analyser en profondeur »

- `optionRef` : `59` · `questionCode` : `q9` · `domain` : `communication`
- `questionText` : « Pour communiquer, je préfère… »
- `optionText` : « Tout analyser en profondeur »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_REFLECTIVENESS` · `value` +2 · `evidence_role` `primary` · `context` `communication` → `LOCAL/CONTEXTUAL`
- `preferences` : `PREFERENCE.communication.style = analytical`
- `retainedInformation` : « communication analytique et approfondie »

### Option `60` — « Garder ça léger, avec humour »

- `optionRef` : `60` · `questionCode` : `q9` · `domain` : `communication`
- `questionText` : « Pour communiquer, je préfère… »
- `optionText` : « Garder ça léger, avec humour »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.communication.style = light_humorous`
- `retainedInformation` : « communication légère et humoristique »
- *Retiré en V12 : `DRV_PLAYFULNESS`. Un style de communication ne démontre pas que le playful est un moteur général de résonance. L'information passe en BEHAVIOR.*

### Option `61` — « Écrire plutôt que parler »

- `optionRef` : `61` · `questionCode` : `q9` · `domain` : `communication`
- `questionText` : « Pour communiquer, je préfère… »
- `optionText` : « Écrire plutôt que parler »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.communication.channel = written   (contexte self_expression · evidence de confirmation, poids non doublé)`
- `retainedInformation` : « canal écrit préféré »


## Q10 — « Pour mes grandes décisions, je… »

### Option `62` — « Analyse les pour et les contre »

- `optionRef` : `62` · `questionCode` : `q10` · `domain` : `décision`
- `questionText` : « Pour mes grandes décisions, je… »
- `optionText` : « Analyse les pour et les contre »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_REFLECTIVENESS` · `value` +1 · `evidence_role` `primary` · `context` `decision` → `LOCAL/CONTEXTUAL`
- `behavior` : `context` `decision_process` · `pattern` `weigh_pros_and_cons`
- `retainedInformation` : « décision rationnelle, analyse avantages-inconvénients »

### Option `63` — « Fais confiance à mon instinct »

- `optionRef` : `63` · `questionCode` : `q10` · `domain` : `décision`
- `questionText` : « Pour mes grandes décisions, je… »
- `optionText` : « Fais confiance à mon instinct »
- `status` : `ACTIF`
- `behavior` : `context` `decision_process` · `pattern` `trust_instinct`
- `retainedInformation` : « décision intuitive »

### Option `64` — « Demande l'avis des proches »

- `optionRef` : `64` · `questionCode` : `q10` · `domain` : `décision`
- `questionText` : « Pour mes grandes décisions, je… »
- `optionText` : « Demande l'avis des proches »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_RELATIONALITY` · `value` +1 · `evidence_role` `primary` · `context` `decision` → `LOCAL/CONTEXTUAL`
- `behavior` : `context` `decision_process` · `pattern` `consult_close_ones`
- `retainedInformation` : « décision consultative, avis des proches »

### Option `65` — « Fais des recherches approfondies »

- `optionRef` : `65` · `questionCode` : `q10` · `domain` : `décision`
- `questionText` : « Pour mes grandes décisions, je… »
- `optionText` : « Fais des recherches approfondies »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_REFLECTIVENESS` · `value` +2 · `evidence_role` `primary` · `context` `decision` → `LOCAL/CONTEXTUAL`
- `behavior` : `context` `decision_process` · `pattern` `research_thoroughly`
- `retainedInformation` : « recherches approfondies, décision documentée »

### Option `66` — « Attends que ce soit clair en moi »

- `optionRef` : `66` · `questionCode` : `q10` · `domain` : `décision`
- `questionText` : « Pour mes grandes décisions, je… »
- `optionText` : « Attends que ce soit clair en moi »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_REFLECTIVENESS` · `value` +1 · `evidence_role` `primary` · `context` `decision` → `LOCAL/CONTEXTUAL`
- `behavior` : `context` `decision_process` · `pattern` `wait_for_inner_clarity`
- `retainedInformation` : « décision par maturation »


## Q11 — « J'exprime mes émotions… »

### Option `67` — « Assez librement »

- `optionRef` : `67` · `questionCode` : `q11` · `domain` : `émotions`
- `questionText` : « J'exprime mes émotions… »
- `optionText` : « Assez librement »
- `status` : `ACTIF`
- `behavior` : `context` `emotional_expression` · `pattern` `openly`
- `retainedInformation` : « expression émotionnelle libre »

### Option `68` — « Avec quelques personnes de confiance »

- `optionRef` : `68` · `questionCode` : `q11` · `domain` : `émotions`
- `questionText` : « J'exprime mes émotions… »
- `optionText` : « Avec quelques personnes de confiance »
- `status` : `ACTIF`
- `behavior` : `context` `emotional_expression` · `pattern` `with_trusted_few`
- `retainedInformation` : « expression émotionnelle sélective, cercle de confiance »

### Option `69` — « Par mes actes plus que par mes mots »

- `optionRef` : `69` · `questionCode` : `q11` · `domain` : `émotions`
- `questionText` : « J'exprime mes émotions… »
- `optionText` : « Par mes actes plus que par mes mots »
- `status` : `ACTIF`
- `behavior` : `context` `emotional_expression` · `pattern` `through_actions`
- `retainedInformation` : « expression émotionnelle par les actes »

### Option `70` — « Rarement, je préfère garder ça pour moi »

- `optionRef` : `70` · `questionCode` : `q11` · `domain` : `émotions`
- `questionText` : « J'exprime mes émotions… »
- `optionText` : « Rarement, je préfère garder ça pour moi »
- `status` : `ACTIF`
- `behavior` : `context` `emotional_expression` · `pattern` `keeps_to_self`
- `retainedInformation` : « expression émotionnelle réservée »

### Option `71` — « Souvent après coup »

- `optionRef` : `71` · `questionCode` : `q11` · `domain` : `émotions`
- `questionText` : « J'exprime mes émotions… »
- `optionText` : « Souvent après coup »
- `status` : `ACTIF`
- `behavior` : `context` `emotional_expression` · `pattern` `delayed`
- `retainedInformation` : « expression émotionnelle différée, compréhension après coup »


## Q12 — « Quand quelqu'un m'invite ou m'offre quelque chose… »

### Option `72` — « N'importe quelle attention sincère me touche »

- `optionRef` : `72` · `questionCode` : `q12` · `domain` : `cadeau et invitation`
- `questionText` : « Quand quelqu'un m'invite ou m'offre quelque chose… »
- `optionText` : « N'importe quelle attention sincère me touche »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `profileEvidences` :
    - `IMPORTANCE_AUTHENTICITY` · `value` +2 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « la sincérité avant tout »

### Option `73` — « Quelque chose de bien choisi, même simple »

- `optionRef` : `73` · `questionCode` : `q12` · `domain` : `cadeau et invitation`
- `questionText` : « Quand quelqu'un m'invite ou m'offre quelque chose… »
- `optionText` : « Quelque chose de bien choisi, même simple »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `profileEvidences` :
    - `PROFILE_EXACTINGNESS` · `value` +1 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « justesse du choix »

### Option `74` — « Un certain niveau de qualité compte pour moi »

- `optionRef` : `74` · `questionCode` : `q12` · `domain` : `cadeau et invitation`
- `questionText` : « Quand quelqu'un m'invite ou m'offre quelque chose… »
- `optionText` : « Un certain niveau de qualité compte pour moi »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `profileEvidences` :
    - `PROFILE_EXACTINGNESS` · `value` +1 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « un niveau de qualité compte »

### Option `75` — « Les détails influencent beaucoup mon expérience »

- `optionRef` : `75` · `questionCode` : `q12` · `domain` : `cadeau et invitation`
- `questionText` : « Quand quelqu'un m'invite ou m'offre quelque chose… »
- `optionText` : « Les détails influencent beaucoup mon expérience »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `profileEvidences` :
    - `PROFILE_SENSITIVITY` · `value` +2 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « les détails pèsent sur l'expérience »

### Option `76` — « Pas de préférence, je n'y suis pas attaché(e) »

- `optionRef` : `76` · `questionCode` : `q12` · `domain` : `cadeau et invitation`
- `questionText` : « Quand quelqu'un m'invite ou m'offre quelque chose… »
- `optionText` : « Pas de préférence, je n'y suis pas attaché(e) »
- `status` : `REMOVED_FROM_ONBOARDING_CORE`
- `retainedInformation` : « faible exigence sur la forme »


## Q13 — « Pour les cadeaux, je préfère… »

### Option `77` — « Des expériences »

- `optionRef` : `77` · `questionCode` : `q13` · `domain` : `cadeau`
- `questionText` : « Pour les cadeaux, je préfère… »
- `optionText` : « Des expériences »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_EXPERIENCE` · `value` +2 · `evidence_role` `primary` · `context` `gift` → `LOCAL/CONTEXTUAL`
- `retainedInformation` : « préférence cadeaux-expériences »

### Option `78` — « Des objets à garder »

- `optionRef` : `78` · `questionCode` : `q13` · `domain` : `cadeau`
- `questionText` : « Pour les cadeaux, je préfère… »
- `optionText` : « Des objets à garder »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_OBJECT` · `value` +2 · `evidence_role` `primary` · `context` `gift` → `LOCAL/CONTEXTUAL`
- `retainedInformation` : « préférence cadeaux-objets »

### Option `79` — « Les deux me touchent »

- `optionRef` : `79` · `questionCode` : `q13` · `domain` : `cadeau`
- `questionText` : « Pour les cadeaux, je préfère… »
- `optionText` : « Les deux me touchent »
- `status` : `ACTIF`
- `retainedInformation` : *aucune*
- *« Les deux me touchent » est un non-choix. Aucun signal, aucune information conservée.*

### Option `80` — « Des choses utiles »

- `optionRef` : `80` · `questionCode` : `q13` · `domain` : `cadeau`
- `questionText` : « Pour les cadeaux, je préfère… »
- `optionText` : « Des choses utiles »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_FUNCTIONAL` · `value` +2 · `evidence_role` `primary` · `context` `gift` → `LOCAL/CONTEXTUAL`
    - `APPETENCE_OBJECT` · `value` +1 · `evidence_role` `primary` · `context` `gift` → `LOCAL/CONTEXTUAL`
- `drivers` : `DRV_UTILITY`
- `retainedInformation` : « préférence cadeau utile »

### Option `81` — « Des choses symboliques »

- `optionRef` : `81` · `questionCode` : `q13` · `domain` : `cadeau`
- `questionText` : « Pour les cadeaux, je préfère… »
- `optionText` : « Des choses symboliques »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_OBJECT` · `value` +1 · `evidence_role` `primary` · `context` `gift` → `LOCAL/CONTEXTUAL`
- `drivers` : `DRV_SYMBOLISM`
- `retainedInformation` : « préférence pour les cadeaux symboliques »


## Q14 — « Pour les cadeaux matériels, ce qui me touche le plus… »

### Option `82` — « Un objet utile et bien pensé »

- `optionRef` : `82` · `questionCode` : `q14` · `domain` : `cadeau matériel`
- `questionText` : « Pour les cadeaux matériels, ce qui me touche le plus… »
- `optionText` : « Un objet utile et bien pensé »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_FUNCTIONAL` · `value` +2 · `evidence_role` `primary` · `context` `gift.material` → `LOCAL/CONTEXTUAL`
    - `APPETENCE_OBJECT` · `value` +1 · `evidence_role` `primary` · `context` `gift.material` → `LOCAL/CONTEXTUAL`
- `drivers` : `DRV_UTILITY`
- `retainedInformation` : « objet utile, intelligence d'usage »

### Option `83` — « Quelque chose qui montre qu'on m'a écouté(e) »

- `optionRef` : `83` · `questionCode` : `q14` · `domain` : `cadeau matériel`
- `questionText` : « Pour les cadeaux matériels, ce qui me touche le plus… »
- `optionText` : « Quelque chose qui montre qu'on m'a écouté(e) »
- `status` : `ACTIF`
- `drivers` : `DRV_ATTENTIVENESS`
- `retainedInformation` : « cadeau fondé sur l'écoute »

### Option `84` — « Un objet beau et de qualité »

- `optionRef` : `84` · `questionCode` : `q14` · `domain` : `cadeau matériel`
- `questionText` : « Pour les cadeaux matériels, ce qui me touche le plus… »
- `optionText` : « Un objet beau et de qualité »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_AESTHETIC` · `value` +2 · `evidence_role` `primary` · `context` `gift.material` → `LOCAL/CONTEXTUAL`
    - `PROFILE_EXACTINGNESS` · `value` +1 · `evidence_role` `primary` · `context` `gift.material` → `LOCAL/CONTEXTUAL`
    - `APPETENCE_OBJECT` · `value` +1 · `evidence_role` `primary` · `context` `gift.material` → `LOCAL/CONTEXTUAL`
- `drivers` : `DRV_AESTHETIC` · `DRV_QUALITY`
- `retainedInformation` : « beau et qualité »

### Option `85` — « Un objet de valeur symbolique »

- `optionRef` : `85` · `questionCode` : `q14` · `domain` : `cadeau matériel`
- `questionText` : « Pour les cadeaux matériels, ce qui me touche le plus… »
- `optionText` : « Un objet de valeur symbolique »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_OBJECT` · `value` +1 · `evidence_role` `primary` · `context` `gift.material` → `LOCAL/CONTEXTUAL`
- `drivers` : `DRV_SYMBOLISM`
- `retainedInformation` : « valeur symbolique »

### Option `86` — « Je préfère les expériences aux objets »

- `optionRef` : `86` · `questionCode` : `q14` · `domain` : `cadeau matériel`
- `questionText` : « Pour les cadeaux matériels, ce qui me touche le plus… »
- `optionText` : « Je préfère les expériences aux objets »
- `status` : `ACTIF`
- `profileEvidences` :
    - `APPETENCE_EXPERIENCE` · `value` +2 · `evidence_role` `primary` · `context` `gift.material` → `LOCAL/CONTEXTUAL`
    - `APPETENCE_OBJECT` · `value` -1 · `evidence_role` `primary` · `context` `gift.material` → `LOCAL/CONTEXTUAL`
- `retainedInformation` : « préférence comparative explicite : expérience avant objet »


## Q15 — « Ma relation à la nourriture et aux restaurants… »

### Option `87` — « J'aime manger partout »

- `optionRef` : `87` · `questionCode` : `q15` · `domain` : `table`
- `questionText` : « Ma relation à la nourriture et aux restaurants… »
- `optionText` : « J'aime manger partout »
- `status` : `MOVED_TO_DISCOVERY_FOOD` · `destination` : `Discovery Food`
- `retainedInformation` : « ouverte sur différents types de tables »

### Option `88` — « Je suis gourmand(e) »

- `optionRef` : `88` · `questionCode` : `q15` · `domain` : `table`
- `questionText` : « Ma relation à la nourriture et aux restaurants… »
- `optionText` : « Je suis gourmand(e) »
- `status` : `MOVED_TO_DISCOVERY_FOOD` · `destination` : `Discovery Food`
- `retainedInformation` : « gourmandise »

### Option `89` — « J'adore les belles tables »

- `optionRef` : `89` · `questionCode` : `q15` · `domain` : `table`
- `questionText` : « Ma relation à la nourriture et aux restaurants… »
- `optionText` : « J'adore les belles tables »
- `status` : `MOVED_TO_DISCOVERY_FOOD` · `destination` : `Discovery Food`
- `profileEvidences` :
    - `IMPORTANCE_AESTHETIC` · `value` +1 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « aime les belles tables »

### Option `90` — « La gastronomie est une passion »

- `optionRef` : `90` · `questionCode` : `q15` · `domain` : `table`
- `questionText` : « Ma relation à la nourriture et aux restaurants… »
- `optionText` : « La gastronomie est une passion »
- `status` : `MOVED_TO_DISCOVERY_FOOD` · `destination` : `Discovery Food`
- `profileEvidences` :
    - `PROFILE_INTENSITY` · `value` +1 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « gastronomie = passion · INTEREST food_gastronomy, interest_level = passion · contexte food_gastronomy »

### Option `91` — « Je mange pour vivre »

- `optionRef` : `91` · `questionCode` : `q15` · `domain` : `table`
- `questionText` : « Ma relation à la nourriture et aux restaurants… »
- `optionText` : « Je mange pour vivre »
- `status` : `MOVED_TO_DISCOVERY_FOOD` · `destination` : `Discovery Food`
- `retainedInformation` : « faible intérêt pour la gastronomie »


## Q16 — « Si on m'offre un week-end, ce qui compte le plus… »

### Option `92` — « La destination avant tout »

- `optionRef` : `92` · `questionCode` : `q16` · `domain` : `voyage`
- `questionText` : « Si on m'offre un week-end, ce qui compte le plus… »
- `optionText` : « La destination avant tout »
- `status` : `MOVED_TO_DISCOVERY_VOYAGE` · `destination` : `Discovery Voyage`
- `retainedInformation` : « destination prioritaire »

### Option `93` — « Un hôtel confortable et bien situé »

- `optionRef` : `93` · `questionCode` : `q16` · `domain` : `voyage`
- `questionText` : « Si on m'offre un week-end, ce qui compte le plus… »
- `optionText` : « Un hôtel confortable et bien situé »
- `status` : `MOVED_TO_DISCOVERY_VOYAGE` · `destination` : `Discovery Voyage`
- `profileEvidences` :
    - `IMPORTANCE_FUNCTIONAL` · `value` +2 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « confort et emplacement »

### Option `94` — « Le charme et l'authenticité »

- `optionRef` : `94` · `questionCode` : `q16` · `domain` : `voyage`
- `questionText` : « Si on m'offre un week-end, ce qui compte le plus… »
- `optionText` : « Le charme et l'authenticité »
- `status` : `MOVED_TO_DISCOVERY_VOYAGE` · `destination` : `Discovery Voyage`
- `profileEvidences` :
    - `IMPORTANCE_AUTHENTICITY` · `value` +2 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
    - `IMPORTANCE_AESTHETIC` · `value` +1 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « charme et authenticité »

### Option `95` — « Le luxe et le service »

- `optionRef` : `95` · `questionCode` : `q16` · `domain` : `voyage`
- `questionText` : « Si on m'offre un week-end, ce qui compte le plus… »
- `optionText` : « Le luxe et le service »
- `status` : `MOVED_TO_DISCOVERY_VOYAGE` · `destination` : `Discovery Voyage`
- `profileEvidences` :
    - `APPETENCE_PREMIUM` · `value` +2 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « luxe et qualité de service »

### Option `96` — « L'important, c'est d'être ensemble »

- `optionRef` : `96` · `questionCode` : `q16` · `domain` : `voyage`
- `questionText` : « Si on m'offre un week-end, ce qui compte le plus… »
- `optionText` : « L'important, c'est d'être ensemble »
- `status` : `MOVED_TO_DISCOVERY_VOYAGE` · `destination` : `Discovery Voyage`
- `profileEvidences` :
    - `PROFILE_RELATIONALITY` · `value` +2 · `evidence_role` `primary` · `context` `GLOBAL` → `—`
- `retainedInformation` : « la compagnie passe avant le lieu »


## Q4A — « Mon rapport au temps et à l'organisation… »

### Option `97` — « J'anticipe et je planifie à l'avance »

- `optionRef` : `97` · `questionCode` : `q4a` · `domain` : `temps et organisation`
- `questionText` : « Mon rapport au temps et à l'organisation… »
- `optionText` : « J'anticipe et je planifie à l'avance »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_STRUCTURE` · `value` +2 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
- `retainedInformation` : « anticipe et planifie »

### Option `98` — « Je gère au fil de l'eau »

- `optionRef` : `98` · `questionCode` : `q4a` · `domain` : `temps et organisation`
- `questionText` : « Mon rapport au temps et à l'organisation… »
- `optionText` : « Je gère au fil de l'eau »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_STRUCTURE` · `value` -1 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
- `retainedInformation` : « fonctionne au fil de l'eau »

### Option `99` — « La ponctualité compte beaucoup pour moi »

- `optionRef` : `99` · `questionCode` : `q4a` · `domain` : `temps et organisation`
- `questionText` : « Mon rapport au temps et à l'organisation… »
- `optionText` : « La ponctualité compte beaucoup pour moi »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.relational.punctuality = high   ·   context = relationnel`
- `retainedInformation` : « importance forte de la ponctualité »

### Option `100` — « Je suis souvent un peu en retard, sans malice »

- `optionRef` : `100` · `questionCode` : `q4a` · `domain` : `temps et organisation`
- `questionText` : « Mon rapport au temps et à l'organisation… »
- `optionText` : « Je suis souvent un peu en retard, sans malice »
- `status` : `ACTIF`
- `facts` : `fact_type = habit   ·   value = « souvent un peu en retard, sans malice »   ·   user_confirmed = true   ·   implication : ne pas bâtir une attention dont la réussite dépend de sa ponctualité`
- `retainedInformation` : « ponctualité personnelle faible »

### Option `101` — « La charge mentale m'épuise vite »

- `optionRef` : `101` · `questionCode` : `q4a` · `domain` : `temps et organisation`
- `questionText` : « Mon rapport au temps et à l'organisation… »
- `optionText` : « La charge mentale m'épuise vite »
- `status` : `ACTIF`
- `facts` : `fact_type = functional_impact   ·   subject = mental_load   ·   relation = causes   ·   effect = rapid_exhaustion   ·   user_confirmed = true   ·   implication : réduire le nombre de décisions, coordinations et tâches nécessaires. Ne produit PAS NEED_RELIEF.`
- `retainedInformation` : « sensibilité à la charge mentale, coût énergétique de la charge mentale »


## Q4B — « Dans ce que je choisis ou apprécie, qu'est-ce qui te ressemble le plus ? »

### Option `102` — « La qualité compte, même si je n'en parle pas »

- `optionRef` : `102` · `questionCode` : `q4b` · `domain` : `qualité et standing`
- `questionText` : « Dans ce que je choisis ou apprécie, qu'est-ce qui te ressemble le plus ? »
- `optionText` : « La qualité compte, même si je n'en parle pas »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_EXACTINGNESS` · `value` +1 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
- `drivers` : `DRV_QUALITY`
- `retainedInformation` : « importance discrète de la qualité »

### Option `103` — « Je préfère la simplicité authentique au luxe »

- `optionRef` : `103` · `questionCode` : `q4b` · `domain` : `qualité et standing`
- `questionText` : « Dans ce que je choisis ou apprécie, qu'est-ce qui te ressemble le plus ? »
- `optionText` : « Je préfère la simplicité authentique au luxe »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_AUTHENTICITY` · `value` +2 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
- `drivers` : `DRV_SIMPLICITY` · `DRV_AUTHENTICITY`
- `retainedInformation` : « simplicité authentique »

### Option `104` — « J'aime le beau et le raffinement »

- `optionRef` : `104` · `questionCode` : `q4b` · `domain` : `qualité et standing`
- `questionText` : « Dans ce que je choisis ou apprécie, qu'est-ce qui te ressemble le plus ? »
- `optionText` : « J'aime le beau et le raffinement »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_AESTHETIC` · `value` +2 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
    - `PROFILE_SENSITIVITY.aesthetic` · `value` +1 · `evidence_role` `primary` · `context` `GLOBAL` → `GLOBAL_DIRECT`
- `drivers` : `DRV_AESTHETIC`
- `retainedInformation` : « beau et raffinement esthétique »

### Option `105` — « Le prix m'importe peu, c'est l'intention »

- `optionRef` : `105` · `questionCode` : `q4b` · `domain` : `qualité et standing`
- `questionText` : « Dans ce que je choisis ou apprécie, qu'est-ce qui te ressemble le plus ? »
- `optionText` : « Le prix m'importe peu, c'est l'intention »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.gift.value_basis = intention_over_price`
- `retainedInformation` : « le prix n'est pas le critère, importance de l'intention »
- *Retiré en V13 : `IMPORTANCE_AUTHENTICITY`. « Le prix m'importe peu, c'est l'intention » n'établit ni attentiveness ni authenticity : la réponse exprime que la valeur intentionnelle et relationnelle du geste prime sur sa valeur monétaire. Aucun PROFILE, aucun DRIVER.*

### Option `106` — « Je suis sensible à certaines marques ou maisons »

- `optionRef` : `106` · `questionCode` : `q4b` · `domain` : `qualité et standing`
- `questionText` : « Dans ce que je choisis ou apprécie, qu'est-ce qui te ressemble le plus ? »
- `optionText` : « Je suis sensible à certaines marques ou maisons »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.brands.sensitivity = positive   ·   opens_branch = brands   ·   trigger Discovery « lesquelles ? » → ENTITY_BRAND avec relation LOVE | LIKE`
- `retainedInformation` : « sensibilité déclarée à certaines marques ou maisons »

### Option `106b` — « Je suis attiré(e) par les lieux ou expériences d'exception »

- `optionRef` : `106b` · `questionCode` : `q4b` · `domain` : `qualité et standing`
- `questionText` : « Dans ce que je choisis ou apprécie, qu'est-ce qui te ressemble le plus ? »
- `optionText` : « Je suis attiré(e) par les lieux ou expériences d'exception »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.experience.tier = exceptional   ·   confidence = low, à préciser par le Discovery`
- `retainedInformation` : « attrait pour les lieux ou expériences d'exception »


## Q4C — « Quand on organise quelque chose pour moi… »

### Option `107` — « J'aime tout savoir à l'avance »

- `optionRef` : `107` · `questionCode` : `q4c` · `domain` : `organisation d'une surprise`
- `questionText` : « Quand on organise quelque chose pour moi… »
- `optionText` : « J'aime tout savoir à l'avance »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_STRUCTURE` · `value` +2 · `evidence_role` `primary` · `context` `organised_for_me` → `LOCAL/CONTEXTUAL`
- `preferences` : `PREFERENCE.organised_for_me.surprise_level = none`
- `retainedInformation` : « fort besoin d'information préalable quand quelqu'un organise pour soi »

### Option `108` — « J'aime garder une part de surprise »

- `optionRef` : `108` · `questionCode` : `q4c` · `domain` : `organisation d'une surprise`
- `questionText` : « Quand on organise quelque chose pour moi… »
- `optionText` : « J'aime garder une part de surprise »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.organised_for_me.surprise_level = partial`
- `retainedInformation` : « surprise cadrée, partielle »
- *Retiré en V14 : `APPETENCE_SPONTANEITY +1 pri`. Quelqu'un d'autre organise. Vouloir ne pas tout savoir d'un événement qu'on prépare pour elle n'est pas aimer improviser soi-même. Sans cette PREFERENCE la ligne ne produirait plus rien.*

### Option `109` — « J'aime être totalement surpris(e) »

- `optionRef` : `109` · `questionCode` : `q4c` · `domain` : `organisation d'une surprise`
- `questionText` : « Quand on organise quelque chose pour moi… »
- `optionText` : « J'aime être totalement surpris(e) »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.organised_for_me.surprise_level = full`
- `retainedInformation` : « surprise totale appréciée »
- *Retiré en V14 : `APPETENCE_SPONTANEITY +2 pri`. Idem, au degré maximal. Même raison, même conséquence.*

### Option `110` — « J'ai besoin de valider les détails »

- `optionRef` : `110` · `questionCode` : `q4c` · `domain` : `organisation d'une surprise`
- `questionText` : « Quand on organise quelque chose pour moi… »
- `optionText` : « J'ai besoin de valider les détails »
- `status` : `ACTIF`
- `profileEvidences` :
    - `IMPORTANCE_MASTERY` · `value` +2 · `evidence_role` `primary` · `context` `organised_for_me` → `LOCAL/CONTEXTUAL`
- `retainedInformation` : « besoin de valider personnellement les paramètres »

### Option `111` — « Je m'adapte facilement »

- `optionRef` : `111` · `questionCode` : `q4c` · `domain` : `organisation d'une surprise`
- `questionText` : « Quand on organise quelque chose pour moi… »
- `optionText` : « Je m'adapte facilement »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_ADAPTABILITY` · `value` +2 · `evidence_role` `primary` · `context` `organised_for_me` → `LOCAL/CONTEXTUAL`
- `retainedInformation` : « flexibilité, adaptation facile »


## Q4D — « Pour rester en contact, je préfère… »

### Option `112` — « Un appel téléphonique »

- `optionRef` : `112` · `questionCode` : `q4d` · `domain` : `canal de contact`
- `questionText` : « Pour rester en contact, je préfère… »
- `optionText` : « Un appel téléphonique »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.communication.channel = call   ·   stability = stable`
- `retainedInformation` : « canal de contact = appel »

### Option `113` — « Un message écrit »

- `optionRef` : `113` · `questionCode` : `q4d` · `domain` : `canal de contact`
- `questionText` : « Pour rester en contact, je préfère… »
- `optionText` : « Un message écrit »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.communication.channel = written   ·   stability = stable`
- `retainedInformation` : « canal de contact = écrit »

### Option `114` — « Un vocal »

- `optionRef` : `114` · `questionCode` : `q4d` · `domain` : `canal de contact`
- `questionText` : « Pour rester en contact, je préfère… »
- `optionText` : « Un vocal »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.communication.channel = voice   ·   stability = stable`
- `retainedInformation` : « canal de contact = vocal »

### Option `115` — « En personne, rien ne remplace »

- `optionRef` : `115` · `questionCode` : `q4d` · `domain` : `canal de contact`
- `questionText` : « Pour rester en contact, je préfère… »
- `optionText` : « En personne, rien ne remplace »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.communication.channel = in_person   ·   stability = stable`
- `retainedInformation` : « canal de contact = présentiel »

### Option `116` — « Peu importe, selon le moment »

- `optionRef` : `116` · `questionCode` : `q4d` · `domain` : `canal de contact`
- `questionText` : « Pour rester en contact, je préfère… »
- `optionText` : « Peu importe, selon le moment »
- `status` : `ACTIF`
- `preferences` : `PREFERENCE.communication.channel = flexible   ·   stability = contextual`
- `retainedInformation` : « canal indifférent, selon le moment »


## Q18 — « Le type de surprise que je détesterais… »

### Option `117` — « Une surprise devant beaucoup de monde »

- `optionRef` : `117` · `questionCode` : `q18` · `domain` : `surprise`
- `questionText` : « Le type de surprise que je détesterais… »
- `optionText` : « Une surprise devant beaucoup de monde »
- `status` : `ACTIF`
- `guardrails` :
    - `GRD_PUBLIC_EXPOSURE` · `severity` `HARD` · `guardrailScope` `selection`
    - *Le stem de Q18 demande ce que la personne détesterait. Une option cochée sous ce stem est une evidence de refus, et la formulation de l'option n'apporte aucune nuance. Ne pas proposer d'attention exposant publiquement.*
- `retainedInformation` : « éviter la surprise publique »

### Option `118` — « Une surprise qui change mon planning »

- `optionRef` : `118` · `questionCode` : `q18` · `domain` : `surprise`
- `questionText` : « Le type de surprise que je détesterais… »
- `optionText` : « Une surprise qui change mon planning »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_STRUCTURE` · `value` +1 · `evidence_role` `secondary` · `context` `surprise` → `LOCAL/CONTEXTUAL`
- `guardrails` :
    - `GRD_SCHEDULE_DISRUPTION` · `severity` `HARD` · `guardrailScope` `selection`
    - *Même stem, aucune nuance dans l'option. Ne pas proposer d'attention qui bouleverse son planning.*
- `retainedInformation` : « ne pas bouleverser le planning »

### Option `119` — « Une surprise trop intime ou trop intense »

- `optionRef` : `119` · `questionCode` : `q18` · `domain` : `surprise`
- `questionText` : « Le type de surprise que je détesterais… »
- `optionText` : « Une surprise trop intime ou trop intense »
- `status` : `ACTIF`
- `guardrails` :
    - `GRD_TOO_INTIMATE` · `severity` `HARD` · `guardrailScope` `selection`
    - `GRD_SENTIMENTAL_OVERLOAD` · `severity` `HARD` · `guardrailScope` `selection`
    - *Même stem, mais la formulation NUANCE explicitement : « TROP intime ou TROP intense ». Ce n'est pas l'intimité qui est refusée, c'est son excès. La contrainte porte donc sur un degré, pas sur une catégorie : une attention intime n'est pas éliminée, une attention dont l'intensité émotionnelle dépasse un seuil l'est. C'est la seule des quatre dont la formulation impose un seuil plutôt qu'une exclusion de catégorie.*
- `retainedInformation` : « éviter la surprise trop intime ou émotionnellement intense »

### Option `120` — « Une surprise mal organisée »

- `optionRef` : `120` · `questionCode` : `q18` · `domain` : `surprise`
- `questionText` : « Le type de surprise que je détesterais… »
- `optionText` : « Une surprise mal organisée »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_EXACTINGNESS` · `value` +1 · `evidence_role` `secondary` · `context` `surprise` → `LOCAL/CONTEXTUAL`
- `guardrails` :
    - `GRD_POOR_EXECUTION` · `severity` `HARD` · `guardrailScope` `execution`
    - *Severity HARD, scope execution. Ne pas éliminer une surprise parce que c'est une surprise ; éliminer ou pénaliser une option si Candice n'est pas suffisamment certaine qu'elle peut être correctement exécutée. Le « — FORT » de la V10 sort du code : il disait la force de l'evidence, pas la sévérité de la contrainte.*
- `retainedInformation` : « mauvaise exécution = risque fort d'échec »

### Option `121` — « Je suis plutôt partant(e) pour tout »

- `optionRef` : `121` · `questionCode` : `q18` · `domain` : `surprise`
- `questionText` : « Le type de surprise que je détesterais… »
- `optionText` : « Je suis plutôt partant(e) pour tout »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_ADAPTABILITY` · `value` +1 · `evidence_role` `primary` · `context` `surprise` → `LOCAL/CONTEXTUAL`
- `retainedInformation` : « forte ouverture aux formats de surprise »
- *Retiré en V14 : `APPETENCE_SPONTANEITY +2 pri`. « Partant pour tout » dit qu'elle accepte ce qu'on lui propose, pas qu'elle décide au dernier moment. L'absence de guardrail sur cette ligne n'est PAS une information : absence de guardrail = absence d'evidence, donc rien à stocker. C'était une erreur de ma part.*


## Q19 — « Ce qui me blesse le plus dans une relation… »

### Option `122` — « Ne pas être écouté(e) »

- `optionRef` : `122` · `questionCode` : `q19` · `domain` : `relation`
- `questionText` : « Ce qui me blesse le plus dans une relation… »
- `optionText` : « Ne pas être écouté(e) »
- `status` : `ACTIF`
- `needs` : `NEED_SEEN_UNDERSTOOD`
- `retainedInformation` : « blessure liée au manque d'écoute »

### Option `123` — « Être oublié(e) ou mis(e) de côté »

- `optionRef` : `123` · `questionCode` : `q19` · `domain` : `relation`
- `questionText` : « Ce qui me blesse le plus dans une relation… »
- `optionText` : « Être oublié(e) ou mis(e) de côté »
- `status` : `ACTIF`
- `needs` : `NEED_LOVED_MATTER` · `NEED_CHOSEN`
- `retainedInformation` : « blessure liée à l'oubli ou l'exclusion »

### Option `124` — « Être envahi(e) ou contrôlé(e) »

- `optionRef` : `124` · `questionCode` : `q19` · `domain` : `relation`
- `questionText` : « Ce qui me blesse le plus dans une relation… »
- `optionText` : « Être envahi(e) ou contrôlé(e) »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_AUTONOMY` · `value` +2 · `evidence_role` `primary` · `context` `relationship` → `LOCAL/CONTEXTUAL`
- `needs` : `NEED_FREEDOM` · `NEED_RHYTHM_RESPECT`
- `retainedInformation` : « blessure liée à l'intrusion ou au contrôle »

### Option `125` — « Les reproches ou critiques répétées »

- `optionRef` : `125` · `questionCode` : `q19` · `domain` : `relation`
- `questionText` : « Ce qui me blesse le plus dans une relation… »
- `optionText` : « Les reproches ou critiques répétées »
- `status` : `ACTIF`
- `needs` : `NEED_ACCEPTANCE`
- `retainedInformation` : « blessure liée aux critiques répétées »

### Option `126` — « Le manque de fiabilité »

- `optionRef` : `126` · `questionCode` : `q19` · `domain` : `relation`
- `questionText` : « Ce qui me blesse le plus dans une relation… »
- `optionText` : « Le manque de fiabilité »
- `status` : `ACTIF`
- `needs` : `NEED_TRUST` · `NEED_REASSURANCE` (secondary)
- `retainedInformation` : « blessure liée à l'inconstance, besoin de fiabilité chez l'autre »

### Option `127` — « Le manque de profondeur »

- `optionRef` : `127` · `questionCode` : `q19` · `domain` : `relation`
- `questionText` : « Ce qui me blesse le plus dans une relation… »
- `optionText` : « Le manque de profondeur »
- `status` : `ACTIF`
- `profileEvidences` :
    - `PROFILE_RELATIONALITY` · `value` +1 · `evidence_role` `primary` · `context` `relationship` → `LOCAL/CONTEXTUAL`
- `needs` : `NEED_CONNECTION`
- `retainedInformation` : « blessure liée à la superficialité ou au manque de profondeur »

