// LES NOMS DE BRANCHE — relier ce que les conditions ÉCRIVENT à ce que la banque CONTIENT.
//
// Les conditions du référentiel nomment les branches en français : « Niveau B Esthétique »,
// « Branche Animaux philosophie ouverte ». La banque, elle, les identifie par un code :
// `aesthetic`, `animals`. Aucun onglet du classeur ne donne la correspondance. La première
// version comparait le nom au code, tel quel : sur 562 noms distincts, 9 seulement étaient
// des codes. Les portes de profondeur ne s'ouvraient donc à peu près jamais, sans que rien
// ne le signale — la condition était « lisible », simplement toujours fausse.
//
// LA CORRESPONDANCE EST DÉRIVÉE, PAS DEVINÉE. Une question garde sa PROPRE branche derrière
// une porte : « Niveau B Esthétique » se lit dans les questions de la branche `aesthetic`.
// Un nom employé par AU MOINS TROIS questions d'une même branche désigne donc cette branche.
// Quand deux branches l'emploient à ce niveau (« Cinéma » : cinema et cinema2, deux
// générations du même sujet), il les désigne toutes les deux. Une branche qui ne l'emploie
// que marginalement (moins du quart de la principale) est un renvoi, pas une désignation.
//
// Un nom qui n'atteint pas ce seuil n'entre PAS dans la table : la condition qui le porte
// reste indécidable, la question fermée, et le nom figure au registre des conditions à
// résoudre. La table entière est exportable pour relecture (`tableDesAlias`).
import { BANQUE, type QuestionV3 } from './banque';
import { analyserCondition, clef } from './conditions';

const SEUIL_EMPLOIS = 3;
const PART_MINIMALE = 0.25;

function deriver(banque: readonly QuestionV3[]) {
  const emplois = new Map<string, Map<string, number>>();           // nom → branche → n
  const domaines = new Map<string, Map<string, number>>();          // branche → domaine → n
  for (const q of banque) {
    for (const c of analyserCondition(q.condition_emission).clauses) {
      // « Intérêt art, musées et expositions sélectionné ou détecté » nomme une branche au
      // même titre que « Branche Arts & créatif ouverte » : le nom est celui du référentiel,
      // la branche est celle des questions qui l'emploient.
      const nom = c.type === 'niveau' || c.type === 'branche_ouverte' ? c.branche : c.type === 'interet' ? c.domaine : null;
      if (nom === null) continue;
      const m = emplois.get(nom) ?? new Map<string, number>();
      m.set(q.branche, (m.get(q.branche) ?? 0) + 1);
      emplois.set(nom, m);
    }
    for (const o of q.options) {
      if (!o.domaine) continue;
      const m = domaines.get(q.branche) ?? new Map<string, number>();
      m.set(o.domaine, (m.get(o.domaine) ?? 0) + 1);
      domaines.set(q.branche, m);
    }
  }
  const alias = new Map<string, Set<string>>();
  for (const [nom, parBranche] of emplois) {
    const max = Math.max(...parBranche.values());
    const retenues = [...parBranche].filter(([, n]) => n >= SEUIL_EMPLOIS && n >= max * PART_MINIMALE).map(([b]) => b);
    if (retenues.length > 0) alias.set(nom, new Set(retenues));
  }
  // Un identifiant de branche se désigne toujours lui-même.
  for (const q of banque) {
    const k = clef(q.branche);
    alias.set(k, new Set([...(alias.get(k) ?? []), q.branche]));
  }
  // Le DOMAINE principal d'une branche : celui que la majorité de ses options écrivent. Un
  // intérêt déclaré pour ce domaine est un intérêt pour cette branche.
  const parDomaine = new Map<string, Set<string>>();
  for (const [branche, m] of domaines) {
    const principal = [...m].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
    const k = clef(principal);
    parDomaine.set(k, new Set([...(parDomaine.get(k) ?? []), branche]));
  }
  return { alias, parDomaine, emplois };
}

const D = deriver(BANQUE);

/**
 * LE PONT ENTRE DEUX VOCABULAIRES. Un intérêt lu dans une réponse libre porte un domaine
 * parent du JOURNAL (`books_literature`, `food_gastronomy` — dictionnaire HSG). Les
 * questions, elles, écrivent un domaine de la BANQUE (`reading`, `food`). Rien ne reliait
 * les deux : quelqu'un qui écrit « je lis au lit le dimanche matin » avait un intérêt lu,
 * rangé sous `books_literature`, et aucune question de lecture ne s'ouvrait.
 *
 * Seules les correspondances SANS AMBIGUÏTÉ sont écrites. Un domaine du journal absent
 * d'ici n'ouvre rien (architecture, cars_mobility, culture_history, science,
 * business_entrepreneurship, personal_development) ; `family_parenting` est laissé dehors
 * volontairement : la branche « enfants » parle des enfants de la personne, et un intérêt
 * pour la parentalité ne dit pas qu'elle en a.
 */
export const PONT_DOMAINES_JOURNAL: ReadonlyMap<string, readonly string[]> = new Map([
  ['food_gastronomy', ['food']], ['cooking', ['food']], ['wine_spirits', ['drinks']], ['travel', ['travel']],
  ['fashion', ['fashion']], ['beauty_skincare', ['beauty']], ['jewelry_watches', ['jewelry', 'watch']],
  ['design_decor', ['home']], ['art', ['art', 'museum']], ['photography', ['photography']], ['music', ['music']],
  ['cinema_series', ['cinema', 'series']], ['books_literature', ['reading']], ['sport_fitness', ['sport_practice']],
  ['outdoor_nature', ['nature']], ['tech', ['tech']], ['gaming', ['gaming']], ['craftsmanship', ['creativity']],
  ['wellbeing', ['wellbeing']], ['gardening', ['gardening']], ['animals', ['animals']], ['collecting', ['collection']],
]);
/** Les branches qu'ouvre un domaine parent du journal : par le pont, puis par les tables de la banque. */
export function branchesDuDomaineJournal(domaine: string): string[] {
  const k = clef(domaine);
  // Le journal normalise ses libellés (« books literature ») ; le vocabulaire les écrit avec un tiret bas.
  const noms = [k, ...(PONT_DOMAINES_JOURNAL.get(k) ?? PONT_DOMAINES_JOURNAL.get(k.replace(/ /g, '_')) ?? [])];
  return [...new Set(noms.flatMap((n) => [...(D.alias.get(n) ?? []), ...(D.parDomaine.get(n) ?? [])]))];
}

/** Nom écrit par une condition → identifiants de branche désignés. */
export const ALIAS_BRANCHES: ReadonlyMap<string, ReadonlySet<string>> = D.alias;
/** Domaine (celui qu'écrivent les options) → branches dont c'est le domaine principal. */
export const BRANCHES_DU_DOMAINE: ReadonlyMap<string, ReadonlySet<string>> = D.parDomaine;

/** La table complète, pour relecture : chaque nom, ce qu'il désigne, et sur combien d'emplois. */
export function tableDesAlias(): { nom: string; branches: string[]; emplois: Record<string, number>; retenu: boolean }[] {
  return [...D.emplois].map(([nom, m]) => ({
    nom, branches: [...(D.alias.get(nom) ?? [])].sort(), emplois: Object.fromEntries(m), retenu: D.alias.has(nom),
  })).sort((a, b) => (a.nom < b.nom ? -1 : 1));
}
