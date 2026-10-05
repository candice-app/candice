// Normalisation LEXICALE pure (lot A bis, correction 1).
//
// SEULE responsable de la clé de correspondance d'un concept. Déterministe :
// même entrée → même sortie, quel que soit l'ordre d'appel.
//   minuscules · accents dépliés · ponctuation retirée · articles retirés ·
//   espaces et tirets unifiés en une espace.
//
// Elle NE fait PAS de singulier/pluriel, AUCUNE traduction, AUCUN rapprochement
// sémantique. `analog photography` ne se résout vers `photographie argentique`
// que par un alias explicite, jamais par devinette (section 9 du lot). La
// résolution sémantique réelle (embeddings, modèle) est un lot à part.

/** Articles FR/EN retirés (ils ne portent pas la clé conceptuelle). */
const ARTICLES = new Set([
  'le', 'la', 'les', 'l', 'un', 'une', 'des', 'de', 'du', 'd',
  'the', 'a', 'an',
]);

/** Marques diacritiques combinantes (U+0300–U+036F), retirées après décomposition NFD. */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

export function normalizeLabel(raw: string): string {
  const deAccented = raw.normalize('NFD').replace(COMBINING_MARKS, '');
  const lowered = deAccented.toLowerCase();
  // Ponctuation → espace ; on conserve lettres, chiffres, espaces et tirets.
  const depunctuated = lowered.replace(/[^\p{L}\p{N}\s-]/gu, ' ');
  // Tirets et espaces multiples → une seule espace.
  const unified = depunctuated.replace(/[-\s]+/g, ' ').trim();
  const tokens = unified.split(' ').filter((t) => t.length > 0 && !ARTICLES.has(t));
  return tokens.join(' ');
}
