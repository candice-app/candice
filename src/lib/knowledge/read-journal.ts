// LECTEUR DU JOURNAL POUR LA CONSOLIDATION — reconstruit des Evidence COMPLÈTES.
//
// Pourquoi un lecteur de plus, et pourquoi ce n'est pas une entorse au portail unique :
// `readResolvedEvidences` (preseance.ts) RÉDUIT par préséance — une gagnante par construct —
// et ne rend qu'une projection d'affichage. La consolidation AGRÈGE : elle compte les
// preuves, mesure l'indépendance et les contextes distincts, construit relationHistory.
// Lui donner du résolu produirait evidenceCount: 1 partout. Le portail unique est borné
// « pour un affichage » et carve-out déjà la lecture write-side de persist.ts ; ceci est le
// troisième cas, déclaré, et il n'alimente aucun écran.
//
// DEUX CHAMPS NE SONT PAS DES COLONNES DE knowledge_evidences et doivent être reconstruits
// depuis la source (migration 82) :
//   - source_type : vit sur knowledge_sources. provenanceLevel l'écrit : « ne jamais le lire
//     au read ». L'indépendance et declaredStrongPrimary en dépendent pourtant.
//   - timestamp   : knowledge_evidences est la SEULE table du journal sans colonne `ts`
//     (sources/facts/open_knowledge/extraction_records en ont toutes une). `created_at` est
//     l'heure d'ÉCRITURE, pas celle de l'information. `mostRecent`, `latestTimestamp`,
//     l'ordre de relationHistory et « la plus récente supplante » en dépendent.
// Les deux se récupèrent par la MÊME jointure : une evidence appartient à exactement une
// source, et toutes les evidences d'une source partagent son instant.
//
// Une source absente est une ERREUR BRUYANTE : un journal amputé de sa provenance ne doit
// jamais passer pour un journal valide.

import type { Evidence } from './evidence';
import type { AboutRef } from './identity';
import type { SourceType } from './sources';

export class JournalSourceError extends Error {}

/**
 * PAGINATION — PostgREST plafonne une réponse (1000 lignes par défaut). Un journal plus
 * long reviendrait TRONQUÉ, et un journal tronqué consolide faux EN SILENCE : moins de
 * preuves, moins de provenances, mauvais score et mauvaise confiance, sans la moindre
 * erreur. On pagine donc explicitement jusqu'à une page incomplète.
 *
 * ORDRE STABLE OBLIGATOIRE : sans ORDER BY, PostgreSQL ne garantit AUCUN ordre entre deux
 * requêtes. Paginer sans ordre peut rendre deux fois la même ligne et en sauter une autre —
 * une troncature silencieuse déguisée en pagination. On ordonne donc sur `id`, clé unique.
 */
const TAILLE_PAGE = 1000;
/** Les identifiants d'un `in(...)` voyagent dans l'URL : on les envoie par lots. */
const LOT_IDENTIFIANTS = 200;

async function toutesLesLignes(
  construire: () => Q,
  ou: string,
): Promise<Row[]> {
  const out: Row[] = [];
  for (let de = 0; ; de += TAILLE_PAGE) {
    const { data, error } = await construire()
      .order('id', { ascending: true })
      .range(de, de + TAILLE_PAGE - 1);
    if (error) throw new JournalEvidenceReadError(`${ou}: ${error.message}`);
    const page = data ?? [];
    out.push(...page);
    if (page.length < TAILLE_PAGE) return out;
  }
}
export class JournalEvidenceReadError extends Error {}

/** Colonnes nécessaires pour RECONSTRUIRE une evidence, pas pour l'afficher. */
export const JOURNAL_EVIDENCE_COLUMNS =
  'id, about_kind, about_id, user_id, source_id, target_family, target_construct, ' +
  'evidence_role, context, confidence, stability, raw_information, fact_id, ' +
  'assertion_status, assertion_basis, ontology_version, hsg_version, dims, rank, ' +
  'value, strength, direction, modality, relation, relationship, severity, ' +
  'guardrail_scope, subject_id, subject_label, entity_id, entity_label, entity_type, ' +
  'parent_domain, preference_path, preference_value, behavior_context, pattern, facet, ' +
  'superseded_at';

interface Row { [k: string]: unknown }
interface Reponse { data: Row[] | null; error: { message: string } | null }
interface Q extends PromiseLike<Reponse> {
  eq(c: string, v: string): Q;
  in(c: string, v: readonly string[]): Q;
  order(c: string, o: { ascending: boolean }): Q;
  range(de: number, a: number): Q;
}
interface Client {
  from(t: string): { select(c: string): Q };
}

