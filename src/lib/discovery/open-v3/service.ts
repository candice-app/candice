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
import { lireEtat, FAIT_SUJET_CHOISI, FAIT_SUJET_ABORDE, FAIT_SUJET_REFUSE, FAIT_PROJET, lireProjet, type Projet } from './etat';
import { memeSujet } from './correspondances';
import { enonceRempli } from './parametres';
import type { EtatDiscovery, TypeDeProjet } from './conditions';
import { analyserCondition } from './conditions';
import { BANQUE } from './banque';
import { createFact } from '@/lib/knowledge/fact';
import { contexteDeProjet } from '@/lib/knowledge/read-journal';
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
export { cleOption } from './cle-option';
import { cleOption } from './cle-option';
import { relationsAdmises, OUVERTES_ARCHIVEES } from './contrats-ouverts';
import aliasOptions from './alias-options.json';
import { DESTINATIONS_PAR_QUESTION } from './destinations';
import { ecrireDestinations, sourceLectureDestinations, type LecteurDeSegments, type ResultatDestinations } from './destinations-ecriture';
export { sourceLectureDestinations, type LecteurDeSegments, type ResultatDestinations };
import { libelleBranche } from './branches';
import { poolDe, estPrioritaire } from './coexistence';

const libelleDuPool = (branche: string): string | null => {
  const pool = poolDe(branche);
  for (const b of new Set(BANQUE.map((q) => q.branche))) if (b !== branche && poolDe(b) === pool && libelleBranche(b)) return libelleBranche(b);
  return null;
};

/** Forme attendue par l'écran. Le type de question suit la forme du référentiel. */
export interface QuestionAServir {
  readonly question_key: string;
  readonly dimension: string;
  /** Nom lisible de la branche, ou `null` : l'écran n'affiche alors rien. */
  readonly libelle: string | null;
  readonly question_text: string;
  readonly question_type: 'chips_single' | 'chips_multi' | 'text';
  readonly options: readonly { readonly label: string; readonly value: string }[] | null;
  /** Texte du référentiel, validé. JAMAIS reformulé par un modèle. */
  readonly locked_text: true;
  /** Pourquoi cette question a été choisie. De quoi répondre à la personne qui demande. */
  readonly motif: string;
}

function aServir(c: Choix, etat: Pick<EtatDiscovery, 'objetsDeProjet'> = {}): QuestionAServir {
  const q = c.question;
  const type = q.forme === 'open' ? 'text'
    : q.forme === 'single' ? 'chips_single' : 'chips_multi';
  return {
    question_key: q.id,
    dimension: q.branche,
    // Le nom que la personne lit : celui du référentiel, ou celui de l'autre génération du
    // même domaine. Jamais l'identifiant technique.
    libelle: libelleBranche(q.branche) ?? libelleDuPool(q.branche),
    // Un énoncé à paramètre est servi REMPLI, depuis sa source autorisée — ou n'est pas servi.
    question_text: enonceRempli(q, etat),
    question_type: type,
    options: type === 'text' ? null : q.options.filter((o) => !estAliasMasque(q.id, o)).map((o) => ({ label: o.libelle, value: cleOption(o) })),
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
  return { questions: r.choix.map((c) => aServir(c, etat)), diagnostic: r.diagnostic, manques };
}

/** Une réponse donnée pour un projet en cours. `value` = JSON { projet, question, option, contrat }. */
export const FAIT_REPONSE_DE_PROJET = 'discovery.reponse_de_projet';
/** Un paramètre d'action répondu pour un projet (« pour cet achat… ») : il vit et s'éteint avec lui. */
export const FAIT_PARAMETRE_DE_PROJET = 'discovery.parametre_de_projet';

const ALIAS = new Map<string, string>((aliasOptions as { alias: { question: string; rang_canonique: string; rang_alias: string }[] }).alias
  .map((a) => [`${a.question}|r${a.rang_alias}`, `r${a.rang_canonique}`] as [string, string]));
/** La clé de l'option canonique quand la clé reçue est celle d'un alias masqué (onglet 6). */
export const optionCanonique = (questionId: string, cle: string): string => ALIAS.get(`${questionId}|${cle}`) ?? cle;
/** Vrai si cette option est un alias masqué : conservée pour les réponses historiques, jamais affichée. */
export const estAliasMasque = (questionId: string, o: OptionV3): boolean => ALIAS.has(`${questionId}|${cleOption(o)}`);

export class ReponseInvalideError extends Error {}
/** Le même acte existe déjà avec une AUTRE réponse : ce n'est pas un renvoi, c'est refusé. */
export class ActeDejaEnregistreError extends ReponseInvalideError {}

/** L'identifiant de source d'un acte : dérivé, donc le même pour la même requête renvoyée. */
export function sourceDeLActe(type: 'discovery_closed' | 'discovery_open', userId: string, questionId: string, acteId: string): string {
  return evidenceId(type, `${userId}:${questionId}:acte:${acteId}`);
}

interface LigneSource { id: string; option_ref: string | null; raw_text: string | null; ts: string; source_type: string }
/** Toutes les sources d'une question pour ce compte et cette voie, vivantes ou non. */
async function sourcesDeLaQuestion(client: WriteClient, userId: string, type: string, questionCode: string): Promise<LigneSource[]> {
  const lecture = client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { eq(c: string, v: string): { eq(c: string, v: string):
      Promise<{ data: LigneSource[] | null; error: { message: string } | null }> } } } };
  };
  const { data, error } = await lecture.from('knowledge_sources').select('id, option_ref, raw_text, ts, source_type')
    .eq('user_id', userId).eq('source_type', type).eq('question_code', questionCode);
  if (error) throw new Error(`lecture des réponses précédentes impossible : ${error.message}`);
  return data ?? [];
}

