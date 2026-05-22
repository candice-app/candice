export type AttentionDim = 'MOT' | 'SER' | 'CAD_C' | 'CAD_S' | 'EXP' | 'GES' | 'SUR';

// Ordered slot within a question: index 0 = rank 1, index 1 = rank 2, etc.
// Each slot can contain 1–2 dimensions that share the same rank.
export type RankSlot = AttentionDim[];
export type Question = RankSlot[];

export interface AttentionAnswers {
  reception: Question[];  // Q1..Q4
  expression: Question[]; // QE (one or more questions)
}

export interface FaceResult {
  raw:        Record<AttentionDim, number>;
  normalized: Record<AttentionDim, number>;
  dominant:   AttentionDim[];
  secondaire: AttentionDim[];
  tertiaire:  AttentionDim[];
}

export interface AttentionResult {
  reception:  FaceResult;
  expression: FaceResult;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIMS: AttentionDim[] = ['MOT', 'SER', 'CAD_C', 'CAD_S', 'EXP', 'GES', 'SUR'];

const RANK_WEIGHTS: Record<number, number> = { 0: 5, 1: 3, 2: 1 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function zeroVector(): Record<AttentionDim, number> {
  return { MOT: 0, SER: 0, CAD_C: 0, CAD_S: 0, EXP: 0, GES: 0, SUR: 0 };
}

function scoreFace(questions: Question[]): FaceResult {
  const raw = zeroVector();

  for (const question of questions) {
    question.forEach((slot, rankIndex) => {
      const weight = RANK_WEIGHTS[rankIndex] ?? 0;
      if (weight === 0) return;
      for (const dim of slot) {
        raw[dim] += weight;
      }
    });
  }

  const max = Math.max(...DIMS.map(d => raw[d]));

  const normalized = zeroVector();
  if (max > 0) {
    for (const dim of DIMS) {
      normalized[dim] = Math.round((raw[dim] / max) * 100);
    }
  }

  const dominant:   AttentionDim[] = [];
  const secondaire: AttentionDim[] = [];
  const tertiaire:  AttentionDim[] = [];

  for (const dim of DIMS) {
    const n = normalized[dim];
    if (n === 100) {
      dominant.push(dim);
    } else if (n > 45) {
      secondaire.push(dim);
    } else if (n > 30) {
      tertiaire.push(dim);
    }
  }

  return { raw, normalized, dominant, secondaire, tertiaire };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function scoreAttention(answers: AttentionAnswers): AttentionResult {
  return {
    reception:  scoreFace(answers.reception),
    expression: scoreFace(answers.expression),
  };
}
