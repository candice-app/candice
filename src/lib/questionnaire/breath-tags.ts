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

export interface AttentionBreathInput {
  readonly tags: readonly AttentionBreathTag[];
  readonly tagCount: number; // 7b : la profondeur suit ce nombre
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
  return { tags, tagCount: tags.length };
}
