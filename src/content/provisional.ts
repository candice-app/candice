// ⚠ COPY PROVISOIRE — NON ARBITRÉE. Emplacements identifiés pour le squelette UI du sous-bloc 2
// (étape d'identification + état transitoire côte à côte). À REMPLACER par la rédaction d'Estelle.
// Séparée de src/content/invite.ts (copy arbitrée) pour qu'on voie d'un coup d'œil ce qui reste à
// trancher. {Prénom} résolu au rendu comme ailleurs.

export const PROVISIONAL = {
  'identify.title': 'Pour qui veux-tu créer un profil ?', // PROVISOIRE
  'identify.name.label': 'Son prénom', // PROVISOIRE
  'identify.gender.label': 'Comment Candice doit-elle en parler ?', // PROVISOIRE
  'identify.cta': 'Continuer', // PROVISOIRE
  'cotecote.pending': 'Le parcours « côte à côte » arrive à l’incrément suivant.', // PROVISOIRE
} as const;

export type ProvisionalKey = keyof typeof PROVISIONAL;
