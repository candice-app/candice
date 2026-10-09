// Résolution des jetons de texte (incognito §2/§6) — fonction PURE et UNIQUE, appelée par la
// production AVANT la création du SourceRecord : la couche source stocke prénom + pronom RÉSOLUS,
// jamais le jeton. UN SEUL point de résolution, une seule autorité textuelle. Aucun pronom genré
// ni prénom codé en dur dans un libellé : les libellés portent {Prénom}, {Pronom} (début de
// phrase) et {pronom} (ailleurs), résolus ICI et nulle part ailleurs.
//
//   {Prénom}                                  → le prénom du contact (toujours, quel que soit le genre)
//   {Pronom} / {pronom}  gender = 'femme'     → Elle / elle
//                        gender = 'homme'     → Il   / il
//                        gender ∈ {non_binaire, non_precise, NULL} → le prénom (rien ne s'accorde —
//                                               un prénom épicène comme Camille ne pose aucun problème)

export type ContactGender = 'femme' | 'homme' | 'non_binaire' | 'non_precise' | null | undefined;

export function resolvePronoun(template: string, firstName: string, gender: ContactGender): string {
  const lower = gender === 'femme' ? 'elle' : gender === 'homme' ? 'il' : firstName;
  const cap = gender === 'femme' ? 'Elle' : gender === 'homme' ? 'Il' : firstName;
  return template
    .replace(/\{Prénom\}/g, firstName)
    .replace(/\{Pronom\}/g, cap)
    .replace(/\{pronom\}/g, lower);
}