/**
 * Reconstruit UNE evidence à partir de sa ligne et de sa source. Les champs sémantiques
 * nuls ne sont PAS posés : une famille ne porte que les siens, et poser `null` ferait
 * échouer les gardes `!== undefined` de la consolidation (ex. relationship facultatif).
 */
function rowToEvidence(r: Row, sourceType: SourceType, ts: string): Evidence {
  const about = { kind: r.about_kind, id: r.about_id } as unknown as AboutRef;
  const e: Record<string, unknown> = {
    about,
    ownerId: r.user_id,
    evidence_id: r.id,
    source_id: r.source_id,
    source_type: sourceType,          // RECONSTRUIT depuis knowledge_sources
    timestamp: ts,                    // RECONSTRUIT depuis knowledge_sources.ts
    target_family: r.target_family,
    target_construct: r.target_construct,
    evidence_role: r.evidence_role,
    context: r.context,
    confidence: r.confidence,
    stability: r.stability,
    raw_information: r.raw_information,
    assertionStatus: r.assertion_status,
    assertionBasis: r.assertion_basis,
    version: { ontology_version: r.ontology_version, hsg_version: r.hsg_version },
  };
  if (r.fact_id != null) e.fact_id = r.fact_id;
  if (r.dims != null) e.dims = r.dims;
  if (r.rank != null) e.rank = r.rank;
  // Champs sémantiques : posés UNIQUEMENT s'ils sont renseignés.
  const SEM: [string, string][] = [
    ['value', 'value'], ['strength', 'strength'], ['direction', 'direction'],
    ['modality', 'modality'], ['relation', 'relation'], ['relationship', 'relationship'],
    ['severity', 'severity'], ['guardrail_scope', 'guardrailScope'],
    ['subject_id', 'subject'], ['subject_label', 'subjectLabel'],
    ['entity_id', 'entity_id'], ['entity_label', 'entityLabel'],
    ['entity_type', 'entityType'], ['parent_domain', 'parent_domain'],
    ['preference_path', 'preference_path'], ['preference_value', 'preferenceValue'],
    ['behavior_context', 'behaviorContext'], ['pattern', 'pattern'], ['facet', 'facet'],
  ];
  for (const [col, champ] of SEM) if (r[col] != null) e[champ] = r[col];
  return e as unknown as Evidence;
}

/**
 * Lit le journal d'evidences d'une personne et rend des Evidence COMPLÈTES, prêtes pour la
 * consolidation. N'applique AUCUNE préséance (la consolidation agrège). Exclut les evidences
 * supersédées (§48septies) comme le fait le portail d'affichage.
 */
export async function readJournalEvidences(
  client: Client,
  opts: { userId: string; aboutId?: string },
): Promise<Evidence[]> {
  const data = await toutesLesLignes(() => {
    const q = client.from('knowledge_evidences').select(JOURNAL_EVIDENCE_COLUMNS).eq('user_id', opts.userId);
    return opts.aboutId ? q.eq('about_id', opts.aboutId) : q;
  }, 'knowledge_evidences read');
  const rows: Row[] = data.filter((r: Row) => !r.superseded_at);
  if (rows.length === 0) return [];

  const ids: string[] = [...new Set(rows.map((r: Row) => String(r.source_id)))];
  const srcRows: Row[] = [];
  for (let i = 0; i < ids.length; i += LOT_IDENTIFIANTS) {
    const lot = ids.slice(i, i + LOT_IDENTIFIANTS);
    srcRows.push(...await toutesLesLignes(
      () => client.from('knowledge_sources').select('id, source_type, ts').in('id', lot),
      'knowledge_sources read',
    ));
  }
  const sources = new Map<string, { source_type: SourceType; ts: string }>();
  for (const s of srcRows) {
    sources.set(String(s.id), { source_type: s.source_type as SourceType, ts: String(s.ts) });
  }

  const manquantes = ids.filter((id) => !sources.has(id));
  if (manquantes.length > 0) {
    // Bruyante par construction : sans provenance, l'indépendance et la force déclarée
    // seraient calculées faux, en silence. Mieux vaut ne rien rendre.
    throw new JournalSourceError(
      `source absente pour ${manquantes.length} evidence(s) — réhydratation impossible : ${manquantes.join(', ')}`,
    );
  }
  return rows.map((r: Row) => {
    const s = sources.get(String(r.source_id))!;
    return rowToEvidence(r, s.source_type, s.ts);
  });
}
