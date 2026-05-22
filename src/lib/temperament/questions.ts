export type TemperamentAxisKey =
  | 'energieSociale'
  | 'espaceProsimite'
  | 'spontaneiteControle'
  | 'communicationStyle'
  | 'expressiviteReserve'
  | 'stabiliteNouveaute'
  | 'sensibiliteDetails'
  | 'exigenceStanding'
  | 'rapportTemps';

export type ModeKey = 'conflit' | 'stress' | 'decision' | 'canal';

export interface AxisDelta {
  axis: TemperamentAxisKey;
  value: number; // positive = right pole, negative = left pole (see scoring.ts for convention)
}

export interface ModeSignal {
  mode: ModeKey;
  value: string;
}

export interface TemperamentOption {
  id: string;
  label: string;
  subtext: string;
  deltas: AxisDelta[];
  mode?: ModeSignal;
}

export interface TemperamentQuestion {
  id: string;
  title: string;
  micro: string;
  step: 2 | 3;
  options: TemperamentOption[];
}

// ─── Étape 2 — Mon énergie relationnelle ──────────────────────────────────────
// Axis convention (positive = right pole, negative = left pole):
//   energieSociale:      -=introversion, +=extraversion
//   espaceProsimite:     -=espace/autonomie, +=proximité/lien
//   spontaneiteControle: -=spontanéité, +=contrôle
//   communicationStyle:  -=directe, +=indirecte
//   expressiviteReserve: -=expressivité, +=réserve
//   stabiliteNouveaute:  -=stabilité, +=nouveauté
//   sensibiliteDetails:  -=faible, +=élevée
//   exigenceStanding:    -=simplicité, +=premium
//   rapportTemps:        -=imprévu, +=anticipation

