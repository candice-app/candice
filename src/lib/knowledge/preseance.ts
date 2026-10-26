// PRÉSÉANCE PAR NIVEAU DE PROVENANCE (hsg §48bis) — à construct égal, le NIVEAU LE PLUS FORT gagne
// (1 > 2 > … > 6), quelles que soient les dates ; à niveau ÉGAL, la récence décide. Une evidence EXTRAITE
// (inférence IA, niveau 5) ne l'emporte JAMAIS sur une DÉCLARATION (niveau 1), même plus récente.
// C'est la résolution au read de l'échelle à 6 niveaux ; on étend l'esprit de reviseWithCorrection, on ne
// crée pas une 2ᵉ échelle.

import { provenanceLevel, type SourceType, type AssertionBasis } from './sources';

export interface ResolvableEvidence {
  readonly target_construct: string;
  readonly source_type: SourceType;
  readonly assertionBasis: AssertionBasis;
  readonly created_at: string; // ISO
}

/**
 * PRIMITIF CANONIQUE pour tous les lecteurs du journal. Prend des lignes TELLES QUE la base les stocke
 * (colonnes snake_case `assertion_basis` + `source_type`), les résout par préséance, rend les gagnants.
 * TOUT lecteur qui réduit le journal à UNE evidence par construct DOIT passer par ici — sinon il résout
 * par récence seule et une inférence IA écrase une déclaration en silence. (Les lecteurs de FACTs, qui
 * renvoient une LISTE sans réduire, n'ont rien à résoudre : ils ne masquent rien.)
 */
export function resolveJournalRows<R extends { target_construct: string; source_type: string; assertion_basis: string; created_at: string }>(rows: readonly R[]): R[] {
  return resolveByProvenance(
    rows.map((r) => ({ ...r, source_type: r.source_type as SourceType, assertionBasis: r.assertion_basis as AssertionBasis })),
  ) as unknown as R[];
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// PORTAIL UNIQUE DE LECTURE DES EVIDENCES — « fermer la porte, pas poser une alarme » (décision 25 oct).
// `readResolvedEvidences` est la SEULE fonction qui exécute `.from('knowledge_evidences').select(...)` pour
// un affichage : la chaîne de requête brute ne vit QU'ICI, nulle part ailleurs à copier. Elle rend TOUJOURS
// des lignes DÉJÀ RÉSOLUES par préséance. Un nouveau lecteur qui veut des evidences importe cette fonction
// et reçoit du résolu — il ne peut pas obtenir de brut via une fonction exportée. Le seul contournement
// serait de réécrire une requête brute à la main (visible en revue, sans exemple à copier). La VRAIE
// impossibilité physique (révoquer le SELECT sur la table de base, n'exposer qu'une vue résolue en SQL)
// relève de la base — destructive sur les droits, décision + application d'Estelle (voir rapport).
// (La lecture write-side par source_id dans persist.ts ne passe pas ici : elle compte, ne réduit pas par
// construct, n'alimente aucun écran — ce n'est pas une surface de masquage.)

const EVIDENCE_COLUMNS =
  'target_family, target_construct, direction, modality, strength, rank, assertion_basis, source_type, confidence, context, created_at';

export class JournalReadError extends Error {}

/** Une evidence résolue, telle que la rendent les lecteurs (colonnes snake_case de la base). */
export interface ResolvedEvidenceRow {
  target_family: string;
  target_construct: string;
  direction?: string;
  modality?: string;
  strength: string | null;
  rank: number | null;
  assertion_basis: string;
  source_type: string;
  confidence: string | null;
  context: string;
  created_at: string;
}

type EvidenceQueryResult = { data: unknown[] | null; error: { message: string } | null };
interface EvidenceEq extends PromiseLike<EvidenceQueryResult> {
  eq(col: string, val: string): PromiseLike<EvidenceQueryResult>;
}
/** Client supabase-like : `.eq` est à la fois awaitable ET chaînable (comme le query builder réel). */
export interface JournalEvidenceClient {
  from(table: string): { select(cols: string): { eq(col: string, val: string): EvidenceEq } };
}

/**
 * Lit les evidences d'un `userId` (optionnellement d'un `aboutId`), filtre les `contexts` AVANT résolution
 * (certains lecteurs restreignent le contexte puis réduisent par construct), et rend les gagnants de préséance.
 * Erreur BRUYANTE : jamais de 0 silencieux (une lecture qui échoue ne doit pas passer pour un journal vide).
 */
export async function readResolvedEvidences(
  client: JournalEvidenceClient,
  opts: { userId: string; aboutId?: string; contexts?: readonly string[] },
): Promise<ResolvedEvidenceRow[]> {
  const q = client.from('knowledge_evidences').select(EVIDENCE_COLUMNS).eq('user_id', opts.userId);
  const { data, error } = await (opts.aboutId ? q.eq('about_id', opts.aboutId) : q);
  if (error) throw new JournalReadError(`knowledge_evidences read: ${error.message}`);
  let rows = (data ?? []) as ResolvedEvidenceRow[];
  if (opts.contexts) {
    const set = new Set(opts.contexts);
    rows = rows.filter((r) => set.has(r.context));
  }
  return resolveJournalRows(rows);
}

/** Résout, par construct, l'evidence qui FAIT FOI : niveau le plus fort d'abord, récence à niveau égal. */
export function resolveByProvenance<E extends ResolvableEvidence>(evidences: readonly E[]): E[] {
  const winner = new Map<string, E>();
  for (const e of evidences) {
    const cur = winner.get(e.target_construct);
    if (!cur) { winner.set(e.target_construct, e); continue; }
    const le = provenanceLevel(e.source_type, e.assertionBasis);
    const lc = provenanceLevel(cur.source_type, cur.assertionBasis);
    if (le < lc) winner.set(e.target_construct, e);                 // niveau plus fort (chiffre plus petit) gagne
    else if (le === lc && e.created_at > cur.created_at) winner.set(e.target_construct, e); // récence à niveau égal
    // sinon : le gagnant courant reste (niveau plus fort, ou même niveau mais plus récent)
  }
  return [...winner.values()];
}
