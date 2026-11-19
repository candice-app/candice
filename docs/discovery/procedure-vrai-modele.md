# Lecture réelle : la procédure, à exécuter en une fois

Cette procédure lance deux essais avec le vrai modèle, sur la pile Supabase **locale** et avec des personnes fictives :

- **le script 34**, l'essai de lecture : 38 cas, base en mémoire ;
- **le script 37**, le parcours complet par les routes, avec les entrées du modèle observées par le relais.

Rien ne touche la production : aucune migration sur la base vivante, aucun déploiement.

## Une fois seulement : installer tsx

Au passage du 20 novembre, le lanceur s'est arrêté avec « ARRÊT — tsx absent ». `tsx` exécute les scripts ; il n'est pas dans les dépendances du projet. Dans le Terminal du Mac :

```bash
cd ~/candice && npm install --no-save tsx@4 && ls node_modules/.bin/tsx
```

`--no-save` ne modifie ni `package.json` ni `package-lock.json`. La dernière commande doit afficher `node_modules/.bin/tsx`. Un `npm ci` ultérieur le retire : il faudra alors le réinstaller.

## Une seule commande, dans le Terminal du Mac

Ouvre d'abord Docker Desktop, puis lance :

```bash
cd ~/candice && git log --oneline -1 && { supabase status >/dev/null 2>&1 || bash scripts/local/01-monter-la-pile.sh; } && bash scripts/local/40-parcours-vrai-modele.sh; echo "VERDICT : $?"
```

- `git log` affiche le commit testé. Il doit être celui du paquet.
- Si la pile locale tourne déjà, elle est gardée telle quelle. Sinon, `01-monter-la-pile.sh` la monte, et attend ton « o » avant d'appliquer les migrations à la base **locale**.
- Ta base locale doit contenir les migrations du paquet. Celles du 19 novembre sont déjà sur ton Mac, et ce paquet n'en ajoute aucune.
- Le lanceur prend la clé dans l'environnement du lancement. Si elle n'y est pas, il te la demande en saisie masquée.
- **Avant tout appel payant**, le lanceur vérifie son propre verdict sur 7 scénarios simulés (`tests-lanceur.sh`), et s'arrête si l'un d'eux échoue.
- **VERDICT : 0** signifie que les deux essais sont conformes et que leurs rapports ont été écrits pendant ce passage.
- **VERDICT : 1** signifie qu'il y a au moins un écart, une panne d'API, un rapport absent, ancien ou illisible, ou un journal non écrit.

Les dépendances (`npm ci`) et `tsx` (voir plus haut) doivent déjà être installés. Le lanceur s’arrête s’il manque l’un ou l’autre ; il ne télécharge rien.

## Ce que les rapports contiennent

Les rapports sont `docs/discovery/essai-extracteur-reel.json` et `docs/discovery/parcours-complet-reel.json`. Les journaux sont dans `scripts/local/.resultats/`.

Chaque rapport nomme :

- le **commit testé**, et signale toute modification non commitée dans `src` ;
- la **version du lecteur** (v5 depuis le 20 nov., deuxième paquet) ;
- les **modèles** appelés : destinations, extracteur libre et qualification pour le 34 ; modèles observés au relais pour le 37 ;
- le **résultat de chaque cas**.

Le rapport du 34 garde aussi, pour chaque cas :

- **ce que le modèle a réellement rendu**, ses codes traduits en déclencheurs ;
- le **statut rendu par le service** et l'**instrumentation de chaque lecteur** (destinations, envie), séparément ;
- les **attributs écrits** : attribut, valeur, polarité, stabilité.

Le rapport du 37 dit s'il est **achevé** ou **interrompu**, et l'**étape atteinte**. Il garde ce que le modèle a rendu pour la lecture de la réponse libre.

Aucune clé et aucun en-tête n'y figurent.

**Une panne ne passe jamais pour un résultat vide.** Un cas dont la lecture est restée en attente, ou dont le modèle n'a pas été appelé, est compté en échec. Le script 37 exige que la céramique lue par le modèle soit réellement écrite avant de vérifier qu'elle ne part pas à la recommandation ; s'il ne la trouve pas, il s'arrête en échec. Une erreur d'écriture d'un rapport fait sortir le script en code 3.

## Les rapports d'un passage précédent

Le lanceur réécrit `docs/discovery/essai-extracteur-reel.json` et `docs/discovery/parcours-complet-reel.json`. Ceux de chaque passage revu sont d'abord copiés dans `docs/discovery/passage-reel-<date>/` :

- **19 nov.** sur 50e3c42 : `passage-reel-19nov/` ;
- **20 nov.** sur 4cfb4d1 : `passage-reel-20nov/` (33/38 ; 6 passées, 1 en échec, interrompu).

## Après le passage

Écris-moi « fait ». Je lis les rapports sur ton disque.

Je corrige ensuite les défauts observés, puis je te donne la commande qui rejoue les seuls cas concernés. Le parcours complet du script 37 se rejoue toujours entier, avec ses vérifications de consentement et de retrait.

## Les trois catégories de preuve

| Catégorie | Où | État |
|---|---|---|
| Logique éprouvée avec réponses simulées | tests ; scripts 33, 35, 36, 37 simulé, 39 | exécutée sur le paquet |
| Lecture réellement observée du modèle | script 34 | 19 nov. sur 50e3c42 : **31/38**. 20 nov. sur 4cfb4d1 : **33/38**. Écarts corrigés au paquet suivant, **à rejouer** |
| Parcours complet réellement exécuté | script 37 réel | 19 nov. sur 50e3c42 : **27/0**, cas négatif « céramique » vide. 20 nov. sur 4cfb4d1 : **6 passées, 1 en échec, interrompu** avant la recommandation. **À rejouer en entier** |
