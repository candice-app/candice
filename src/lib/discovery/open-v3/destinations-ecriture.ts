/**
 * CE QUE LES DESTINATIONS CONDITIONNELLES ÉCRIVENT — et tout ce qu'il faut pour l'écrire juste :
 * le registre des référents que la personne a nommés, ses animaux déclarés, les clarifications
 * quand un référent reste ambigu, le relevé de chaque lecture, et la reprise des lectures faites
 * quand une destination n'était pas encore disponible.
 *
 * QUATRE RÈGLES TENUES PAR LA STRUCTURE :
 *   · une lecture = UNE source, d'identifiant dérivé du verbatim ET de la version du lecteur.
 *     Rejouer après une panne retombe sur la même source ; une version plus récente du lecteur
 *     produit une AUTRE source, qui remplace l'ancienne — une réponse lue quand sa destination
 *     manquait n'est donc pas « traitée » pour toujours ;
 *   · chaque lecture laisse un RELEVÉ : quels passages, à quelle position du verbatim, retenus ou
 *     écartés, écrits ou non, et pourquoi. C'est le rattachement exact des preuves à la phrase ;
 *   · un référent ambigu n'écrit RIEN : il ouvre une clarification, que seule la personne ferme ;
 *   · remplacer la réponse retire tout ce qui en dérivait (lectures, référents, clarifications) :
 *     toutes ces sources portent le code de la question.
 */
import { randomUUID } from 'node:crypto';
import type { QuestionV3 } from './banque';
import { question as questionParId } from './banque';
import {
  DESTINATIONS_PAR_QUESTION, MEDIUM_PAR_QUESTION, VERSION_LECTURE, cibleLexicale, cleNom, examinerSegments, exigenceDe, idEntite, lireSegmentsParModele, resoudre,
  type Destination, type EntiteConnue, type NatureIdentite, type Resolution, type SegmentExamine,
} from './destinations';
import { PREFIXE_FAIT } from './produire';
import { createFact } from '@/lib/knowledge/fact';
import { evidenceId, factId } from '@/lib/knowledge-write/ids';
import { supersedeSources } from '@/lib/knowledge-write/supersede';
import { createSourceRecord } from '@/lib/knowledge/sources';
import { persistKnowledge, type WriteClient } from '@/lib/knowledge-write/persist';
import { accountAbout, asEntityId, asSubjectId, asUserId } from '@/lib/knowledge/identity';
import { normalizeLabel } from '@/lib/knowledge/normalize';
import { JOURNAL_VERSION_STAMP } from '@/lib/knowledge/version';
import type { Evidence } from '@/lib/knowledge/evidence';

export const FAIT_ENTITE = 'discovery.entite';
export const FAIT_ANIMAL = 'discovery.animal';
export const FAIT_CLARIFICATION = 'discovery.clarification';
export const FAIT_LECTURE = 'discovery.lecture';
export class DestinationInvalideError extends Error {}

export type LecteurDeSegments = (enonce: string, texte: string, destinations: readonly Destination[], barriere: string) => Promise<unknown>;

/** La source d'une lecture : dérivée du verbatim et de la version du lecteur. */
export function sourceLectureDestinations(verbatimSourceId: string, version: number = VERSION_LECTURE): string {
  return version <= 1 ? evidenceId('lecture-destinations', verbatimSourceId) : evidenceId(`lecture-destinations-v${version}`, verbatimSourceId);
}

/* ── Lectures de la base ─────────────────────────────────────────────────────── */
interface LigneFait { id: string; fact_type: string; value: string; about_id: string; source: string }
async function faitsVivants(client: WriteClient, userId: string, types: readonly string[]): Promise<LigneFait[]> {
  const lecture = client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null):
      Promise<{ data: LigneFait[] | null; error: { message: string } | null }> } } };
  };
  const { data, error } = await lecture.from('knowledge_facts').select('id, fact_type, value, about_id, source').eq('user_id', userId).is('superseded_at', null);
  if (error) throw new Error(`lecture des faits impossible : ${error.message}`);
  // Le détenteur ET la personne décrite : les faits d'un proche portent le même `user_id`.
  return (data ?? []).filter((f) => f.about_id === userId && types.includes(f.fact_type));
}
async function sourceExiste(client: WriteClient, id: string): Promise<boolean> {
  return !!(await (client as unknown as {
    from(t: string): { select(c: string): { eq(c: string, v: string): { maybeSingle(): Promise<{ data: unknown }> } } };
  }).from('knowledge_sources').select('id').eq('id', id).maybeSingle()).data;
}
const lire = <T,>(s: string): T | null => { try { return JSON.parse(s) as T; } catch { return null; } };