/**
 * LE DERNIER MOT : parmi les actes d'une question, le plus récent reste vivant, les autres
 * cessent de l'être. Le plus récent est décidé par l'instant puis par l'identifiant — une
 * règle que deux requêtes simultanées appliquent à l'identique. Celle qui a écrit le dernier
 * mot retire les autres ; celle qui ne l'a pas écrit ne retire que le sien.
 */
async function reconcilierDernierMot(
  client: WriteClient, userId: string, type: 'discovery_closed' | 'discovery_open', questionCode: string, moi: string, timestamp: string,
  derivees: readonly string[] = [],
): Promise<{ readonly dernierMot: boolean }> {
  const tous = await sourcesDeLaQuestion(client, userId, type, questionCode);
  const rang = (x: LigneSource) => `${new Date(x.ts).toISOString()}|${x.id}`;
  const dernier = tous.reduce<LigneSource | null>((m, x) => (!m || rang(x) > rang(m) ? x : m), null);
  if (!dernier || dernier.id === moi) {
    await supersedeSources(client as never, { oldSourceIds: [...tous.map((x) => x.id), ...derivees].filter((id) => id !== moi), newSourceId: moi, timestamp });
    return { dernierMot: true };
  }
  await supersedeSources(client as never, { oldSourceIds: [moi], newSourceId: dernier.id, timestamp });
  return { dernierMot: false };
}

/** Ce qu'une réponse a produit, pour que l'appelant puisse le dire et le tracer. */
export interface ResultatReponse {
  /** La même réponse existait déjà, vivante : rien n'a été réécrit. */
  readonly dejaFaite?: boolean;
  readonly sourceId: string;
  /** L'instant de l'acte : celui de la première écriture, y compris quand il est renvoyé. */
  readonly timestamp: string;
  readonly preuvesEcrites: number;
  /** Faits écrits : options de fait, ou réponses rattachées à un projet. */
  readonly faitsEcrits: number;
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
    /** Identité de l'acte : « cette question dans ce lot ». Voir lot.ts. */
    readonly acteId: string;
    /** Le projet en cours auquel cette réponse appartient (question de niveau C, achat ou séjour
     *  concret). La réponse est alors rattachée au projet et n'écrit AUCUNE connaissance générale. */
    readonly projet?: Projet;
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
  for (const cleRecue of input.clesOptions) {
    // Un alias (onglet 6) « produit EXACTEMENT la même connaissance que l'option canonique ».
    const cle = optionCanonique(q.id, cleRecue);
    const o = parCle.get(cle);
    if (!o) throw new ReponseInvalideError(`option « ${cle} » inconnue de « ${q.id} » — rien n'est écrit`);
    choisies.push(o);
  }

  const timestamp = input.timestamp ?? new Date().toISOString();
  // ── L'IDENTITÉ D'UNE RÉPONSE EST CELLE DE L'ACTE, pas celle de son contenu.
  //
  //    Première version : un identifiant tiré au hasard — un double envoi doublait chaque
  //    preuve. Deuxième version (19 nov. au matin) : un identifiant dérivé des options
  //    cochées — le double envoi ne comptait plus, mais deux actes distincts de même contenu
  //    étaient confondus : après A, puis B, un nouvel A retombait sur l'identifiant du
  //    premier, et il fallait une rustine (le rang) pour l'en distinguer.
  //    L'acte est « la réponse à cette question dans ce lot proposé » (`acteId`, fourni par
  //    l'appelant à partir du lot signé). La même requête renvoyée porte le même acte : rien
  //    n'est réécrit. Un autre lot est un autre acte, même si les options sont identiques.
  if (!input.acteId?.trim()) throw new ReponseInvalideError('acte sans identité : une réponse appartient à un lot proposé');
  const clesTriees = [...new Set(input.clesOptions.map((c) => optionCanonique(q.id, c)))].sort();
  const optionRef = clesTriees.join(',');
  const sourceId = sourceDeLActe('discovery_closed', input.userId, q.id, input.acteId);
  const actes = await sourcesDeLaQuestion(client, input.userId, 'discovery_closed', q.id);
  const meme = actes.find((x) => x.id === sourceId);
  if (meme) {
    // LE MÊME ACTE : la requête a été renvoyée (double clic, reprise après coupure, rejeu).
    // S'il porte une AUTRE réponse, ce n'est pas un renvoi : un acte ne se réécrit pas.
    if ((meme.option_ref ?? '') !== optionRef) {
      throw new ActeDejaEnregistreError(`« ${q.id} » a déjà reçu une autre réponse dans ce parcours — rien n'est écrit`);
    }
    return { sourceId, preuvesEcrites: 0, faitsEcrits: 0, sansEmission: [], dejaFaite: true, timestamp: meme.ts };
  }
  const about = accountAbout(asUserId(input.userId));
  const source = createSourceRecord({
    about, ownerId: asUserId(input.userId), id: sourceId,
    sourceType: 'discovery_closed',
    questionText: q.enonce,
    answerText: choisies.map((o) => o.libelle).join(' · '),
    questionCode: q.id,
    // Les clés des options, telles que le navigateur les a renvoyées : de quoi reconnaître le
    // même acte, et relire ce qui a été coché sans dépendre de la progression.
    optionRef,
    ...(input.projet ? { branchId: `projet:${input.projet.id}` } : {}),
    timestamp,
  });

