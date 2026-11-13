# Parcours d'approfondissement conversationnel — contrat

Arbitré par Estelle le 13 novembre. Ce document est le contrat ; les formes qu'il fixe
sont vérifiées par les essais, ne les réinvente pas.

## Ce qui est DÉJÀ fait — construis dessus, ne le refais pas

- `src/lib/recommendations/declarations-proche.ts` — le chemin de lecture autorisé des
  déclarations du proche. Rend **uniquement des rejets**, jamais une préférence. Échoue
  fermé sur cinq motifs distincts. Branché dans `/api/recommendations/generate`.
- `src/lib/recommendations/veto-text.ts` — reconnaissance par mot (le `includes` écartait
  « vinyle » sur un veto « vin »).
- `src/lib/recommendations/rejection-match.ts` — `candidateRejectedBy`, déjà consommé.
- `extract-free-text.ts` — `INTEREST_RELATIONSHIPS` fait foi, degré validé avant écriture,
  jamais converti, rejet orienté vers la connaissance ouverte.

## 1. Point d'entrée réel

Le parcours part d'un **message libre** dans la conversation, pas d'une ligne du
référentiel Discovery. Montre où l'application l'appelle — un point d'entrée qui n'est
appelé de nulle part ne prouve rien.

## 2. Le fil, conservé entre les tours

```ts
interface FilApprofondissement {
  readonly filId: string;
  readonly about: AboutRef;            // le sujet du fil : compte ou contact
  readonly recitInitial: string;       // verbatim, jamais réécrit
  readonly tours: readonly Tour[];
  readonly personnes: readonly PersonneDuFil[];  // identités déjà résolues
}
interface Tour {
  readonly question: string;           // ce que Candice a demandé
  readonly reponse: string;            // verbatim
  readonly ts: string;
}
interface PersonneDuFil {
  readonly mention: string;            // « Thibaud », « lui », « nous deux »
  readonly contactId: string | null;   // null tant que non résolu
  readonly ambigu: boolean;            // plusieurs contacts correspondent
}
```

Un « oui », un « lui », un « c'était une première » n'a de sens que dans ce fil. Un tour
isolé ne doit jamais produire une écriture.

## 3. Sortie structurée par tour — deux listes SÉPARÉES

```ts
interface SortieDeTour {
  readonly relance: string | null;     // une question, une seule. null = le fil s'arrête.
  readonly pistes: readonly string[];  // guident la relance, N'ÉCRIVENT RIEN
  readonly candidats: readonly CandidatConnaissance[];
}
interface CandidatConnaissance {
  readonly segment: string;            // l'extrait EXACT des propos qui l'étaye
  readonly sujet: string;
  readonly aQuiCaSeRapporte: { kind: 'account' | 'contact'; id: string | null };
  readonly provenance: ProvenanceRecit;
  readonly destination: 'INTEREST' | 'ENTITY' | 'FACT' | 'OPEN_KNOWLEDGE';
  readonly portee: string;             // « cette recette », « le pain rapide », « en général »
}
type ProvenanceRecit =
  | 'narrateur_sur_lui'        // « moi j'ai aimé »
  | 'narrateur_impression'     // « il avait l'air content »
  | 'narrateur_rapporte'       // « il m'a dit qu'il avait adoré »
  | 'declaration_propre';      // saisi par le proche sur son compte
```

**Une piste n'est jamais une connaissance.** Elle guide la question suivante ; elle ne
devient écriture que si elle est étayée par un segment, rattachée au bon sujet, placée
dans la bonne portée et autorisée par le contrat d'écriture.

## 4. Validation côté application AVANT écriture

Réutilise les règles et les types existants. Rien de neuf ici, et surtout pas un second
chemin d'écriture.

- `segment` vide ou introuvable dans les propos → **refus**, la piste reste une piste.
- identité non résolue (`contactId: null` ou `ambigu`) → **aucune écriture rattachée à sa
  fiche**. Le récit peut rester dans le contexte autorisé du narrateur.
