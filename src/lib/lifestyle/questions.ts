import type { TemperamentAxisKey } from '@/lib/temperament/questions';

export type { TemperamentAxisKey };

export type LifestyleAxisKey =
  | 'foodie'
  | 'premiumSimplicite'
  | 'experienceObjet'
  | 'esthetiqueFonctionnel'
  | 'aventureConfort'
  | 'authenticiteLuxe';

// Axis convention (positive = first-named pole, negative = second-named pole):
//   foodie:              += foodie,     -= faible intérêt alimentaire
//   premiumSimplicite:   += premium,    -= simplicité
//   experienceObjet:     += expérience, -= objet
//   esthetiqueFonctionnel: += esthétique, -= fonctionnel
//   aventureConfort:     += aventure,   -= confort
//   authenticiteLuxe:    += authenticité, -= luxe

export type FilterKey =
  | 'antiSurprisePublique'
  | 'antiSurprisePlanning'
  | 'antiSurpriseIntime'
  | 'exigenceExecution'
  | 'ouvertSurprise'
  | 'besoinEcoute'
  | 'peurOubli'
  | 'besoinAir'
  | 'sensibiliteCritique'
  | 'besoinFiabilite'
  | 'besoinProfondeur'
  | 'sensibiliteChargeMetale';

export type UnifiedDelta =
  | { target: 'lifestyle'; axis: LifestyleAxisKey; value: number }
  | { target: 'temperament'; axis: TemperamentAxisKey; value: number }
  | { target: 'filter'; key: FilterKey }
  | { target: 'canal'; value: string };

export interface LifestyleOption {
  id: string;
  label: string;
  subtext: string;
  deltas: UnifiedDelta[];
}

export interface LifestyleQuestion {
  id: string;
  title: string;
  micro: string;
  step: 4 | 5;
  options: LifestyleOption[];
  type?: 'choice' | 'textarea';
}

// ─── Étape 4 — Ce que j'aime vivre ───────────────────────────────────────────

