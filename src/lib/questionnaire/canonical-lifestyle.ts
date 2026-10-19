// Construit une question lifestyle RENDUE DEPUIS LE CANONIQUE (lot B, domaine lifestyle). Les LIBELLÉS
// (question + options) et l'ordre viennent de onboarding.ts (V15) ; les subtexts de la couche de
// présentation. On CONSERVE l'id d'option LEGACY (ex. q13_1) comme id technique : ainsi scoreLifestyle
// (banque globale, par id) et les colonnes lifestyle_answers/lifestyle_axes/relational_filters restent
// INCHANGÉES → projection préservée (.6). Au submit, legacyIdToRef mappe vers l'optionRef canonique pour
// le journal (.3/.4). Même stratégie que canonical-temperament.ts.

import type { LifestyleQuestion } from '../lifestyle/questions';
import { STEP4_QUESTIONS, STEP5_CHOICE_QUESTIONS } from '../lifestyle/questions';
import { ONBOARDING_MAPPINGS } from '../knowledge/onboarding';
import { OPTION_PRESENTATION } from './presentation';

const norm = (s: string) => s.normalize('NFC').replace(/[’ʼ‘`´]/g, "'").replace(/…/g, '...').replace(/\s+/g, ' ').replace(/[(),.:;!?]/g, '').trim().toLowerCase();

const LEGACY = [...STEP4_QUESTIONS, ...STEP5_CHOICE_QUESTIONS];
const legacyById = new Map(LEGACY.map((q) => [q.id, q]));

// (questionCode|label normalisé) → optionRef canonique actif
const refByQcLabel = new Map<string, string>();
for (const m of ONBOARDING_MAPPINGS) if (m.status === 'ACTIF') refByQcLabel.set(`${m.questionCode}|${norm(m.optionText)}`, m.optionRef);

/** legacy option id (q13_1) → optionRef canonique — pour le journal au submit. */
export const legacyIdToRef = new Map<string, string>();
for (const q of LEGACY) {
  if (q.status) continue; // question inactive (Food/Voyage q15/q16, q12) : non rendue, non mappée
  for (const o of q.options) {
    const ref = refByQcLabel.get(`${q.id}|${norm(o.label)}`);
    if (ref) legacyIdToRef.set(o.id, ref);
  }
}

/** Construit la question `qc` : labels/subtexts canoniques, id d'option LEGACY conservé, deltas legacy. */
export function buildCanonicalLifestyleQuestion(qc: string): LifestyleQuestion {
  const legacy = legacyById.get(qc);
  if (!legacy) throw new Error(`[canonical-lifestyle] question legacy ${qc} introuvable`);
  const canon = ONBOARDING_MAPPINGS.filter((m) => m.questionCode === qc && m.status === 'ACTIF');
  if (canon.length === 0) throw new Error(`[canonical-lifestyle] aucune option active pour ${qc}`);
  const options = canon.map((m) => {
    const leg = legacy.options.find((o) => norm(o.label) === norm(m.optionText));
    if (!leg) throw new Error(`[canonical-lifestyle] option legacy manquante pour ${qc} « ${m.optionText} »`);
    return {
      ...leg,
      id: leg.id, // id LEGACY conservé (scoring + lifestyle_answers inchangés)
      label: m.optionText, // libellé CANONIQUE (V15)
      subtext: OPTION_PRESENTATION[m.optionRef]?.subtext ?? leg.subtext, // présentation (repli legacy)
      deltas: leg.deltas, // projection (banque legacy)
    };
  });
  return { ...legacy, options };
}
