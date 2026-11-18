// LE SERVICE DISCOVERY OPEN V3 — poser une question, enregistrer une réponse.
//
// Les trois pièces en amont sont pures et éprouvées séparément : `conditions` décide si une
// question peut s'ouvrir, `selection` choisit laquelle, `produire` traduit une option en
// preuve. Ce fichier est le seul qui touche la base, et il ne décide rien de plus.
//
// ⚠ LA RÉPONSE EST ENREGISTRÉE AVANT TOUT LE RESTE. L'ordre n'est pas un détail : si le
// journal s'écrivait après avoir marqué la question posée, une panne entre les deux perdrait
// la réponse tout en interdisant de reposer la question. La personne aurait répondu pour
// rien, sans aucun moyen de s'en apercevoir. On écrit la connaissance d'abord ; marquer la
// progression ensuite est réparable, l'inverse non.
import { randomUUID } from 'node:crypto';
import { question as questionParId, type OptionV3, type QuestionV3 } from './banque';
import { prochainesQuestions, type Choix } from './selection';
import { produireDepuisOption } from './produire';
import { lireEtat, FAIT_SUJET_CHOISI, FAIT_SUJET_ABORDE } from './etat';
import { analyserCondition } from './conditions';
import { BANQUE } from './banque';
import { createFact } from '@/lib/knowledge/fact';
import { factId } from '@/lib/knowledge-write/ids';
import { supersedeSources } from '@/lib/knowledge-write/supersede';
import { createSourceRecord } from '@/lib/knowledge/sources';
import { persistKnowledge, type WriteClient } from '@/lib/knowledge-write/persist';
import { evidenceId } from '@/lib/knowledge-write/ids';
import { accountAbout, asUserId } from '@/lib/knowledge/identity';
import { JOURNAL_VERSION_STAMP } from '@/lib/knowledge/version';
import type { Evidence } from '@/lib/knowledge/evidence';

/* ────────────────────────────────────────────────────────────────────────────
 * L'IDENTITÉ D'UNE OPTION, telle qu'elle voyage jusqu'au navigateur et revient.
 *
 * Pas l'index dans le tableau : un réimport du référentiel pourrait changer l'ordre, et
 * une réponse enregistrée hier se rattacherait alors à une autre option. On prend le rang
 * quand le référentiel en donne un, sinon le libellé normalisé — ce que la personne a lu.
 * ──────────────────────────────────────────────────────────────────────────── */
