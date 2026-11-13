// ARITHMÉTIQUE DES PORTÉES DE CONSENTEMENT — pure, donc éprouvable sans base.
//
// Une ligne de `contact_consents` porte un TABLEAU de portées : une même ligne peut couvrir
// plusieurs usages accordés à des moments différents. Retirer un usage ne doit donc jamais
// retirer la ligne : cela révoquerait en silence des accords que la personne n'a pas repris.
//
// Et la réciproque, aussi facile à manquer : une ligne dont on retire la DERNIÈRE portée
// n'accorde plus rien. La laisser « active » avec un tableau vide donnerait un consentement
// qui ne consent à rien — un état que personne ne saurait lire correctement six mois plus tard.
export interface EtatConsentement {
  readonly scope: readonly string[];
  readonly status: 'pending' | 'active' | 'rejected' | 'revoked';
}

/** Ajoute une portée. Idempotent : réaccorder ce qui est déjà accordé ne duplique rien. */
export function accorder(etat: EtatConsentement | null, portee: string): EtatConsentement {
  const scope = etat ? [...etat.scope] : [];
  if (!scope.includes(portee)) scope.push(portee);
  return { scope, status: 'active' };
}

/**
 * Retire UNE portée, et rien d'autre.
 * · d'autres portées subsistent → la ligne reste active, les autres accords sont préservés ;
 * · c'était la dernière → la ligne est révoquée, et le tableau vidé (pas de consentement
 *   actif qui ne consent à rien) ;
 * · la portée n'était pas accordée → l'état est rendu inchangé, sans erreur : un retrait
 *   de ce qu'on n'a pas accordé n'est pas une faute, et ne doit surtout rien révoquer.
 */
export function retirer(etat: EtatConsentement | null, portee: string): EtatConsentement {
  if (!etat) return { scope: [], status: 'revoked' };
  if (!etat.scope.includes(portee)) return { scope: [...etat.scope], status: etat.status };
  const scope = etat.scope.filter((p) => p !== portee);
  return scope.length > 0
    ? { scope, status: etat.status === 'active' ? 'active' : etat.status }
    : { scope: [], status: 'revoked' };
}
