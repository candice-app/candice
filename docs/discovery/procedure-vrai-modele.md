# Lancer les essais avec le vrai modèle — procédure exacte

Deux essais n'ont encore jamais tourné avec le vrai modèle :

- **script 34**, l'essai de lecture. Le vrai modèle lit des réponses fictives : 15 destinations, la cible des appréciations, la qualification D1 et la cible dans un récit. Il n'y a pas de base : tout se passe en mémoire.
- **script 37**, le parcours complet. Il passe par les vraies routes, sur la pile Supabase **locale** :
  - sélection, lot signé, réponse ;
  - lecture par le modèle, écriture, relecture ;
  - recommandation sans accord, après accord, puis après retrait.

  Ce qui part au modèle est observé par le relais.

Le lanceur `scripts/local/40-parcours-vrai-modele.sh` fait tout, dans l'ordre :

- il te demande la clé lui-même, et elle reste seulement dans son processus ;
- il ne lit pas `.env.local`, et donne une valeur locale à chaque variable que l'application lit ;
- il s'arrête si une seule variable lue par l'application n'a pas de valeur locale.

Rien ne touche la production. Il n'y a pas de migration sur la base vivante, et aucun déploiement.

## Étapes, dans le Terminal du Mac

**1. Le dépôt, sur le commit figé**

```bash
cd ~/candice
git status
git log --oneline -1
```

`git log` doit afficher le commit figé du paquet. `git status` ne doit montrer aucun fichier modifié, hors `.claude/settings.local.json`.

**2. Les dépendances**

C'est ton geste, une fois. La branche ajoute des dépendances, et `tsx` lance les scripts.

```bash
npm ci
npm install --no-save tsx@4
```

**3. La pile locale**

Ouvre d'abord Docker Desktop, puis :

```bash
bash scripts/local/01-monter-la-pile.sh
```

Le script :

- vérifie que tout est local, sur l'hôte et le port exacts ;
- affiche l'ordre des migrations ;
- attend ton « o » avant de les appliquer à la base **locale**.

**4. Les deux essais**

```bash
bash scripts/local/40-parcours-vrai-modele.sh
```

Colle la clé quand il la demande, puis appuie sur Entrée. Rien ne s'affiche. Compte une quarantaine d'appels courts au modèle.

**5. Le compte rendu**

Écris-moi « fait ». Je lis les sorties directement sur ton disque :

- `scripts/local/.resultats/34-reel.txt` et `37-reel.txt` ;
- `docs/discovery/essai-extracteur-reel.json` ;
- `docs/discovery/parcours-complet-reel.json`.

Aucun de ces fichiers ne contient la clé, ni aucun en-tête.

**6. Arrêter la pile locale (facultatif)**

```bash
supabase stop
```

## Ce que chaque essai établit, et ce qu'il n'établit pas

| Catégorie | Où | État au 19 nov. au soir |
|---|---|---|
| **Logique éprouvée avec réponses simulées** : ce que l'application écrit, refuse, relit et transmet, pour une lecture donnée | tests unitaires ; scripts 33, 35, 36, 37 (mode `simule`) et 39 | exécuté |
| **Lecture réellement observée du modèle** : ce que le vrai modèle découpe, qualifie et cible | script 34 ; la partie « lecture » du script 37 en mode `reel` | **pas encore exécuté** |
| **Parcours complet réellement exécuté** avec le vrai modèle : routes, base, recommandation, entrées observées au relais | script 37, mode `reel` | **pas encore exécuté** |

Si la pile locale ne peut pas monter, parce que Docker ou le CLI Supabase manque, le script 37 en mode réel ne peut pas tourner. Le script 34 peut tourner seul, sans base :

```bash
cd ~/candice
read -rs ANTHROPIC_API_KEY
export ANTHROPIC_API_KEY
node_modules/.bin/tsx scripts/local/34-essai-extracteur-reel.mts | tee scripts/local/.resultats/34-reel.txt
unset ANTHROPIC_API_KEY
```

Pour `read -rs` : colle la clé, puis Entrée. Rien ne s'affiche.
