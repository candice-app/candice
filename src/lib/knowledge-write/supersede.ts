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

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// IDENTIFICATION DES ANCIENNES SOURCES À SUPERSÉDER (décision Estelle 28 oct) — portée VERROUILLÉE :
//   même IDENTIFIANT STABLE de question (`question_code`, pas le libellé)
//   + MÊME PERSONNE DÉCLARANTE (self : `about` identique ET `rapporteur` nul)
//   + MÊME VOIE d'acquisition (texte libre self : source_type ∈ {onboarding_open, extraction_inferred}).
// Une correction ne supersède QUE ce que la MÊME personne a déclaré par le MÊME chemin — jamais au-delà :
//   1. clé = question_code (stable) → survit à la réécriture d'un libellé (refonte de la banque) ;
//   2. TOUTES les versions vivantes (corrections successives : la 2ᵉ supersède l'originale ET la 1ʳᵉ) ;
//   3. ⚠ CÔTE À CÔTE : une source sur le même sujet venue d'AUTRUI (Julie, `rapporteur` renseigné /
//      source_type reported_by_relative / declared_via_relative) est EXCLUE. Les faits du pilote sont
//      toujours conservés+reportés, c'est la PRÉSÉANCE qui décide ce qui s'affiche — jamais une supersession.

const SELF_FREETEXT_SOURCE_TYPES = new Set(['onboarding_open', 'extraction_inferred']);

interface SourceRow { id: string; rapporteur: string | null; source_type: string; correction_event_id?: string | null }
export interface SourceLookupClient {
  from(table: string): {
    select(cols: string): {
      match(q: Record<string, string>): Promise<{ data: unknown[] | null; error: { message: string } | null }>;
    };
  };
}

/**
 * @deprecated Remplacée par `oldSelfSourceIdsForCorrection` + `supersedePriorVersions` (3ᵉ forme,
 *   identité d'évènement de correction). Cette primitive distingue mal « ancien » de « neuf » quand une
 *   correction crée DEUX sources (verbatim déclaré + extraction). NE PAS la câbler dans un nouveau chemin.
 *   À SUPPRIMER quand ses tests seront réécrits contre la nouvelle primitive (lot dédié, pas « un jour »).
 *
 * Renvoie les source_id des anciennes versions d'un champ RÉDIGÉ à superséder lors d'une correction du
 * PILOTE sur lui-même. Scope : (user_id, about, question_code) en base, puis filtre `rapporteur` nul ET
 * voie self free-text. Exclut par construction toute source d'un tiers (côte à côte).
 */
export async function liveSelfSourceIdsForQuestion(
  client: SourceLookupClient,
  input: { ownerId: string; aboutKind: string; aboutId: string; questionCode: string },
): Promise<string[]> {
  // JAMAIS requêter une clé vide : un question_code vide apparierait tous les null entre eux et supersèderait
  // au hasard. Une correction porte toujours un identifiant stable — sinon c'est un bug, pas un cas à avaler.
  if (!input.questionCode?.trim()) throw new SupersedeError('liveSelfSourceIdsForQuestion: questionCode vide (clé de supersession manquante)');
  const { data, error } = await client.from('knowledge_sources')
    .select('id, rapporteur, source_type')
    .match({ user_id: input.ownerId, about_kind: input.aboutKind, about_id: input.aboutId, question_code: input.questionCode });
  if (error) throw new SupersedeError(`lookup sources: ${error.message}`);
  return ((data ?? []) as SourceRow[])
    .filter((s) => (s.rapporteur == null) && SELF_FREETEXT_SOURCE_TYPES.has(s.source_type)) // self + même voie ; exclut le côte à côte
    .map((s) => s.id);
}

/**
 * 3ᵉ FORME (décision Estelle 5 nov) — supersession par IDENTITÉ D'ÉVÈNEMENT DE CORRECTION. Rend les source_id
 * des ANCIENNES versions d'un champ RÉDIGÉ par le pilote sur lui-même, à superséder lors d'une correction :
 * toutes les sources vivantes self free-text de (user_id, about, question_code) **SAUF celles qui portent
 * `correctionEventId`** (les DEUX sources de la correction courante — verbatim déclaré + extraction — le
 * portent). Aucune dépendance à une horloge ; les sources pré-identifiant (correction_event_id NULL) sont
 * d'anciennes versions → supersédées. Exclut par construction toute source d'un tiers (côte à côte).
 */
export async function oldSelfSourceIdsForCorrection(
  client: SourceLookupClient,
  input: { ownerId: string; aboutKind: string; aboutId: string; questionCode: string; correctionEventId: string },
): Promise<string[]> {
  if (!input.questionCode?.trim()) throw new SupersedeError('oldSelfSourceIdsForCorrection: questionCode vide (clé de supersession manquante)');
  if (!input.correctionEventId?.trim()) throw new SupersedeError('oldSelfSourceIdsForCorrection: correctionEventId vide (sans lui, on supersèderait les sources de la correction courante)');
  const { data, error } = await client.from('knowledge_sources')
    .select('id, rapporteur, source_type, correction_event_id')
    .match({ user_id: input.ownerId, about_kind: input.aboutKind, about_id: input.aboutId, question_code: input.questionCode });
  if (error) throw new SupersedeError(`lookup sources (correction): ${error.message}`);
  return ((data ?? []) as SourceRow[])
    .filter((s) => (s.rapporteur == null) && SELF_FREETEXT_SOURCE_TYPES.has(s.source_type)) // self + même voie ; exclut le côte à côte
    .filter((s) => s.correction_event_id !== input.correctionEventId)                        // ÉPARGNE les sources de CETTE correction
    .map((s) => s.id);
}

/**
 * Supersède les versions antérieures d'un champ corrigé par le pilote (3ᵉ forme), `superseded_by` = la source
 * du VERBATIM DÉCLARÉ (`declaredSourceId`), jamais l'extraction (« ta nouvelle réponse » est une réponse ;
 * « une inférence du modèle » n'en est pas une). Idempotent (n'écrase pas une supersession déjà posée).
 */
export async function supersedePriorVersions(
  lookup: SourceLookupClient,
  mark: SupersedeClient,
  input: { ownerId: string; aboutKind: string; aboutId: string; questionCode: string; correctionEventId: string; declaredSourceId: string; timestamp: string },
): Promise<void> {
  const oldSourceIds = await oldSelfSourceIdsForCorrection(lookup, input);
  await supersedeSources(mark, { oldSourceIds, newSourceId: input.declaredSourceId, timestamp: input.timestamp });
}

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
