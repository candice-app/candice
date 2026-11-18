import type { OptionV3 } from './banque';

/**
 * L'IDENTITÉ D'UNE OPTION, telle qu'elle voyage jusqu'au navigateur, revient, et reste dans
 * la progression (`profile_completion.answer_data`). Le rang quand le référentiel en donne
 * un, sinon le libellé normalisé — jamais l'index dans le tableau.
 */
export function cleOption(o: OptionV3): string {
  if (o.rang && o.rang.trim()) return `r${o.rang.trim()}`;
  return `l${o.libelle.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}