  const evidences: Evidence[] = [];
  const facts: ReturnType<typeof createFact>[] = [];
  const sansEmission: { option: string; motif: string }[] = [];
  for (const o of choisies) {
    const p = produireDepuisOption(q, o);
    // ── UNE RÉPONSE DONNÉE POUR UN PROJET APPARTIENT AU PROJET (décision n° 4). « Pour cet achat,
    //    plutôt un petit format » ne dit pas que la personne préfère les petits formats : écrite
    //    comme une préférence, elle compterait un jour pour un goût général. Elle est gardée comme
    //    un FAIT rattaché au projet, avec le contrat exact de l'option, et n'entre dans aucune
    //    consolidation. Clos, le projet garde ses réponses ; elles n'ouvrent ni n'interdisent rien.
    // ── UNE RÉPONSE DONNÉE POUR UN PROJET GARDE SON SENS, DANS LA PORTÉE DU PROJET. Le contrat de
    //    l'option s'écrit tel quel — préférence, garde-fou, fait — et son `context` porte le
    //    projet : les lecteurs généraux l'écartent (read-journal.ts), le lecteur du projet la
    //    retrouve structurée. Un PARAMÈTRE D'ACTION (« pour cet achat, un budget de… »), qui
    //    n'écrit rien hors projet, est ici un fait du projet : c'est sa seule raison d'être.
    const contexte = input.projet ? contexteDeProjet(input.projet.id) : undefined;
    if (input.projet && p.type === 'rien') {
      if (p.motif !== 'action_interface') { sansEmission.push({ option: o.libelle, motif: p.motif }); continue; }
      facts.push(createFact({ about, ownerId: asUserId(input.userId), fact_id: factId(sourceId, FAIT_PARAMETRE_DE_PROJET, `${q.id}:${cleOption(o)}`),
        fact_type: FAIT_PARAMETRE_DE_PROJET, context: contexte,
        value: JSON.stringify({ projet: input.projet.id, question: q.id, option: cleOption(o), libelle: o.libelle, ...(o.attribut ? { attribut: o.attribut } : {}), ...(o.valeur ? { valeur: o.valeur } : {}) }),
        source: sourceId, timestamp, confidence: 'high', user_confirmed: true, assertionStatus: 'explicit' }));
      continue;
    }
    if (p.type === 'fait') {
      facts.push(createFact({ about, ownerId: asUserId(input.userId), fact_id: factId(sourceId, p.fait.factType, `${p.fait.valeur}:${cleOption(o)}`),
        fact_type: p.fait.factType,
        // La valeur du contrat, avec sa polarité et sa stabilité : un fait « sous condition » ou
        // « temporaire » ne doit pas se relire comme un fait acquis.
        value: JSON.stringify({ valeur: p.fait.valeur, ...(p.fait.polarite ? { polarite: p.fait.polarite } : {}), ...(p.fait.stabilite ? { stabilite: p.fait.stabilite } : {}), question: q.id, libelle: o.libelle,
          ...(input.projet ? { projet: input.projet.id } : {}) }),
        ...(contexte ? { context: contexte } : {}),
        source: sourceId, timestamp, confidence: 'high', user_confirmed: true, assertionStatus: 'explicit' }));
      continue;
    }
    if (p.type === 'rien') { sansEmission.push({ option: o.libelle, motif: p.motif }); continue; }
    for (const e of [p.evidence, ...(p.autres ?? [])]) evidences.push({
      ...e,
      // Dans un projet, le contexte EST le projet : c'est lui qui borne la portée de la preuve.
      ...(contexte ? { context: contexte } : {}),
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
  // La connaissance d'abord. Si ceci échoue, l'appelant NE marque pas la question posée :
  // mieux vaut la reposer que perdre la réponse en interdisant de la reposer.
  // LA SOURCE EST ÉCRITE MÊME SANS PREUVE : l'acte a eu lieu, et c'est elle qui permet de
  // reconnaître son renvoi. Une réponse dont aucune option n'émet reste un acte.
  const issue = await persistKnowledge(client, { source, evidences, facts });
  // LE DERNIER MOT COMPTE, et un seul. On relit APRÈS avoir écrit : deux actes arrivés en même
  // temps se voient alors l'un l'autre, et les deux requêtes concluent pareil.
  await reconcilierDernierMot(client, input.userId, 'discovery_closed', q.id, sourceId, timestamp);
  if (sansEmission.length > 0) {
    console.warn('[discovery] options sans émission', q.id, sansEmission);
  }
  // Deux requêtes du MÊME acte arrivées ensemble passent toutes deux le contrôle d'existence ;
  // la base n'en écrit qu'une (identifiants dérivés). Celle dont l'écriture a été absorbée
  // n'a pas créé l'acte : elle le dit, pour que rien ne se compte deux fois.
  if (issue === 'replayed') return { sourceId, preuvesEcrites: 0, faitsEcrits: 0, sansEmission, timestamp, dejaFaite: true };
  return { sourceId, preuvesEcrites: evidences.length, faitsEcrits: facts.length, sansEmission, timestamp };
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
  /** Le même acte existait déjà : rien n'a été réécrit, le modèle n'a pas été rappelé. */
  readonly dejaFaite?: boolean;
  /** L'instant de l'acte : celui de la première écriture, y compris quand il est renvoyé. */
  readonly timestamp: string;
  readonly verbatimEcrit: boolean;
  readonly verbatimSourceId: string;
  readonly preuvesExtraites: number;
  /** Le modèle n'a pas répondu : le verbatim est sauvegardé, sa lecture reste à faire. */
  readonly extractionEnAttente: boolean;
  /** La réponse appartient à ce projet : aucune lecture générale n'en est faite. */
  readonly rattacheeAuProjet?: string;
  /** Questions de l'onglet 17 : ce que leurs destinations ont écrit, et ce qui est resté au verbatim. */
  readonly destinations?: ResultatDestinations;
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
    /** Identité de l'acte : « cette question dans ce lot ». Voir lot.ts. */
    readonly acteId: string;
    /** Le projet en cours auquel cette réponse appartient : le verbatim lui est rattaché, et
     *  aucune connaissance générale n'en est tirée (l'envie culinaire garde son contrat propre). */
    readonly projet?: Projet;
    /** Lecteur de segments (onglet 17). Ne se passe qu'en essai ; par défaut, le modèle. */
    readonly lecteur?: LecteurDeSegments;
    readonly timestamp?: string;
  },
): Promise<ResultatOuverte> {
  const q = questionParId(input.questionId);
  if (!q) throw new ReponseInvalideError(`question « ${input.questionId} » absente de la banque active`);
  if (q.forme !== 'open') throw new ReponseInvalideError(`« ${q.id} » n'est pas une question ouverte`);
  if (OUVERTES_ARCHIVEES.has(q.id)) throw new ReponseInvalideError(`« ${q.id} » est archivée par le référentiel : elle n'est ni servie ni lue`);
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
  if (!input.acteId?.trim()) throw new ReponseInvalideError('acte sans identité : une réponse appartient à un lot proposé');
  const verbatimSourceId = sourceDeLActe('discovery_open', input.userId, q.id, input.acteId);
  const actes = await sourcesDeLaQuestion(client, input.userId, 'discovery_open', factType);
  const meme = actes.find((x) => x.id === verbatimSourceId);
  if (meme) {
    // LE MÊME ACTE, renvoyé. Le verbatim est déjà là ; sa lecture, si elle manque, est reprise
    // par le rejeu des lectures en attente — on ne rappelle pas le modèle sur le chemin de la
    // personne pour une requête qu'elle a déjà faite.
    if ((meme.raw_text ?? '').trim() !== texte) {
      throw new ActeDejaEnregistreError(`« ${q.id} » a déjà reçu une autre réponse dans ce parcours — rien n'est écrit`);
    }
    return { verbatimEcrit: false, dejaFaite: true, verbatimSourceId, preuvesExtraites: 0, extractionEnAttente: false, timestamp: meme.ts };
  }
  // Les lectures tirées des réponses précédentes à cette question (même code, voie inférée)
  // tombent avec elles : une inférence ne survit pas à la phrase dont elle a été tirée.
  const lecturesAnciennes = (await sourcesDeLaQuestion(client, input.userId, 'extraction_inferred', factType)).map((x) => x.id);
  const issueVerbatim = await persistKnowledge(client, {
    source: createSourceRecord({
      about, ownerId, id: verbatimSourceId, sourceType: 'discovery_open',
      questionCode: factType, questionText: q.enonce, rawText: texte, timestamp,
      ...(input.projet ? { branchId: `projet:${input.projet.id}` } : {}),
    }),
    facts: [createFact({
      about, ownerId, fact_id: factId(verbatimSourceId, factType, texte),
      fact_type: factType, value: texte, source: verbatimSourceId, timestamp,
      ...(input.projet ? { context: `projet:${input.projet.id}` } : {}),
      confidence: 'high', user_confirmed: true, assertionStatus: 'explicit',
    })],
  });
  // La requête jumelle du même acte a écrit le verbatim la première : elle seule le fait lire.
  if (issueVerbatim === 'replayed') return { verbatimEcrit: false, dejaFaite: true, verbatimSourceId, preuvesExtraites: 0, extractionEnAttente: false, timestamp };
  const { dernierMot } = await reconcilierDernierMot(client, input.userId, 'discovery_open', factType, verbatimSourceId, timestamp, lecturesAnciennes);
  // Un acte arrivé en même temps est plus récent : c'est lui qui sera lu, pas celui-ci.
  if (!dernierMot) return { verbatimEcrit: true, verbatimSourceId, preuvesExtraites: 0, extractionEnAttente: false, timestamp };

  // UNE RÉPONSE DE PROJET N'EST PAS LUE POUR EN TIRER UNE CONNAISSANCE GÉNÉRALE : la phrase est
  // gardée, rattachée au projet. Seule l'envie culinaire, qui a son contrat propre, est lue.
  if (input.projet && q.id !== CONTRAT_ENVIE_CULINAIRE) {
    return { verbatimEcrit: true, verbatimSourceId, preuvesExtraites: 0, extractionEnAttente: false, timestamp, rattacheeAuProjet: input.projet.id };
  }

  // ── 2. LA LECTURE PAR LE MODÈLE, et seulement maintenant. Son échec ne retire pas le
  //       verbatim, et il est SIGNALÉ : `extractionEnAttente` dit qu'il faudra rejouer.
  try {
    if (q.id === CONTRAT_ENVIE_CULINAIRE) {
      const envie = await ecrireEnvieCulinaire(client, { userId: input.userId, texte, verbatimSourceId, timestamp });
      return { verbatimEcrit: true, verbatimSourceId, preuvesExtraites: 0, extractionEnAttente: false, envie, timestamp };
    }
    // Les questions de l'onglet 17 ont un contrat de destinations : lui seul décide de ce qui s'écrit.
    if (DESTINATIONS_PAR_QUESTION.has(q.id)) {
      const d = await ecrireDestinations(client, { userId: input.userId, question: q, texte, barriere, verbatimSourceId, timestamp, ...(input.lecteur ? { lecteur: input.lecteur } : {}) });
      return { verbatimEcrit: true, verbatimSourceId, preuvesExtraites: d.preuves, extractionEnAttente: false, timestamp, destinations: d };
    }
    const { extractFreeText } = await import('@/lib/knowledge-write/extract-free-text');
    const r = await extractFreeText(client, {
      about, ownerId, rawText: texte,
      // La barrière accompagne la question : le modèle lit les deux ensemble.
      fieldContext: `${q.enonce}\n\nINFÉRENCES INTERDITES : ${barriere}`,
      questionCode: factType, verbatimSourceId, timestamp,
      // Le contrat de la question borne les relations qu'une entité peut y recevoir.
      ...(relationsAdmises(q.id) ? { relationsAdmises: relationsAdmises(q.id) } : {}),
    });
    return { verbatimEcrit: true, verbatimSourceId, preuvesExtraites: r.evidences.length, extractionEnAttente: false, timestamp };
  } catch (e) {
    console.error('[discovery] lecture par le modèle impossible — verbatim conservé, à rejouer', q.id, e);
    return { verbatimEcrit: true, verbatimSourceId, preuvesExtraites: 0, extractionEnAttente: true, timestamp };
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

  // UNE RÉPONSE REMPLACÉE N'EST PLUS LUE : sa phrase reste au journal, mais en tirer une
  // connaissance aujourd'hui ferait revivre ce que la personne a corrigé.
  const { data: faitsVivants, error: eFaits } = await (client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null):
      Promise<{ data: { source: string }[] | null; error: { message: string } | null }> } } };
  }).from('knowledge_facts').select('source').eq('user_id', input.userId).is('superseded_at', null);
  if (eFaits) throw new Error(`lecture des verbatims vivants impossible : ${eFaits.message}`);
  const vivants = new Set((faitsVivants ?? []).map((f) => f.source));

  let examinees = 0, rejouees = 0, encoreEnAttente = 0;
  for (const v of data ?? []) {
    if (v.about_id !== input.userId || !v.question_code || !v.raw_text) continue;
    if (!vivants.has(v.id)) continue;
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
      // Le rejeu applique le MÊME contrat que la première lecture.
      ...(relationsAdmises(qid) ? { relationsAdmises: relationsAdmises(qid) } : {}),
    };
    const aDestinations = DESTINATIONS_PAR_QUESTION.has(qid);
    const attendue = estEnvie ? sourceLectureEnvie(v.id) : aDestinations ? sourceLectureDestinations(v.id) : extractionSourceId(entree);
    if (await existe(attendue)) continue;                       // déjà lue : rien à faire
    if (rejouees >= (input.max ?? 5)) { encoreEnAttente++; continue; }
    try {
      if (estEnvie) await ecrireEnvieCulinaire(client, { userId: input.userId, texte: v.raw_text, verbatimSourceId: v.id, timestamp: v.ts });
      else if (aDestinations) await ecrireDestinations(client, { userId: input.userId, question: q, texte: v.raw_text, barriere: barriere ?? '', verbatimSourceId: v.id, timestamp: v.ts });
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
  if (!branchesSurDemarche().includes(input.branche) && !sujetsExplorables().some((x) => x.branche === input.branche)) {
    throw new ReponseInvalideError(`« ${input.branche} » n'est pas un sujet que l'on peut choisir d'explorer`);
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
    // Le dernier mot compte : choisir d'explorer un sujet retire le refus qu'on en avait fait.
    if (input.origine !== 'texte_libre') {
      const refus = await faitsVivantsDuSujet(client, input.userId, input.branche, [FAIT_SUJET_REFUSE]);
      if (refus.length > 0) await supersedeSources(client as never, { oldSourceIds: [...new Set(refus.map((f) => f.source))], newSourceId: sourceId, timestamp });
    }
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


/* ────────────────────────────────────────────────────────────────────────────
 * LE REFUS EXPLICITE — « ne plus me poser de questions sur ce sujet ».
 *
 * Quatre choses distinctes, que la première version confondait : la PLACE qu'un domaine tient
 * aujourd'hui, le fait de l'APPRÉCIER, l'ENVIE de l'explorer, et le REFUS d'en parler. Une
 * réponse « très peu de place » était lue comme un refus. Le refus est désormais un acte que
 * la personne fait elle-même, daté, réversible, écrit sous son identité — et c'est le seul qui
 * arrête les questions d'un sujet. Il n'écrit AUCUNE préférence : refuser d'en parler ne dit
 * pas qu'on n'aime pas.
 * Refuser un sujet retire la démarche « explorer ce sujet » ; choisir de l'explorer retire le
 * refus : le dernier mot compte.
 * ──────────────────────────────────────────────────────────────────────────── */
async function faitsVivantsDuSujet(client: ClientSujets, userId: string, branche: string, types: readonly string[]) {
  const lecture = client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null):
      Promise<{ data: { source: string; fact_type: string; value: string; about_id: string }[] | null; error: { message: string } | null }> } } };
  };
  const { data, error } = await lecture.from('knowledge_facts').select('source, fact_type, value, about_id').eq('user_id', userId).is('superseded_at', null);
  if (error) throw new Error(`lecture des sujets impossible : ${error.message}`);
  const sujet = new Set(memeSujet(branche));
  return (data ?? []).filter((f) => f.about_id === userId && types.includes(f.fact_type) && sujet.has(f.value));
}

