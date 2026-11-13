# Préalables des scénarios 3 et 4 — à écrire avant de pouvoir les jouer

Ces deux scénarios restent **BLOQUÉS** jusqu'à leur exécution réelle. Ce document dit
exactement ce qui manque, pour que leur mise en place ne soit pas improvisée le jour venu.

## 1. Transport de test — capturer le lien d'annulation sans appeler Resend

Le courriel d'annulation part par **Resend**, un appel HTTP sortant. Inbucket n'attrape que
le SMTP de GoTrue : il ne verra jamais ce lien. Lancer le scénario 3 en l'état enverrait un
**vrai courriel**.

**Un seul module de transport**, pas un garde `NODE_ENV` au point d'appel — celui-ci retombe
au deuxième appel courriel écrit, exactement comme `cancel-deletion` l'a montré.

```
src/lib/mail/transport.ts        choisit l'implémentation par variable d'environnement
src/lib/mail/transport-resend.ts l'actuel appel Resend
src/lib/mail/transport-local.ts  N'ÉMET RIEN : écrit l'objet, le destinataire et les liens
                                 dans un fichier JSONL sous .local-mail/ (gitignoré)
```

Trois exigences, chacune vérifiable :

1. `MAIL_TRANSPORT=local` sélectionne l'implémentation locale **dans le module**, jamais au
   point d'appel ;
2. un test assère **zéro appel sortant** sous ce réglage — espion sur `fetch`, pas seulement
   sur la fonction d'envoi ;
3. le transport local **journalise les liens** extraits du corps, pour que le scénario 3
   puisse en récupérer un et le suivre.

Le scénario 3 est **déjà écrit**, et il se joue en **deux cas distincts** — parce que
`cancel-deletion` met `cancelled_at` ET `deletion_scheduled_at` à NULL : après annulation,
**il n'y a plus de demande du tout**. Pousser ensuite l'échéance au passé ne prolonge donc
pas le cas « annulée » : cela fabrique une **échéance orpheline**, qui est un autre cas.
Les confondre ferait passer l'un pour l'autre.

### 3a — annulation suivie

1. semer un compte fictif avec de vraies lignes et de vrais objets ;
2. créer la demande par **`/api/account/delete`**, avec un jeton du compte lui-même : c'est
   cette route qui envoie le courriel, pas le cron ;
3. récupérer le lien **capturé par le transport local**, **vérifier sa destination** (hôte
   exact, protocole), puis le suivre ;
4. **vérifier que la demande est réellement annulée** : relire `my_profile` et constater
   `subscription_status ≠ cancelled`, `cancelled_at IS NULL`, `deletion_scheduled_at IS NULL`.
   Suivre un lien qui répond 200 ne prouve pas qu'il a agi ;
5. lancer le cron : compte, lignes et objets **intacts**, aucun achèvement écrit.

### 3b — échéance orpheline

Depuis l'état annulé du 3a, poser **`deletion_scheduled_at` au passé** sans rétablir
`cancelled_at` : c'est l'état qu'un chemin futur (Stripe, un outil d'administration) pourrait
laisser en oubliant de nettoyer. `cancelled_at IS NULL` rend l'échéance non interprétable.

**Convention arrêtée le 13 novembre :**

- le refus se journalise dans **`cron_runs`**, en **entrée structurée** — pas une chaîne
  dans un message. Le script compare le champ, pas le texte sérialisé :

  ```jsonc
  // cron_runs.metadata
  {
    "refusals": [
      { "subject_user_id": "<uuid>", "reason": "ORPHANED_DELETION_DEADLINE" }
    ]
  }
  ```

  Une seule exécution peut refuser plusieurs comptes : d'où un tableau, et le rattachement
  par `subject_user_id` sur chaque entrée. Le motif vaut **exactement**
  `ORPHANED_DELETION_DEADLINE` — pas « contient », pas un préfixe ;
- la garde intervient **AVANT toute tentative**. `erasure_manifests` ne reçoit donc
  **aucune nouvelle ligne** pour ce compte : un refus n'est pas une tentative ratée, c'est
  une tentative qui n'a pas eu lieu ;