/** Les référents que la personne a nommés, et ses animaux déclarés. Un seul par identité. */
export async function entitesConnues(client: WriteClient, userId: string): Promise<EntiteConnue[]> {
  const vues = new Map<string, EntiteConnue>();
  for (const f of await faitsVivants(client, userId, [FAIT_ENTITE, FAIT_ANIMAL])) {
    if (f.fact_type === FAIT_ANIMAL) {
      const a = lire<{ nom: string; espece: string }>(f.value);
      if (a?.nom) vues.set(f.id, { id: f.id, nature: 'animal', medium: 'animal', nom: a.nom, rattachement: a.espece ?? null });
    } else {
      const e = lire<EntiteConnue>(f.value);
      if (e?.id && !vues.has(e.id)) vues.set(e.id, e);
    }
  }
  return [...vues.values()];
}

/* ── Les animaux : déclarés par la personne, jamais déduits ──────────────────────
 * « J'ai un chien » ne dit ni combien, ni lequel. Un animal n'a d'identité que si la personne
 * le déclare, avec son nom et son espèce. Son identifiant est celui du fait : il appartient au
 * compte qui l'a déclaré, et aucun autre compte ne peut le lire (politiques d'accès du journal). */
export async function declarerAnimal(
  client: WriteClient, input: { readonly userId: string; readonly nom: string; readonly espece: string; readonly timestamp?: string },
): Promise<{ readonly petId: string; readonly etat: 'declare' | 'deja_connu' }> {
  const nom = input.nom.trim(), espece = input.espece.trim();
  if (!nom || !espece) throw new DestinationInvalideError('un animal se déclare avec son nom et son espèce');
  if (nom.length > 60 || espece.length > 40) throw new DestinationInvalideError('nom ou espèce trop long');
  const connus = (await entitesConnues(client, input.userId)).filter((e) => e.nature === 'animal');
  const meme = connus.find((a) => cleNom(a.nom) === cleNom(nom) && cleNom(a.rattachement ?? '') === cleNom(espece));
  if (meme) return { petId: meme.id, etat: 'deja_connu' };
  const timestamp = input.timestamp ?? new Date().toISOString();
  const about = accountAbout(asUserId(input.userId)); const sourceId = randomUUID();
  const petId = factId(sourceId, FAIT_ANIMAL, nom);
  await persistKnowledge(client, {
    source: createSourceRecord({ about, ownerId: asUserId(input.userId), id: sourceId, sourceType: 'user_declaration', questionCode: FAIT_ANIMAL,
      questionText: 'Animal déclaré par la personne', answerText: `${nom} (${espece})`, timestamp }),
    facts: [createFact({ about, ownerId: asUserId(input.userId), fact_id: petId, fact_type: FAIT_ANIMAL, value: JSON.stringify({ nom, espece }),
      source: sourceId, timestamp, confidence: 'high', user_confirmed: true, assertionStatus: 'explicit' })],
  });
  return { petId, etat: 'declare' };
}
export async function animauxDe(client: WriteClient, input: { readonly userId: string }): Promise<readonly { petId: string; nom: string; espece: string | null }[]> {
  return (await entitesConnues(client, input.userId)).filter((e) => e.nature === 'animal').map((a) => ({ petId: a.id, nom: a.nom, espece: a.rattachement }));
}

/* ── Ce qu'une destination écrit pour un segment retenu ──────────────────────── */
const assainir = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const libelleEntite = (e: EntiteConnue) => (e.rattachement && e.nature !== 'animal' ? `${e.nom} — ${e.rattachement}` : e.nom);
interface Ecritures { evidences: Evidence[]; facts: ReturnType<typeof createFact>[] }
interface Contexte { readonly userId: string; readonly question: QuestionV3; readonly sourceId: string; readonly timestamp: string }

