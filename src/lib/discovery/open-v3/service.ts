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
import { lireEtat } from './etat';
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
    const e = p.evidence;
    evidences.push({
      ...e,
      about, ownerId: asUserId(input.userId),
      evidence_id: evidenceId(sourceId, `${e.target_family}:${e.target_construct}`),
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
export async function enregistrerReponseOuverte(
  client: WriteClient,
  input: {
    readonly userId: string;
    readonly questionId: string;
    readonly texte: string;
    readonly timestamp?: string;
  },
): Promise<{ readonly verbatimEcrit: boolean; readonly preuvesExtraites: number }> {
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

  // ── 1. LE VERBATIM, écrit comme FACT. C'est lui qui fait autorité.
  const { produceSocleFact } = await import('@/lib/questionnaire/produce-socle');
  await produceSocleFact(client, {
    userId: input.userId,
    entries: [{ spec: { factType: `discovery.${q.id}`, questionText: q.enonce }, value: texte }],
    timestamp,
  });

  // ── 2. L'EXTRACTION, et seulement maintenant. Son échec ne retire pas le verbatim : la
  //       phrase reste, et c'est le minimum qu'on devait à la personne qui l'a écrite.
  const { extractFreeText } = await import('@/lib/knowledge-write/extract-free-text');
  let preuvesExtraites = 0;
  try {
    const r = await extractFreeText(client, {
      about: accountAbout(asUserId(input.userId)),
      ownerId: asUserId(input.userId),
      rawText: texte,
      // La barrière accompagne la question : le modèle lit les deux ensemble.
      fieldContext: `${q.enonce}\n\nINFÉRENCES INTERDITES : ${barriere}`,
      questionCode: `discovery.${q.id}`,
      timestamp,
    });
    preuvesExtraites = r.evidences.length;
  } catch (e) {
    console.error('[discovery] extraction impossible, le verbatim est conservé', q.id, e);
  }
  return { verbatimEcrit: true, preuvesExtraites };
}
