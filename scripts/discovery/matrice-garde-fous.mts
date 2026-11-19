// LA MATRICE DES GARDE-FOUS DU DISCOVERY — une ligne par option qui écrit un garde-fou.
//
// Un garde-fou stocké est un chemin technique (« shoe.gift_openness.cadeau_chaussures_refuse »).
// Pour qu'il serve à écarter une proposition sans jamais s'apparier sur un mot, chaque ligne est
// traduite ici, depuis SA QUESTION, SON CONTRAT et SA PORTÉE, en cinq informations :
//   · la CIBLE          — qui est concerné, et par quel genre de proposition ;
//   · le REFUS          — ce qui est effectivement refusé ou conditionné, dans ses mots ;
//   · le CONTEXTE       — le domaine de la banque où ce refus a été dit ;
//   · la CONTRAINTE     — SOFT ou HARD, telle que le référentiel l'a arbitrée, jamais relevée ;
//   · la RECONNAISSANCE — le PÉRIMÈTRE (canaux et domaine) hors duquel ce refus ne s'applique
//                         jamais, et le CRITÈRE à vérifier à l'intérieur.
// Le périmètre vient d'une table explicite (attribut du contrat → canaux). Le critère est la
// réponse replacée dans sa question : aucune reformulation n'est inventée.
//
// Une ligne n'est déclarée INDÉCIDABLE que pour une raison objective, écrite sur la ligne.
import { writeFileSync } from 'node:fs';
import { BANQUE, MANIFESTE } from '../../src/lib/discovery/open-v3/banque.ts';
import { produireDepuisOption } from '../../src/lib/discovery/open-v3/produire.ts';
import { cleOption } from '../../src/lib/discovery/open-v3/cle-option.ts';
import { aParametre } from '../../src/lib/discovery/open-v3/selection.ts';

