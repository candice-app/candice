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
      if (c.type !== 'niveau' && c.type !== 'branche_ouverte') continue;
      const m = emplois.get(c.branche) ?? new Map<string, number>();
      m.set(q.branche, (m.get(q.branche) ?? 0) + 1);
      emplois.set(c.branche, m);
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
