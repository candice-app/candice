// COUVERTURE COMPLÈTE DU RÉFÉRENTIEL — chaque question, chaque condition, un statut justifié (19 nov., 19h56).
//
// « Mets à jour la couverture complète du référentiel : chaque question et chaque condition doivent
// avoir un statut justifié. Une fermeture prévue par le produit est distincte d'une condition encore
// non implémentée. »
//
// MÉTHODE. Pour chaque question du référentiel (révision 8 : actives, en arbitrage, retirées) :
//   · hors de la banque active : son état et la raison écrite au classeur ;
//   · dans la banque : la condition que le moteur évalue (sa lecture établie, sinon le texte), clause
//     par clause. Chaque clause est évaluée par le VRAI évaluateur (conditions.ts) dans deux états :
//       – l'état VIDE réellement lu dans la base pour un compte neuf (lireEtat, pile locale) ;
//       – un état OUVERT : toutes les branches ouvertes au niveau C, un projet de chaque genre dans
//         chaque domaine, toutes les situations déclarées, une entité pour chaque question d'entité.
//     Une clause qui reste « indécidable » dans les deux n'est PAS implémentée : le moteur ne sait pas
//     la constater. Le compte de test est créé puis effacé.
// STATUTS (question active) :
//   implementee_lecture_etablie · implementee_condition_d_origine · ouverte_sur_demarche (sensible)
//   fermee_par_le_produit (décision citée) · fermee_par_garde_de_sensibilite (sensible, sans démarche écrite)
//   non_implementee_hypothese (en attente d'arbitrage)
//   non_implementee (ce qui manque est écrit)
//
// Usage : . /home/claude/pile/env-local.sh; npx tsx scripts/discovery/couverture-referentiel.mts
import { readFileSync, writeFileSync } from 'node:fs';
import { compteLocal, pileLocale } from '../local/_compte-local.mts';
import { BANQUE, type QuestionV3 } from '../../src/lib/discovery/open-v3/banque.ts';
import { analyseDe, aUneLecture } from '../../src/lib/discovery/open-v3/lectures.ts';
import { evaluerCondition, TYPES_DE_PROJET, SITUATIONS_DE_VIE, type Clause, type ConditionAnalysee, type EtatDiscovery } from '../../src/lib/discovery/open-v3/conditions.ts';
import { lireEtat } from '../../src/lib/discovery/open-v3/etat.ts';
import { poolDe } from '../../src/lib/discovery/open-v3/coexistence.ts';
import { verdictDe, contexteDEvaluation } from '../../src/lib/discovery/open-v3/selection.ts';
import { OUVERTES_ARCHIVEES } from '../../src/lib/discovery/open-v3/contrats-ouverts.ts';
import ENT from '../../src/lib/discovery/open-v3/entites-de-questions.json' with { type: 'json' };
import TABLE from '../../src/lib/discovery/open-v3/lectures-de-conditions.json' with { type: 'json' };

const integral = JSON.parse(readFileSync('docs/discovery/open-v3-integral.json', 'utf8')) as Record<'actives' | 'en_arbitrage' | 'retirees', { id: string; statut: string; condition_emission: string; branche: string; niveau: string | null; forme: string }[]>;
const nonLues = new Map((TABLE as { non_lues: { question: string; statut: string; manque: string; decision?: string; choix?: string[] }[] }).non_lues.map((x) => [x.question, x]));
const lectures = new Map((TABLE as { lectures: { question: string; critere: string; lue: string }[] }).lectures.map((x) => [x.question, x]));

// ── L'état VIDE, lu dans la base pour un compte neuf.
const { admin } = pileLocale();
const c = await compteLocal('couverture-referentiel');
const { etat: vide, manques } = await lireEtat(c.client as never, { userId: c.userId });
if (manques.length > 0) throw new Error(`état vide incomplet : ${manques.join(' ; ')}`);
const { error: eSup } = await admin.auth.admin.deleteUser(c.userId);
if (eSup) throw new Error(`compte de test non effacé : ${eSup.message}`);

