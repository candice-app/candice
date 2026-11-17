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
import { BANQUE, type QuestionV3 } from './banque';
import { analyserCondition, evaluerCondition, type EtatDiscovery } from './conditions';
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
  readonly plafonnees: number;
  readonly retenues: number;
}

export interface Resultat {
  /** Les questions retenues, les plus pertinentes d'abord. Vide = rien à demander. */
  readonly choix: readonly Choix[];
  /** Ce qui a été écarté et pourquoi. Un « rien à demander » doit être explicable. */
  readonly diagnostic: Diagnostic;
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
 * L'attribut que la question vise, quand elle n'en vise qu'un. Il sert à la clause
 * « information manquante » : sans lui, cette clause est indécidable, et on préfère ne
 * pas poser plutôt que de supposer que l'information manque.
 */
function attributVise(q: QuestionV3): string | undefined {
  const attrs = new Set(q.options.map((o) => o.attribut).filter((a): a is string => !!a));
  return attrs.size === 1 ? [...attrs][0] : undefined;
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

  let dejaPosees = 0, fermees = 0, indecidables = 0, steriles = 0;
  const eligibles: Choix[] = [];

  for (const q of banque) {
    if (etat.dejaPosees.has(q.id)) { dejaPosees++; continue; }
    if (sterile(q)) { steriles++; continue; }

    const verdict = evaluerCondition(
      analyserCondition(q.condition_emission),
      etat,
      { branche: q.branche, attribut: attributVise(q) },
    );
    if (verdict === 'fermer') { fermees++; continue; }
    if (verdict === 'indecidable') { indecidables++; continue; }

    // ── SCORE. Il n'ordonne que des questions DÉJÀ autorisées : il ne peut pas ouvrir ce
    //    qu'une condition a fermé. Il décide seulement de l'ordre, et son rôle s'arrête là.
    const niveau = ORDRE_NIVEAU[(q.niveau ?? 'B') as 'A' | 'B' | 'C'] ?? 1;
    let score = 100 - niveau * 30;                      // le peu profond d'abord
    const motifs: string[] = [`niveau ${q.niveau ?? '—'}`];
    if (etat.branchesOuvertes.has(q.branche)) { score += 15; motifs.push('branche déjà ouverte'); }
    const attribut = attributVise(q);
    if (attribut && !etat.attributsConnus.has(attribut)) { score += 10; motifs.push('information absente'); }
    if (q.facultative) { score -= 5; motifs.push('facultative'); }

    eligibles.push({ question: q, score, motif: motifs.join(' · ') });
  }

  // Tri stable et reproductible : score, puis identifiant.
  eligibles.sort((a, b) => b.score - a.score || (a.question.id < b.question.id ? -1 : 1));

  const retenues: Choix[] = [];
  const parBrancheCompte = new Map<string, number>();
  let plafonnees = 0;
  for (const c of eligibles) {
    if (retenues.length >= combien) break;
    const n = parBrancheCompte.get(c.question.branche) ?? 0;
    if (n >= parBranche) { plafonnees++; continue; }
    parBrancheCompte.set(c.question.branche, n + 1);
    retenues.push(c);
  }

  return {
    choix: retenues,
    diagnostic: {
      examinees: banque.length,
      dejaPosees, fermees, indecidables, steriles, plafonnees,
      retenues: retenues.length,
    },
  };
}

/** La prochaine question, ou `null`. Le diagnostic reste accessible par `prochainesQuestions`. */
export function prochaineQuestion(etat: EtatDiscovery, banque?: readonly QuestionV3[]): Choix | null {
  return prochainesQuestions(etat, { combien: 1 }, banque).choix[0] ?? null;
}
