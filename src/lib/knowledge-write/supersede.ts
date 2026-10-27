// SUPERSESSION EXPLICITE (décision Estelle 27 oct) — à la CORRECTION d'une réponse, l'évènement de
// correction MARQUE les lignes de l'ancienne version du champ : `superseded_at` + `superseded_by` (le
// source_id qui remplace). Le journal garde tout (append = append) ; ce sont les LECTEURS qui excluent les
// supersédées (readResolvedEvidences, FACTs, et l'HISTORIQUE — une supersédée est une CORRECTION, fate b,
// donc nulle part, historique compris).
//
// Marqueur EXPLICITE (pas une exclusion par clé de champ au read) : traçabilité dans les deux sens, pas de
// dépendance à my_profile (qui meurt à l'étape 7), et sert le lot « trace des exclusions ».
//
// On identifie l'ANCIENNE version par ses SOURCES (une correction d'un champ = une nouvelle source ; les
// sources précédentes de ce champ, et TOUT ce qu'elles ont produit, sont supersédées). L'identification des
// anciennes sources (par champ) est faite par l'appelant (étape 4) et passée ici en `oldSourceIds` : le
// read, lui, ne dépend que du marqueur, jamais de la clé de champ.

export interface SupersedeClient {
  from(table: string): {
    update(values: Record<string, unknown>): {
      in(col: string, vals: readonly string[]): {
        is(col: string, val: null): Promise<{ error: { message: string } | null }>;
      };
    };
  };
}

export class SupersedeError extends Error {}

/** Tables restituables portant le marqueur (migration 95). Les trois sont marquées ensemble. */
const SUPERSEDABLE_TABLES = ['knowledge_evidences', 'knowledge_facts', 'knowledge_open_knowledge'] as const;

/**
 * Marque comme SUPERSÉDÉES (remplacées) toutes les lignes restituables dérivées de `oldSourceIds`, par la
 * source `newSourceId`. N'écrase pas une supersession déjà posée (`is('superseded_at', null)`). Idempotent.
 * Erreur BRUYANTE : une supersession qui échoue laisserait l'ancienne réponse ressurgir — jamais silencieuse.
 */
export async function supersedeSources(
  client: SupersedeClient,
  input: { oldSourceIds: readonly string[]; newSourceId: string; timestamp: string },
): Promise<void> {
  const ids = input.oldSourceIds.filter((id) => id && id !== input.newSourceId);
  if (ids.length === 0) return; // rien à superséder (première version d'un champ)
  const values = { superseded_at: input.timestamp, superseded_by: input.newSourceId };
  for (const table of SUPERSEDABLE_TABLES) {
    const { error } = await client.from(table).update(values).in('source_id', ids).is('superseded_at', null);
    if (error) throw new SupersedeError(`${table} supersede: ${error.message}`);
  }
}