// ── L'état OUVERT : tout ce qu'une personne peut déclarer, déclaré.
const branches = [...new Set(BANQUE.map((q) => q.branche))];
const pools = [...new Set(BANQUE.map((q) => poolDe(q.branche)))];
const entites = new Map(Object.keys((ENT as { questions: Record<string, unknown> }).questions).map((id) => [id, { id: `x:${id}`, libelle: 'X' }] as const));
const ouvert: EtatDiscovery = {
  ...vide,
  branchesOuvertes: new Set(branches), niveauParBranche: new Map(branches.map((b) => [b, 'C' as const])),
  projets: new Map(pools.map((p) => [p, new Set(TYPES_DE_PROJET)])),
  situations: new Map(SITUATIONS_DE_VIE.map((s) => [s, true])),
  entiteParQuestion: entites,
};

const seule = (cl: Clause): ConditionAnalysee => ({ ...analyseDe(BANQUE[0]), clauses: [cl], groupes: [[[cl]]], lisible: true, inconnues: [] });
const evalue = (q: QuestionV3, cl: Clause, e: EtatDiscovery) => evaluerCondition(seule(cl), e, contexteDEvaluation(q, e));
const decrire = (cl: Clause) => JSON.stringify(cl).slice(0, 220);

type Ligne = { id: string; etat: string; branche: string; niveau: string | null; forme: string; statut: string; justification: string;
  condition_origine: string; condition_evaluee?: string; clauses?: { clause: string; statut: 'evaluee' | 'indecidable' }[] };
const lignes: Ligne[] = [];
for (const r of integral.retirees) lignes.push({ id: r.id, etat: 'retiree', branche: r.branche, niveau: r.niveau, forme: r.forme, statut: 'retiree_par_le_referentiel', justification: r.statut, condition_origine: r.condition_emission });
for (const r of integral.en_arbitrage) lignes.push({ id: r.id, etat: 'en_arbitrage', branche: r.branche, niveau: r.niveau, forme: r.forme, statut: 'en_arbitrage_hors_banque', justification: r.statut, condition_origine: r.condition_emission });

const parId = new Map(BANQUE.map((q) => [q.id, q]));
for (const r of integral.actives) {
  const q = parId.get(r.id);
  if (!q) throw new Error(`${r.id} : active au classeur, absente de la banque`);
  const a = analyseDe(q);
  const clauses = a.clauses.map((cl) => {
    const indecidable = evalue(q, cl, vide) === 'indecidable' && evalue(q, cl, ouvert) === 'indecidable';
    return { clause: decrire(cl), statut: indecidable ? 'indecidable' as const : 'evaluee' as const };
  });
  const base = { id: q.id, etat: 'active', branche: q.branche, niveau: q.niveau ?? null, forme: q.forme, condition_origine: q.condition_emission, ...(lectures.has(q.id) ? { condition_evaluee: lectures.get(q.id)!.lue } : {}), clauses };
  const nl = nonLues.get(q.id);
  const muettes = clauses.filter((x) => x.statut === 'indecidable');
  // Le verdict de la question entière dans l'état ouvert : une question jamais décidable n'est jamais servie.
  const vOuvert = verdictDe(q, ouvert);
  let statut: string, justification: string;
  if (OUVERTES_ARCHIVEES.has(q.id)) { statut = 'fermee_par_le_produit'; justification = 'question ouverte archivée par le référentiel (onglet 9)'; }
  else if (nl?.decision) { statut = 'fermee_par_le_produit'; justification = `${nl.decision} — ${nl.manque}`; }
  else if (nl?.statut === 'hypothese') { statut = 'non_implementee_hypothese'; justification = `en attente d’arbitrage : ${nl.manque}${nl.choix ? ` — choix : ${nl.choix.join(' | ')}` : ''}`; }
  else if (nl?.statut === 'sans_lecture') { statut = 'non_implementee'; justification = nl.manque; }
  else if (a.sensible && !a.ouvertureSurDemarche) { statut = 'fermee_par_garde_de_sensibilite'; justification = `sensible (${a.niveauSensibilite ?? 'niveau non dit'}) et sans ouverture sur démarche au référentiel : la garde des questions sensibles la ferme (conditions.ts) — à rouvrir seulement par une démarche que le référentiel écrirait`; }
  else if (!a.lisible || a.inconnues.length > 0) { statut = 'non_implementee'; justification = `condition non comprise : ${a.inconnues.join(' ; ') || 'illisible'}`; }
  else if (muettes.length > 0) { statut = 'non_implementee'; justification = `clause(s) que le moteur ne sait pas constater : ${muettes.map((m) => m.clause).join(' ; ')}`; }
  else if (a.ouvertureSurDemarche) { statut = 'ouverte_sur_demarche'; justification = `sensible : ne s’ouvre que sur la démarche de la personne${aUneLecture(q) ? ` ; ${lectures.get(q.id)!.critere}` : ''}`; }
  else if (aUneLecture(q)) { statut = 'implementee_lecture_etablie'; justification = lectures.get(q.id)!.critere; }
  else { statut = 'implementee_condition_d_origine'; justification = 'le texte du référentiel est compris clause par clause'; }
  if (statut.startsWith('implementee') && vOuvert === 'indecidable') { statut = 'non_implementee'; justification = `jamais décidable, même tout déclaré (${justification})`; }
  lignes.push({ ...base, statut, justification });
}