- famille, vocabulaire, portée : les contrôles existants (`degreCanonique`,
  `ENTITY_RELATIONS`, `ev_*_shape`).
- un détail confirmé sans destination structurée autorisée → connaissance ouverte, et
  **signale le cas précis** plutôt que de le faire disparaître.
- rejouer le même tour ne doit pas créer de doublon (`evidenceId` est déterministe —
  sers-t'en, n'invente pas une clé).

## 5. Ce que le parcours doit distinguer, et que rien ne distingue aujourd'hui

- le **plaisir de faire** et le **plaisir de partager le moment** : deux connaissances
  différentes, jamais fusionnées ;
- une **action ponctuelle** et un **intérêt durable** : « j'ai fait du pain ce week-end »
  n'établit aucun intérêt. Conserve le fait, ouvre une relance ;
- une **portée** : « j'ai détesté attendre entre les étapes » ne rejette ni le pain, ni la
  cuisine, ni les activités avec Thibaud ;
- une **fréquence rattachée à la bonne pratique** : « presque tous les dimanches » porte
  sur le pain rapide, pas sur le levain.

« J'ai détesté » doit ouvrir autant de relances utiles que « j'ai adoré ».

## 6. Ce que le parcours ne doit JAMAIS faire

Mon impression sur Thibaud, et ses mots rapportés par moi, **ne créent aucune préférence
confirmée sur son profil** et ne suffisent jamais à lui recommander l'activité.

Et la contrainte qui gouverne tout : **une préférence privée du proche ne doit apparaître
ni dans une relance, ni dans une justification, ni dans une réponse qui me confirmerait
indirectement ce qu'il a déclaré.** Le module de lecture (`declarations-proche.ts`) ne
rend que des rejets, et le moteur les applique APRÈS génération — ne contourne ni l'un ni
l'autre, et ne fais entrer aucune donnée du proche dans un prompt.

## 7. Les preuves attendues

Un essai local montrant **l'échange complet** : message initial → relances → ce qui est
écrit → ce qui est relu → ce que le moteur propose ou écarte. Pour chaque échange :
relances, segments justificatifs, provenance, résultat observé.

1. un fait ponctuel ouvre une relance **sans** créer d'intérêt ;
2. « j'ai adoré » et « j'ai détesté » donnent chacun plusieurs tours utiles ;
3. un même récit fait ressortir un rejet précis, un plaisir distinct, et une fréquence
   rattachée à la bonne pratique ;
4. la personne ignore la relance ou change de sujet → le fil s'arrête proprement, ce qui
   est confirmé est conservé ;
5. un « oui » ambigu et un prénom non résolu sont clarifiés **avant** toute attribution ;
6. impression / propos rapporté / déclaration propre = trois provenances distinctes ;
7. Thibaud a déclaré un rejet contredisant mon impression positive → sa fiche reste
   fidèle à sa déclaration, **l'activité est écartée** ;
8. un goût général pour la cuisine ne confirme pas le levain ;
9. compte absent, fiche inaccessible, permissions refusées → aucun usage de ses données,
   **et aucune fuite dans la conversation**.

Dans le bilan, distingue : les relances produites avec un modèle **simulé**, celles
réellement générées par le modèle, et les écritures **effectivement relues en base**. Les
trois n'ont pas la même valeur de preuve et les confondre rendrait le bilan faux.

Si un accès bloque une preuve, dis **laquelle précisément** et poursuis les parties
testables. Si un arbitrage manque, donne le cas exact et continue les parties décidées.

## Rappels de cadre

Branche + PR, jamais de push sur `main`. Aucune opération en production. Les migrations
sont appliquées par Estelle. Les deux typechecks : `npx tsc --noEmit` **et**
`npx tsc -p tsconfig.scripts.json` — `tsconfig.json` exclut `scripts`, le premier seul ne
couvre pas les scripts.