- le refus porte l'identifiant du compte concerné, pour être rattachable à une exécution.

Le test échoue si la trace manque, si le motif diffère ne serait-ce que d'un caractère, si
une tentative est créée, ou si le compte, ses lignes ou ses fichiers changent. L'assertion
porte sur les lignes de `cron_runs` **créées pendant ce passage**, pas sur n'importe quelle
ligne portant le bon motif : sinon un refus d'hier ferait passer le test d'aujourd'hui.

C'est le cas que la parade 2 protège, et il échoue **fermé** : il refuse. La parade 1, qui
nettoie les champs, échoue ouvert le jour où un nouveau chemin oublie de le faire.

**Le branchement qui t'appartient** : l'envoi de `/api/account/delete` doit passer par
`envoyerCourriel`, donc par le transport choisi. La preuve vue de l'extérieur est que le
courriel apparaît dans `.local-mail/` ; la preuve qu'aucun appel sortant n'a lieu est dans
le test unitaire du transport, qui espionne `fetch` lui-même.

## 1 bis. Erreurs Storage — les deux formes, et la reprise

`hard-delete.ts` avale aujourd'hui les échecs :

```ts
await supabaseAdmin.storage.from('contact-photos').remove([contact.photo_url]).catch(() => {});
```

Deux formes d'échec, et ce code n'en voit aucune :

- **l'exception** — attrapée et jetée par le `.catch(() => {})` ;
- **le champ `error` du retour** — le client Supabase ne lève pas, il rend `{ data, error }`.
  Un `remove` qui échoue proprement rend `error` non nul et ce code ne le regarde même pas.