function ecrituresPour(c: Contexte, d: Destination, s: Pick<SegmentExamine, 'passage' | 'debut' | 'fin' | 'attitude' | 'relation'>, entite: EntiteConnue | null): Ecritures {
  const q = c.question; const about = accountAbout(asUserId(c.userId)); const ownerId = asUserId(c.userId);
  const domaine = q.options.find((o) => o.domaine)?.domaine ?? q.branche;
  // Le lieu idéal de sensory2.1487 est HYPOTHÉTIQUE : son contexte le dit, pour qu'aucun lecteur
  // ne prenne ces éléments pour ceux d'un lieu réel ou possédé.
  const contexte = q.id === 'sensory2.1487' ? 'lieu_ideal_hypothetique' : domaine;
  const commun = {
    about, ownerId, source_id: c.sourceId, source_type: 'extraction_inferred', raw_information: s.passage,
    // Les mots sont ceux de la personne ; c'est leur RANGEMENT qui est une lecture.
    confidence: 'low', assertionStatus: 'inferred', assertionBasis: 'self_report', timestamp: c.timestamp, version: JOURNAL_VERSION_STAMP,
    // `strength` n'est pas un degré d'engagement : le journal exige une force sur toute preuve
    // sans valeur, et la lecture d'un texte libre l'écrit partout à `moderate`.
    strength: 'moderate', evidence_role: d.role ?? 'secondary', stability: d.stabilite ?? 'undetermined',
  };
  if (d.voie === 'FACT') {
    const type = `${PREFIXE_FAIT}${assainir(domaine)}.${assainir(d.cle)}`;
    // Pour un animal, le fait est le SOUHAIT ; l'animal en est le sujet (pet_id).
    const valeur = entite && entite.nature !== 'animal' ? libelleEntite(entite) : s.passage;
    return { evidences: [], facts: [createFact({ about, ownerId, fact_id: factId(c.sourceId, type, `${s.debut}:${valeur}`), fact_type: type,
      value: JSON.stringify({ valeur, libelle: valeur, question: q.id, declencheur: d.declencheur, passage: { debut: s.debut, fin: s.fin },
        ...(entite && entite.nature !== 'animal' ? { referent: entite.id } : {}), ...(entite?.nature === 'animal' ? { pet_id: entite.id, animal: entite.nom } : {}),
        // `mention` : la personne a nommé ; aucune appréciation n'est établie par ce fait.
        ...(exigenceDe(d)!.attitude === 'mention' ? { sens: 'mention' } : {}) }),
      source: c.sourceId, timestamp: c.timestamp, confidence: 'medium', user_confirmed: false, assertionStatus: 'inferred' })] };
  }
  if (d.famille === 'PREFERENCE') {
    return { facts: [], evidences: [{ ...commun, context: contexte, evidence_id: evidenceId(c.sourceId, `PREFERENCE:${d.cle}:${s.debut}`), target_family: 'PREFERENCE',
      target_construct: `PREFERENCE.${assainir(domaine)}.${assainir(d.cle)}`, preferenceValue: s.passage,
      polarity: s.attitude === 'rejet' ? 'rejet' : 'positive' } as unknown as Evidence] };
  }
  if (d.famille === 'INTEREST') {
    const sujet = asSubjectId(normalizeLabel(s.passage));
    return { facts: [], evidences: [{ ...commun, context: 'GLOBAL', evidence_id: evidenceId(c.sourceId, `INTEREST:${sujet}`), target_family: 'INTEREST',
      target_construct: sujet, subject: sujet, subjectLabel: s.passage } as unknown as Evidence] };
  }
  if (d.famille === 'ENTITY' && entite && s.relation) {
    const eid = asEntityId(entite.id);
    return { facts: [], evidences: [{ ...commun, context: 'GLOBAL', evidence_id: evidenceId(c.sourceId, `ENTITY:${entite.id}:${s.relation}`), target_family: 'ENTITY',
      target_construct: eid, entity_id: eid, entityLabel: libelleEntite(entite), entityType: normalizeLabel(d.typeEntite ?? 'unknown'), relation: s.relation } as unknown as Evidence] };
  }
  return { evidences: [], facts: [] };
}
const faitRegistre = (c: Contexte, e: EntiteConnue, s: { debut: number; fin: number }) => createFact({
  about: accountAbout(asUserId(c.userId)), ownerId: asUserId(c.userId), fact_id: factId(c.sourceId, FAIT_ENTITE, e.id), fact_type: FAIT_ENTITE,
  value: JSON.stringify({ ...e, provenance: { question: c.question.id, source: c.sourceId, passage: s } }),
  source: c.sourceId, timestamp: c.timestamp, confidence: 'medium', user_confirmed: false, assertionStatus: 'inferred' });

