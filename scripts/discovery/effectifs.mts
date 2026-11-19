// EFFECTIFS DE LA BANQUE, recalculés depuis la banque active — jamais repris d'un ancien relevé.
// Chaque question est rangée dans UNE catégorie, par ordre de priorité, selon ce qui décide de
// son ouverture. « Peut s'ouvrir » est mesuré avec un état où tout ce qu'une personne peut
// apporter est présent (tous les domaines, tous les sujets choisis, un projet partout, toutes
// les réponses de tri) : ce qui reste fermé ou non résolu là ne dépend pas de la personne.
import { writeFileSync, mkdirSync } from 'node:fs';
import { BANQUE, MANIFESTE } from '../../src/lib/discovery/open-v3/banque.ts';
import { analyserCondition, type EtatDiscovery } from '../../src/lib/discovery/open-v3/conditions.ts';
import { verdictDe, aParametre } from '../../src/lib/discovery/open-v3/selection.ts';
import { couvertureDestinations } from '../../src/lib/discovery/open-v3/destinations.ts';
import { ALIAS_BRANCHES, SOUS_PARTIES, TAGS_ATTENDUS, HYPOTHESES } from '../../src/lib/discovery/open-v3/correspondances.ts';
import { DEPENDANCES, TETES_DE_SOUS_PARTIE, SELECTEURS } from '../../src/lib/discovery/open-v3/dependances.ts';
import { REMPLACEMENTS, poolDe } from '../../src/lib/discovery/open-v3/coexistence.ts';
import { OUVERTES_ARCHIVEES, CONTRATS_OUVERTS, DESTINATIONS_CONDITIONNELLES } from '../../src/lib/discovery/open-v3/contrats-ouverts.ts';
import { cleOption } from '../../src/lib/discovery/open-v3/cle-option.ts';
import { produireDepuisOption } from '../../src/lib/discovery/open-v3/produire.ts';

const noms = new Set<string>([...ALIAS_BRANCHES.keys(), ...BANQUE.map((q) => q.branche)]);
for (const s of ALIAS_BRANCHES.values()) for (const b of s) noms.add(b);
const tout: EtatDiscovery = {
  tags: new Map([...[...noms].map((n) => [`INTEREST.${n}`, 'positive'] as const), ...[...TAGS_ATTENDUS.values()].flatMap((s) => [...s].map((t) => [t, 'positive'] as const))]), nePasCreuser: new Set(), branchesOuvertes: noms,
  niveauParBranche: new Map([...noms].map((n) => [n, 'C'] as const)), dejaPosees: new Set(), attributsConnus: new Set(), sansAlcool: false,
  contextesConnus: new Set(), contextesActifs: new Set(), aliasBranches: ALIAS_BRANCHES, reglesSousParties: SOUS_PARTIES,
  sujetsChoisis: new Set(BANQUE.map((q) => q.branche)),
  projets: new Map([...new Set(BANQUE.map((q) => poolDe(q.branche)))].map((p) => [p, new Set(['achat', 'sejour'] as const)] as const)),
  optionsChoisies: new Map(BANQUE.filter((q) => SELECTEURS.has(q.id)).map((q) => [q.id, new Set(q.options.map(cleOption))] as const)),
};
const sansProjet: EtatDiscovery = { ...tout, projets: new Map() };
const sansDemarche: EtatDiscovery = { ...tout, sujetsChoisis: new Set() };
const sansTri: EtatDiscovery = { ...tout, optionsChoisies: new Map() };