export function cleOption(o: OptionV3): string {
  if (o.rang && o.rang.trim()) return `r${o.rang.trim()}`;
  return `l${o.libelle.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}

/** Forme attendue par l'écran. Le type de question suit la forme du référentiel. */
export interface QuestionAServir {
  readonly question_key: string;
  readonly dimension: string;
  readonly question_text: string;
  readonly question_type: 'chips_single' | 'chips_multi' | 'text';
  readonly options: readonly { readonly label: string; readonly value: string }[] | null;
  /** Texte du référentiel, validé. JAMAIS reformulé par un modèle. */
  readonly locked_text: true;
  /** Pourquoi cette question a été choisie. De quoi répondre à la personne qui demande. */
  readonly motif: string;
}

function aServir(c: Choix): QuestionAServir {
  const q = c.question;
  const type = q.forme === 'open' ? 'text'
    : q.forme === 'single' ? 'chips_single' : 'chips_multi';
  return {
    question_key: q.id,
    dimension: q.branche,
    question_text: q.enonce,
    question_type: type,
    options: type === 'text' ? null : q.options.map((o) => ({ label: o.libelle, value: cleOption(o) })),
    locked_text: true,
    motif: c.motif,
  };
}

export interface ServiceClient extends WriteClient {
  from(table: string): never;
}

/**
 * La ou les prochaines questions. `null` quand il n'y a rien à demander — et le diagnostic
 * dit alors pourquoi, parce qu'un silence qu'on ne peut pas expliquer ne se corrige pas.
 *
 * Si l'état n'a pas pu être lu entièrement, on REFUSE de poser : une progression illisible
 * ferait resservir à quelqu'un une question qu'il a déjà vue, ce qui est exactement ce qui
 * fait croire que Candice n'écoute pas.
 */
export async function prochainesQuestionsPour(
  client: unknown,
  opts: { userId: string; combien?: number },
): Promise<{ questions: readonly QuestionAServir[]; diagnostic: unknown; manques: readonly string[] }> {
  const { etat, manques } = await lireEtat(client as never, { userId: opts.userId });
  const bloquant = manques.some((m) => m.includes('progression illisible'));
  if (bloquant) {
    console.error('[discovery] progression illisible — aucune question servie', manques);
    return { questions: [], diagnostic: { refuse: 'progression illisible' }, manques };
  }
  const r = prochainesQuestions(etat, { combien: opts.combien ?? 1 });
  if (manques.length > 0) console.warn('[discovery] état incomplet', manques);
  return { questions: r.choix.map(aServir), diagnostic: r.diagnostic, manques };
}

export class ReponseInvalideError extends Error {}

/** Ce qu'une réponse a produit, pour que l'appelant puisse le dire et le tracer. */
export interface ResultatReponse {
  readonly sourceId: string;
  readonly preuvesEcrites: number;
  /** Options retenues qui n'ont rien produit, avec le motif. Jamais silencieux. */
  readonly sansEmission: readonly { readonly option: string; readonly motif: string }[];
}

/**
 * Enregistre une réponse fermée : une ou plusieurs options choisies.
 *
 * UNE SEULE SOURCE pour toute la réponse — c'est un acte d'acquisition, pas une collection
 * d'actes. Les identifiants de preuve en dérivent, donc rejouer la MÊME réponse est
 * idempotent, tandis qu'une nouvelle réponse crée une nouvelle source et coexiste avec
 * l'ancienne : le journal n'écrase pas.
 *
 * Une option INCONNUE de la question fait tout échouer. Elle ne peut venir que d'un client
 * modifié ou d'un référentiel qui a bougé sous nos pieds : dans les deux cas, écrire une
 * partie de la réponse serait pire que n'écrire rien.
 */
export async function enregistrerReponseFermee(
  client: WriteClient,
  input: {
    readonly userId: string;
    readonly questionId: string;
    readonly clesOptions: readonly string[];
    readonly timestamp?: string;
  },
): Promise<ResultatReponse> {
  const q = questionParId(input.questionId);
  if (!q) throw new ReponseInvalideError(`question « ${input.questionId} » absente de la banque active`);
  if (q.forme === 'open') throw new ReponseInvalideError(`« ${q.id} » est une question ouverte : passe par l'enregistrement de texte libre`);
  if (input.clesOptions.length === 0) throw new ReponseInvalideError('aucune option choisie');
  if (q.forme === 'single' && input.clesOptions.length > 1) {
    throw new ReponseInvalideError(`« ${q.id} » n'accepte qu'une réponse, ${input.clesOptions.length} reçues`);
  }

  const parCle = new Map(q.options.map((o) => [cleOption(o), o] as const));
  const choisies: OptionV3[] = [];
  for (const cle of input.clesOptions) {
    const o = parCle.get(cle);
    if (!o) throw new ReponseInvalideError(`option « ${cle} » inconnue de « ${q.id} » — rien n'est écrit`);
    choisies.push(o);
  }

  const timestamp = input.timestamp ?? new Date().toISOString();
  const sourceId = randomUUID();
  const about = accountAbout(asUserId(input.userId));
  const source = createSourceRecord({
    about, ownerId: asUserId(input.userId), id: sourceId,
    sourceType: 'discovery_closed',
    questionText: q.enonce,
    answerText: choisies.map((o) => o.libelle).join(' · '),
    questionCode: q.id,
    timestamp,
  });

  const evidences: Evidence[] = [];
  const sansEmission: { option: string; motif: string }[] = [];
  for (const o of choisies) {
    const p = produireDepuisOption(q, o);
    if (p.type === 'rien') { sansEmission.push({ option: o.libelle, motif: p.motif }); continue; }
    for (const e of [p.evidence, ...(p.autres ?? [])]) evidences.push({
      ...e,
      about, ownerId: asUserId(input.userId),
      // ⚠ L'IDENTITÉ D'UNE PREUVE EST CELLE DE L'OPTION COCHÉE, pas seulement celle de sa cible.
      //    Dans une réponse multiple, plusieurs options visent la MÊME cible avec des valeurs
      //    différentes (« leur affection », « leur fidélité » → PREFERENCE.animals.value_sought).
      //    Dériver l'identifiant de la seule cible leur donnait le MÊME identifiant : la base
      //    n'en gardait qu'une, et le service annonçait pourtant les avoir toutes écrites.
      //    Mesuré le 18 nov. sur la pile locale : 3 produites, 1 relue ; 643 questions et
      //    5 390 options de la banque y étaient exposées. La clé de l'option rétablit une
      //    preuve par choix, et rejouer la même réponse reste idempotent.
      evidence_id: evidenceId(sourceId, `${e.target_family}:${e.target_construct}:${cleOption(o)}`),
      source_id: sourceId,
      source_type: 'discovery_closed',
      // L'option a été EXPLICITEMENT cochée par la personne : c'est la meilleure provenance
      // qu'une réponse fermée puisse avoir. `confidence` reste `medium` : une déclaration
      // est sûre sur ce qu'elle dit, pas sur sa portée — une seule réponse ne fait pas un trait.
      confidence: 'medium',
      evidence_role: 'primary',
      assertionStatus: 'explicit',
      assertionBasis: 'self_report',
      timestamp,
      version: JOURNAL_VERSION_STAMP,
    } as unknown as Evidence);
  }

  const idsDistincts = new Set(evidences.map((e) => e.evidence_id));
  if (idsDistincts.size !== evidences.length) {
    // Deux preuves de même identifiant s'écraseraient en base. On refuse plutôt que
    // d'annoncer un nombre d'écritures que la base ne contiendra pas.
    throw new Error(`« ${q.id} » : ${evidences.length} preuves pour ${idsDistincts.size} identifiants — rien n'est écrit`);
  }
  if (evidences.length > 0) {
    // La connaissance d'abord. Si ceci échoue, l'appelant NE marque pas la question posée :
    // mieux vaut la reposer que perdre la réponse en interdisant de la reposer.
    await persistKnowledge(client, { source, evidences });
  }
  if (sansEmission.length > 0) {
    console.warn('[discovery] options sans émission', q.id, sansEmission);
  }
  return { sourceId, preuvesEcrites: evidences.length, sansEmission };
}