Après quoi `auth.admin.deleteUser` passe, la ligne disparaît, et le fichier est orphelin pour
toujours — sans trace. Il faut donc, pour **les trois surfaces** (photos de contacts, avatar,
photos de wishlist et du carnet d'envies) :

1. vérifier **l'exception ET le champ `error`**, jamais l'un sans l'autre ;
2. si un fichier reste à effacer, **conserver ce qu'il faut pour reprendre** — godet et
   chemin, jamais le nom de fichier dans la trace (un nom porte souvent un nom de personne) :
   des **dénombrements par godet**, et la reprise relit les chemins depuis la base ;
3. **enregistrer l'échec** (`ECHEC_PARTIEL` + résidu) et **ne pas appeler `deleteUser`** :
   effacer la ligne alors que des fichiers restent rend la reprise impossible, puisque les
   chemins se lisent depuis cette ligne.

Le point 3 est le plus contraignant et le plus important : **l'ordre compte**. Storage
d'abord, vérifié, et la ligne `auth.users` seulement ensuite.

## 2. Injection contrôlée — couper Storage à mi-chemin

Le scénario 4 est le plus important, parce que c'est celui que personne ne teste. Il exige
un point d'injection **dans le chemin réel**, pas un test qui simule l'échec à côté.

```ts
// hard-delete.ts — point d'injection, INERTE partout sauf sur une pile d'essai locale.
//
// ⚠ Number('') vaut 0 et Number.isFinite(0) vaut true : un test naïf
// `Number.isFinite(n) && supprimes >= n` déclenche la coupure QUAND LA VARIABLE EST
// ABSENTE — c'est-à-dire en production. D'où trois verrous indépendants.
function coupureDEssai(): { apres: number; forme: 'exception' | 'erreur' } | null {
  // 1. VERROU D'ENVIRONNEMENT — deux conditions indépendantes, toutes deux requises.
  if (process.env.NODE_ENV === 'production') return null;
  if (process.env.ESSAI_PILE_LOCALE !== 'oui') return null;   // opt-in explicite
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  let hote: string;
  try { hote = new URL(api).hostname; } catch { return null; } // URL illisible → inerte
  if (!['127.0.0.1', 'localhost', '::1'].includes(hote)) return null;

  // 2. VERROU DE FORME — présence, chiffres seuls, entier SÛR, strictement positif.
  const brut = process.env.ESSAI_COUPER_STORAGE_APRES?.trim();
  if (brut === undefined || !/^[0-9]+$/.test(brut)) return null;
  const n = Number(brut);
  if (!Number.isSafeInteger(n) || n <= 0) return null;  // 1e20, 0, « 1.5 », « -1 » → inerte

  // 3. FORME DE L'ÉCHEC — exception, ou retour { error } sans exception.
  const forme = process.env.ESSAI_STORAGE_FORME === 'erreur' ? 'erreur' : 'exception';
  return { apres: n, forme };
}

// … dans la boucle, APRÈS avoir réellement supprimé un objet :
const c = coupureDEssai();
if (c && supprimes >= c.apres) {
  if (c.forme === 'exception') throw new StorageInterrompu(`coupure d'essai après ${supprimes}`);
  return { error: { message: `coupure d'essai après ${supprimes}` } }; // sans exception
}
```

**Les cas à couvrir, et le premier protège la production :**

| Cas | Valeur | Attendu |
|---|---|---|
| variable absente | *(non définie)* | **aucune coupure** |
| chaîne vide | `""` | aucune coupure — c'est elle qui faisait de l'exemple initial une coupure permanente |
| non numérique | `"abc"` | aucune coupure |
| zéro | `"0"` | aucune coupure : couper avant le premier objet ne prouve rien d'une reprise |
| négatif, décimal | `"-1"`, `"1.5"` | aucune coupure |
| **au-delà de l'entier sûr** | `"99999999999999999999"` | aucune coupure — passe la regex, mais `Number.isSafeInteger` est faux |
| hors pile locale | `"1"` sans `ESSAI_PILE_LOCALE=oui`, ou API non bouclée | aucune coupure |
| coupure demandée | `"1"` sur trois objets, pile locale | 1 effacé, **2 restants**, échec signalé |

Le dernier cas se joue **deux fois** : `ESSAI_STORAGE_FORME=exception` puis `=erreur`. Les
deux doivent produire le même `ECHEC_PARTIEL` avec résidu — sinon la forme silencieuse,
celle qui ne lève pas, passerait pour un succès.


La variable est lue par le **processus de l'application**, pas par le script d'essai : le
scénario 4 se joue donc en deux temps, application démarrée AVEC la variable pour le premier
passage, redémarrée SANS pour le second. Le script le vérifie et refuse d'avancer si le
premier passage s'est achevé — preuve que l'injection n'était pas active.

**Les deux assertions, et la seconde est celle qui compte :**

| Tour | Attendu | Ce que l'assertion doit interdire |
|---|---|---|
| 1 | `ECHEC_PARTIEL` ; **au moins un objet effacé ET au moins un restant** ; résidu non vide et **égal au réel** ; **compte Auth toujours présent** | qu'`ACHEVEMENT_VERIFIE` soit écrit alors qu'il reste des objets ; que la coupure tombe avant la boucle (rien d'effacé) ou pas du tout (rien de restant) ; que `deleteUser` ait été appelé, ce qui rendrait la reprise impossible |
| 2 | `attempt_no = 2` ; `inventory_before` **égal au résidu du tour 1** ; puis Auth absent, zéro ligne, zéro objet, résidu vide, et seulement alors `ACHEVEMENT_VERIFIE` | que la reprise reparte de zéro ; que l'achèvement soit déclaré avant les contrôles des trois surfaces |

Le tour 1 doit couvrir **les deux formes d'échec** : l'exception levée par l'injection, et un
`{ error }` rendu par le client sans exception. Les deux doivent produire le même
`ECHEC_PARTIEL` avec résidu — sinon l'une des deux passerait pour un succès.

Pour prouver que la reprise part **du résidu** et non de zéro, le second tour doit porter
`attempt_no = 2` et son `inventory_before` doit être **égal au résidu du premier tour**, pas
à l'inventaire initial. C'est le seul moyen de distinguer une reprise d'un recommencement
qui aurait réussi par hasard.

Et l'achèvement ne se déclare **jamais** sans la passe de vérification : un test où l'on
retire la passe doit faire échouer le scénario. Un contrôle qui n'a jamais échoué ne
démontre rien.
