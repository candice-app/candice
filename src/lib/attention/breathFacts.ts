import type { FaceResult, AttentionDim } from './scoring';

const DIMS: AttentionDim[] = ['MOT', 'SER', 'CAD_C', 'CAD_S', 'EXP', 'GES', 'SUR'];

export type ReceptionShape = 'multi' | 'dual' | 'single';
export type RelationType   = 'congruence' | 'ecart' | 'neutre';

export interface EcartInfo {
  ecartGive: AttentionDim;
  ecartNeed: AttentionDim;
}

export interface BreathFacts {
  fortR:           AttentionDim[];
  fortE:           AttentionDim[];
  receptionShape:  ReceptionShape;
  receptionTop:    AttentionDim[];
  shared:          AttentionDim[];
  congruenceRatio: number;
  relation:        RelationType;
  ecart?:          EcartInfo;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const DIM_LABELS: Record<AttentionDim, string> = {
  MOT:   'les mots',
  SER:   'les services rendus',
  CAD_C: 'les cadeaux choisis',
  CAD_S: 'les cadeaux qui ont du sens',
  EXP:   'le temps partagé et les expériences',
  GES:   'les petites attentions du quotidien',
  SUR:   'les surprises',
};

const DIM_SHORT: Record<AttentionDim, string> = {
  MOT:   'les mots',
  SER:   'les services rendus',
  CAD_C: 'les cadeaux choisis',
  CAD_S: 'les cadeaux qui ont du sens',
  EXP:   'le temps partagé',
  GES:   'les petites attentions',
  SUR:   'les surprises',
};

function followVerb(dim: AttentionDim): string {
  return DIM_SHORT[dim].startsWith('les ') ? 'suivent' : 'suit';
}

// ─── Core computation ─────────────────────────────────────────────────────────

function sortedByNorm(normalized: Record<AttentionDim, number>): AttentionDim[] {
  return [...DIMS].sort((a, b) => normalized[b] - normalized[a]);
}

export function computeBreathFacts(reception: FaceResult, expression: FaceResult): BreathFacts {
  const sortedR = sortedByNorm(reception.normalized);
  const sortedE = sortedByNorm(expression.normalized);

  const strongR = sortedR.filter(d => reception.normalized[d] >= 50).slice(0, 4);
  const fortR   = strongR.length >= 2 ? strongR : sortedR.slice(0, 2);

  const strongE = sortedE.filter(d => expression.normalized[d] >= 50).slice(0, 3);
  const fortE   = strongE.length >= 1 ? strongE : sortedE.slice(0, 1);

  const norm = reception.normalized;
  let receptionShape: ReceptionShape;
  if (fortR.length >= 3 && norm[fortR[0]] - norm[fortR[2]] <= 30) {
    receptionShape = 'multi';
  } else if (strongR.length === 2 || (fortR.length >= 2 && norm[fortR[0]] - norm[fortR[1]] <= 15)) {
    receptionShape = 'dual';
  } else {
    receptionShape = 'single';
  }

  const shared          = fortE.filter(d => fortR.includes(d));
  const congruenceRatio = shared.length / Math.max(1, fortE.length);

  let relation: RelationType;
  let ecart: EcartInfo | undefined;

  const maxExpNorm = Math.max(...DIMS.map(d => expression.normalized[d]));
  if (maxExpNorm === 0) {
    relation = 'neutre';
  } else if (congruenceRatio >= 0.6) {
    relation = 'congruence';
  } else {
    const giveOnly  = fortE.filter(d => !fortR.includes(d));
    const ecartGive = giveOnly.length > 0 ? giveOnly[0] : fortE[0];
    const ecartNeed = reception.dominant.length > 0 ? reception.dominant[0] : fortR[0];
    if (ecartGive !== ecartNeed) {
      relation = 'ecart';
      ecart    = { ecartGive, ecartNeed };
    } else {
      relation = 'neutre';
    }
  }

  return {
    fortR,
    fortE,
    receptionShape,
    receptionTop: fortR,
    shared,
    congruenceRatio,
    relation,
    ...(ecart ? { ecart } : {}),
  };
}

// ─── Fallback text (deterministic, mirrors system prompt rules) ───────────────

export function buildFallbackText(facts: BreathFacts): string {
  const { receptionShape, receptionTop, relation, ecart } = facts;

  let main: string;
  if (receptionShape === 'multi' && receptionTop.length >= 3) {
    const list = `${DIM_SHORT[receptionTop[0]]}, ${DIM_SHORT[receptionTop[1]]} et ${DIM_SHORT[receptionTop[2]]}`;
    if (receptionTop.length >= 4) {
      main = `Plusieurs langages comptent presque autant pour toi : ${list} — ${DIM_SHORT[receptionTop[3]]} ${followVerb(receptionTop[3])} juste derrière.`;
    } else {
      main = `Plusieurs langages comptent presque autant pour toi : ${list}.`;
    }
  } else if (receptionShape === 'dual' && receptionTop.length >= 2) {
    main = `Ce qui te touche le plus, c'est ${DIM_LABELS[receptionTop[0]]} — et tout autant ${DIM_LABELS[receptionTop[1]]}.`;
  } else {
    main = `Ce qui te touche avant tout, c'est ${DIM_LABELS[receptionTop[0]]}.`;
  }

  let second: string;
  if (relation === 'congruence') {
    second = "Et tu sembles offrir aux autres ce que tu aimes toi-même recevoir.";
  } else if (relation === 'ecart' && ecart) {
    second = `Tu donnes surtout par ${DIM_LABELS[ecart.ecartGive]}, alors que ce qui te touche le plus, c'est plutôt ${DIM_LABELS[ecart.ecartNeed]}. Un écart utile à connaître.`;
  } else {
    second = "Ton profil d'attention commence à prendre forme.";
  }

  return `${main} ${second} Ton profil se précise.`;
}
