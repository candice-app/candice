// Construit une question de tempérament RENDUE DEPUIS LE CANONIQUE (lot B, A1). Les LIBELLÉS
// (question + options) et l'ordre viennent de onboarding.ts (V15) ; les subtexts de la couche de
// présentation. On CONSERVE l'id d'option LEGACY (ex. q5_1) comme id technique : ainsi scoreTemperament
// (banque globale, par id) et la colonne temperament_answers restent INCHANGÉS → projection préservée
// (.6). Au submit, legacyIdToRef mappe vers l'optionRef canonique pour le journal (.3/.4).

import type { TemperamentQuestion } from '../temperament/questions';
import { STEP2_QUESTIONS, STEP3_QUESTIONS } from '../temperament/questions';
import { ONBOARDING_MAPPINGS } from '../knowledge/onboarding';
import { OPTION_PRESENTATION } from './presentation';

const norm = (s: string) => s.normalize('NFC').replace(/[’ʼ‘`´]/g, "'").replace(/…/g, '...').replace(/\s+/g, ' ').replace(/[(),.:;!?]/g, '').trim().toLowerCase();

const LEGACY = [...STEP2_QUESTIONS, ...STEP3_QUESTIONS];
const legacyById = new Map(LEGACY.map((q) => [q.id, q]));

// (questionCode|label normalisé) → optionRef canonique actif
const refByQcLabel = new Map<string, string>();
for (const m of ONBOARDING_MAPPINGS) if (m.status === 'ACTIF') refByQcLabel.set(`${m.questionCode}|${norm(m.optionText)}`, m.optionRef);

/** legacy option id (q5_1) → optionRef canonique — pour le journal au submit. */
export const legacyIdToRef = new Map<string, string>();
for (const q of LEGACY) for (const o of q.options) {
  const ref = refByQcLabel.get(`${q.id}|${norm(o.label)}`);
  if (ref) legacyIdToRef.set(o.id, ref);
}

/** Construit la question `qc` : labels/subtexts canoniques, id d'option LEGACY conservé, deltas/mode legacy. */
export function buildCanonicalTemperamentQuestion(qc: string): TemperamentQuestion {
  const legacy = legacyById.get(qc);
  if (!legacy) throw new Error(`[canonical-temperament] question legacy ${qc} introuvable`);
  const canon = ONBOARDING_MAPPINGS.filter((m) => m.questionCode === qc && m.status === 'ACTIF');
  if (canon.length === 0) throw new Error(`[canonical-temperament] aucune option active pour ${qc}`);
  const options = canon.map((m) => {
    const leg = legacy.options.find((o) => norm(o.label) === norm(m.optionText));
    if (!leg) throw new Error(`[canonical-temperament] option legacy manquante pour ${qc} « ${m.optionText} »`);
    return {
      id: leg.id, // id LEGACY conservé (scoring + temperament_answers inchangés)
      label: m.optionText, // libellé CANONIQUE (V15)
      subtext: OPTION_PRESENTATION[m.optionRef]?.subtext ?? leg.subtext, // présentation (repli legacy)
      deltas: leg.deltas, // projection (banque legacy)
      ...(leg.mode ? { mode: leg.mode } : {}),
    };
  });
  return { ...legacy, options };
}