export async function refuserSujet(
  client: ClientSujets,
  input: { readonly userId: string; readonly branche: string; readonly refuse: boolean; readonly timestamp?: string },
): Promise<{ readonly etat: 'refuse' | 'repris' | 'inchange' }> {
  if (!BRANCHES_CONNUES.has(input.branche)) throw new ReponseInvalideError(`« ${input.branche} » n'est pas un sujet de la banque`);
  const timestamp = input.timestamp ?? new Date().toISOString();
  const about = accountAbout(asUserId(input.userId));
  const refus = await faitsVivantsDuSujet(client, input.userId, input.branche, [FAIT_SUJET_REFUSE]);
  const sourceId = randomUUID();
  if (input.refuse) {
    if (refus.length > 0) return { etat: 'inchange' };
    const demarches = await faitsVivantsDuSujet(client, input.userId, input.branche, [FAIT_SUJET_CHOISI, FAIT_SUJET_ABORDE]);
    await persistKnowledge(client, {
      source: createSourceRecord({ about, ownerId: asUserId(input.userId), id: sourceId, sourceType: 'user_declaration', questionCode: FAIT_SUJET_REFUSE,
        questionText: 'Sujet sur lequel la personne ne veut plus être questionnée', answerText: input.branche, timestamp }),
      facts: [createFact({ about, ownerId: asUserId(input.userId), fact_id: factId(sourceId, FAIT_SUJET_REFUSE, input.branche),
        fact_type: FAIT_SUJET_REFUSE, value: input.branche, source: sourceId, timestamp, confidence: 'high', user_confirmed: true, assertionStatus: 'explicit' })],
    });
    if (demarches.length > 0) await supersedeSources(client as never, { oldSourceIds: [...new Set(demarches.map((f) => f.source))], newSourceId: sourceId, timestamp });
    return { etat: 'refuse' };
  }
  if (refus.length === 0) return { etat: 'inchange' };
  await persistKnowledge(client, { source: createSourceRecord({ about, ownerId: asUserId(input.userId), id: sourceId, sourceType: 'user_declaration',
    questionCode: `${FAIT_SUJET_REFUSE}.retrait`, questionText: 'La personne accepte de nouveau des questions sur ce sujet', answerText: input.branche, timestamp }) });
  await supersedeSources(client as never, { oldSourceIds: [...new Set(refus.map((f) => f.source))], newSourceId: sourceId, timestamp });
  return { etat: 'repris' };
}