/* ── La lecture ──────────────────────────────────────────────────────────────── */
export interface LigneReleve {
  readonly declencheur: string; readonly debut: number | null; readonly fin: number | null;
  readonly issue: 'ecrit' | 'ecarte' | 'clarification' | 'non_ecrit'; readonly motif?: string;
}
export interface ResultatDestinations {
  readonly dejaLue: boolean; readonly preuves: number; readonly faits: number;
  readonly releve: readonly LigneReleve[]; readonly clarifications: number;
  /** Lectures d'une version antérieure du lecteur, remplacées par celle-ci. */
  readonly reprises: number;
}
export interface Clarification {
  readonly id: string; readonly question: string; readonly enonce: string; readonly nature: NatureIdentite;
  readonly passage: string; readonly raison: string;
  readonly choix: readonly { readonly id: string; readonly libelle: string }[];
  /** La personne peut préciser elle-même (titre, auteur, émission, lieu…) plutôt que choisir. */
  readonly saisieLibre: boolean;
}
interface ValeurClarification {
  question: string; verbatim: string; rang: string; nature: NatureIdentite; medium: string; raison: string;
  segment: Pick<SegmentExamine, 'passage' | 'debut' | 'fin' | 'attitude' | 'relation'>;
  choix: EntiteConnue[]; proposee: EntiteConnue | null;
  /** Segments d'une destination « second segment » qui attendent ce référent. */
  enAttente: { rang: string; segment: Pick<SegmentExamine, 'passage' | 'debut' | 'fin' | 'attitude' | 'relation'> }[];
}
const sourceClarification = (lecture: string, rang: string, debut: number) => evidenceId('clarification', `${lecture}|${rang}|${debut}`);

