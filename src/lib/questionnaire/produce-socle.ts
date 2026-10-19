// Production de connaissance depuis une réponse SOCLE (mode 1, self), AU MOMENT de la réponse.
// Pour chaque optionRef sélectionné : produceFromOption (mapping canonique) → persistKnowledge
// (journal knowledge_*). Provenance : about=accountAbout(self), sourceType=onboarding_closed,
// assertionBasis=self_report (forcé par produceFromOption), entered_by=self (user_id).
//
// Le journal est l'AUTORITÉ. La projection my_profile (attention_reception…) reste écrite par le
// code existant, INCHANGÉE — elle n'est pas touchée ici (cf. hsg-architecture.md §47bis.3).

import { ONBOARDING_MAPPINGS } from '../knowledge/onboarding';
import { accountAbout, asUserId } from '../knowledge/identity';
import { produceFromOption, type WriteContext } from '../knowledge-write/produce';
import { persistKnowledge, type WriteClient } from '../knowledge-write/persist';
import { createSourceRecord } from '../knowledge/sources';
import { createFact } from '../knowledge/fact';
import { factId } from '../knowledge-write/ids';
import { ATTENTION_DIMS } from './attention-dims';
import { TEMPERAMENT_DELTAS } from './temperament-deltas';
import { LIFESTYLE_DELTAS } from './lifestyle-deltas';
import type { FactFieldSpec } from './socle-facts-fields';

const byRef = new Map(ONBOARDING_MAPPINGS.map((m) => [m.optionRef, m] as const));

/**
 * JOURNAL EN APPEND (décision Estelle, 19 oct) : chaque réponse est un ACTE D'ACQUISITION distinct,
 * avec son propre `source_id` FRAIS (uuid à l'acquisition, jamais dérivé du contenu — doctrine ids.ts).
 * Deux réponses à la même question à deux dates coexistent ; deux respondents (modes 1/2/3) coexistent.
 * On N'ÉCRASE JAMAIS une evidence. L'état courant se dérive par la RÈGLE DE RÉCENCE (hsg §47ter) :
 * le plus récent par (sujet, questionCode, dimension), lu à la projection — rien n'est marqué ni supprimé.
 * (evidence_id reste déterministe PAR source → re-rejouer la MÊME acquisition reste idempotent ;
 *  une NOUVELLE réponse a une nouvelle source donc de nouvelles evidences.)
 */
export async function produceSocleAnswer(
  client: WriteClient,
  input: {
    userId: string;
    selectedOptionRefs: readonly string[]; // ORDRE = rang quand `ranked` (1er = rang 1)
    timestamp: string;
    ranked?: boolean; // q1 : le classement déclaré porte une information (QUESTIONS_WITH_EXPLICIT_RANKING)
  },
): Promise<number> {
  let written = 0;
  for (let i = 0; i < input.selectedOptionRefs.length; i++) {
    const ref = input.selectedOptionRefs[i];
    const mapping = byRef.get(ref);
    if (!mapping) continue; // option inconnue du canonique → rien (jamais inventer)
    const ctx: WriteContext = {
      about: accountAbout(asUserId(input.userId)),
      ownerId: asUserId(input.userId),
      sourceId: globalThis.crypto.randomUUID(), // FRAIS par acquisition (append) — jamais dérivé du contenu
      sourceType: 'onboarding_closed',
      timestamp: input.timestamp,
    };
    // q1 : le rang (ordre de sélection, 1..3) alimente la strength affective via la modalité.
    const opts: { affectionRankByModality?: Record<string, 1 | 2 | 3> } = {};
    const rank = i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined; // ordre de sélection
    if (input.ranked && rank && mapping.affectionLanguage.length > 0) {
      opts.affectionRankByModality = { [mapping.affectionLanguage[0].modality]: rank };
    }
    const { source, evidences, facts } = produceFromOption(ctx, mapping, opts);
    // SÉMANTIQUE attention (hsg §47ter) : dims + rang sur l'evidence → attention_reception
    // reconstructible du journal. PONT legacy tempérament ET lifestyle (hsg §47quater) : les deltas
    // d'axes → temperament_axes / lifestyle_axes reconstructibles, dans projection_bridge (JAMAIS lu par
    // le HSG). Un ref est tempérament OU lifestyle, jamais les deux. Côté lifestyle, les deltas 'filter'
    // et 'canal' ne sont PAS au pont : ils sont canoniques (NEED/GUARDRAIL/… cas 1) et déjà dans `evidences`.
    const dims = ATTENTION_DIMS[ref];
    const deltas = TEMPERAMENT_DELTAS[ref] ?? LIFESTYLE_DELTAS[ref];
    // Le PONT est de niveau ACQUISITION (une réponse = une contribution de projection), keyé par
    // `source_id` (frais par acquisition). On l'attache à TOUTES les evidences de l'acquisition : elles
    // partagent le même source_id et le même pont, donc si l'une est filtrée un jour, une autre le porte
    // encore — pas de couplage à l'ordre de production. La RECONSTRUCTION dédoublonne par `source_id`
    // (bridgesFromEvidenceRows) : une acquisition = un pont compté une fois, jamais N fois même si l'option
    // produit N evidences (fréquent côté lifestyle : plusieurs constructs canoniques par réponse).
    const enriched = (dims || deltas)
      ? evidences.map((e) => ({
          ...e,
          ...(dims ? { dims, rank } : {}),
          ...(deltas ? { projectionBridge: { deltas } } : {}),
        }))
      : evidences;
    await persistKnowledge(client, { source, evidences: enriched, facts });
    written += enriched.length;
  }
  return written;
}

/**
 * A3 — produit des FACTs depuis des réponses TEXTE LIBRE / pratiques (singularité, pratique, q17).
 * VERBATIM : la valeur saisie est conservée telle quelle (rawText + fact.value), SANS mapping, SANS
 * inférence. Un FACT ne produit aucun signal (R16/§11.1) et ne disparaît jamais (append, source_id frais).
 * Jamais de FACT vide (règle produit : jamais d'analyse sur input vide). Projection my_profile inchangée.
 */
export async function produceSocleFact(
  client: WriteClient,
  input: {
    userId: string;
    entries: ReadonlyArray<{ spec: FactFieldSpec; value: string }>;
    timestamp: string;
  },
): Promise<number> {
  const about = accountAbout(asUserId(input.userId));
  const ownerId = asUserId(input.userId);
  let written = 0;
  for (const { spec, value } of input.entries) {
    const text = value.trim();
    if (!text) continue; // jamais de FACT vide
    const sourceId = globalThis.crypto.randomUUID(); // FRAIS par acquisition (append)
    const source = createSourceRecord({
      about,
      ownerId,
      id: sourceId,
      sourceType: 'onboarding_open', // texte libre
      questionText: spec.questionText, // libellé EXACT du composant
      rawText: text, // verbatim, jamais tronqué/normalisé
      timestamp: input.timestamp,
    });
    const fact = createFact({
      about,
      ownerId,
      fact_id: factId(sourceId, spec.factType, text),
      fact_type: spec.factType,
      value: text, // verbatim
      source: sourceId,
      timestamp: input.timestamp,
      confidence: 'high',
      user_confirmed: true, // la personne l'a saisi elle-même
      ...(spec.sensitive ? { sensitivity: { isSensitive: true } } : {}),
    });
    await persistKnowledge(client, { source, facts: [fact] });
    written++;
  }
  return written;
}
