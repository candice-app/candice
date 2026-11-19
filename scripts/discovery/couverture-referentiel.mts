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

// ── CE QUI MANQUE, PAR NATURE (20 nov.) : « sépare les prérequis métier réellement absents, les données
//    à recueillir ou à rattacher, les clauses déjà comprises mais non exécutées, et les décisions produit
//    encore nécessaires ». Chaque motif écrit est rangé dans UNE catégorie, avec ce qu'il faudrait.
type Categorie = 'prerequis_metier_absent' | 'donnees_a_recueillir' | 'clause_comprise_non_executee' | 'decision_produit';
const CATEGORIES: [RegExp, Categorie, string][] = [
  [/recommandation EN PRÉPARATION|tension entre une recommandation/, 'decision_produit', 'la question vit chez le pilote, pendant une recommandation : décider si elle y est posée (au pilote, sur son proche) ou réécrite pour une préparation de la personne'],
  [/seuil d’importance|critère de pertinence|souvenirs importants|rapport à la marque ambigu|symbolique \/ histoire|approfondissement expressément pertinent/, 'decision_produit', 'un seuil ou un critère que le référentiel ne chiffre pas : à fixer (ou à remplacer par une réponse explicite de la personne)'],
  [/Famille \(branche relation2\)/, 'decision_produit', 'aucune règle d’ouverture écrite pour cette sous-partie : à écrire'],
  [/options ne sont pas écrites/, 'prerequis_metier_absent', 'les réponses possibles de la question restent à écrire (contenu du référentiel)'],
  [/règles K3/, 'prerequis_metier_absent', 'les « règles K3 » des questions préventives n’existent dans aucune source : à fournir, ou à retirer'],
  [/préparation TERMINÉE/, 'decision_produit', 'la fin d’une préparation est déjà déclarée (« Projet terminé ») ; reste à décider si, et jusqu’à quand, une question « après » se pose pour une préparation close, et à laquelle sa réponse se rattache'],
  [/contextes de niveau C|niveau de délégation|Cartouche ADN/, 'prerequis_metier_absent', 'une notion que le moteur n’a pas (contexte de préparation précis, délégation, « cartouche ») : à définir'],
  [/caractéristique de l’achat|budget|caractéristiques d’une préparation/, 'donnees_a_recueillir', 'une caractéristique de la préparation (catégorie, usage, budget, format…) à demander quand la personne la déclare'],
  [/paramètre \{activité\}|paramètre d’énoncé sans source/, 'donnees_a_recueillir', 'la valeur du paramètre n’est recueillie par aucune réponse : une question qui la demande, une par une'],
  [/animal voyage|proche vit loin|dates importantes/, 'donnees_a_recueillir', 'une donnée qu’aucune question ne recueille (ou qui appartient au carnet du pilote) : à recueillir ou à rattacher'],
  [/fatigue familiale/, 'prerequis_metier_absent', 'une démarche dite dans un texte libre, que rien ne détecte : détection à construire'],
  [/INTEREST\.live_performance|INTEREST\.resonance/, 'clause_comprise_non_executee', 'un tag de la refonte dont la correspondance avec la branche historique n’est pas déclarée : une équivalence explicite à écrire'],
  [/clause\(s\) que le moteur ne sait pas constater|condition non comprise|jamais décidable/, 'clause_comprise_non_executee', 'une clause comprise dont l’évaluation n’est pas raccordée'],
  [/aucun écrivain ne produit/, 'donnees_a_recueillir', 'rien n’écrit l’objet attendu : une source à désigner'],
];
for (const l of lignes) if (l.statut === 'non_implementee') {
  const c = CATEGORIES.find(([re]) => re.test(l.justification));
  if (!c) throw new Error(`${l.id} : motif non rangé — « ${l.justification.slice(0, 120)} »`);
  (l as Ligne & { categorie?: Categorie; ce_qu_il_faudrait?: string }).categorie = c[1];
  (l as Ligne & { ce_qu_il_faudrait?: string }).ce_qu_il_faudrait = c[2];
}
const compte = (s: string) => lignes.filter((l) => l.statut === s).length;
const statuts = [...new Set(lignes.map((l) => l.statut))].sort();
const resume = Object.fromEntries(statuts.map((s) => [s, compte(s)]));
const clausesTotal = lignes.reduce((n, l) => n + (l.clauses?.length ?? 0), 0);
const clausesMuettes = lignes.reduce((n, l) => n + (l.clauses?.filter((x) => x.statut === 'indecidable').length ?? 0), 0);
writeFileSync('docs/discovery/couverture-referentiel.json', JSON.stringify({
  date: new Date().toISOString(), referentiel: 'Candice_Discovery_Referentiel_V5_OPEN_V3_REVISION_8.xlsx',
  methode: 'clause évaluée par conditions.ts dans l’état vide lu en base (compte neuf, pile locale) et dans un état ouvert ; indécidable dans les deux = non implémentée',
  questions: lignes.length, resume, clauses: { total: clausesTotal, indecidables: clausesMuettes },
  non_implementees_par_nature: Object.fromEntries(['prerequis_metier_absent', 'donnees_a_recueillir', 'clause_comprise_non_executee', 'decision_produit'].map((c) => [c, lignes.filter((l) => (l as { categorie?: string }).categorie === c).length])), lignes,
}, null, 1));