export const STEP4_QUESTIONS: LifestyleQuestion[] = [
  {
    id: 'q12',
    step: 4,
    title: "Quand quelqu'un m'invite ou m'offre quelque chose…",
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q12_1',
        label: "N'importe quelle attention sincère me touche",
        subtext: "L'intention compte bien plus que le standing.",
        deltas: [
          { target: 'lifestyle', axis: 'premiumSimplicite', value: -2 },
          { target: 'lifestyle', axis: 'authenticiteLuxe', value: +1 },
        ],
      },
      {
        id: 'q12_2',
        label: 'Quelque chose de bien choisi, même simple',
        subtext: 'Le soin du choix me touche plus que le prix.',
        deltas: [
          { target: 'temperament', axis: 'sensibiliteDetails', value: +1 },
        ],
      },
      {
        id: 'q12_3',
        label: 'Un certain niveau de qualité compte pour moi',
        subtext: "J'apprécie quand c'est fait avec exigence.",
        deltas: [
          { target: 'lifestyle', axis: 'premiumSimplicite', value: +1 },
          { target: 'temperament', axis: 'exigenceStanding', value: +1 },
        ],
      },
      {
        id: 'q12_4',
        label: 'Les détails influencent beaucoup mon expérience',
        subtext: "Un détail raté peut gâcher l'ensemble pour moi.",
        deltas: [
          { target: 'temperament', axis: 'sensibiliteDetails', value: +2 },
          { target: 'temperament', axis: 'exigenceStanding', value: +1 },
        ],
      },
      {
        id: 'q12_5',
        label: "Pas de préférence, je n'y suis pas attaché(e)",
        subtext: "Ces détails ne pèsent pas dans mon plaisir.",
        deltas: [
          { target: 'lifestyle', axis: 'premiumSimplicite', value: -1 },
          { target: 'temperament', axis: 'sensibiliteDetails', value: -1 },
        ],
      },
    ],
  },
  {
    id: 'q13',
    step: 4,
    title: 'Pour les cadeaux, je préfère…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q13_1',
        label: 'Des expériences',
        subtext: 'Vivre quelque chose plutôt que posséder.',
        deltas: [
          { target: 'lifestyle', axis: 'experienceObjet', value: +2 },
        ],
      },
      {
        id: 'q13_2',
        label: 'Des objets à garder',
        subtext: 'Quelque chose de tangible qui dure.',
        deltas: [
          { target: 'lifestyle', axis: 'experienceObjet', value: -2 },
        ],
      },
      {
        id: 'q13_3',
        label: 'Les deux me touchent',
        subtext: "Je suis sensible à l'un comme à l'autre.",
        deltas: [],
      },
      {
        id: 'q13_4',
        label: 'Des choses utiles',
        subtext: 'Ce qui me sert vraiment au quotidien.',
        deltas: [
          { target: 'lifestyle', axis: 'esthetiqueFonctionnel', value: -2 },
        ],
      },
      {
        id: 'q13_5',
        label: 'Des choses symboliques',
        subtext: "Ce qui porte un sens, une mémoire.",
        deltas: [
          { target: 'lifestyle', axis: 'authenticiteLuxe', value: +1 },
        ],
      },
    ],
  },
  {
    id: 'q14',
    step: 4,
    title: 'Pour les cadeaux matériels, ce qui me touche le plus…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q14_1',
        label: 'Un objet utile et bien pensé',
        subtext: "L'usage avant tout, mais pensé.",
        deltas: [
          { target: 'lifestyle', axis: 'esthetiqueFonctionnel', value: -2 },
        ],
      },
      {
        id: 'q14_2',
        label: "Quelque chose qui montre qu'on m'a écouté(e)",
        subtext: "La preuve qu'on a retenu un détail.",
        deltas: [
          { target: 'temperament', axis: 'sensibiliteDetails', value: +2 },
        ],
      },
      {
        id: 'q14_3',
        label: 'Un objet beau et de qualité',
        subtext: "L'esthétique et la matière comptent.",
        deltas: [
          { target: 'lifestyle', axis: 'esthetiqueFonctionnel', value: +2 },
          { target: 'lifestyle', axis: 'premiumSimplicite', value: +1 },
        ],
      },
      {
        id: 'q14_4',
        label: 'Un objet de valeur symbolique',
        subtext: "Ce qui a un sens dépasse l'objet.",
        deltas: [
          { target: 'lifestyle', axis: 'authenticiteLuxe', value: +1 },
        ],
      },
      {
        id: 'q14_5',
        label: 'Je préfère les expériences aux objets',
        subtext: 'Au fond, je retiens les moments.',
        deltas: [
          { target: 'lifestyle', axis: 'experienceObjet', value: +2 },
        ],
      },
    ],
  },
  {
    id: 'q15',
    step: 4,
    title: 'Ma relation à la nourriture et aux restaurants…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q15_1',
        label: "J'aime manger partout",
        subtext: "Peu exigeant(e), je m'adapte facilement.",
        deltas: [
          { target: 'lifestyle', axis: 'foodie', value: +1 },
          { target: 'lifestyle', axis: 'premiumSimplicite', value: -1 },
        ],
      },
      {
        id: 'q15_2',
        label: 'Je suis gourmand(e)',
        subtext: 'Le plaisir de la table, la convivialité.',
        deltas: [
          { target: 'lifestyle', axis: 'foodie', value: +2 },
        ],
      },
      {
        id: 'q15_3',
        label: "J'adore les belles tables",
        subtext: "Le cadre et l'expérience comptent.",
        deltas: [
          { target: 'lifestyle', axis: 'foodie', value: +1 },
          { target: 'lifestyle', axis: 'premiumSimplicite', value: +2 },
        ],
      },
      {
        id: 'q15_4',
        label: 'La gastronomie est une passion',
        subtext: "Un vrai sujet d'expertise pour moi.",
        deltas: [
          { target: 'lifestyle', axis: 'foodie', value: +2 },
          { target: 'temperament', axis: 'exigenceStanding', value: +2 },
        ],
      },
      {
        id: 'q15_5',
        label: 'Je mange pour vivre',
        subtext: "La nourriture n'est pas centrale chez moi.",
        deltas: [
          { target: 'lifestyle', axis: 'foodie', value: -2 },
        ],
      },
    ],
  },
  {
    id: 'q16',
    step: 4,
    title: "Si on m'offre un week-end, ce qui compte le plus…",
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q16_1',
        label: 'La destination avant tout',
        subtext: 'Découvrir un lieu nouveau.',
        deltas: [
          { target: 'lifestyle', axis: 'aventureConfort', value: +2 },
        ],
      },
      {
        id: 'q16_2',
        label: 'Un hôtel confortable et bien situé',
        subtext: 'Le confort et la praticité priment.',
        deltas: [
          { target: 'lifestyle', axis: 'aventureConfort', value: -2 },
        ],
      },
      {
        id: 'q16_3',
        label: "Le charme et l'authenticité",
        subtext: "Un lieu qui a une âme.",
        deltas: [
          { target: 'lifestyle', axis: 'authenticiteLuxe', value: +2 },
          { target: 'lifestyle', axis: 'esthetiqueFonctionnel', value: +1 },
        ],
      },
      {
        id: 'q16_4',
        label: 'Le luxe et le service',
        subtext: "Être pleinement choyé(e).",
        deltas: [
          { target: 'lifestyle', axis: 'authenticiteLuxe', value: -2 },
          { target: 'lifestyle', axis: 'premiumSimplicite', value: +1 },
        ],
      },
      {
        id: 'q16_5',
        label: "L'important, c'est d'être ensemble",
        subtext: 'Le lieu compte moins que la compagnie.',
        deltas: [
          { target: 'lifestyle', axis: 'experienceObjet', value: +1 },
        ],
      },
    ],
  },
  // ─── Compléments transversaux ─────────────────────────────────────────────────
  {
    id: 'q4a',
    step: 4,
    title: "Mon rapport au temps et à l'organisation…",
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q4a_1',
        label: "J'anticipe et je planifie à l'avance",
        subtext: 'Savoir où je vais me rassure.',
        deltas: [
          { target: 'temperament', axis: 'rapportTemps', value: +2 },
          { target: 'temperament', axis: 'spontaneiteControle', value: +1 },
        ],
      },
      {
        id: 'q4a_2',
        label: "Je gère au fil de l'eau",
        subtext: 'Je préfère rester souple.',
        deltas: [
          { target: 'temperament', axis: 'rapportTemps', value: -2 },
          { target: 'temperament', axis: 'spontaneiteControle', value: -1 },
        ],
      },
      {
        id: 'q4a_3',
        label: 'La ponctualité compte beaucoup pour moi',
        subtext: 'Le retard me coûte.',
        deltas: [
          { target: 'temperament', axis: 'rapportTemps', value: +1 },
          { target: 'temperament', axis: 'exigenceStanding', value: +1 },
        ],
      },
      {
        id: 'q4a_4',
        label: 'Je suis souvent un peu en retard, sans malice',
        subtext: "Le temps m'échappe parfois.",
        deltas: [
          { target: 'temperament', axis: 'rapportTemps', value: -1 },
        ],
      },
      {
        id: 'q4a_5',
        label: "La charge mentale m'épuise vite",
        subtext: 'Trop à gérer me déborde.',
        deltas: [
          { target: 'temperament', axis: 'sensibiliteDetails', value: +2 },
          { target: 'filter', key: 'sensibiliteChargeMetale' },
        ],
      },
    ],
  },
  {
    id: 'q4b',
    step: 4,
    title: 'Mon rapport à la qualité et au standing…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q4b_1',
        label: "La qualité compte, même si je n'en parle pas",
        subtext: "Je le remarque sans l'exiger.",
        deltas: [
          { target: 'lifestyle', axis: 'premiumSimplicite', value: +1 },
        ],
      },
      {
        id: 'q4b_2',
        label: 'Je préfère la simplicité authentique au luxe',
        subtext: 'Le vrai vaut mieux que le clinquant.',
        deltas: [
          { target: 'lifestyle', axis: 'authenticiteLuxe', value: +2 },
          { target: 'lifestyle', axis: 'premiumSimplicite', value: -1 },
        ],
      },
      {
        id: 'q4b_3',
        label: "J'aime le beau et le raffinement",
        subtext: 'Le soin esthétique me touche.',
        deltas: [
          { target: 'lifestyle', axis: 'esthetiqueFonctionnel', value: +2 },
          { target: 'lifestyle', axis: 'premiumSimplicite', value: +1 },
        ],
      },
      {
        id: 'q4b_4',
        label: "Le prix m'importe peu, c'est l'intention",
        subtext: "La valeur n'est pas dans le coût.",
        deltas: [
          { target: 'lifestyle', axis: 'premiumSimplicite', value: -1 },
        ],
      },
      {
        id: 'q4b_5',
        label: "Je suis sensible aux belles marques et aux lieux d'exception",
        subtext: "L'excellence me parle.",
        deltas: [
          { target: 'lifestyle', axis: 'authenticiteLuxe', value: -2 },
          { target: 'lifestyle', axis: 'premiumSimplicite', value: +1 },
        ],
      },
    ],
  },
  {
    id: 'q4c',
    step: 4,
    title: 'Quand on organise quelque chose pour moi…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q4c_1',
        label: "J'aime tout savoir à l'avance",
        subtext: "Pas d'inconnue, ça me détend.",
        deltas: [
          { target: 'temperament', axis: 'spontaneiteControle', value: +2 },
          { target: 'temperament', axis: 'rapportTemps', value: +1 },
          { target: 'filter', key: 'antiSurprisePlanning' },
        ],
      },
      {
        id: 'q4c_2',
        label: "J'aime garder une part de surprise",
        subtext: "Un peu d'inconnu, mais pas trop.",
        deltas: [],
      },
      {
        id: 'q4c_3',
        label: "J'aime être totalement surpris(e)",
        subtext: "L'imprévu total m'enchante.",
        deltas: [
          { target: 'temperament', axis: 'spontaneiteControle', value: -2 },
          { target: 'filter', key: 'ouvertSurprise' },
        ],
      },
      {
        id: 'q4c_4',
        label: "J'ai besoin de valider les détails",
        subtext: "Je préfère avoir un droit de regard.",
        deltas: [
          { target: 'temperament', axis: 'spontaneiteControle', value: +2 },
          { target: 'temperament', axis: 'exigenceStanding', value: +1 },
          { target: 'filter', key: 'exigenceExecution' },
        ],
      },
      {
        id: 'q4c_5',
        label: "Je m'adapte facilement",
        subtext: 'Je fais confiance et je suis le mouvement.',
        deltas: [
          { target: 'temperament', axis: 'spontaneiteControle', value: -1 },
        ],
      },
    ],
  },
  {
    id: 'q4d',
    step: 4,
    title: 'Pour rester en contact, je préfère…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q4d_1',
        label: 'Un appel téléphonique',
        subtext: 'Entendre la voix, le vrai échange.',
        deltas: [{ target: 'canal', value: 'oral' }],
      },
      {
        id: 'q4d_2',
        label: 'Un message écrit',
        subtext: 'Asynchrone, à mon rythme.',
        deltas: [{ target: 'canal', value: 'écrit' }],
      },
      {
        id: 'q4d_3',
        label: 'Un vocal',
        subtext: "Spontané mais sans contrainte d'horaire.",
        deltas: [{ target: 'canal', value: 'hybride' }],
      },
      {
        id: 'q4d_4',
        label: 'En personne, rien ne remplace',
        subtext: 'La présence physique avant tout.',
        deltas: [{ target: 'canal', value: 'présentiel' }],
      },
      {
        id: 'q4d_5',
        label: 'Peu importe, selon le moment',
        subtext: "Je m'adapte au canal.",
        deltas: [{ target: 'canal', value: 'flexible' }],
      },
    ],
  },
];