export const STEP2_QUESTIONS: TemperamentQuestion[] = [
  {
    id: 'q5',
    step: 2,
    title: 'Quand je recharge mes batteries…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q5_1',
        label: 'J’ai besoin de moments seul(e)',
        subtext: 'Le calme et la solitude me régénèrent vraiment.',
        deltas: [
          { axis: 'energieSociale', value: -2 },
          { axis: 'espaceProsimite', value: -2 },
        ],
      },
      {
        id: 'q5_2',
        label: 'Je préfère les petits groupes',
        subtext: 'Quelques personnes proches plutôt qu’une foule.',
        deltas: [
          { axis: 'energieSociale', value: -1 },
          { axis: 'espaceProsimite', value: +1 },
        ],
      },
      {
        id: 'q5_3',
        label: 'Ça dépend des jours',
        subtext: 'Mon énergie sociale varie selon les moments.',
        deltas: [],
      },
      {
        id: 'q5_4',
        label: 'J’aime être entouré(e)',
        subtext: 'La présence des autres me donne de l’énergie.',
        deltas: [
          { axis: 'energieSociale', value: +2 },
          { axis: 'espaceProsimite', value: +1 },
        ],
      },
      {
        id: 'q5_5',
        label: 'Plus c’est animé, mieux c’est',
        subtext: 'J’aime le mouvement, la stimulation, l’effervescence.',
        deltas: [
          { axis: 'energieSociale', value: +2 },
          { axis: 'stabiliteNouveaute', value: +1 },
        ],
      },
    ],
  },
  {
    id: 'q6',
    step: 2,
    title: 'Quand je suis stressé(e), j’ai tendance à…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q6_1',
        label: 'Garder pour moi, faire bonne figure',
        subtext: 'J’encaisse en silence plutôt que de le montrer.',
        deltas: [{ axis: 'expressiviteReserve', value: +2 }],
        mode: { mode: 'stress', value: 'silence' },
      },
      {
        id: 'q6_2',
        label: 'Me retirer, avoir besoin de calme',
        subtext: 'J’ai besoin de m’isoler pour me reposer.',
        deltas: [{ axis: 'espaceProsimite', value: -2 }],
        mode: { mode: 'stress', value: 'retrait' },
      },
      {
        id: 'q6_3',
        label: 'En parler, me confier',
        subtext: 'Mettre des mots dessus m’aide à aller mieux.',
        deltas: [{ axis: 'expressiviteReserve', value: -2 }],
        mode: { mode: 'stress', value: 'parole' },
      },
      {
        id: 'q6_4',
        label: 'Agir, me mettre en mouvement',
        subtext: 'Faire quelque chose vaut mieux que ruminer.',
        deltas: [{ axis: 'spontaneiteControle', value: -1 }],
        mode: { mode: 'stress', value: 'action' },
      },
      {
        id: 'q6_5',
        label: 'Chercher à contrôler ce que je peux',
        subtext: 'Reprendre la main sur les détails me rassure.',
        deltas: [
          { axis: 'spontaneiteControle', value: +2 },
          { axis: 'rapportTemps', value: +1 },
        ],
        mode: { mode: 'stress', value: 'contrôle' },
      },
    ],
  },
  {
    id: 'q7',
    step: 2,
    title: 'Face à un désaccord, je…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q7_1',
        label: 'En parle directement',
        subtext: 'J’aborde le sujet franchement, sans tourner autour.',
        deltas: [{ axis: 'communicationStyle', value: -2 }],
        mode: { mode: 'conflit', value: 'direct' },
      },
      {
        id: 'q7_2',
        label: 'Ai besoin de temps avant d’en parler',
        subtext: 'Je dois digérer avant de pouvoir en discuter.',
        deltas: [{ axis: 'rapportTemps', value: +1 }],
        mode: { mode: 'conflit', value: 'temporisateur' },
      },
      {
        id: 'q7_3',
        label: 'Évite le conflit autant que possible',
        subtext: 'Je préfère préserver la paix, quitte à me taire.',
        deltas: [{ axis: 'expressiviteReserve', value: +1 }],
        mode: { mode: 'conflit', value: 'évitant' },
      },
      {
        id: 'q7_4',
        label: 'Dédramatise avec l’humour',
        subtext: 'Je désamorce les tensions par une touche légère.',
        deltas: [{ axis: 'communicationStyle', value: +1 }],
        mode: { mode: 'conflit', value: 'humour' },
      },
      {
        id: 'q7_5',
        label: 'Écris plus facilement que je ne parle',
        subtext: 'À l’écrit, je trouve mieux mes mots.',
        deltas: [{ axis: 'communicationStyle', value: +1 }],
        mode: { mode: 'canal', value: 'écrit' },
      },
    ],
  },
  {
    id: 'q8',
    step: 2,
    title: 'Dans une relation, ce dont j’ai le plus besoin…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q8_1',
        label: 'De stabilité et de constance',
        subtext: 'Savoir sur quoi je peux compter, durablement.',
        deltas: [{ axis: 'stabiliteNouveaute', value: -2 }],
      },
      {
        id: 'q8_2',
        label: 'De liberté et d’espace',
        subtext: 'Pouvoir respirer sans me sentir enfermé(e).',
        deltas: [{ axis: 'espaceProsimite', value: -2 }],
      },
      {
        id: 'q8_3',
        label: 'De profondeur et d’échanges vrais',
        subtext: 'Des conversations qui vont au-delà du superficiel.',
        deltas: [{ axis: 'expressiviteReserve', value: -1 }],
      },
      {
        id: 'q8_4',
        label: 'De légèreté et de rire',
        subtext: 'Du plaisir, de la fluidité, sans lourdeur.',
        deltas: [{ axis: 'stabiliteNouveaute', value: +1 }],
        mode: { mode: 'conflit', value: 'humour' },
      },
      {
        id: 'q8_5',
        label: 'De loyauté dans les moments difficiles',
        subtext: 'Être là quand ça compte vraiment.',
        deltas: [{ axis: 'stabiliteNouveaute', value: -1 }],
      },
      {
        id: 'q8_6',
        label: 'De respect de mon rythme',
        subtext: 'Qu’on n’impose pas une cadence qui n’est pas la mienne.',
        deltas: [
          { axis: 'espaceProsimite', value: -1 },
          { axis: 'spontaneiteControle', value: +1 },
        ],
      },
    ],
  },
];

// ─── Étape 3 — Mon style de communication et de décision ──────────────────────