/** Les sujets que la personne a mis de côté (vivants), par identifiant de branche. */
export async function sujetsRefusesPar(client: ClientSujets, input: { readonly userId: string }): Promise<readonly string[]> {
  const lecture = client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null):
      Promise<{ data: { fact_type: string; value: string; about_id: string }[] | null; error: { message: string } | null }> } } };
  };
  const { data, error } = await lecture.from('knowledge_facts').select('fact_type, value, about_id').eq('user_id', input.userId).is('superseded_at', null);
  if (error) throw new Error(`lecture des sujets mis de côté impossible : ${error.message}`);
  return [...new Set((data ?? []).filter((f) => f.about_id === input.userId && f.fact_type === FAIT_SUJET_REFUSE).map((f) => f.value))];
}


/* ────────────────────────────────────────────────────────────────────────────
 * LES PROJETS : « achat concret », « séjour concret » (décision n° 4 du 18 nov.).
 *
 * Un contexte explicite, avec un début et une fin, qui vient d'un projet que la personne a
 * saisi ou choisi. L'intérêt pour le voyage ou pour un objet ne le crée pas. Il ouvre les
 * questions de niveau C de son domaine ; terminé ou annulé, il ne les ouvre plus.
 * ──────────────────────────────────────────────────────────────────────────── */