export async function ecrireDestinations(
  client: WriteClient,
  input: { readonly userId: string; readonly question: QuestionV3; readonly texte: string; readonly barriere: string;
           readonly verbatimSourceId: string; readonly timestamp: string; readonly lecteur?: LecteurDeSegments },
): Promise<ResultatDestinations> {
  const q = input.question;
  const destinations = DESTINATIONS_PAR_QUESTION.get(q.id)!;
  const sourceId = sourceLectureDestinations(input.verbatimSourceId);
  if (await sourceExiste(client, sourceId)) return { dejaLue: true, preuves: 0, faits: 0, releve: [], clarifications: 0, reprises: 0 };

  const brut = await (input.lecteur ?? lireSegmentsParModele)(q.enonce, input.texte, destinations, input.barriere);   // LÈVE si le modèle est en panne
  const examen = examinerSegments(input.texte, brut, destinations);
  const connues = await entitesConnues(client, input.userId);
  const c: Contexte = { userId: input.userId, question: q, sourceId, timestamp: input.timestamp };
  const about = accountAbout(asUserId(input.userId)); const ownerId = asUserId(input.userId);
  const medium = MEDIUM_PAR_QUESTION[q.id] ?? q.branche;

  const evidences: Evidence[] = []; const facts: ReturnType<typeof createFact>[] = [];
  const releve: LigneReleve[] = examen.ecartes.map((e) => ({ declencheur: e.declencheur, debut: null, fin: null, issue: 'ecarte' as const, motif: e.motif }));
  const clarifs: { source: string; valeur: ValeurClarification }[] = [];
  // Les référents résolus par CETTE lecture, pour les destinations « second segment ».
  const referents: { entite: EntiteConnue; segment: SegmentExamine }[] = [];
  const enregistrees = new Set<string>();
  const noter = (d: Destination, s: SegmentExamine, issue: LigneReleve['issue'], motif?: string) =>
    releve.push({ declencheur: d.declencheur, debut: s.debut, fin: s.fin, issue, ...(motif ? { motif } : {}) });
  const ajouter = (e: Ecritures) => { evidences.push(...e.evidences); facts.push(...e.facts); };

  for (const d of destinations.filter((x) => !exigenceDe(x)!.secondSegment)) {
    const ex = exigenceDe(d)!;
    const segments = examen.retenus.filter((s) => s.declencheur === d.declencheur);
    if (segments.length === 0) continue;
    if (ex.attitude === 'projection') {
      // Une projection est UN fait : les passages qui la décrivent, à leur place dans la phrase.
      const type = `${PREFIXE_FAIT}${assainir(q.options.find((o) => o.domaine)?.domaine ?? q.branche)}.${assainir(d.cle)}`;
      const valeur = segments.map((s) => s.passage).join(' … ');
      facts.push(createFact({ about, ownerId, fact_id: factId(sourceId, type, 'projection'), fact_type: type,
        value: JSON.stringify({ valeur, libelle: valeur, question: q.id, declencheur: d.declencheur, sens: 'projection', passages: segments.map((s) => ({ debut: s.debut, fin: s.fin })) }),
        source: sourceId, timestamp: input.timestamp, confidence: 'medium', user_confirmed: false, assertionStatus: 'inferred' }));
      for (const s of segments) noter(d, s, 'ecrit');
      continue;
    }
    for (const s of segments) {
      if (!ex.resolution) { ajouter(ecrituresPour(c, d, s, null)); noter(d, s, 'ecrit'); continue; }
      const r: Resolution = resoudre(ex.resolution, medium, s, connues);
      if (r.etat === 'unique') {
        if (r.nouvelle && !enregistrees.has(r.id)) { facts.push(faitRegistre(c, r.entite, s)); enregistrees.add(r.id); connues.push(r.entite); }
        referents.push({ entite: r.entite, segment: s });
        ajouter(ecrituresPour(c, d, s, r.entite)); noter(d, s, 'ecrit');
      } else if (r.etat === 'ambigu' || r.clarifiable) {
        clarifs.push({ source: sourceClarification(sourceId, d.rang, s.debut), valeur: {
          question: q.id, verbatim: input.verbatimSourceId, rang: d.rang, nature: ex.resolution, medium,
          raison: r.etat === 'ambigu' ? r.raison : r.motif, segment: { passage: s.passage, debut: s.debut, fin: s.fin, attitude: s.attitude, ...(s.relation ? { relation: s.relation } : {}) },
          choix: r.etat === 'ambigu' ? [...r.choix] : [], proposee: r.etat === 'ambigu' ? r.proposee : null, enAttente: [] } });
        noter(d, s, 'clarification', r.etat === 'ambigu' ? r.raison : r.motif);
      } else noter(d, s, 'non_ecrit', r.motif);
    }
  }
  for (const d of destinations.filter((x) => exigenceDe(x)!.secondSegment)) {
    for (const s of examen.retenus.filter((x) => x.declencheur === d.declencheur)) {
      // Le segment doit être DISTINCT de celui qui nomme le référent, et le référent sans équivoque.
      const distincts = referents.filter((r) => s.fin <= r.segment.debut || s.debut >= r.segment.fin);
      // Épreuve 4 : l'appréciation porte-t-elle sur le référent LUI-MÊME ? « J'y ai adoré le silence » : non.
      const nature = exigenceDe(d)!.resolution!;
      const ref = referents.length === 1 ? referents[0].segment : clarifs.length === 1 ? clarifs[0].valeur.segment : null;
      if (ref && d.famille === 'ENTITY') {
        const lu = cibleLexicale(input.texte, s.debut, s.fin, nature, { debut: ref.debut, fin: ref.fin, nom: ref.passage });
        if (lu.cible !== 'referent') { noter(d, s, 'non_ecrit', lu.cible === 'aspect' ? 'appreciation_d_un_aspect' : 'cible_indeterminee'); continue; }
      }
      if (referents.length === 1 && distincts.length === 1) { ajouter(ecrituresPour(c, d, s, referents[0].entite)); noter(d, s, 'ecrit'); continue; }
      if (referents.length === 0 && clarifs.length === 1) { clarifs[0].valeur.enAttente.push({ rang: d.rang, segment: { passage: s.passage, debut: s.debut, fin: s.fin, attitude: s.attitude, ...(s.relation ? { relation: s.relation } : {}) } }); noter(d, s, 'clarification', 'referent_en_attente'); continue; }
      noter(d, s, 'non_ecrit', referents.length === 0 ? 'referent_non_resolu' : distincts.length === 0 ? 'segment_non_distinct' : 'referent_indetermine');
    }
  }

  facts.push(createFact({ about, ownerId, fact_id: factId(sourceId, FAIT_LECTURE, q.id), fact_type: FAIT_LECTURE,
    value: JSON.stringify({ version: VERSION_LECTURE, question: q.id, verbatim: input.verbatimSourceId, releve }),
    source: sourceId, timestamp: input.timestamp, confidence: 'high', user_confirmed: false, assertionStatus: 'inferred' }));
  await persistKnowledge(client, {
    source: createSourceRecord({ about, ownerId, id: sourceId, sourceType: 'extraction_inferred', questionCode: `discovery.${q.id}`,
      questionText: `Lecture par destinations conditionnelles (onglet 17, lecteur v${VERSION_LECTURE}) — ${q.id}`, rawText: input.texte, timestamp: input.timestamp }),
    evidences, facts,
  });
  for (const cl of clarifs) {
    await persistKnowledge(client, {
      source: createSourceRecord({ about, ownerId, id: cl.source, sourceType: 'extraction_inferred', questionCode: `discovery.${q.id}`,
        questionText: `Clarification demandée — ${q.id}`, rawText: cl.valeur.segment.passage, timestamp: input.timestamp }),
      facts: [createFact({ about, ownerId, fact_id: factId(cl.source, FAIT_CLARIFICATION, q.id), fact_type: FAIT_CLARIFICATION, value: JSON.stringify(cl.valeur),
        source: cl.source, timestamp: input.timestamp, confidence: 'high', user_confirmed: false, assertionStatus: 'inferred' })],
    });
  }
  // LA REPRISE : une lecture d'une version antérieure du lecteur est remplacée par celle-ci.
  const anciennes: string[] = [];
  for (let v = 1; v < VERSION_LECTURE; v++) {
    const id = sourceLectureDestinations(input.verbatimSourceId, v);
    if (await sourceExiste(client, id)) anciennes.push(id);
  }
  if (anciennes.length > 0) await supersedeSources(client as never, { oldSourceIds: anciennes, newSourceId: sourceId, timestamp: input.timestamp });
  const nonEcrits = releve.filter((l) => l.issue !== 'ecrit');
  if (nonEcrits.length > 0) console.warn('[discovery] destinations : segments non écrits', q.id, nonEcrits.map((l) => `${l.declencheur}:${l.issue}:${l.motif ?? ''}`));
  return { dejaLue: false, preuves: evidences.length, faits: facts.filter((f) => f.fact_type.startsWith(PREFIXE_FAIT)).length, releve, clarifications: clarifs.length, reprises: anciennes.length };
}

