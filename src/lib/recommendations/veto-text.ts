// VETO TEXTUEL — reconnaissance d'un terme interdit dans une idée proposée.
//
// Le défaut corrigé ici : `texte.includes(veto)` écartait toute idée dont le texte
// CONTENAIT la suite de lettres, où qu'elle tombe. Un veto « vin » écartait « vinyle »,
// « Vincent » et « divin » ; un veto « pain » écartait « copains ». Le veto se retournait
// contre la personne qu'il protège : il ne filtrait pas un risque, il supprimait des
// idées au hasard, et sans la moindre trace.
//
// La règle retenue : frontière de mot des deux côtés, insensible à la casse et aux
// accents, pluriel français toléré sur chaque mot (« vin » reconnaît « vins », pas
// « vinyle »). Une expression composée garde son ordre et tolère un espacement variable
// (« surprise publique » reconnaît « surprises  publiques »).
//
// Ce que la règle NE fait pas, délibérément : aucune racine, aucun synonyme, aucune
// approximation. Un veto est une consigne de la personne ; l'élargir au-delà de ses mots
// serait décider à sa place. Le recoupement sémantique vit ailleurs (rejection-match.ts),
// sur des rejets déclarés qui portent leur propre provenance.

/** Minuscule + accents retirés. Appliqué des DEUX côtés, sinon « crustacés » ne
 *  reconnaîtrait pas « crustaces » et le veto fuirait sur une simple saisie sans accent. */
export function aplatir(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const ECHAPPER = /[.*+?^${}()|[\]\\]/g;

/**
 * Motif d'un veto : chaque mot garde son ordre, tolère un pluriel français (s/x) et un
 * espacement variable ; frontières de mot aux deux extrémités.
 * Rend `null` pour un veto vide ou sans aucun caractère alphanumérique — un veto qui ne
 * dit rien ne doit RIEN écarter (sinon il écarterait tout).
 */
export function motifVeto(veto: string): RegExp | null {
  // Un mot sans le moindre caractère alphanumérique n'est pas un mot : « !! », « - »,
  // « ... » sont des saisies vides de sens. Les garder fabriquerait un motif qui peut
  // reconnaître de la ponctuation présente dans presque n'importe quelle idée — un veto
  // involontaire, invisible, qui écarterait des propositions sans que personne ne sache
  // pourquoi. `filter(Boolean)` ne suffisait pas : il retire les chaînes vides, pas celles
  // qui ne portent que de la ponctuation.
  const mots = aplatir(veto).split(/\s+/).filter((m) => /[a-z0-9]/.test(m));
  if (mots.length === 0) return null;
  const morceaux = mots.map((m) => `${m.replace(ECHAPPER, '\\$&')}(?:s|x)?`);
  // Frontières explicites plutôt que \b : \b est faux dès qu'un veto commence ou finit
  // par un caractère non-mot (« d'alcool », « 100% »), où il ne s'applique pas.
  const motif = `(?<![a-z0-9])${morceaux.join('\\s+')}(?![a-z0-9])`;
  try { return new RegExp(motif, 'i'); } catch { return null; }
}

/** Le texte mentionne-t-il ce veto ? */
export function mentionne(texte: string, veto: string): boolean {
  const motif = motifVeto(veto);
  return motif !== null && motif.test(aplatir(texte));
}

/** Le premier veto que ce texte enfreint, ou null. Rendu plutôt qu'un booléen :
 *  savoir POURQUOI une idée est écartée vaut mieux que savoir qu'elle l'est. */
export function vetoEnfreint(texte: string, vetos: readonly string[]): string | null {
  const plat = aplatir(texte);
  for (const v of vetos) {
    const motif = motifVeto(v);
    if (motif !== null && motif.test(plat)) return v;
  }
  return null;
}
