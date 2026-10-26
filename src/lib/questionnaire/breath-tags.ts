import { readResolvedEvidences, type JournalEvidenceClient } from '../knowledge/preseance';

// La respiration lit le JOURNAL, jamais les réponses brutes ni result.axes (hsg §47ter, règle 7a).
// Construit les TAGS produits (ce que le HSG a dérivé) + leur PROVENANCE, pour que la respiration les
// REFORMULE sans rien déduire. RÉSOLUTION PAR PRÉSÉANCE (resolveJournalRows, hsg §48bis) : à construct
// égal, le niveau le plus fort gagne, récence à niveau égal — JAMAIS la récence seule (une inférence IA
// niveau 5 ne masque pas une déclaration niveau 1 écrite avant elle).

export interface AttentionBreathTag {
  readonly family: string; // AFFECTION_LANGUAGE | DRIVER
  readonly construct: string; // AFFECTION_RECEIVE_WORDS, DRV_ATTENTIVENESS…
  readonly direction?: string; // receive | give (AFFECTION)
  readonly modality?: string; // WORDS, SERVICES… (AFFECTION)
  readonly strength: string | null;
  readonly rank: number | null;
  readonly basis: string; // provenance : assertion_basis
  readonly confidence: string | null; // confiance de la donnée — VOYAGE jusqu'au modèle (7b : la fermeté suit la confiance)
}

/**
 * RELATION give≈receive sur la MODALITÉ — DÉFINIE par le HSG (déterministe), pas observée par le
 * modèle. C'est la seule relation que la respiration a le droit d'énoncer (hsg §47bis.4) :
 *   congruence : la modalité qu'elle préfère recevoir, elle la donne aussi ;
 *   ecart      : sa 1ʳᵉ modalité reçue n'est pas parmi celles qu'elle donne ;
 *   neutre     : pas assez de données (manque le reçu ou le donné).
 */
export type AttentionRelation = 'congruence' | 'ecart' | 'neutre';

export interface AttentionBreathInput {
  readonly tags: readonly AttentionBreathTag[];
  readonly tagCount: number; // 7b : la profondeur suit ce nombre
  readonly relation: AttentionRelation; // DÉFINIE par le HSG, fournie à la respiration
  readonly receiveTop?: string; // modalité reçue de rang 1 (pour nommer l'écart)
  readonly giveTop?: string; // modalité donnée de rang 1
}

/** Entrée d'une respiration CUMULATIVE : tous les tags du journal (tous domaines jusqu'ici). */
export interface SocleBreathInput {
  readonly tags: readonly AttentionBreathTag[];
  readonly tagCount: number;
  readonly relation: AttentionRelation; // relation attention (give≈receive), définie par le HSG
  readonly receiveTop?: string;
  readonly giveTop?: string;
}

/**
 * Lit TOUT le journal de `userId` (cumulatif : attention + tempérament + …) et en dérive les tags
 * + provenance. ⚠ NE LIT JAMAIS `dims` ni `projection_bridge` (sémantique legacy, interdite comme
 * connaissance — §47bis / §47quater). Préséance par construct (resolveJournalRows).
 */
export async function readSocleTags(client: TagsReadClient, userId: string): Promise<SocleBreathInput> {
  const rows = await readResolvedEvidences(client as unknown as JournalEvidenceClient, { userId });
  const tags: AttentionBreathTag[] = rows.map((r) => ({
    family: r.target_family,
    construct: r.target_construct,
    ...(r.direction ? { direction: r.direction } : {}),
    ...(r.modality ? { modality: r.modality } : {}),
    strength: r.strength,
    rank: r.rank,
    basis: r.assertion_basis, confidence: r.confidence,
  }));
  return { tags, tagCount: tags.length, ...deriveAttentionRelation(tags) };
}

/** Client chaînable (deux `.eq`) — pour filtrer le journal d'UN proche (about=contact). */
export interface ContactTagsReadClient {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): {
        eq(col: string, val: string): Promise<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };
  };
}

/**
 * Respiration MODE 3 : lit le journal d'UN proche (`about_id = contactId`), jamais celui du pilote.
 * ⚠ Filtre about OBLIGATOIRE : sans lui, on mélangerait les traits du pilote et du proche (même user_id).
 */
export async function readContactTags(client: ContactTagsReadClient, userId: string, contactId: string): Promise<SocleBreathInput> {
  const rows = await readResolvedEvidences(client as unknown as JournalEvidenceClient, { userId, aboutId: contactId });
  const tags: AttentionBreathTag[] = rows.map((r) => ({
    family: r.target_family, construct: r.target_construct,
    ...(r.direction ? { direction: r.direction } : {}), ...(r.modality ? { modality: r.modality } : {}),
    strength: r.strength, rank: r.rank, basis: r.assertion_basis, confidence: r.confidence,
  }));
  return { tags, tagCount: tags.length, ...deriveAttentionRelation(tags) };
}