/**
 * Enregistre une réponse OUVERTE : le verbatim, puis l'extraction.
 *
 * L'ORDRE N'EST PAS INTERCHANGEABLE. Le verbatim est l'AUTORITÉ : c'est la phrase que la
 * personne a écrite. L'extraction est une lecture de cette phrase par un modèle. Écrire
 * l'extraction d'abord, c'est risquer une inférence ORPHELINE — une affirmation sur la
 * personne sans que la phrase dont elle est tirée existe quelque part. Si le verbatim
 * échoue, l'extraction n'est pas tentée : mieux vaut ne rien savoir que savoir sans pouvoir
 * le justifier.
 *
 * LA BARRIÈRE DE LA QUESTION VOYAGE JUSQU'AU MODÈLE. `inferences_interdites` est la seule
 * chose qui l'empêche de conclure au-delà des mots — la banque refuse d'ailleurs toute
 * question ouverte qui n'en porte pas. Elle est donc jointe au contexte du champ, et pas
 * laissée dans le classeur.
 */
export interface ResultatOuverte {
  readonly verbatimEcrit: boolean;
  readonly verbatimSourceId: string;
  readonly preuvesExtraites: number;
  /** Le modèle n'a pas répondu : le verbatim est sauvegardé, sa lecture reste à faire. */
  readonly extractionEnAttente: boolean;
  /** `food2.0882A` seulement : ce que le contrat dédié a écrit. */
  readonly envie?: { readonly ecrite: boolean; readonly contraintes: number; readonly ecartes: readonly string[] };
}

