// Résolution d'une clé de contenu : {Prénom}/{Pronom}/{pronom} → valeurs du contact, via le
// résolveur UNIQUE (src/lib/knowledge-write/pronoun.ts). Import relatif (comme le reste de la lib
// testée) pour que vitest le résolve sans alias @/. Partagé par tous les consommateurs (cartes,
// e-mail, page d'arrivée, inscription, notifications, relances).

import { resolvePronoun, type ContactGender } from '../lib/knowledge-write/pronoun';
import { INVITE_CONTENT, type ContentValue, type InviteContentKey } from './invite';

export function resolveContent(
  key: InviteContentKey,
  firstName: string,
  gender: ContactGender,
): string | readonly string[] {
  const v: ContentValue = INVITE_CONTENT[key];
  return Array.isArray(v) ? v.map((s) => resolvePronoun(s, firstName, gender)) : resolvePronoun(v as string, firstName, gender);
}

/** Toujours un tableau de paragraphes résolus (confort de rendu, qu'il y en ait un ou plusieurs). */
export function resolveLines(key: InviteContentKey, firstName: string, gender: ContactGender): string[] {
  const r = resolveContent(key, firstName, gender);
  return Array.isArray(r) ? [...r] : [r as string];
}
