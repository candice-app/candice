// LE PARTAGE PAR ÉLÉMENT — une allergie se partage UNE PAR UNE.
//
// Décision d'Estelle : « Trois cases "allergies", "régime" et "alcool" ne suffisent pas si une
// seule case partage toutes les allergies. » La case « Allergies » n'existe donc plus : il y a
// une clé par allergie déclarée, et une pour la précision libre.
//
//   facts_allergies:gluten            une allergie de la liste
//   facts_allergies:detail            la précision écrite par la personne
//
// CONSÉQUENCES VOULUES.
//   · Une allergie ajoutée APRÈS un partage n'est pas partagée : sa clé n'était pas accordée.
//   · « Tout partager » ne comprend AUCUNE allergie : chacune se coche.
//   · L'ancienne clé `facts_allergies`, seule, ne partage plus rien.
// Rien ici ne dit au destinataire qu'il existe d'autres allergies que celles qu'il voit — ni
// qu'il n'en existe pas : l'absence d'un droit de lecture n'est pas une absence d'allergie.

export const PREFIXE_ALLERGIE = 'facts_allergies:';
const FORME = /^facts_allergies:[a-z0-9_]{1,40}$/;
export const estCleAllergie = (s: string): boolean => FORME.test(s);

const ALLERGIE_FR: Record<string, string> = {
  gluten: 'gluten', lactose: 'lactose', fruits_a_coque: 'fruits à coque', fruits_de_mer: 'fruits de mer',
};
const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

export interface ElementPartageable { readonly cle: string; readonly libelle: string }

/** Les allergies d'une personne, chacune avec SA clé de partage. */
export function elementsAllergies(
  pi: { allergies?: string[] | null; allergies_detail?: string | null } | null | undefined,
): ElementPartageable[] {
  const e: ElementPartageable[] = [];
  for (const a of pi?.allergies ?? []) {
    // « aucune » et « autre » ne sont pas des allergies : l'une dit qu'il n'y en a pas, l'autre
    // renvoie à la précision libre.
    if (!a || a === 'aucune' || a === 'autre') continue;
    const cle = `${PREFIXE_ALLERGIE}${slug(a)}`;
    if (FORME.test(cle) && !e.some((x) => x.cle === cle)) e.push({ cle, libelle: ALLERGIE_FR[a] ?? a });
  }
  const detail = pi?.allergies_detail?.trim();
  if (detail) e.push({ cle: `${PREFIXE_ALLERGIE}detail`, libelle: detail });
  return e;
}

/** Les allergies qu'un partage donné laisse voir. */
export function allergiesPartagees(elements: readonly ElementPartageable[], portee: readonly string[]): ElementPartageable[] {
  const p = new Set(portee);
  return elements.filter((x) => p.has(x.cle));
}