// ─── Étape 5 — Ce qu'il vaut mieux éviter ────────────────────────────────────

export const STEP5_CHOICE_QUESTIONS: LifestyleQuestion[] = [
  {
    id: 'q18',
    step: 5,
    title: 'Le type de surprise que je détesterais…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q18_1',
        label: 'Une surprise devant beaucoup de monde',
        subtext: "L'attention publique me met mal à l'aise.",
        deltas: [
          { target: 'temperament', axis: 'energieSociale', value: -1 },
          { target: 'temperament', axis: 'expressiviteReserve', value: +1 },
          { target: 'filter', key: 'antiSurprisePublique' },
        ],
      },
      {
        id: 'q18_2',
        label: 'Une surprise qui change mon planning',
        subtext: 'Bousculer mon organisation me stresse.',
        deltas: [
          { target: 'temperament', axis: 'spontaneiteControle', value: +1 },
          { target: 'temperament', axis: 'rapportTemps', value: +1 },
          { target: 'filter', key: 'antiSurprisePlanning' },
        ],
      },
      {
        id: 'q18_3',
        label: 'Une surprise trop intime ou trop intense',
        subtext: "Trop d'émotion exposée me gêne.",
        deltas: [
          { target: 'temperament', axis: 'expressiviteReserve', value: +1 },
          { target: 'temperament', axis: 'espaceProsimite', value: -1 },
          { target: 'filter', key: 'antiSurpriseIntime' },
        ],
      },
      {
        id: 'q18_4',
        label: 'Une surprise mal organisée',
        subtext: "L'amateurisme gâche tout pour moi.",
        deltas: [
          { target: 'temperament', axis: 'exigenceStanding', value: +1 },
          { target: 'temperament', axis: 'sensibiliteDetails', value: +1 },
          { target: 'filter', key: 'exigenceExecution' },
        ],
      },
      {
        id: 'q18_5',
        label: "Je suis plutôt partant(e) pour tout",
        subtext: "J'accueille la surprise avec plaisir.",
        deltas: [
          { target: 'temperament', axis: 'spontaneiteControle', value: -1 },
          { target: 'filter', key: 'ouvertSurprise' },
        ],
      },
    ],
  },
  {
    id: 'q19',
    step: 5,
    title: 'Ce qui me blesse le plus dans une relation…',
    micro: 'Choisis la réponse qui te ressemble le plus.',
    options: [
      {
        id: 'q19_1',
        label: "Ne pas être écouté(e)",
        subtext: "Avoir l'impression de parler dans le vide.",
        deltas: [{ target: 'filter', key: 'besoinEcoute' }],
      },
      {
        id: 'q19_2',
        label: "Être oublié(e) ou mis(e) de côté",
        subtext: 'Sentir que je ne compte pas.',
        deltas: [{ target: 'filter', key: 'peurOubli' }],
      },
      {
        id: 'q19_3',
        label: "Être envahi(e) ou contrôlé(e)",
        subtext: "Manquer d'air dans la relation.",
        deltas: [
          { target: 'temperament', axis: 'espaceProsimite', value: -2 },
          { target: 'filter', key: 'besoinAir' },
        ],
      },
      {
        id: 'q19_4',
        label: 'Les reproches ou critiques répétées',
        subtext: "La critique constante m'use.",
        deltas: [{ target: 'filter', key: 'sensibiliteCritique' }],
      },
      {
        id: 'q19_5',
        label: 'Le manque de fiabilité',
        subtext: "Ne pas pouvoir compter sur quelqu'un.",
        deltas: [
          { target: 'temperament', axis: 'stabiliteNouveaute', value: -1 },
          { target: 'filter', key: 'besoinFiabilite' },
        ],
      },
      {
        id: 'q19_6',
        label: 'Le manque de profondeur',
        subtext: 'Les relations superficielles me lassent.',
        deltas: [{ target: 'filter', key: 'besoinProfondeur' }],
      },
    ],
  },
];

export const ALL_LIFESTYLE_QUESTIONS: LifestyleQuestion[] = [
  ...STEP4_QUESTIONS,
  ...STEP5_CHOICE_QUESTIONS,
];