const md: string[] = [
  '# Couverture complète du référentiel — révision 8', '',
  `Généré par \`scripts/discovery/couverture-referentiel.mts\` le ${new Date().toISOString().slice(0, 10)}. Détail question par question, clause par clause : \`docs/discovery/couverture-referentiel.json\`.`, '',
  'Méthode : chaque clause de chaque condition est évaluée par le vrai évaluateur du moteur, dans l’état réellement lu en base pour un compte neuf, puis dans un état où tout est déclaré. Une clause indécidable dans les deux n’est pas implémentée. « Fermée par le produit » ne s’emploie que lorsqu’une décision ou le référentiel la prévoit, et la cite.', '',
  `**${lignes.length} questions** (${integral.actives.length} actives, ${integral.en_arbitrage.length} en arbitrage, ${integral.retirees.length} retirées) · **${clausesTotal} clauses** évaluées, dont **${clausesMuettes}** indécidables.`, '',
  '| Statut | Questions |', '|---|---|', ...statuts.map((s) => `| ${s} | ${resume[s]} |`), '',
];
const NOMS: Record<Categorie, string> = { prerequis_metier_absent: 'Prérequis métier réellement absents', donnees_a_recueillir: 'Données à recueillir ou à rattacher',
  clause_comprise_non_executee: 'Clauses déjà comprises mais non exécutées', decision_produit: 'Décisions produit encore nécessaires' };
md.push('## Non implémentées, par nature de ce qui manque', '');
for (const cat of Object.keys(NOMS) as Categorie[]) {
  const de = lignes.filter((l) => (l as { categorie?: string }).categorie === cat);
  md.push(`### ${NOMS[cat]} — ${de.length}`, '');
  const par = new Map<string, string[]>();
  for (const l of de) { const k = `${l.justification} → ${(l as { ce_qu_il_faudrait?: string }).ce_qu_il_faudrait}`; par.set(k, [...(par.get(k) ?? []), l.id]); }
  for (const [j, ids] of par) md.push(`- **${ids.join(', ')}** — ${j}`);
  md.push('');
}
for (const s of ['fermee_par_le_produit', 'fermee_par_garde_de_sensibilite', 'non_implementee_hypothese']) {
  md.push(`## ${s}`, '');
  const par = new Map<string, string[]>();
  for (const l of lignes.filter((x) => x.statut === s)) par.set(l.justification, [...(par.get(l.justification) ?? []), l.id]);
  for (const [j, ids] of par) md.push(`- **${ids.join(', ')}** — ${j}`);
  md.push('');
}
writeFileSync('docs/discovery/couverture-referentiel.md', md.join('\n'));
console.log(JSON.stringify(resume), `clauses ${clausesTotal}, indécidables ${clausesMuettes}`);