/** Questions ouvertes qui ont un contrat propre, et ne passent PAS par l'extraction générale. */
const CONTRAT_ENVIE_CULINAIRE = 'food2.0882A';

export async function enregistrerReponseOuverte(
  client: WriteClient,
  input: {
    readonly userId: string;
    readonly questionId: string;
    readonly texte: string;
    readonly timestamp?: string;
  },
): Promise<ResultatOuverte> {
  const q = questionParId(input.questionId);
  if (!q) throw new ReponseInvalideError(`question « ${input.questionId} » absente de la banque active`);
  if (q.forme !== 'open') throw new ReponseInvalideError(`« ${q.id} » n'est pas une question ouverte`);
  const texte = input.texte.trim();
  if (texte.length === 0) throw new ReponseInvalideError('réponse vide');

  const barriere = q.inferences_interdites
    ?? q.options.find((o) => o.inferences_interdites)?.inferences_interdites;
  if (!barriere) {
    // La banque ne devrait pas contenir une telle question — elle les écarte à l'import.
    // Si l'une passe quand même, on ne l'extrait pas : une extraction sans barrière peut
    // transformer une phrase sur ce qu'on aime manger en allergie ou en régime religieux.
    throw new ReponseInvalideError(
      `« ${q.id} » n'a pas d'inférences interdites : extraire sans barrière est refusé`);
  }

  const timestamp = input.timestamp ?? new Date().toISOString();
  const about = accountAbout(asUserId(input.userId));
  const ownerId = asUserId(input.userId);
  const factType = `discovery.${q.id}`;

  // ── 1. LE VERBATIM, écrit comme FACT, AVANT TOUT APPEL AU MODÈLE. C'est lui qui fait
  //       autorité, et c'est la sauvegarde : si tout ce qui suit échoue, la phrase est là.
  //       La source dit d'où elle vient (`discovery_open`) — la première version la rangeait
  //       sous « onboarding », ce qui était faux.
  const verbatimSourceId = randomUUID();
  await persistKnowledge(client, {
    source: createSourceRecord({
      about, ownerId, id: verbatimSourceId, sourceType: 'discovery_open',
      questionCode: factType, questionText: q.enonce, rawText: texte, timestamp,
    }),
    facts: [createFact({
      about, ownerId, fact_id: factId(verbatimSourceId, factType, texte),
      fact_type: factType, value: texte, source: verbatimSourceId, timestamp,
      confidence: 'high', user_confirmed: true, assertionStatus: 'explicit',
    })],
  });

  // ── 2. LA LECTURE PAR LE MODÈLE, et seulement maintenant. Son échec ne retire pas le
  //       verbatim, et il est SIGNALÉ : `extractionEnAttente` dit qu'il faudra rejouer.
  try {
    if (q.id === CONTRAT_ENVIE_CULINAIRE) {
      const envie = await ecrireEnvieCulinaire(client, { userId: input.userId, texte, verbatimSourceId, timestamp });
      return { verbatimEcrit: true, verbatimSourceId, preuvesExtraites: 0, extractionEnAttente: false, envie };
    }
    const { extractFreeText } = await import('@/lib/knowledge-write/extract-free-text');
    const r = await extractFreeText(client, {
      about, ownerId, rawText: texte,
      // La barrière accompagne la question : le modèle lit les deux ensemble.
      fieldContext: `${q.enonce}\n\nINFÉRENCES INTERDITES : ${barriere}`,
      questionCode: factType, verbatimSourceId, timestamp,
    });
    return { verbatimEcrit: true, verbatimSourceId, preuvesExtraites: r.evidences.length, extractionEnAttente: false };
  } catch (e) {
    console.error('[discovery] lecture par le modèle impossible — verbatim conservé, à rejouer', q.id, e);
    return { verbatimEcrit: true, verbatimSourceId, preuvesExtraites: 0, extractionEnAttente: true };
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * `food2.0882A` — l'envie culinaire actuelle (contrat du 18 nov., voir envie-culinaire.ts).
 *
 * Une seule source, d'identifiant DÉRIVÉ de celle du verbatim : rejouer la lecture après une
 * panne retombe sur la même source et n'écrit rien deux fois. Cette source existe aussi
 * quand la réponse n'exprime aucune envie — c'est elle qui dit « lu, rien à écrire », et qui
 * distingue ce cas d'une lecture qui n'a pas encore eu lieu.
 * ──────────────────────────────────────────────────────────────────────────── */
export function sourceLectureEnvie(verbatimSourceId: string): string {
  return evidenceId('lecture-envie', verbatimSourceId);
}

async function ecrireEnvieCulinaire(
  client: WriteClient,
  input: { userId: string; texte: string; verbatimSourceId: string; timestamp: string },
): Promise<{ ecrite: boolean; contraintes: number; ecartes: readonly string[] }> {
  const { estAbsenceDEnvie, lireEnvieParModele, validerLecture, FAIT_ENVIE_CULINAIRE } = await import('./envie-culinaire');
  const about = accountAbout(asUserId(input.userId));
  const ownerId = asUserId(input.userId);
  const sourceId = sourceLectureEnvie(input.verbatimSourceId);

  const dejaLue = await (client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { maybeSingle(): Promise<{ data: unknown }> } } };
  }).from('knowledge_sources').select('id').eq('id', sourceId).maybeSingle();
  if (dejaLue.data) return { ecrite: false, contraintes: 0, ecartes: [] };

  // Un refus, une réponse vide, « aucune envie particulière » : décidé ICI, sans modèle.
  const lecture = estAbsenceDEnvie(input.texte)
    ? { exprimeEnvie: false, details: [], contraintes: [], ecartes: [] as string[] }
    : validerLecture(input.texte, await lireEnvieParModele(input.texte));   // LÈVE si le modèle est en panne

  const source = createSourceRecord({
    about, ownerId, id: sourceId, sourceType: 'extraction_inferred',
    questionCode: `discovery.${CONTRAT_ENVIE_CULINAIRE}`,
    questionText: 'Lecture de l’envie culinaire (contrat food2.0882A)', rawText: input.texte, timestamp: input.timestamp,
  });
  const facts = lecture.exprimeEnvie ? [createFact({
    about, ownerId, fact_id: factId(sourceId, FAIT_ENVIE_CULINAIRE, lecture.details.join(' ; ')),
    fact_type: FAIT_ENVIE_CULINAIRE,
    // Les détails que la personne a écrits, dans ses mots. Rien de plus.
    value: lecture.details.join(' ; '),
    // La période qu'elle a donnée, telle quelle. Absente si elle n'en a pas donné : on
    // n'écrit pas « en ce moment » à sa place.
    ...(lecture.periode ? { context: lecture.periode } : {}),
    source: sourceId, timestamp: input.timestamp,
    confidence: 'medium', user_confirmed: false, assertionStatus: 'inferred',
    // FAIT OUVERT : ni sujet, ni relation, ni effet. Sa destination plus précise (Carnet
    // d'envies ?) attend un arbitrage ; d'ici là il ne recommande et n'interdit rien.
  })] : [];
  const { createOpenKnowledge } = await import('@/lib/knowledge/open-knowledge');
  const { openKnowledgeId } = await import('@/lib/knowledge-write/ids');
  const { asSubjectId } = await import('@/lib/knowledge/identity');
  const { normalizeLabel } = await import('@/lib/knowledge/normalize');
  // La contrainte DÉCLARÉE À PART suit le chemin d'un texte libre : conservée telle quelle,
  // marquée sensible (donc jamais nommée dans un texte généré), sans veto ni garde-fou.
  const openKnowledge = lecture.contraintes.map((c) => createOpenKnowledge({
    about, ownerId, open_knowledge_id: openKnowledgeId(sourceId, normalizeLabel(c)),
    type: 'descriptive', subject: asSubjectId(normalizeLabel(c)), subjectLabel: c,
    relation: 'contrainte alimentaire déclarée', context: 'GLOBAL', source: sourceId,
    timestamp: input.timestamp, confidence: 'low', assertionStatus: 'inferred', sensitive: true,
  }));
  await persistKnowledge(client, { source, facts, openKnowledge });
  return { ecrite: facts.length > 0, contraintes: openKnowledge.length, ecartes: lecture.ecartes };
}

