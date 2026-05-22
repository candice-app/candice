import { ALL_TEMPERAMENT_QUESTIONS } from './questions';
import type { TemperamentAxisKey, ModeKey } from './questions';

// ─── Types ────────────────────────────────────────────────────────────────────

export type { TemperamentAxisKey, ModeKey };

export interface AxisScore {
  score:     number; // -100 to +100
  intensity: number; // count of non-zero delta contributions
}

export interface ModeResult {
  label:     string;
  intensity: number; // how many questions voted for this label
}

export interface TemperamentAxes {
  energieSociale:      AxisScore;
  espaceProsimite:     AxisScore;
  spontaneiteControle: AxisScore;
  communicationStyle:  AxisScore;
  expressiviteReserve: AxisScore;
  stabiliteNouveaute:  AxisScore;
  sensibiliteDetails:  AxisScore;
  exigenceStanding:    AxisScore;
  rapportTemps:        AxisScore;
}

export interface TemperamentModes {
  conflit:  ModeResult | null;
  stress:   ModeResult | null;
  decision: ModeResult | null;
  canal:    ModeResult | null;
}

export interface TemperamentResult {
  axes:  TemperamentAxes;
  modes: TemperamentModes;
}

// questionId → selectedOptionId
export type TemperamentAnswers = Record<string, string>;

// ─── Constants ────────────────────────────────────────────────────────────────

const AXIS_KEYS: TemperamentAxisKey[] = [
  'energieSociale',
  'espaceProsimite',
  'spontaneiteControle',
  'communicationStyle',
  'expressiviteReserve',
  'stabiliteNouveaute',
  'sensibiliteDetails',
  'exigenceStanding',
  'rapportTemps',
];

const MODE_KEYS: ModeKey[] = ['conflit', 'stress', 'decision', 'canal'];

// Max raw magnitude per axis — generous upper bound for normalization.
// Max signal per question: |±2|. With up to 4 questions pushing same axis = 8.
const MAX_RAW = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function zeroAxes(): Record<TemperamentAxisKey, { raw: number; intensity: number }> {
  return Object.fromEntries(AXIS_KEYS.map(k => [k, { raw: 0, intensity: 0 }])) as Record<
    TemperamentAxisKey,
    { raw: number; intensity: number }
  >;
}

function zeroModeVotes(): Record<ModeKey, Record<string, number>> {
  return Object.fromEntries(MODE_KEYS.map(k => [k, {}])) as Record<ModeKey, Record<string, number>>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function scoreTemperament(answers: TemperamentAnswers): TemperamentResult {
  const axisAcc = zeroAxes();
  const modeVotes = zeroModeVotes();

  for (const [questionId, optionId] of Object.entries(answers)) {
    const question = ALL_TEMPERAMENT_QUESTIONS.find(q => q.id === questionId);
    if (!question) continue;

    const option = question.options.find(o => o.id === optionId);
    if (!option) continue;

    for (const { axis, value } of option.deltas) {
      axisAcc[axis].raw += value;
      if (value !== 0) axisAcc[axis].intensity++;
    }

    if (option.mode) {
      const { mode, value } = option.mode;
      modeVotes[mode][value] = (modeVotes[mode][value] ?? 0) + 1;
    }
  }

  // Normalize axes
  const axes: TemperamentAxes = {} as TemperamentAxes;
  for (const key of AXIS_KEYS) {
    const { raw, intensity } = axisAcc[key];
    const score = Math.max(-100, Math.min(100, Math.round((raw / MAX_RAW) * 100)));
    axes[key] = { score, intensity };
  }

  // Resolve modes (pick label with most votes, or null)
  const modes: TemperamentModes = {
    conflit:  null,
    stress:   null,
    decision: null,
    canal:    null,
  };

  for (const mode of MODE_KEYS) {
    const votes = modeVotes[mode];
    const entries = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      modes[mode] = { label: entries[0][0], intensity: entries[0][1] };
    }
  }

  return { axes, modes };
}