/* ── Les clarifications ──────────────────────────────────────────────────────── */
const RAISONS: Readonly<Record<string, string>> = {
  plusieurs_referents_du_meme_nom: 'Tu as déjà cité plusieurs choses qui portent ce nom.',
  nom_proche_non_identique: 'Ce nom ressemble à un autre que tu as déjà cité.',
  plusieurs_animaux: 'Tu as plusieurs animaux.', aucun_animal_declare: 'Je ne sais pas encore de quel animal il s’agit.',
  identite_absente: 'Je ne sais pas de quoi il s’agit exactement.', nom_absent: 'Il me manque son nom.',
  emission_absente: 'Il me manque le nom du podcast.', episode_non_identifie: 'Il me manque le titre ou le numéro de l’épisode.',
  lieu_generique: 'Il me manque le nom du lieu.', juge_ambigu_par_le_modele: 'Je ne suis pas sûre de ce que tu désignes.',
};
export async function clarificationsOuvertes(client: WriteClient, input: { readonly userId: string }): Promise<readonly Clarification[]> {
  const out: Clarification[] = [];
  for (const f of await faitsVivants(client, input.userId, [FAIT_CLARIFICATION])) {
    const v = lire<ValeurClarification>(f.value); const q = v ? questionParId(v.question) : undefined;
    if (!v || !q) continue;
    out.push({ id: f.source, question: v.question, enonce: q.enonce, nature: v.nature, passage: v.segment.passage, raison: RAISONS[v.raison] ?? 'Je ne suis pas sûre de ce que tu désignes.',
      choix: [...v.choix, ...(v.proposee ? [v.proposee] : [])].map((e) => ({ id: e.id, libelle: v.proposee && e.id === v.proposee.id && v.choix.length > 0 ? `${libelleEntite(e)} (autre que les précédents)` : libelleEntite(e) })),
      saisieLibre: v.nature !== 'animal' });
  }
  return out;
}

