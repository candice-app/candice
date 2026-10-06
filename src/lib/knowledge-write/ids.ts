// Identifiants de la couche d'écriture (lot B bloc 2a).
//
// source_id : uuid généré À L'ACQUISITION (voir produce.ts / bloc 2b), propagé inchangé.
//   Pas dérivé du contenu : une même question peut être répondue deux fois (reprise,
//   correction) → deux actes d'acquisition, deux sources coexistantes (journal en ajout
//   seul). Et le découpler du contenu évite qu'une restructuration (ex. 106→106/106b)
//   change les ids de sources historiques.
//
// evidence_id : DÉTERMINISTE, dérivé de (source_id + clé-cible). Rend le remap IDEMPOTENT —
//   rejouer le mapping sur une source REMPLACE ses evidences (même id → upsert), au lieu
//   d'en accumuler une seconde génération (fausse convergence). La clé-cible ne contient
//   QUE l'identité de la cible (family + construct + facet + direction/modality), JAMAIS
//   strength/role/value/context : corriger une strength doit remplacer, pas créer.

import { createHash } from 'node:crypto';

/** Namespace fixe du module de connaissance (uuid constant, arbitraire mais stable). */
const KNOWLEDGE_NAMESPACE = '0b3b94f2-1d7a-5e64-9c2a-6f1d0ac0ffee';

/** uuid v5 (RFC 4122, SHA-1) déterministe : (name, namespace) → même uuid, toujours. */
function uuidv5(name: string, namespace: string): string {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(Buffer.concat([ns, Buffer.from(name, 'utf8')])).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // variant RFC 4122
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** evidence_id déterministe à partir de la source et de la clé-cible. */
export function evidenceId(sourceId: string, targetKey: string): string {
  return uuidv5(`ev:${sourceId}:${targetKey}`, KNOWLEDGE_NAMESPACE);
}

/** id déterministe d'un FACT / OpenKnowledge produit par une source (sur source + identité cible). */
export function factId(sourceId: string, factType: string, subject: string): string {
  return uuidv5(`fact:${sourceId}:${factType}:${subject}`, KNOWLEDGE_NAMESPACE);
}
export function openKnowledgeId(sourceId: string, subject: string): string {
  return uuidv5(`ok:${sourceId}:${subject}`, KNOWLEDGE_NAMESPACE);
}