export const STEP3_QUESTIONS: TemperamentQuestion[] = [
  {
    id: 'q9',
    step: 3,
    title: 'Pour communiquer, je préfère…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q9_1',
        label: 'Aller droit au but',
        subtext: 'L’efficacité et la clarté, sans détour.',
        deltas: [{ axis: 'communicationStyle', value: -2 }],
      },
      {
        id: 'q9_2',
        label: 'Parler de ce que je ressens',
        subtext: 'Mettre l’émotion au cœur de l’échange.',
        deltas: [{ axis: 'expressiviteReserve', value: -2 }],
      },
      {
        id: 'q9_3',
        label: 'Tout analyser en profondeur',
        subtext: 'Comprendre le fond avant d’avancer.',
        deltas: [{ axis: 'sensibiliteDetails', value: +1 }],
        mode: { mode: 'decision', value: 'analytique' },
      },
      {
        id: 'q9_4',
        label: 'Garder ça léger, avec humour',
        subtext: 'Désamorcer et alléger par le rire.',
        deltas: [{ axis: 'communicationStyle', value: +1 }],
        mode: { mode: 'conflit', value: 'humour' },
      },
      {
        id: 'q9_5',
        label: 'Écrire plutôt que parler',
        subtext: 'À l’écrit, je m’exprime plus juste.',
        deltas: [],
        mode: { mode: 'canal', value: 'écrit' },
      },
    ],
  },
  {
    id: 'q10',
    step: 3,
    title: 'Pour mes grandes décisions, je…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q10_1',
        label: 'Analyse les pour et les contre',
        subtext: 'Je pèse rationnellement avant de trancher.',
        deltas: [{ axis: 'sensibiliteDetails', value: +1 }],
        mode: { mode: 'decision', value: 'rationnel' },
      },
      {
        id: 'q10_2',
        label: 'Fais confiance à mon instinct',
        subtext: 'Je me fie à ce que je ressens.',
        deltas: [{ axis: 'spontaneiteControle', value: -1 }],
        mode: { mode: 'decision', value: 'intuitif' },
      },
      {
        id: 'q10_3',
        label: 'Demande l’avis des proches',
        subtext: 'Le regard des gens de confiance compte.',
        deltas: [{ axis: 'espaceProsimite', value: +1 }],
        mode: { mode: 'decision', value: 'social' },
      },
      {
        id: 'q10_4',
        label: 'Fais des recherches approfondies',
        subtext: 'Je veux maîtriser le sujet avant de choisir.',
        deltas: [
          { axis: 'exigenceStanding', value: +1 },
          { axis: 'spontaneiteControle', value: +1 },
        ],
        mode: { mode: 'decision', value: 'analytique' },
      },
      {
        id: 'q10_5',
        label: 'Attends que ce soit clair en moi',
        subtext: 'Je laisse maturer jusqu’à la certitude intérieure.',
        deltas: [{ axis: 'rapportTemps', value: +1 }],
        mode: { mode: 'decision', value: 'maturation' },
      },
    ],
  },
  {
    id: 'q11',
    step: 3,
    title: 'J’exprime mes émotions…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q11_1',
        label: 'Assez librement',
        subtext: 'Je montre ce que je ressens sans filtre.',
        deltas: [{ axis: 'expressiviteReserve', value: -2 }],
      },
      {
        id: 'q11_2',
        label: 'Avec quelques personnes de confiance',
        subtext: 'Je m’ouvre, mais dans un cercle restreint.',
        deltas: [{ axis: 'expressiviteReserve', value: -1 }],
      },
      {
        id: 'q11_3',
        label: 'Par mes actes plus que par mes mots',
        subtext: 'Je préfère prouver que déclarer.',
        deltas: [],
      },
      {
        id: 'q11_4',
        label: 'Rarement, je préfère garder ça pour moi',
        subtext: 'Mes émotions restent surtout intérieures.',
        deltas: [{ axis: 'expressiviteReserve', value: +2 }],
      },
      {
        id: 'q11_5',
        label: 'Souvent après coup, quand j’ai compris ce que je ressens',
        subtext: 'Je comprends mes émotions avec un temps de décalage.',
        deltas: [
          { axis: 'expressiviteReserve', value: +1 },
          { axis: 'rapportTemps', value: +1 },
        ],
      },
    ],
  },
];

export const ALL_TEMPERAMENT_QUESTIONS: TemperamentQuestion[] = [
  ...STEP2_QUESTIONS,
  ...STEP3_QUESTIONS,
];
