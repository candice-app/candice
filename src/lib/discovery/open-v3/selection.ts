// LE CHOIX DE LA PROCHAINE QUESTION.
//
// Fonction PURE : elle reçoit ce que Candice sait, elle rend une question ou rien. Aucune
// lecture de base, aucun appel modèle — pour qu'on puisse l'éprouver entièrement, et pour
// que le même état donne toujours la même question.
//
// ─────────────────────────────────────────────────────────────────────────────────────
// QUATRE RÈGLES, DANS CET ORDRE.
//
// 1. ON NE POSE QUE CE QUI PEUT S'OUVRIR. La condition du référentiel décide ; ce qu'on
//    n'a pas su lire ferme (voir conditions.ts). Une question Discovery arrive seule, et
//    poser « quelle céramique t'attire ? » à quelqu'un qui n'a jamais parlé de céramique
//    affirme une compréhension qu'on n'a pas.
//
// 2. ON NE POSE PAS CE DONT ON NE SAURA RIEN FAIRE. Si aucune option de la question ne
//    produit quoi que ce soit — ni preuve, ni verbatim conservé — alors répondre ne change
//    rien à ce que Candice sait. Demander dans ce cas prend du temps à la personne et lui
//    laisse croire qu'elle a appris quelque chose à Candice. C'est pire qu'une question en
//    moins.
//
// 3. ON VA DU PEU PROFOND VERS LE PROFOND. Les niveaux A, puis B, puis C. Une question de
//    niveau C posée tôt est intrusive même quand sa condition l'autorise.
//
// 4. ON NE CREUSE PAS UNE SEULE BRANCHE. Un plafond par branche, sinon le score mène tout
//    l'échange dans le domaine le mieux renseigné — là où il y a le moins à apprendre.
//
// L'ORDRE EST DÉTERMINISTE À ÉGALITÉ DE SCORE : départage par identifiant. Deux fois le
// même état doit donner deux fois la même question, sinon aucun test ne vaut rien et aucun
// parcours n'est reproductible.
// ─────────────────────────────────────────────────────────────────────────────────────
import { DEPENDANCES, TETES_DE_SOUS_PARTIE } from './dependances';
import { OUVERTES_ARCHIVEES } from './contrats-ouverts';
import { PRESUMENT_L_ALCOOL } from './correspondances';
import { coexistence, estPrioritaire, poolDe, type VerdictCoexistence } from './coexistence';
import { BANQUE, type QuestionV3 } from './banque';
import { analyserCondition, evaluerCondition, type EtatDiscovery, type Verdict } from './conditions';

const PAR_ID = new Map(BANQUE.map((q) => [q.id, q] as const));
import { produireDepuisOption } from './produire';

export interface Choix {
  readonly question: QuestionV3;
  /** Pourquoi celle-ci : de quoi répondre à « pourquoi Candice m'a demandé ça ? ». */
  readonly motif: string;
  readonly score: number;
}

export interface Diagnostic {
  readonly examinees: number;
  readonly dejaPosees: number;
  readonly fermees: number;
  readonly indecidables: number;
  readonly steriles: number;
  /** Questions historiques écartées par la règle de coexistence des générations. */
  readonly remplacees: number;
  readonly plafonnees: number;
  readonly retenues: number;
}

export interface Resultat {
  /** Les questions retenues, les plus pertinentes d'abord. Vide = rien à demander. */
  readonly choix: readonly Choix[];
  /** Ce qui a été écarté et pourquoi. Un « rien à demander » doit être explicable. */
  readonly diagnostic: Diagnostic;
}

/**
 * LE VERDICT D'UNE QUESTION : sa propre condition, ET celle de la question qui ouvre sa
 * sous-partie quand elle n'en porte que le nom. « Fermer » l'emporte, puis « non résolu ».
 */