const BRANCHES_CONNUES = new Set(BANQUE.map((q) => q.branche));

/**
 * CE QUI A ÉTÉ DIT POUR UN PROJET, sous sa forme structurée : les preuves (préférences,
 * garde-fous) que leur contrat prévoit, et les faits et paramètres d'action. C'est le SEUL
 * lecteur qui les rend ; tous les lecteurs généraux les écartent.
 */
export async function connaissancesDuProjet(
  client: ClientSujets, input: { readonly userId: string; readonly projetId: string },
): Promise<{ readonly preuves: readonly Evidence[]; readonly faits: readonly { readonly type: string; readonly valeur: unknown }[] }> {
  const { readJournalEvidences, contexteDeProjet: ctx } = await import('@/lib/knowledge/read-journal');
  const preuves = await readJournalEvidences(client as never, { userId: input.userId, aboutId: input.userId, projet: input.projetId });
  const lecture = client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null):
      Promise<{ data: { fact_type: string; value: string; context: string | null; about_id: string }[] | null; error: { message: string } | null }> } } };
  };
  const { data, error } = await lecture.from('knowledge_facts').select('fact_type, value, context, about_id').eq('user_id', input.userId).is('superseded_at', null);
  if (error) throw new Error(`lecture des faits du projet impossible : ${error.message}`);
  const faits = (data ?? []).filter((f) => f.about_id === input.userId && f.context === ctx(input.projetId) && (f.fact_type.startsWith('discovery.fait.') || f.fact_type === FAIT_PARAMETRE_DE_PROJET))
    .map((f) => { let valeur: unknown = f.value; try { valeur = JSON.parse(f.value); } catch { /* valeur brute */ } return { type: f.fact_type, valeur }; });
  return { preuves, faits };
}