/**
 * REJOUE les lectures restées en attente : réponses ouvertes du Discovery dont le verbatim
 * est en base et dont la lecture par le modèle n'a pas abouti (panne, coupure).
 *
 * Sans doublon par construction : la lecture d'un verbatim a un identifiant dérivé de lui, et
 * on ne rappelle le modèle que si cette source n'existe pas. `max` borne le travail d'un appel.
 */
export async function rejouerLecturesEnAttente(
  client: WriteClient,
  input: { readonly userId: string; readonly max?: number },
): Promise<{ readonly examinees: number; readonly rejouees: number; readonly encoreEnAttente: number }> {
  const lecture = client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { eq(c: string, v: string):
      Promise<{ data: { id: string; question_code: string | null; raw_text: string | null; ts: string; about_id: string }[] | null; error: { message: string } | null }> } } };
  };
  const { data, error } = await lecture.from('knowledge_sources')
    .select('id, question_code, raw_text, ts, about_id').eq('user_id', input.userId).eq('source_type', 'discovery_open');
  if (error) throw new Error(`lecture des verbatims impossible : ${error.message}`);
  const { extractFreeText, extractionSourceId } = await import('@/lib/knowledge-write/extract-free-text');
  const about = accountAbout(asUserId(input.userId));
  const ownerId = asUserId(input.userId);
  const existe = async (id: string) => !!(await (client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { maybeSingle(): Promise<{ data: unknown }> } } };
  }).from('knowledge_sources').select('id').eq('id', id).maybeSingle()).data;

  let examinees = 0, rejouees = 0, encoreEnAttente = 0;
  for (const v of data ?? []) {
    if (v.about_id !== input.userId || !v.question_code || !v.raw_text) continue;
    const qid = v.question_code.replace(/^discovery\./, '');
    const q = questionParId(qid);
    if (!q || q.forme !== 'open') continue;
    examinees++;
    const estEnvie = qid === CONTRAT_ENVIE_CULINAIRE;
    const barriere = q.inferences_interdites ?? q.options.find((o) => o.inferences_interdites)?.inferences_interdites;
    const entree = {
      about, ownerId, rawText: v.raw_text,
      fieldContext: `${q.enonce}\n\nINFÉRENCES INTERDITES : ${barriere ?? ''}`,
      questionCode: v.question_code, verbatimSourceId: v.id, timestamp: v.ts,
    };
    const attendue = estEnvie ? sourceLectureEnvie(v.id) : extractionSourceId(entree);
    if (await existe(attendue)) continue;                       // déjà lue : rien à faire
    if (rejouees >= (input.max ?? 5)) { encoreEnAttente++; continue; }
    try {
      if (estEnvie) await ecrireEnvieCulinaire(client, { userId: input.userId, texte: v.raw_text, verbatimSourceId: v.id, timestamp: v.ts });
      else {
        if (!barriere) continue;
        await extractFreeText(client, entree);
      }
      rejouees++;
    } catch (e) {
      encoreEnAttente++;
      console.error('[discovery] rejeu impossible, la lecture reste en attente', qid, e);
    }
  }
  return { examinees, rejouees, encoreEnAttente };
}