/** FACTs restituables d'UN proche. MÊME filtre qu'au pilote (7d corrigé) : seuls les sensibles sortent. */
export async function readContactFacts(client: ContactTagsReadClient, userId: string, contactId: string): Promise<SocleFact[]> {
  const { data, error } = await client
    .from('knowledge_facts')
    .select('fact_type, value, visibility_derived, assertion_status')
    .eq('user_id', userId)
    .eq('about_id', contactId);
  if (error) throw new BreathReadError(`knowledge_facts (contact) read: ${error.message}`);
  type Row = { fact_type: string; value: string; visibility_derived: string; assertion_status: string | null };
  return ((data ?? []) as Row[]).filter((r) => r.visibility_derived !== 'internal_only').map((r) => ({ factType: r.fact_type, value: r.value, assertionStatus: r.assertion_status }));
}

/** Dérive la relation give≈receive DÉTERMINISTIQUEMENT depuis les tags (jamais le modèle). */
export function deriveAttentionRelation(tags: readonly AttentionBreathTag[]): Pick<AttentionBreathInput, 'relation' | 'receiveTop' | 'giveTop'> {
  const byRank = (a: AttentionBreathTag, b: AttentionBreathTag) => (a.rank ?? 9) - (b.rank ?? 9);
  const recv = tags.filter((t) => t.family === 'AFFECTION_LANGUAGE' && t.direction === 'receive').sort(byRank);
  const give = tags.filter((t) => t.family === 'AFFECTION_LANGUAGE' && t.direction === 'give').sort(byRank);
  if (recv.length === 0 || give.length === 0) return { relation: 'neutre' };
  const giveModalities = new Set(give.map((t) => t.modality));
  const receiveTop = recv[0].modality;
  const giveTop = give[0].modality;
  return { relation: giveModalities.has(receiveTop) ? 'congruence' : 'ecart', receiveTop, giveTop };
}

/** Client de lecture minimal (supabase-compatible). */
export interface TagsReadClient {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): Promise<{ data: unknown[] | null; error: { message: string } | null }>;
    };
  };
}

export class BreathReadError extends Error {}

/**
 * Un FACT restituable dans la prose : déclaration brute (self-écrite), à NOMMER sans interpréter.
 * `assertionStatus` PORTE LA PROVENANCE jusqu'à l'affichage (hsg §48bis) : 'explicit' = déclaré,
 * 'inferred' = SUPPOSÉ (extrait d'une réponse libre). Les FACTs ne se résolvent pas (liste, pas de
 * gagnant), donc un fait inféré et un fait déclaré coexistent dans la même liste avec le même poids —
 * SAUF que le rendu DOIT les distinguer. La FORME de la distinction est éditoriale (Estelle, registre) ;
 * ici on garantit seulement que le signal voyage et n'est pas perdu au read.
 */
export interface SocleFact {
  readonly factType: string;
  readonly value: string;
  readonly assertionStatus: string | null; // 'explicit' | 'inferred' | null
}

/**
 * Lit les FACTs restituables du journal. FILTRE MÉCANIQUE DE VISIBILITÉ (condition dans le code, aucune
 * exception) : seuls les FACTs `visibility_derived != 'internal_only'` entrent — santé, mobilité, adresse
 * ne sortent JAMAIS (§35/R12, et protège une future fiche de proche). Erreur bruyante, jamais de 0 silencieux.
 */
export async function readSocleFacts(client: TagsReadClient, userId: string): Promise<SocleFact[]> {
  const { data, error } = await client
    .from('knowledge_facts')
    .select('fact_type, value, visibility_derived, assertion_status')
    .eq('user_id', userId);
  if (error) throw new BreathReadError(`knowledge_facts read: ${error.message}`);
  type Row = { fact_type: string; value: string; visibility_derived: string; assertion_status: string | null };
  return ((data ?? []) as Row[])
    .filter((r) => r.visibility_derived !== 'internal_only')
    .map((r) => ({ factType: r.fact_type, value: r.value, assertionStatus: r.assertion_status }));
}

/**
 * Lit les evidences du domaine attention produites pour `userId` et en dérive les tags (préséance
 * appliquée). AUCUNE réponse brute, AUCUN axe : uniquement ce que le journal porte.
 */
export async function readAttentionTags(client: TagsReadClient, userId: string): Promise<AttentionBreathInput> {
  // ⚠ Contextes filtrés AVANT résolution (le portail s'en charge) : on réduit par construct dans le seul
  // périmètre attention, pas à travers tout le journal. L'erreur reste bruyante (JournalReadError), jamais
  // de 0 tag silencieux.
  const rows = await readResolvedEvidences(client as unknown as JournalEvidenceClient, {
    userId, contexts: ['attention_received', 'affection_given'],
  });
  const tags: AttentionBreathTag[] = rows.map((r) => ({
    family: r.target_family,
    construct: r.target_construct,
    ...(r.direction ? { direction: r.direction } : {}),
    ...(r.modality ? { modality: r.modality } : {}),
    strength: r.strength,
    rank: r.rank,
    basis: r.assertion_basis, confidence: r.confidence,
  }));
  return { tags, tagCount: tags.length, ...deriveAttentionRelation(tags) };
}
