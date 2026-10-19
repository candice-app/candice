// La respiration lit le JOURNAL, jamais les réponses brutes ni result.axes (hsg §47ter, règle 7a).
// Construit les TAGS produits (ce que le HSG a dérivé) + leur PROVENANCE, pour que la respiration les
// REFORMULE sans rien déduire. Règle de récence appliquée : le plus récent par construct (append).

export interface AttentionBreathTag {
  readonly family: string; // AFFECTION_LANGUAGE | DRIVER
  readonly construct: string; // AFFECTION_RECEIVE_WORDS, DRV_ATTENTIVENESS…
  readonly direction?: string; // receive | give (AFFECTION)
  readonly modality?: string; // WORDS, SERVICES… (AFFECTION)
  readonly strength: string | null;
  readonly rank: number | null;
  readonly basis: string; // provenance : assertion_basis
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
 * connaissance — §47bis / §47quater). Récence appliquée par construct.
 */
export async function readSocleTags(client: TagsReadClient, userId: string): Promise<SocleBreathInput> {
  const { data } = await client
    .from('knowledge_evidences')
    .select('target_family, target_construct, direction, modality, strength, rank, assertion_basis, context, ts')
    .eq('user_id', userId);
  type Row = { target_family: string; target_construct: string; direction?: string; modality?: string; strength: string | null; rank: number | null; assertion_basis: string; context: string; ts: string };
  const rows = (data ?? []) as Row[];
  const latest = new Map<string, Row>();
  for (const r of rows) {
    const prev = latest.get(r.target_construct);
    if (!prev || r.ts > prev.ts) latest.set(r.target_construct, r);
  }
  const tags: AttentionBreathTag[] = [...latest.values()].map((r) => ({
    family: r.target_family,
    construct: r.target_construct,
    ...(r.direction ? { direction: r.direction } : {}),
    ...(r.modality ? { modality: r.modality } : {}),
    strength: r.strength,
    rank: r.rank,
    basis: r.assertion_basis,
  }));
  return { tags, tagCount: tags.length, ...deriveAttentionRelation(tags) };
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
      eq(col: string, val: string): Promise<{ data: unknown[] | null; error: unknown }>;
    };
  };
}

/**
 * Lit les evidences du domaine attention produites pour `userId` et en dérive les tags (récence
 * appliquée). AUCUNE réponse brute, AUCUN axe : uniquement ce que le journal porte.
 */
export async function readAttentionTags(client: TagsReadClient, userId: string): Promise<AttentionBreathInput> {
  const { data } = await client
    .from('knowledge_evidences')
    .select('target_family, target_construct, direction, modality, strength, rank, assertion_basis, context, ts')
    .eq('user_id', userId);
  type Row = { target_family: string; target_construct: string; direction?: string; modality?: string; strength: string | null; rank: number | null; assertion_basis: string; context: string; ts: string };
  const rows = ((data ?? []) as Row[]).filter((r) => r.context === 'attention_received' || r.context === 'affection_given');

  // récence : le plus récent par construct
  const latest = new Map<string, Row>();
  for (const r of rows) {
    const prev = latest.get(r.target_construct);
    if (!prev || r.ts > prev.ts) latest.set(r.target_construct, r);
  }
  const tags: AttentionBreathTag[] = [...latest.values()].map((r) => ({
    family: r.target_family,
    construct: r.target_construct,
    ...(r.direction ? { direction: r.direction } : {}),
    ...(r.modality ? { modality: r.modality } : {}),
    strength: r.strength,
    rank: r.rank,
    basis: r.assertion_basis,
  }));
  return { tags, tagCount: tags.length, ...deriveAttentionRelation(tags) };
}