/* ────────────────────────────────────────────────────────────────────────────
 * LA DÉMARCHE EXPLICITE — « je veux explorer ce sujet ».
 *
 * Certaines questions sont sensibles ET ouvrables : la branche « causes », par décision du
 * 18 nov. Elles ne s'ouvrent que si la personne en a fait la démarche. Cette démarche doit
 * être un ACTE ÉCRIT, daté, et réversible — pas un paramètre d'URL : un lien glissé dans une
 * notification choisie par un score aurait sinon valeur de consentement.
 *
 * L'acte est un FAIT du journal, écrit sous l'identité de la personne. Y revenir le
 * supersède : il n'est pas effacé, il cesse d'être vivant, et les questions se referment.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Les branches qui portent au moins une question « à ouverture sur démarche explicite ». */
export function branchesSurDemarche(): readonly string[] {
  const b = new Set<string>();
  for (const q of BANQUE) if (analyserCondition(q.condition_emission).ouvertureSurDemarche) b.add(q.branche);
  return [...b].sort();
}

interface ClientSujets extends WriteClient {
  from(table: string): never;
}

/**
 * Enregistre (ou retire) la démarche de la personne pour une branche.
 * Refuse une branche qui n'attend aucune démarche : on n'écrit pas un consentement sans objet.
 */
