import type { AttentionDim } from './scoring';

export interface AttentionOption {
  id: string;
  label: string;
  subtext: string;
  dims: AttentionDim[];
}

export interface AttentionQuestion {
  id: string;
  title: string;
  micro: string;
  options: AttentionOption[];
}

export const RECEPTION_QUESTIONS: AttentionQuestion[] = [
  {
    id: 'q1',
    title: 'Je me sens le plus aimé(e) quand …',
    micro: 'Choisis jusqu’à 3 réponses. La première compte le plus.',
    options: [
      { id: 'q1a', label: 'On me dit des mots sincères', subtext: 'Un compliment vrai, une reconnaissance dite à voix haute.', dims: ['MOT'] },
      { id: 'q1b', label: 'On m’aide concrètement sans que je demande', subtext: 'Quelqu’un qui allège ma charge avant même que je l’exprime.', dims: ['SER', 'GES'] },
      { id: 'q1c', label: 'On me fait un cadeau pensé spécialement pour moi', subtext: 'Un objet choisi pour moi, pas acheté au hasard.', dims: ['CAD_C'] },
      { id: 'q1d', label: 'On me fait un cadeau chargé de sens', subtext: 'Quelque chose qui porte une histoire, une intention.', dims: ['CAD_S'] },
      { id: 'q1e', label: 'On me consacre un vrai moment de qualité', subtext: 'Du temps pleinement présent, sans distraction ni écran.', dims: ['EXP'] },
      { id: 'q1f', label: 'On pense à moi dans les petits détails du quotidien', subtext: 'Des micro-attentions régulières, pas réservées aux grandes occasions.', dims: ['GES'] },
      { id: 'q1g', label: 'On me surprend avec quelque chose d’inattendu', subtext: 'L’imprévu, l’effet de surprise qui crée l’émotion.', dims: ['SUR'] },
    ],
  },
  {
    id: 'q2',
    title: 'Une attention réussie, pour moi, c’est surtout …',
    micro: 'Choisis jusqu’à 3 réponses. La première compte le plus.',
    options: [
      { id: 'q2a', label: 'Quelque chose qui montre qu’on m’a écouté(e)', subtext: 'La preuve qu’on a retenu un détail que j’avais glissé.', dims: ['CAD_C', 'GES'] },
      { id: 'q2b', label: 'Quelque chose qui tombe au bon moment', subtext: 'Le bon geste, juste quand j’en avais besoin.', dims: ['GES', 'SER'] },
      { id: 'q2c', label: 'Quelque chose qui crée un souvenir', subtext: 'Un moment ou un objet dont on reparlera plus tard.', dims: ['EXP', 'CAD_S'] },
      { id: 'q2d', label: 'Quelque chose qui me facilite vraiment la vie', subtext: 'Une aide qui retire un poids concret de mes épaules.', dims: ['SER'] },
      { id: 'q2e', label: 'Quelque chose de simple mais sincère', subtext: 'Peu importe le prix, ce qui compte c’est l’intention.', dims: ['MOT', 'GES'] },
      { id: 'q2f', label: 'Quelque chose que je n’avais pas vu venir', subtext: 'L’effet de surprise, ce petit choc heureux.', dims: ['SUR'] },
      { id: 'q2g', label: 'Quelque chose de beau, choisi avec goût', subtext: 'Le soin, l’esthétique, la qualité du choix.', dims: ['CAD_C'] },
    ],
  },
  {
    id: 'q3',
    title: 'Ce qui me touche le plus durablement …',
    micro: 'Choisis jusqu’à 3 réponses. La première compte le plus.',
    options: [
      { id: 'q3a', label: 'Une phrase qui reste en tête', subtext: 'Des mots que je me répète encore longtemps après.', dims: ['MOT'] },
      { id: 'q3b', label: 'Un geste fait sans bruit, mais au bon moment', subtext: 'Une attention discrète qui montre qu’on a vu mon besoin.', dims: ['GES', 'SER'] },
      { id: 'q3c', label: 'Un objet qui a une histoire', subtext: 'Quelque chose chargé de mémoire, pas juste neuf.', dims: ['CAD_S'] },
      { id: 'q3d', label: 'Une expérience partagée dont on reparlera longtemps', subtext: 'Un moment vécu ensemble qui devient un repère commun.', dims: ['EXP'] },
      { id: 'q3e', label: 'Une surprise parfaitement pensée', subtext: 'L’imprévu, mais préparé avec soin et justesse.', dims: ['SUR', 'CAD_C'] },
      { id: 'q3f', label: 'Une aide concrète quand j’en ai vraiment besoin', subtext: 'Un soutien réel dans les moments où je manque de ressources.', dims: ['SER'] },
      { id: 'q3g', label: 'Un détail qui prouve qu’on me connaît vraiment', subtext: 'Le petit signe qui dit : on me connaît pour de vrai.', dims: ['CAD_C', 'GES'] },
    ],
  },
  {
    id: 'q4',
    title: 'Entre deux attentions, je préfère …',
    micro: 'Choisis jusqu’à 3 réponses. La première compte le plus.',
    options: [
      { id: 'q4a', label: 'Une petite attention régulière', subtext: 'La constance vaut mieux qu’un grand geste isolé.', dims: ['GES'] },
      { id: 'q4b', label: 'Un grand moment rare mais marquant', subtext: 'Peu souvent, mais quelque chose qu’on n’oublie pas.', dims: ['EXP'] },
      { id: 'q4c', label: 'Une aide concrète quand j’en ai besoin', subtext: 'Du soutien réel plutôt que des mots.', dims: ['SER'] },
      { id: 'q4d', label: 'Un mot sincère au bon moment', subtext: 'La bonne phrase, dite au moment juste.', dims: ['MOT'] },
      { id: 'q4e', label: 'Un cadeau qui a du sens', subtext: 'Le symbole compte plus que la valeur.', dims: ['CAD_S'] },
      { id: 'q4f', label: 'Une surprise qui casse la routine', subtext: 'L’inattendu qui réveille le quotidien.', dims: ['SUR'] },
      { id: 'q4g', label: 'Un objet choisi avec précision', subtext: 'Le bon objet, choisi avec exigence et justesse.', dims: ['CAD_C'] },
    ],
  },
];

