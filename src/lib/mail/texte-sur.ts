// Un prénom vient des métadonnées d'un compte, ou d'une fiche, que chacun écrit librement.
// Il entre dans des courriels envoyés À QUELQU'UN D'AUTRE, sous l'adresse de Candice : tel quel,
// c'est un moyen de faire porter par Candice un lien ou un message de son choix.
//
// Règle : seules des lettres, l'espace, le trait d'union et l'apostrophe passent. Ni balise,
// ni point (un nom de domaine devient un lien cliquable dans la plupart des messageries),
// ni chiffre, ni barre oblique. Trente lettres au plus.

/** Un prénom sûr à placer dans le sujet ou le corps d'un courriel ; `null` s'il n'en reste rien. */
export function prenomSur(brut: string | null | undefined): string | null {
  if (brut == null) return null;
  const premier = String(brut).trim().split(/\s+/)[0] ?? '';
  const net = premier.normalize('NFC').replace(/[^\p{L}\p{M}'’-]/gu, '').slice(0, 30);
  return /\p{L}/u.test(net) ? net : null;
}

/** Un texte libre (titre, phrase générée) placé dans le corps HTML d'un courriel. */
export function echapperHtml(brut: string | null | undefined): string {
  return String(brut ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