export async function declarerSujet(
  client: ClientSujets,
  input: { readonly userId: string; readonly branche: string; readonly choisi: boolean;
           readonly origine?: 'choix' | 'texte_libre'; readonly timestamp?: string },
): Promise<{ readonly etat: 'choisi' | 'retire' | 'inchange' }> {
  if (!branchesSurDemarche().includes(input.branche)) {
    throw new ReponseInvalideError(`« ${input.branche} » n'est pas un sujet qui s'ouvre sur démarche`);
  }
  const timestamp = input.timestamp ?? new Date().toISOString();
  const about = accountAbout(asUserId(input.userId));
  const type = input.origine === 'texte_libre' ? FAIT_SUJET_ABORDE : FAIT_SUJET_CHOISI;
  const lecture = client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null):
      Promise<{ data: { source: string; fact_type: string; value: string; about_id: string }[] | null; error: { message: string } | null }> } } };
  };
  const { data, error } = await lecture.from('knowledge_facts')
    .select('source, fact_type, value, about_id').eq('user_id', input.userId).is('superseded_at', null);
  if (error) throw new Error(`lecture des sujets choisis impossible : ${error.message}`);
  const vivants = (data ?? []).filter((f) => f.about_id === input.userId && f.value === input.branche
    && (f.fact_type === FAIT_SUJET_CHOISI || f.fact_type === FAIT_SUJET_ABORDE));

  const sourceId = randomUUID();
  if (input.choisi) {
    if (vivants.some((f) => f.fact_type === type)) return { etat: 'inchange' };
    const source = createSourceRecord({
      about, ownerId: asUserId(input.userId), id: sourceId,
      sourceType: 'user_declaration',
      questionCode: type,
      questionText: input.origine === 'texte_libre'
        ? 'Sujet abordé spontanément dans un texte libre' : 'Sujet que la personne a choisi d’explorer',
      answerText: input.branche, timestamp,
    });
    const fact = createFact({
      about, ownerId: asUserId(input.userId),
      fact_id: factId(sourceId, type, input.branche),
      fact_type: type, value: input.branche, source: sourceId, timestamp,
      confidence: 'high', user_confirmed: input.origine !== 'texte_libre', assertionStatus: 'explicit',
    });
    await persistKnowledge(client, { source, facts: [fact] });
    return { etat: 'choisi' };
  }

  // RETRAIT : la personne revient sur sa démarche. TOUT ce qui ouvrait la branche est retiré,
  // le choix comme la mention spontanée — elle dit non, et c'est son dernier mot qui compte.
  if (vivants.length === 0) return { etat: 'inchange' };
  const source = createSourceRecord({
    about, ownerId: asUserId(input.userId), id: sourceId,
    sourceType: 'user_declaration', questionCode: `${FAIT_SUJET_CHOISI}.retrait`,
    questionText: 'La personne ne souhaite plus explorer ce sujet', answerText: input.branche, timestamp,
  });
  await persistKnowledge(client, { source });
  await supersedeSources(client as never, {
    oldSourceIds: [...new Set(vivants.map((f) => f.source))], newSourceId: sourceId, timestamp,
  });
  return { etat: 'retire' };
}