export const EXPRESSION_QUESTION: AttentionQuestion = {
  id: 'qe',
  title: 'Et toi, comment montres-tu naturellement ton attention aux autres ?',
  micro: 'Choisis jusqu’à 3 réponses. Cela aidera Candice à comprendre les décalages possibles entre ce que tu donnes naturellement et ce que les autres attendent.',
  options: [
    { id: 'qea', label: 'Je dis ce que je ressens, je complimente, je rassure', subtext: 'Je mets des mots sur ce que je ressens pour les autres.', dims: ['MOT'] },
    { id: 'qeb', label: 'J’aide, je rends service sans qu’on me le demande', subtext: 'Je montre que je tiens à quelqu’un en l’aidant concrètement.', dims: ['SER'] },
    { id: 'qec', label: 'J’offre des cadeaux choisis avec soin', subtext: 'Je traduis mon affection par un objet bien choisi.', dims: ['CAD_C'] },
    { id: 'qed', label: 'J’offre des choses qui ont du sens, une histoire', subtext: 'J’aime les attentions chargées de symbole.', dims: ['CAD_S'] },
    { id: 'qee', label: 'Je passe du vrai temps de qualité avec les gens', subtext: 'Ma façon d’aimer, c’est d’être pleinement présent(e).', dims: ['EXP'] },
    { id: 'qef', label: 'J’ai mille petites attentions au quotidien', subtext: 'Je montre que je pense à l’autre dans les détails.', dims: ['GES'] },
    { id: 'qeg', label: 'J’aime faire des surprises', subtext: 'J’exprime mon affection en créant de l’inattendu.', dims: ['SUR'] },
  ],
};