/** Ouvre un projet. Refuse une branche inconnue de la banque et un objet vide. */
export async function ouvrirProjet(
  client: ClientSujets,
  input: { readonly userId: string; readonly type: TypeDeProjet; readonly branche: string; readonly objet: string;
           readonly fin?: string; readonly timestamp?: string },
): Promise<{ readonly projet: Projet }> {
  if (!BRANCHES_CONNUES.has(input.branche)) throw new ReponseInvalideError(`« ${input.branche} » n'est pas une branche de la banque`);
  const objet = input.objet.trim();
  if (!objet) throw new ReponseInvalideError('un projet porte un objet nommé : un achat ou un séjour précis');
  if (objet.length > 200) throw new ReponseInvalideError('objet trop long (200 caractères au plus)');
  const timestamp = input.timestamp ?? new Date().toISOString();
  if (input.fin !== undefined && (Number.isNaN(Date.parse(input.fin)) || input.fin < timestamp)) {
    throw new ReponseInvalideError('la date de fin doit être une date à venir');
  }
  const about = accountAbout(asUserId(input.userId));
  const sourceId = randomUUID();
  const projet: Projet = { id: sourceId, type: input.type, branche: input.branche, objet, debut: timestamp, ...(input.fin ? { fin: input.fin } : {}) };
  const valeur = JSON.stringify(projet);
  const source = createSourceRecord({
    about, ownerId: asUserId(input.userId), id: sourceId, sourceType: 'user_declaration',
    questionCode: FAIT_PROJET,
    questionText: input.type === 'achat' ? 'Achat que la personne prépare' : 'Séjour que la personne prépare',
    answerText: objet, timestamp,
  });
  const fact = createFact({
    about, ownerId: asUserId(input.userId), fact_id: factId(sourceId, FAIT_PROJET, valeur),
    fact_type: FAIT_PROJET, value: valeur, source: sourceId, timestamp,
    confidence: 'high', user_confirmed: true, assertionStatus: 'explicit',
  });
  await persistKnowledge(client, { source, facts: [fact] });
  return { projet };
}