// Les séries d'entités sans écrivain : la condition est évaluée, mais rien ne produit l'entité attendue.
const series = (ENT as { series: Record<string, { types: string[] }>; questions: Record<string, { serie: string }> });
const TYPES_PRODUITS = new Set(['brand', 'place', 'restaurant', 'hotel', 'product', 'food', 'drink', 'book', 'film_series', 'music', 'artist', 'destination', 'event', 'person',
  'ENTITY_WORK', 'ENTITY_PLACE']);   // extracteur des réponses libres et lecture par destinations
for (const l of lignes) {
  const qe = series.questions[l.id];
  if (!qe || !l.statut.startsWith('implementee')) continue;
  if (!series.series[qe.serie].types.some((t) => TYPES_PRODUITS.has(t))) {
    l.statut = 'non_implementee';
    l.justification = `série « ${qe.serie} » : aucun écrivain ne produit une entité de type ${series.series[qe.serie].types.join(' / ')} — la condition est évaluée, mais ne peut jamais être remplie`;
  }
}

const compte = (s: string) => lignes.filter((l) => l.statut === s).length;
const statuts = [...new Set(lignes.map((l) => l.statut))].sort();
const resume = Object.fromEntries(statuts.map((s) => [s, compte(s)]));
const clausesTotal = lignes.reduce((n, l) => n + (l.clauses?.length ?? 0), 0);
const clausesMuettes = lignes.reduce((n, l) => n + (l.clauses?.filter((x) => x.statut === 'indecidable').length ?? 0), 0);
writeFileSync('docs/discovery/couverture-referentiel.json', JSON.stringify({
  date: new Date().toISOString(), referentiel: 'Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_8.xlsx',
  methode: 'clause évaluée par conditions.ts dans l’état vide lu en base (compte neuf, pile locale) et dans un état ouvert ; indécidable dans les deux = non implémentée',
  questions: lignes.length, resume, clauses: { total: clausesTotal, indecidables: clausesMuettes }, lignes,
}, null, 1));

const md: string[] = [
  '# Couverture complète du référentiel — révision 8', '',
  `Généré par \`scripts/discovery/couverture-referentiel.mts\` le ${new Date().toISOString().slice(0, 10)}. Détail question par question, clause par clause : \`docs/discovery/couverture-referentiel.json\`.`, '',
  'Méthode : chaque clause de chaque condition est évaluée par le vrai évaluateur du moteur, dans l’état réellement lu en base pour un compte neuf, puis dans un état où tout est déclaré. Une clause indécidable dans les deux n’est pas implémentée. « Fermée par le produit » ne s’emploie que lorsqu’une décision ou le référentiel la prévoit, et la cite.', '',
  `**${lignes.length} questions** (${integral.actives.length} actives, ${integral.en_arbitrage.length} en arbitrage, ${integral.retirees.length} retirées) · **${clausesTotal} clauses** évaluées, dont **${clausesMuettes}** indécidables.`, '',
  '| Statut | Questions |', '|---|---|', ...statuts.map((s) => `| ${s} | ${resume[s]} |`), '',
];
for (const s of ['fermee_par_le_produit', 'fermee_par_garde_de_sensibilite', 'non_implementee_hypothese', 'non_implementee']) {
  md.push(`## ${s}`, '');
  const par = new Map<string, string[]>();
  for (const l of lignes.filter((x) => x.statut === s)) par.set(l.justification, [...(par.get(l.justification) ?? []), l.id]);
  for (const [j, ids] of par) md.push(`- **${ids.join(', ')}** — ${j}`);
  md.push('');
}
writeFileSync('docs/discovery/couverture-referentiel.md', md.join('\n'));
console.log(JSON.stringify(resume), `clauses ${clausesTotal}, indécidables ${clausesMuettes}`);
