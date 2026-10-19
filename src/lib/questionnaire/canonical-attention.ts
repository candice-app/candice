// Construit une question d'attention RENDUE DEPUIS LE CANONIQUE (lot B). Les LIBELLÉS (question +
// options) et l'ordre viennent de onboarding.ts (autorité V15). Les subtexts/icônes viennent de la
// couche de présentation INERTE ; les dims viennent de l'asset de projection. Aucune dépendance
// runtime sur les banques legacy (qui seront supprimées). La forme AttentionQuestion est conservée
// pour que le rendu et le scoring de projection existants fonctionnent sans changement.

import type { AttentionQuestion } from '../attention/questions';
import { ONBOARDING_MAPPINGS } from '../knowledge/onboarding';
import { OPTION_PRESENTATION } from './presentation';
import { ATTENTION_DIMS } from './attention-dims';

// micro (consigne sous le titre) = texte UI PROVISOIRE (lot éditorial futur), non canonique.
// Repris tel quel du déployé, jamais inventé.
const MICRO: Record<string, string> = {
  q1: 'Choisis jusqu’à 3 réponses. La première compte le plus.',
  q2: 'Choisis jusqu’à 3 réponses. La première compte le plus.',
  q4: 'Choisis jusqu’à 3 réponses. La première compte le plus.',
  qe: 'Choisis jusqu’à 3 réponses. Cela aidera Candice à comprendre les décalages possibles entre ce que tu donnes naturellement et ce que les autres attendent.',
};

/**
 * Construit la question d'attention `qc` depuis le canonique actif + présentation + dims.
 * Les ids d'option SONT les optionRef canoniques (ce que la production attend à la soumission).
 */
export function buildCanonicalAttentionQuestion(qc: string): AttentionQuestion {
  const rows = ONBOARDING_MAPPINGS.filter((m) => m.questionCode === qc && m.status === 'ACTIF');
  if (rows.length === 0) throw new Error(`[canonical-attention] aucune option active pour ${qc}`);
  const title = rows[0].questionText;
  const options = rows.map((m) => {
    const pres = OPTION_PRESENTATION[m.optionRef];
    const dims = ATTENTION_DIMS[m.optionRef];
    if (!dims) throw new Error(`[canonical-attention] dims manquants pour ${m.optionRef} (${qc})`);
    return {
      id: m.optionRef, // = optionRef canonique
      label: m.optionText, // libellé canonique (V15)
      subtext: pres?.subtext ?? '', // présentation inerte
      dims, // projection
      ...(pres?.icon ? { icon: pres.icon } : {}),
    };
  });
  return { id: qc, title, micro: MICRO[qc] ?? '', options };
}
