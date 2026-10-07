// Résolution du pronom (incognito §2) — fonction PURE et UNIQUE, appelée par la production
// AVANT la création du SourceRecord : la couche source stocke prénom + pronom RÉSOLUS, jamais
// le jeton. Aucun pronom genré codé en dur dans un libellé : les libellés portent {Pronom}
// (début de phrase) et {pronom} (ailleurs), résolus ICI et nulle part ailleurs.
//
//   gender = 'femme'                          → elle / Elle
//   gender = 'homme'                          → il   / Il
//   gender ∈ {non_binaire, non_precise, NULL} → le prénom (rien ne s'accorde — un prénom
//                                               épicène comme Camille ne pose aucun problème)

export type ContactGender = 'femme' | 'homme' | 'non_binaire' | 'non_precise' | null | undefined;

export function resolvePronoun(template: string, firstName: string, gender: ContactGender): string {
  const lower = gender === 'femme' ? 'elle' : gender === 'homme' ? 'il' : firstName;
  const cap = gender === 'femme' ? 'Elle' : gender === 'homme' ? 'Il' : firstName;
  return template.replace(/\{Pronom\}/g, cap).replace(/\{pronom\}/g, lower);
}