export function verdictDe(q: QuestionV3, etat: EtatDiscovery, partage: ReadonlyMap<string, number> = PARTAGE_BANQUE): Verdict {
  const vise = informationVisee(q, partage);
  const analyse = analyserCondition(q.condition_emission);
  // « NE BOIT PAS » protège les questions qui présument une consommation d'alcool, qu'elles
  // portent ou non la consigne dans leur condition (la sous-branche « Vin » ne la porte pas).
  const presumeAlcool = PRESUMENT_L_ALCOOL.has(q.id);
  if (presumeAlcool && etat.sansAlcool) return 'fermer';
  const dep = DEPENDANCES.get(q.id);
  const dependance = dep && etat.questionsSignalees?.has(q.id) ? { ...dep, signalee: true } : dep;
  const propre = evaluerCondition(analyse, etat,
    { branche: q.branche, pool: poolDe(q.branche), attributs: vise.cles, attributsPartages: vise.partages, dependance, presumeAlcool });
  if (propre === 'fermer') return 'fermer';
  // ── UNE QUESTION DE NIVEAU C EXIGE « UN OBJET, UNE ACTION OU UNE OCCASION NOMMÉS » (politique
  //    de saturation du référentiel), quelle que soit la façon dont sa condition est écrite.
  //    Les questions de la refonte la disent par un tag (`INTEREST.creativity=positive`) : sans
  //    cette règle, « CRE-17 » s'ouvrait à quiconque s'intéresse à la création. Il faut un
  //    projet en cours dans le domaine — ou une condition qui porte elle-même sur un contexte
  //    nommé (`CONTEXT.…`), auquel cas c'est elle qui en répond.
  if (q.niveau === 'C' && !analyse.clauses.some((c) => c.type === 'tag' && c.chemin.startsWith('CONTEXT.'))) {
    if (!etat.projets) return 'indecidable';
    if ((etat.projets.get(poolDe(q.branche))?.size ?? 0) === 0) return 'fermer';
  }
  const idTete = TETES_DE_SOUS_PARTIE.get(q.id);
  const tete = idTete ? PAR_ID.get(idTete) : undefined;
  if (!tete) return propre;
  // La condition de tête est évaluée pour ce qu'elle exige de la PERSONNE ; « information
  // manquante » et le reste de ce qui tient à la question elle-même restent jugés ci-dessus.
  const heritee = evaluerCondition(analyserCondition(tete.condition_emission), etat,
    { branche: tete.branche, pool: poolDe(tete.branche), attributs: vise.cles, attributsPartages: vise.partages, dependance: DEPENDANCES.get(tete.id) });
  if (heritee === 'fermer') return 'fermer';
  return propre === 'indecidable' || heritee === 'indecidable' ? 'indecidable' : 'ouvrir';
}

const ORDRE_NIVEAU = { A: 0, B: 1, C: 2 } as const;

/** Une question dont AUCUNE option ne produit rien n'apprend rien. */
function sterile(q: QuestionV3): boolean {
  if (q.forme === 'open') return false; // le verbatim est conservé, donc on apprend
  return !q.options.some((o) => {
    const p = produireDepuisOption(q, o);
    return p.type === 'evidence' || p.motif === 'connaissance_ouverte';
  });
}

/**
 * CE QUE LA QUESTION CHERCHE À SAVOIR, pour la clause « information manquante ».
 *
 * Les clés sont « <domaine>.<attribut> » — la forme sous laquelle l'état les connaît. Sans
 * le domaine, savoir ce qu'une personne recherche chez les animaux faisait passer pour
 * connu ce qu'elle recherche en voyage.
 *
 * `partages` : au moins une de ces clés est aussi écrite par une AUTRE question de la
 * banque (313 chemins sur 554 le sont, jusqu'à 29 questions pour un même chemin). Qu'un
 * tel chemin soit renseigné ne dit donc pas que CETTE question a eu sa réponse : seule sa
 * propre trace (« déjà posée ») le dit. La clause ne ferme alors pas la question.
 */