export type ReponseClarification =
  | { readonly choix: string }                                            // un des référents proposés
  | { readonly nom: string; readonly rattachement?: string }              // la personne précise elle-même
  | { readonly aucun: true };                                             // « laisse tomber » : rien n'est écrit
export async function repondreClarification(
  client: WriteClient, input: { readonly userId: string; readonly clarificationId: string; readonly reponse: ReponseClarification; readonly timestamp?: string },
): Promise<{ readonly etat: 'ecrite' | 'abandonnee' | 'encore_ambigue'; readonly preuves: number; readonly faits: number }> {
  const f = (await faitsVivants(client, input.userId, [FAIT_CLARIFICATION])).find((x) => x.source === input.clarificationId);
  const v = f ? lire<ValeurClarification>(f.value) : null; const q = v ? questionParId(v.question) : undefined;
  if (!f || !v || !q) throw new DestinationInvalideError('clarification inconnue, déjà réglée, ou d’un autre compte');
  const timestamp = input.timestamp ?? new Date().toISOString();
  const about = accountAbout(asUserId(input.userId)); const ownerId = asUserId(input.userId);
  const sourceId = randomUUID();
  const c: Contexte = { userId: input.userId, question: q, sourceId, timestamp };
  const clore = async (evidences: Evidence[], facts: ReturnType<typeof createFact>[], dit: string) => {
    await persistKnowledge(client, { source: createSourceRecord({ about, ownerId, id: sourceId, sourceType: 'extraction_inferred', questionCode: `discovery.${q.id}`,
      questionText: `Clarification réglée par la personne — ${q.id}`, rawText: v.segment.passage, answerText: dit, timestamp }), evidences, facts });
    await supersedeSources(client as never, { oldSourceIds: [input.clarificationId], newSourceId: sourceId, timestamp });
  };
  if ('aucun' in input.reponse) { await clore([], [], 'aucun'); return { etat: 'abandonnee', preuves: 0, faits: 0 }; }

  const connues = await entitesConnues(client, input.userId);
  let entite: EntiteConnue | null = null; let nouvelle = false;
  if ('choix' in input.reponse) {
    const id = input.reponse.choix;
    // Le choix doit être l'un de ceux qui ont été PROPOSÉS — ou, pour un animal, l'un des siens.
    entite = [...v.choix, ...(v.proposee ? [v.proposee] : [])].find((e) => e.id === id)
      ?? (v.nature === 'animal' ? connues.find((e) => e.nature === 'animal' && e.id === id) ?? null : null);
    if (!entite) throw new DestinationInvalideError('ce choix n’a pas été proposé');
    nouvelle = !connues.some((e) => e.id === entite!.id);
  } else {
    if (v.nature === 'animal') throw new DestinationInvalideError('un animal se déclare à part, avec son nom et son espèce');
    const nom = input.reponse.nom.trim(), rattachement = input.reponse.rattachement?.trim() || undefined;
    if (!nom || nom.length > 200 || (rattachement?.length ?? 0) > 200) throw new DestinationInvalideError('précision vide ou trop longue');
    const r = resoudre(v.nature, v.medium, { ...v.segment, declencheur: '', temps: 'indetermine', sens: 'nu', identite: { nature: v.nature, nom, ...(rattachement ? { rattachement } : {}) } }, connues);
    if (r.etat !== 'unique') return { etat: 'encore_ambigue', preuves: 0, faits: 0 };
    entite = r.entite; nouvelle = r.nouvelle;
  }
  const destinations = DESTINATIONS_PAR_QUESTION.get(q.id) ?? [];
  const evidences: Evidence[] = []; const facts: ReturnType<typeof createFact>[] = [];
  // Un référent précisé par la personne est SA déclaration : le registre le dit.
  if (nouvelle) facts.push({ ...faitRegistre(c, entite, v.segment), user_confirmed: true });
  for (const cible of [{ rang: v.rang, segment: v.segment }, ...v.enAttente]) {
    const d = destinations.find((x) => x.rang === cible.rang);
    if (!d) continue;
    const e = ecrituresPour(c, d, cible.segment, entite);
    evidences.push(...e.evidences); facts.push(...e.facts);
  }
  await clore(evidences, facts, libelleEntite(entite));
  return { etat: 'ecrite', preuves: evidences.length, faits: facts.filter((x) => x.fact_type.startsWith(PREFIXE_FAIT)).length };
}
export { idEntite };
