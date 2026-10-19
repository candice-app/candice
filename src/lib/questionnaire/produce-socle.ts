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
import { evidenceId } from '../knowledge-write/ids';

const byRef = new Map(ONBOARDING_MAPPINGS.map((m) => [m.optionRef, m] as const));

/** uuid v5 déterministe (réponse rejouée → même source, upsert idempotent) via le même ns que les evidences. */
function sourceIdFor(userId: string, optionRef: string): string {
  // on réutilise evidenceId (uuid v5 stable) pour dériver un id de source déterministe par (user, option)
  return evidenceId(`socle:${userId}`, `SRC:${optionRef}`);
}

/**
 * Écrit dans le journal les evidences d'UNE question socle répondue (self). Idempotent : re-répondre
 * réécrit les mêmes ids (source déterministe + evidence_id déterministe) → upsert, pas d'accumulation.
 * Renvoie le nombre d'evidences écrites.
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
      sourceId: sourceIdFor(input.userId, ref),
      sourceType: 'onboarding_closed',
      timestamp: input.timestamp,
    };
    // q1 : le rang (ordre de sélection, 1..3) alimente la strength affective via la modalité.
    const opts: { affectionRankByModality?: Record<string, 1 | 2 | 3> } = {};
    if (input.ranked && i < 3 && mapping.affectionLanguage.length > 0) {
      opts.affectionRankByModality = { [mapping.affectionLanguage[0].modality]: (i + 1) as 1 | 2 | 3 };
    }
    const { source, evidences, facts } = produceFromOption(ctx, mapping, opts);
    await persistKnowledge(client, { source, evidences, facts });
    written += evidences.length;
  }
  return written;
}