function informationVisee(q: QuestionV3, partage: ReadonlyMap<string, number>): { cles: string[]; partages: boolean } {
  const cles = [...new Set(q.options
    .filter((o) => o.attribut)
    .map((o) => `${o.domaine ?? q.branche}.${o.attribut}`))];
  return { cles, partages: cles.some((k) => (partage.get(k) ?? 0) > 1) };
}

/** Pour chaque « <domaine>.<attribut> », le nombre de questions de la banque qui l'écrivent. */
function compterPartage(banque: readonly QuestionV3[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const q of banque) {
    const cles = new Set(q.options.filter((o) => o.attribut).map((o) => `${o.domaine ?? q.branche}.${o.attribut}`));
    for (const k of cles) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
const PARTAGE_BANQUE = compterPartage(BANQUE);

export type MotifDExclusion =
  | 'deja_posee' | 'sterile' | 'archivee' | 'domaine_ecarte' | 'fermee' | 'indecidable'
  | `coexistence_${Exclude<VerdictCoexistence, { poser: true }>['motif']}`;

/**
 * POURQUOI UNE QUESTION N'EST PAS ADMISSIBLE — ou `null` si elle l'est.
 *
 * UNE SEULE FONCTION, pour le choix du lot ET pour le contrôle d'une réponse reçue : la route
 * de réponse refuse une question dont les conditions ne tiennent plus, et elle doit juger
 * avec exactement les règles qui l'ont fait proposer. Deux copies de ces règles finiraient par
 * diverger, et la plus permissive deviendrait la porte.
 *
 * `ignorerDejaPosee` : au moment où la personne répond, la question lui a par définition déjà
 * été posée. Tout le reste est rejugé.
 */
export function motifDExclusion(
  q: QuestionV3, etat: EtatDiscovery,
  opts: { readonly partage?: ReadonlyMap<string, number>; readonly ignorerDejaPosee?: boolean } = {},
): MotifDExclusion | null {
  const partage = opts.partage ?? PARTAGE_BANQUE;
  if (!opts.ignorerDejaPosee && etat.dejaPosees.has(q.id)) return 'deja_posee';
  if (sterile(q)) return 'sterile';
  // Une question ouverte que le référentiel a archivée (onglet 9) n'est jamais servie.
  if (OUVERTES_ARCHIVEES.has(q.id)) return 'archivee';
  // UN DOMAINE QUE LA PERSONNE A ÉCARTÉ n'est plus proposé d'initiative. Sa propre démarche
  // (« explorer ce sujet ») est la seule chose qui passe outre.
  if (etat.nePasCreuser.has(q.branche) && !etat.sujetsChoisis?.has(q.branche)) return 'domaine_ecarte';
  const verdict = verdictDe(q, etat, partage);
  if (verdict === 'fermer') return 'fermee';
  if (verdict === 'indecidable') return 'indecidable';
  // ── COEXISTENCE DES GÉNÉRATIONS (onglet 13). Une question historique que le référentiel
  //    a remplacée n'est plus proposée d'initiative ; celle qu'il garde « distincte et
  //    conditionnée » attend que la nouvelle ait été posée, qu'une information manque
  //    encore, et ne vient jamais juste après elle.
  const v = informationVisee(q, partage);
  const facette = v.cles.length === 0 ? null : v.cles.some((k) => !etat.attributsConnus.has(k));
  const c = coexistence(q.id, etat, facette);
  return c.poser ? null : `coexistence_${c.motif}`;
}

export interface Reglages {
  /** Combien de questions rendre. 1 pour une micro-question, davantage pour une session. */
  readonly combien?: number;
  /** Plafond par branche dans un même lot. 2 par défaut : on ne creuse pas un seul sujet. */
  readonly parBranche?: number;
}

/**
 * Choisit les prochaines questions.
 *
 * Rend aussi un diagnostic : quand il n'y a rien à demander, il faut pouvoir dire si c'est
 * parce que tout a été posé, parce que les conditions ferment, ou parce qu'on n'a pas su
 * les lire. « Aucune question » sans explication est un silence qu'on ne peut pas corriger.
 */
export function prochainesQuestions(
  etat: EtatDiscovery,
  reglages: Reglages = {},
  banque: readonly QuestionV3[] = BANQUE,
): Resultat {
  const combien = reglages.combien ?? 1;
  const parBranche = reglages.parBranche ?? 2;

  let dejaPosees = 0, fermees = 0, indecidables = 0, steriles = 0, remplacees = 0;
  const partage = banque === BANQUE ? PARTAGE_BANQUE : compterPartage(banque);
  const eligibles: Choix[] = [];

  for (const q of banque) {
    const exclusion = motifDExclusion(q, etat, { partage });
    if (exclusion === 'deja_posee') { dejaPosees++; continue; }
    if (exclusion === 'sterile' || exclusion === 'archivee') { steriles++; continue; }
    if (exclusion === 'domaine_ecarte' || exclusion === 'fermee') { fermees++; continue; }
    if (exclusion === 'indecidable') { indecidables++; continue; }
    if (exclusion !== null) { remplacees++; continue; }

    // ── SCORE. Il n'ordonne que des questions DÉJÀ autorisées : il ne peut pas ouvrir ce
    //    qu'une condition a fermé. Il décide seulement de l'ordre, et son rôle s'arrête là.
    const niveau = ORDRE_NIVEAU[(q.niveau ?? 'B') as 'A' | 'B' | 'C'] ?? 1;
    let score = 100 - niveau * 30;                      // le peu profond d'abord
    const motifs: string[] = [`niveau ${q.niveau ?? '—'}`];
    if (etat.branchesOuvertes.has(q.branche)) { score += 15; motifs.push('branche déjà ouverte'); }
    const vise = informationVisee(q, partage);
    if (vise.cles.length > 0 && vise.cles.some((k) => !etat.attributsConnus.has(k))) { score += 10; motifs.push('information absente'); }
    if (q.facultative) { score -= 5; motifs.push('facultative'); }
    // « `2` prioritaire sur intention équivalente » : à score égal, la génération qui reprend
    // la branche passe devant l'historique.
    if (estPrioritaire(q.branche)) { score += 5; motifs.push('génération prioritaire'); }

    // « TRÈS PEU DE PLACE » n'interdit rien : les autres sujets passent simplement d'abord.
    if (etat.placeFaible?.has(poolDe(q.branche)) && !etat.sujetsChoisis?.has(q.branche)) { score -= 25; motifs.push('place faible déclarée : après les autres sujets'); }

    eligibles.push({ question: q, score, motif: motifs.join(' · ') });
  }

  // Tri stable et reproductible : score, puis identifiant.
  eligibles.sort((a, b) => b.score - a.score || (a.question.id < b.question.id ? -1 : 1));

  const retenues: Choix[] = [];
  const parBrancheCompte = new Map<string, number>();
  let plafonnees = 0;
  for (const c of eligibles) {
    if (retenues.length >= combien) break;
    // « Un seul pool visible » : les deux générations d'un domaine comptent pour une branche.
    const pool = poolDe(c.question.branche);
    const n = parBrancheCompte.get(pool) ?? 0;
    if (n >= parBranche) { plafonnees++; continue; }
    parBrancheCompte.set(pool, n + 1);
    retenues.push(c);
  }

  return {
    choix: retenues,
    diagnostic: {
      examinees: banque.length,
      dejaPosees, fermees, indecidables, steriles, remplacees, plafonnees,
      retenues: retenues.length,
    },
  };
}

/** La prochaine question, ou `null`. Le diagnostic reste accessible par `prochainesQuestions`. */
export function prochaineQuestion(etat: EtatDiscovery, banque?: readonly QuestionV3[]): Choix | null {
  return prochainesQuestions(etat, { combien: 1 }, banque).choix[0] ?? null;
}