type Canal = 'message' | 'appel' | 'en_personne' | 'cadeau' | 'service' | 'experience';
const TOUS: Canal[] = ['message', 'appel', 'en_personne', 'cadeau', 'service', 'experience'];
/** Attribut du contrat → genre de proposition concerné. Table explicite ; tout attribut absent arrête le script. */
const PERIMETRE: Record<string, { canaux: Canal[]; cible: string }> = {
  gift_openness: { canaux: ['cadeau'], cible: 'un cadeau offert à cette personne' },
  gift_antipattern: { canaux: ['cadeau'], cible: 'un cadeau offert à cette personne' },
  gift_format: { canaux: ['cadeau', 'experience'], cible: 'la forme d’un cadeau offert à cette personne' },
  secondhand_acceptance: { canaux: ['cadeau'], cible: 'un cadeau d’occasion offert à cette personne' },
  desired_item: { canaux: ['cadeau'], cible: 'un objet précis envisagé pour cette personne' },
  owned_item: { canaux: ['cadeau'], cible: 'un objet que cette personne possède déjà' },
  fit_preference: { canaux: ['cadeau'], cible: 'un cadeau à porter offert à cette personne' },
  material_preference: { canaux: ['cadeau'], cible: 'la matière d’un cadeau offert à cette personne' },
  value_sought: { canaux: ['cadeau', 'experience'], cible: 'ce que la proposition apporte à cette personne' },
  disruptor: { canaux: ['experience', 'en_personne', 'cadeau', 'service'], cible: 'un moment, une sortie ou une attention vécus par cette personne' },
  type_preference: { canaux: ['experience', 'en_personne', 'cadeau'], cible: 'un genre d’activité ou d’objet proposé à cette personne' },
  sensory_preference: { canaux: ['experience', 'en_personne', 'cadeau'], cible: 'l’ambiance ou la sensation d’une proposition faite à cette personne' },
  companions: { canaux: ['experience', 'en_personne'], cible: 'les personnes présentes lors d’un moment proposé à cette personne' },
  modality: { canaux: ['experience', 'en_personne'], cible: 'la manière dont un moment proposé à cette personne se déroule' },
  occasion_scope: { canaux: TOUS, cible: 'l’occasion pour laquelle une attention est proposée à cette personne' },
  exposure_preference: { canaux: TOUS, cible: 'toute proposition qui expose cette personne au regard des autres' },
  sharing_boundary: { canaux: TOUS, cible: 'toute proposition qui partage ou utilise une information sur cette personne' },
  constraint: { canaux: TOUS, cible: 'toute proposition dans ce domaine' },
  service_preference: { canaux: ['service', 'experience', 'cadeau'], cible: 'la manière dont une attention est organisée pour cette personne' },
  support_mode: { canaux: ['message', 'appel', 'en_personne', 'service'], cible: 'la manière de soutenir cette personne' },
  facilitator: { canaux: ['service', 'experience'], cible: 'une aide proposée à cette personne' },
};
const GENERIQUE = /^\(|^autres?$|^cela dépend$|^ça dépend$/i;

const lignes: Record<string, unknown>[] = [];
for (const q of BANQUE) for (const o of q.options) {
  const p = produireDepuisOption(q, o);
  if (p.type !== 'evidence') continue;
  for (const e of [p.evidence, ...(p.autres ?? [])] as { target_family: string; target_construct: string; severity?: string }[]) {
    if (e.target_family !== 'GUARDRAIL') continue;
    const attribut = o.attribut ?? '';
    const per = PERIMETRE[attribut];
    if (!per) throw new Error(`attribut « ${attribut} » sans périmètre (${q.id}) : la table doit être complétée, pas contournée`);
    const code = e.target_construct.split('.').slice(2).join('.');
    const domaine = o.domaine ?? q.branche;
    let indecidable: string | null = null;
    if (GENERIQUE.test(o.libelle.trim())) indecidable = 'le libellé de l’option ne nomme rien (option à écrire, « autre », « cela dépend »)';
    else if (aParametre(q)) indecidable = 'la question porte un paramètre non résolu : ce qui est refusé dépend d’une valeur inconnue';
    else if (attribut === 'desired_item' || attribut === 'owned_item') indecidable = 'le refus vise « cet objet précis », que la ligne ne nomme pas';
    else if (attribut === 'secondhand_acceptance' && !/seconde_main|occasion|reconditionn|neuf/.test(code)) indecidable = 'l’attribut du contrat (seconde main) ne correspond pas à ce que l’option refuse : ligne du référentiel à corriger';
    const nature = o.polarite === 'condition' ? 'condition' : 'refus';
    lignes.push({
      cle: e.target_construct, question: q.id, option: cleOption(o), enonce: q.enonce, libelle: o.libelle, domaine, attribut, code,
      contrainte: e.severity === 'HARD' ? 'HARD' : 'SOFT', nature,
      cible: per.cible, canaux: per.canaux,
      refus: nature === 'condition' ? `accepté seulement sous la condition dite : « ${o.libelle} »` : `écarté par la réponse « ${o.libelle} »`,
      contexte: `question « ${q.enonce} » (domaine ${domaine}${q.niveau ? `, niveau ${q.niveau}` : ''})`,
      critere: `À la question « ${q.enonce} », la personne a répondu « ${o.libelle} ». La proposition est-elle ${nature === 'condition' ? 'soumise à cette condition' : 'ce qu’elle a ainsi écarté'} ?`,
      statut: indecidable ? 'indecidable' : 'traduit', ...(indecidable ? { motif: indecidable } : {}),
    });
  }
}
// Deux options qui écrivent le MÊME chemin doivent dire la même chose : sinon la clé ne suffit pas.
const parCle = new Map<string, Record<string, unknown>[]>();
for (const l of lignes) parCle.set(String(l.cle), [...(parCle.get(String(l.cle)) ?? []), l]);
const collisions = [...parCle].filter(([, ls]) => new Set(ls.map((l) => `${l.contrainte}|${l.nature}|${(l.canaux as string[]).join()}`)).size > 1).map(([k]) => k);
const sortie = { classeur: MANIFESTE.classeur, sha256_classeur: MANIFESTE.sha256_classeur, lignes: lignes.length, traduites: lignes.filter((l) => l.statut === 'traduit').length,
  indecidables: lignes.filter((l) => l.statut === 'indecidable').length, cles_distinctes: parCle.size, cles_a_sens_divergent: collisions, matrice: lignes };
writeFileSync(new URL('../../src/lib/discovery/open-v3/garde-fous.json', import.meta.url), JSON.stringify(sortie, null, 1));
const csv = (v: unknown) => `"${String(Array.isArray(v) ? v.join(' · ') : v ?? '').replace(/"/g, '""')}"`;
const colonnes = ['statut', 'motif', 'question', 'enonce', 'libelle', 'domaine', 'attribut', 'contrainte', 'nature', 'cible', 'canaux', 'refus', 'critere', 'cle'];
writeFileSync(new URL('../../docs/discovery/matrice-garde-fous.csv', import.meta.url), '﻿' + [colonnes.join(';'), ...lignes.map((l) => colonnes.map((c) => csv(l[c])).join(';'))].join('\n'));
console.log(JSON.stringify({ ...sortie, matrice: undefined }, null, 1));
const m = new Map<string, number>(); for (const l of lignes.filter((x) => x.statut === 'indecidable')) m.set(String(l.motif), (m.get(String(l.motif)) ?? 0) + 1); console.log([...m]);