const cat = new Map<string, string[]>();
const ranger = (c: string, id: string) => cat.set(c, [...(cat.get(c) ?? []), id]);
for (const q of BANQUE) {
  const a = analyserCondition(q.condition_emission);
  const sterile = !q.options.some((o) => o.voie === 'OPEN_KNOWLEDGE' || produireDepuisOption(q, o).type !== 'rien') && q.forme !== 'open';
  const v = verdictDe(q, tout);
  if (OUVERTES_ARCHIVEES.has(q.id)) ranger('archivee_par_le_referentiel', q.id);
  else if (sterile) ranger('sterile_aucune_option_n_ecrit', q.id);
  else if (REMPLACEMENTS.get(q.id)?.decision === 'NEW_PRIMARY' || REMPLACEMENTS.get(q.id)?.decision === 'ALIAS_OLD_TO_NEW') ranger('historique_remplacee_jamais_proposee', q.id);
  else if (a.sensible && !a.ouvertureSurDemarche) ranger(`sensible_${a.niveauSensibilite ?? 'consigne'}_fermee`, q.id);
  else if (v === 'indecidable') {
    const tete = TETES_DE_SOUS_PARTIE.get(q.id);
    const nomsEcrits = (a.clauses as { branche?: string; sousPartie?: boolean; type: string }[]).filter((c) => c.branche).map((c) => c.branche!);
    const sp = nomsEcrits.map((n) => SOUS_PARTIES.get(n)).find((x) => x);
    const hyp = HYPOTHESES.find((h) => nomsEcrits.includes(h.nom));
    if (/^ouverture branche/i.test(q.condition_emission)) ranger('non_resolue_ouverture_d_une_branche_distincte_sans_regle_executable', q.id);
    else if (DEPENDANCES.get(q.id) && !DEPENDANCES.get(q.id)!.resolu) ranger('non_resolue_dependance_sans_option_rapprochee', q.id);
    else if (tete) ranger('non_resolue_condition_de_tete_de_sous_partie_non_comprise', q.id);
    else if (a.inconnues.length > 0) ranger('non_resolue_fragment_non_compris', q.id);
    else if (sp && sp.regle === 'non_resolue') ranger('non_resolue_sous_partie_dont_l_ouverture_est_en_prose', q.id);
    else if (hyp && hyp.critere === 'condition_en_prose') ranger('non_resolue_condition_en_prose_apres_le_nom', q.id);
    else if (hyp) ranger('non_resolue_nom_tenu_pour_une_hypothese', q.id);
    else ranger('non_resolue_nom_ou_contexte_non_rattache', q.id);
  } else if (v === 'fermer') ranger('fermee_meme_avec_tout', q.id);
  else if (verdictDe(q, sansDemarche) !== 'ouvrir') ranger('ouvrable_sur_demarche_explicite', q.id);
  else if (verdictDe(q, sansProjet) !== 'ouvrir') ranger('ouvrable_sur_projet_en_cours', q.id);
  else if (verdictDe(q, sansTri) !== 'ouvrir') ranger('ouvrable_sur_reponse_de_tri', q.id);
  else if (REMPLACEMENTS.get(q.id)?.decision === 'KEEP_DISTINCT_CONDITIONED') ranger('historique_conditionnee', q.id);
  else ranger('ouvrable_sur_le_terrain', q.id);
}
const comptes = Object.fromEntries([...cat].map(([k, ids]) => [k, ids.length]).sort((x, y) => (y[1] as number) - (x[1] as number)));
const total = Object.values(comptes).reduce((x, y) => x + (y as number), 0);
if (total !== BANQUE.length) throw new Error(`${total} rangées pour ${BANQUE.length} questions`);
const sortie = {
  classeur: MANIFESTE.classeur, sha256_classeur: MANIFESTE.sha256_classeur, questions_actives: BANQUE.length,
  options: BANQUE.reduce((n, q) => n + q.options.length, 0), questions_ouvertes: BANQUE.filter((q) => q.forme === 'open').length,
  branches: new Set(BANQUE.map((q) => q.branche)).size,
  par_niveau: Object.fromEntries(['A', 'B', 'C', null].map((n) => [n ?? 'sans_niveau', BANQUE.filter((q) => (q.niveau ?? null) === n).length])),
  comptes, dependances: { total: DEPENDANCES.size, resolues: [...DEPENDANCES.values()].filter((d) => d.resolu).length },
  coexistence: { paires: REMPLACEMENTS.size }, contrats_ouverts: CONTRATS_OUVERTS.size, destinations_conditionnelles: { total: DESTINATIONS_CONDITIONNELLES.length, executees: couvertureDestinations().filter((d) => d.executee).length, verbatim_seul: couvertureDestinations().filter((d) => !d.executee).map((d) => `${d.question}#${d.rang} ${d.declencheur} : ${d.motif}`) },
  enonces_a_parametre_non_servis: BANQUE.filter(aParametre).map((q) => q.id), faits_d_option: BANQUE.reduce((n, q) => n + q.options.filter((o) => produireDepuisOption(q, o).type === 'fait').length, 0),
  identifiants: Object.fromEntries([...cat].filter(([k]) => !k.startsWith('ouvrable_sur_le_terrain')).map(([k, ids]) => [k, ids])),
};
mkdirSync(new URL('../../docs/discovery/etat-19nov/', import.meta.url), { recursive: true });
writeFileSync(new URL('../../docs/discovery/etat-19nov/effectifs.json', import.meta.url), JSON.stringify(sortie, null, 1));
console.log(JSON.stringify({ ...sortie, identifiants: undefined }, null, 1));