/** Les projets en cours de la personne (ni supersédés, ni échus). */
export async function projetsEnCours(client: ClientSujets, input: { readonly userId: string }): Promise<readonly Projet[]> {
  const lecture = client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null):
      Promise<{ data: { fact_type: string; value: string; about_id: string }[] | null; error: { message: string } | null }> } } };
  };
  const { data, error } = await lecture.from('knowledge_facts').select('fact_type, value, about_id').eq('user_id', input.userId).is('superseded_at', null);
  if (error) throw new Error(`lecture des projets impossible : ${error.message}`);
  const maintenant = new Date().toISOString();
  return (data ?? []).filter((f) => f.about_id === input.userId && f.fact_type === FAIT_PROJET)
    .map((f) => lireProjet(f.value)).filter((p): p is Projet => p !== null && !(p.fin && p.fin < maintenant));
}

/** Clôt un projet (terminé ou annulé) : ses questions ne s'ouvrent plus. Ce qui a été répondu reste. */
export async function cloreProjet(
  client: ClientSujets,
  input: { readonly userId: string; readonly projetId: string; readonly motif: 'termine' | 'annule'; readonly timestamp?: string },
): Promise<{ readonly etat: 'clos' | 'inchange' }> {
  const enCours = await projetsEnCours(client, { userId: input.userId });
  if (!enCours.some((p) => p.id === input.projetId)) return { etat: 'inchange' };
  const timestamp = input.timestamp ?? new Date().toISOString();
  const sourceId = randomUUID();
  const source = createSourceRecord({
    about: accountAbout(asUserId(input.userId)), ownerId: asUserId(input.userId), id: sourceId,
    sourceType: 'user_declaration', questionCode: `${FAIT_PROJET}.${input.motif}`,
    questionText: input.motif === 'termine' ? 'Projet terminé' : 'Projet annulé', answerText: input.projetId, timestamp,
  });
  await persistKnowledge(client, { source });
  await supersedeSources(client as never, { oldSourceIds: [input.projetId], newSourceId: sourceId, timestamp });
  return { etat: 'clos' };
}


/**
 * « APRÈS CHAQUE RÉPONSE, RECALCULER » (onglet 8 du référentiel). Une session est un lot de
 * questions choisi au départ ; la réponse à la première peut fermer la troisième — la personne
 * vient de dire que le sport tient « très peu de place », ou que la céramique ne l'attire pas.
 * Parmi les questions encore à venir, rend celles qui restent admissibles AVEC l'état relu.
 * Une question hors de la banque active n'est jamais admissible ici.
 */
export async function encoreAdmissibles(
  client: ServiceClient, input: { readonly userId: string; readonly ids: readonly string[] },
): Promise<ReadonlySet<string>> {
  const { etat } = await lireEtat(client as never, { userId: input.userId });
  const tout = new Set(prochainesQuestions(etat, { combien: BANQUE.length, parBranche: BANQUE.length }).choix.map((c) => c.question.id));
  return new Set(input.ids.filter((id) => tout.has(id)));
}


/**
 * LES SUJETS QUE LA PERSONNE PEUT CHOISIR D'EXPLORER (décision n° 7 du 18 nov.) : l'entrée
 * explicite de `/moi/discovery`. Un sujet par domaine — la génération que le référentiel dit
 * prioritaire — et seulement s'il porte un nom lisible et au moins une question que ce choix
 * peut ouvrir : une branche dont toutes les questions sont sensibles SANS mode d'ouverture
 * écrit n'est pas proposée, la choisir ne mènerait nulle part.
 * Choisir un sujet ouvre sa branche ; cela ne crée aucune connaissance sur la personne.
 */
export function sujetsExplorables(): readonly { readonly branche: string; readonly libelle: string }[] {
  const parPool = new Map<string, { branche: string; libelle: string }>();
  for (const branche of new Set(BANQUE.map((q) => q.branche))) {
    const libelle = libelleBranche(branche);
    if (!libelle) continue;
    const ouvrable = BANQUE.some((q) => { if (q.branche !== branche) return false; const a = analyserCondition(q.condition_emission); return !a.sensible || a.ouvertureSurDemarche; });
    if (!ouvrable) continue;
    const pool = poolDe(branche);
    const deja = parPool.get(pool);
    if (!deja || (estPrioritaire(branche) && !estPrioritaire(deja.branche))) parPool.set(pool, { branche, libelle });
  }
  return [...parPool.values()].sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
}

/** Les sujets que la personne a choisis (vivants), par identifiant de branche. */
export async function sujetsChoisisPar(client: ClientSujets, input: { readonly userId: string }): Promise<readonly string[]> {
  const lecture = client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null):
      Promise<{ data: { fact_type: string; value: string; about_id: string }[] | null; error: { message: string } | null }> } } };
  };
  const { data, error } = await lecture.from('knowledge_facts').select('fact_type, value, about_id').eq('user_id', input.userId).is('superseded_at', null);
  if (error) throw new Error(`lecture des sujets choisis impossible : ${error.message}`);
  return [...new Set((data ?? []).filter((f) => f.about_id === input.userId && f.fact_type === FAIT_SUJET_CHOISI).map((f) => f.value))];
}
