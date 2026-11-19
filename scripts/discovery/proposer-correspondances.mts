// CANDIDATS DE CORRESPONDANCE « nom écrit dans une condition → branche(s) » — POUR REVUE.
//
// Ce script NE PILOTE PAS le moteur. Il lit la banque, relève chaque nom que les conditions
// emploient, et propose pour chacun une correspondance avec sa SOURCE et sa JUSTIFICATION.
// Sa sortie est relue, corrigée à la main si besoin, puis FIGÉE dans
// `src/lib/discovery/open-v3/correspondances.json`. Le moteur ne lit que ce fichier figé :
// ajouter une question au classeur ne change donc aucune correspondance déjà validée — ce
// script signalera seulement un nom nouveau, à revoir.
//
// Avant le 19 nov., `branches.ts` décidait seul : un nom désignait une branche s'il y était
// employé au moins trois fois et à plus du quart de son emploi principal. Ce sont des
// fréquences, pas des preuves : « Couple » désignait ainsi toute la branche Relation.
//
// CRITÈRES (aucun n'est une fréquence) :
//   IDENTITÉ    le nom est l'identifiant d'une branche                       → établie
//   NOM         le nom est le NOM OFFICIEL de la branche (noms-officiels.json)→ établie
//   INCLUSION   le nom est contenu dans le nom officiel (ou l'inverse), mots
//               pleins seulement, ET toutes ses questions sont dans ce domaine→ établie
//   SOUS-PARTIE « Sous-branche X », « Axe X », « <Branche> — <partie> » : la partie
//               appartient à la branche de ses questions (appartenance = fait) ;
//               CE QUI L'OUVRE est une règle à part (dépendance ou niveau B)
//   sinon                                                                     → hypothèse
// Une HYPOTHÈSE n'ouvre rien : la condition qui porte ce nom reste non résolue.
//
//   npx tsx scripts/discovery/proposer-correspondances.mts            écrit le fichier figé
//   npx tsx scripts/discovery/proposer-correspondances.mts --verifier compare sans écrire
import { readFileSync, writeFileSync } from 'node:fs';
import { BANQUE } from '../../src/lib/discovery/open-v3/banque.ts';
import { analyserCondition, clef } from '../../src/lib/discovery/open-v3/conditions.ts';
import { poolDe } from '../../src/lib/discovery/open-v3/coexistence.ts';

const RACINE = new URL('../../', import.meta.url).pathname;
const officiels = JSON.parse(readFileSync(RACINE + 'src/lib/discovery/open-v3/noms-officiels.json', 'utf8')) as
  { source: string; sha256_source: string; branches: { id: string; nom_officiel: string }[] };
const NOM_OFFICIEL = new Map(officiels.branches.map((b) => [b.id, b.nom_officiel] as const));
const BRANCHES = [...new Set(BANQUE.map((q) => q.branche))];

const VIDES = new Set(['et', 'ou', 'de', 'des', 'du', 'la', 'le', 'les', 'l', 'd', 'a', 'au', 'aux', 'en', 'un', 'une', 'v1', 'v2', 'refonte', 'remplacer', 'merge', 'rapport']);
/** Le nom officiel sans ses annotations de version. */
const nu = (nom: string) => nom.replace(/\((?:refonte[^)]*|V1[^)]*)\)/gi, '').replace(/[()]/g, ' ').trim();
const mots = (s: string) => new Set(clef(nu(s)).split(/[^a-z0-9]+/).filter((m) => m.length > 1 && !VIDES.has(m)));
const inclus = (a: Set<string>, b: Set<string>) => a.size > 0 && [...a].every((m) => b.has(m));

interface Emploi { nom: string; brut: string; type: string; sousPartie: boolean; question: string; branche: string }
const emplois: Emploi[] = [];
for (const q of BANQUE) for (const c of analyserCondition(q.condition_emission).clauses as { type: string; branche?: string; domaine?: string; sousPartie?: boolean }[]) {
  const nom = c.type === 'niveau' || c.type === 'branche_ouverte' || c.type === 'ouverture_branche' ? c.branche : c.type === 'interet' ? c.domaine : undefined;
  if (nom) emplois.push({ nom, brut: q.condition_emission, type: c.type, sousPartie: c.sousPartie === true, question: q.id, branche: q.branche });
}
const parNom = new Map<string, Emploi[]>();
for (const e of emplois) parNom.set(e.nom, [...(parNom.get(e.nom) ?? []), e]);

import { DEPENDANCES } from '../../src/lib/discovery/open-v3/dependances.ts';

/* ── REVUE À LA MAIN. Chaque ligne est une décision de lecture, avec sa raison. Elle prime sur
 *    les critères, et elle est marquée « lecture » dans la table : ce sont les lignes à relire
 *    en premier. */
type Ouverture = 'dependance' | 'niveau_B_du_parent' | 'non_resolue';
interface Revue { type: 'branche' | 'sous_partie'; branches: string[]; etablie: boolean; ouverture?: Ouverture; raison: string }
const V1 = (b: string, nom: string, forme: string): Revue => ({ type: 'branche', branches: [b], etablie: true,
  raison: `Nom que le classeur donne à la branche historique « ${b} » dans ses conditions (« ${forme} »). Son premier terme est le nom officiel (« ${nom} ») ; la suite le développe sans le conditionner. Toutes ses questions sont dans « ${b} ».` });
const CONTEXTE = (b: string, quoi: string): Revue => ({ type: 'sous_partie', branches: [b], etablie: true, ouverture: 'non_resolue',
  raison: `Cette partie suppose ${quoi}. Rien dans l'état du moteur ne le dit aujourd'hui : l'ouvrir avec sa branche poserait ses questions à quelqu'un qu'elles ne concernent pas.` });
const REVUE: Record<string, Revue> = {
  'hotellerie': { type: 'sous_partie', branches: ['travel2'], etablie: true, ouverture: 'non_resolue',
    raison: 'La feuille Branches écrit « HÔTELLERIE = branche DISTINCTE : ouverture si hébergement cité… ». Le nom est contenu dans « Voyage & Hôtellerie », mais ouvrir l’hôtellerie avec le voyage contredirait cette phrase. Ses 20 questions sont dans travel2 ; ce qui les ouvre (un hébergement cité) n’a pas de forme exécutable.' },
  'couple': { type: 'sous_partie', branches: ['relation2'], etablie: true, ouverture: 'non_resolue',
    raison: 'Feuille Branches : « Couple (si partenaire ET accord d’enrichir) ». Le moteur ne sait pas aujourd’hui si un partenaire existe ni si cet accord a été donné.' },
  'couple au quotidien': CONTEXTE('daily2', 'une vie de couple'),
  'famille et enfants au quotidien': CONTEXTE('daily2', 'une vie de famille avec enfants'),
  'travail a domicile': CONTEXTE('daily2', 'du télétravail ou une activité à domicile (« à ouvrir si télétravail ou activité à domicile »)'),
  // ── Noms des branches historiques (V1), écrits « X et Y » dans les conditions du classeur.
  'sport et activite physique': V1('sport', 'Sport', 'Branche Sport et activité physique ouverte'),
  'nature et plein air': V1('nature', 'Nature', 'Branche Nature et plein air ouverte'),
  'bien-etre et repos': V1('wellbeing', 'Bien-être', 'Branche Bien-être et repos ouverte'),
  'technologie et innovation': V1('tech', 'Technologie', 'Branche Technologie et innovation ouverte'),
  'apprentissage et curiosite': V1('learning', 'Apprentissage', 'Branche Apprentissage et curiosité ouverte'),
  'art, musees et expositions': V1('art', 'Art', 'Intérêt art, musées et expositions sélectionné ou détecté'),
  'mode et vetements': V1('fashion', 'Mode', 'Branche Mode et vêtements ouverte'),
  'parfum et odeurs': V1('fragrance', 'Parfum', 'Branche Parfum et odeurs ouverte'),
  'beaute et soins': V1('beauty', 'Beauté', 'Branche Beauté et soins ouverte'),
  'consommation et valeur': V1('consumption', 'Consommation', 'Branche Consommation et valeur ouverte'),
  'travail et carriere': V1('work', 'Travail', 'Branche Travail et carrière ouverte'),
  'maison et decoration': V1('home', 'Maison', 'Branche Maison et décoration ouverte'),
  // ── Même mot, autre accord ou autre langue : lu, et à confirmer.
  'sensoriel': { type: 'branche', branches: ['sensory2'], etablie: true,
    raison: '« Niveau B Sensoriel » : le masculin de « Signature Sensorielle », nom officiel de sensory2, où sont ses 13 questions, à la suite de « Branche Sensorielle ouverte ».' },
  'arts & creatif': { type: 'branche', branches: ['craft'], etablie: true,
    raison: '« Arts & créatif » abrège « Arts visuels, pratiques créatives & artisanat », nom officiel de craft. C’est le nom que porte la question d’ouverture de cette branche (craft.0614) et ses questions de niveau A.' },
  'jeux video': { type: 'branche', branches: ['gaming'], etablie: true,
    raison: '« Jeux vidéo » est le français de « Gaming », nom officiel de la branche historique gaming, où sont ses 8 questions.' },
  'danse/concerts/festivals': { type: 'branche', branches: ['live'], etablie: true,
    raison: '« Danse/Concerts/Festivals » est le nom officiel de live (« Danse · Concerts · Festivals »), à la ponctuation près.' },
  'les animaux — philosophie': { type: 'branche', branches: ['animals'], etablie: true,
    raison: '« Les animaux — philosophie » est le nom officiel de animals (« Les animaux (philosophie) »), à la ponctuation près.' },
  'avance esthetique': { type: 'branche', branches: [], etablie: false,
    raison: '« Niveau B avancé Esthétique » : le classeur ne dit pas ce qui distingue un niveau B « avancé » du niveau B. Trois questions (aesthetic.1967 à 1969).' },
};

/** Ce qui suit « — » ou « : » dans un nom est une CONDITION s'il restreint ; sinon c'est un
 *  titre de regroupement ou une note de rédaction (décision n° 3 du 18 nov. : « regroupement
 *  éditorial : le conserver comme tel ; condition : pouvoir dire ce qui la rend vraie »). */
const RESTREINT = /\b(si|seulement|uniquement|apres|avant|lorsqu|quand|ignoree?|a poser|a ouvrir|n’ouvrir|rarement|parametrique|envisagee?|concret|projet|passion|achat|budget|recommandation|contexte|contextuelle?|preparatoire|preventif|regles)\b/;

const sortie: unknown[] = []; const bilan: Record<string, number> = {};
for (const [nom, es] of [...parNom].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  const branchesEmploi = [...new Set(es.map((e) => e.branche))].sort();
  const pools = [...new Set(branchesEmploi.map(poolDe))];
  const questions = es.map((e) => e.question);
  const exemple = es[0].brut.slice(0, 200);
  const base = { nom, emplois: Object.fromEntries(branchesEmploi.map((b) => [b, es.filter((e) => e.branche === b).length])), exemple };
  const pousser = (x: Record<string, unknown>) => { sortie.push({ ...base, ...x }); bilan[`${x.type}/${x.statut}/${x.critere}`] = (bilan[`${x.type}/${x.statut}/${x.critere}`] ?? 0) + 1; };
  const nomme = (bs: string[]) => bs.map((b) => `« ${b} » (${NOM_OFFICIEL.get(b) ?? b})`).join(' et ');
  const SRC_NOM = `${officiels.source}, feuille B (nom officiel de la branche) ; conditions du classeur officiel`;

  const revue = REVUE[nom];
  if (revue) {
    pousser({ type: revue.type, branches: revue.branches, statut: revue.etablie ? 'etablie' : 'hypothese', critere: 'lecture',
      ...(revue.ouverture ? { ouverture: revue.ouverture } : {}), source: SRC_NOM, justification: revue.raison });
    continue;
  }

  const ecriteSousPartie = es.every((e) => e.sousPartie);
  // Tout ce qui suit le premier « — », « : » ou « , » qualifie le nom.
  const coupe = nom.match(/^(.*?)\s*( — |\s:\s|:\s|,\s)(.+)$/);
  const tete = (coupe ? coupe[1] : nom).trim();
  const suite = coupe ? coupe[3] : '';
  // Après « : » ou « , », le classeur écrit toujours une circonstance (« : passion ou achat
  // concret », « , avant cadeau matériel »). Seul le tiret introduit un titre ou une note.
  const circonstance = !!coupe && coupe[2].trim() !== '—';
  const dependantes = questions.filter((id) => DEPENDANCES.has(id));

  // ── 1. UNE SOUS-PARTIE (« Sous-branche X », « Axe X »). Appartenance = fait ; ouverture = règle.
  if (ecriteSousPartie) {
    if (pools.length !== 1) { pousser({ type: 'sous_partie', branches: [], candidates: branchesEmploi, statut: 'hypothese', critere: 'aucun', source: 'conditions du classeur officiel', justification: `Sous-partie employée dans plusieurs domaines (${branchesEmploi.join(', ')}).` }); continue; }
    const ouverture: Ouverture = dependantes.length > 0 ? 'dependance'
      : (nom.startsWith(':') || circonstance || RESTREINT.test(suite)) ? 'non_resolue' : 'niveau_B_du_parent';
    pousser({ type: 'sous_partie', branches: branchesEmploi, statut: 'etablie', critere: 'appartenance', ouverture,
      source: `banque du classeur officiel (colonne « branche » des ${questions.length} question(s)) ; ${officiels.source}, feuille A, colonne « Conditions niveau B »`,
      justification: `Partie de ${nomme(branchesEmploi)} : ses questions y sont rangées. ` + (ouverture === 'dependance'
        ? 'Elle s’ouvre sur la réponse que le classeur désigne (voir dependances.ts).'
        : ouverture === 'non_resolue'
          ? 'Le classeur la fait dépendre d’un choix ou d’une circonstance qu’il ne rattache à aucune question lisible : elle reste non résolue.'
          : 'La feuille Branches range les sous-branches parmi les questions de niveau B de leur branche : elle s’ouvre quand la branche a atteint ce niveau.') });
    continue;
  }

  // ── 2. LE NOM D'UNE BRANCHE, seul ou suivi d'un titre de regroupement / d'une note.
  const parIdentite = BRANCHES.filter((b) => clef(b) === tete);
  const parNomOfficiel = BRANCHES.filter((b) => clef(nu(NOM_OFFICIEL.get(b) ?? b)) === tete);
  const m = mots(tete);
  const egalMots = BRANCHES.filter((b) => { const o = mots(NOM_OFFICIEL.get(b) ?? b); return inclus(m, o) && inclus(o, m); });
  const contenu = BRANCHES.filter((b) => inclus(m, mots(NOM_OFFICIEL.get(b) ?? b)));     // nom ⊂ nom officiel, jamais l'inverse
  const teteRevue = REVUE[tete];
  let branches: string[] = []; let critere = 'aucun'; let pourquoi = '';
  if (teteRevue?.etablie && teteRevue.type === 'branche') { branches = teteRevue.branches; critere = 'lecture'; pourquoi = teteRevue.raison; }
  else if (parIdentite.length) { branches = [...new Set([...parIdentite, ...parNomOfficiel])]; critere = 'identite'; pourquoi = `« ${tete} » est l’identifiant de la branche${parNomOfficiel.length > parIdentite.length ? ', et le nom officiel de sa seconde génération' : ''}.`; }
  else if (parNomOfficiel.length) { branches = parNomOfficiel; critere = 'nom'; pourquoi = `« ${tete} » est le nom officiel de ${nomme(parNomOfficiel)}.`; }
  else if (egalMots.length) { branches = egalMots; critere = 'nom'; pourquoi = `« ${tete} » porte exactement les mots du nom officiel de ${nomme(egalMots)}.`; }
  else {
    const dansLeDomaine = contenu.filter((b) => pools.includes(poolDe(b)));
    if (dansLeDomaine.length) { branches = dansLeDomaine; critere = 'inclusion'; pourquoi = `Les mots de « ${tete} » sont dans le nom officiel de ${nomme(dansLeDomaine)}, où sont ses questions.`; }
  }
  // LES DEUX GÉNÉRATIONS D'UN DOMAINE PORTENT LE MÊME NOM (onglet 13 : « un seul pool visible »).
  // « Beauté » est le nom de beauty ; beauty2 s'appelle « Beauté & bien-être corporel » et ses
  // questions disent « Niveau B Beauté » : le nom désigne les deux.
  if (branches.length > 0 && critere !== 'lecture') {
    const domaines = new Set(branches.map(poolDe));
    for (const b of BRANCHES) if (!branches.includes(b) && domaines.has(poolDe(b)) && inclus(m, mots(NOM_OFFICIEL.get(b) ?? b))) branches.push(b);
  }
  branches = branches.sort();
  if (branches.length === 0 && /^axe \d/.test(tete) && pools.length === 1) {
    branches = branchesEmploi; critere = 'appartenance';
    pourquoi = `Axe de ${nomme(branchesEmploi)} : la feuille Branches écrit que cette branche « sépare strictement trois axes », et les ${questions.length} questions de celui-ci y sont rangées.`;
  }
  if (branches.length === 0) {
    pousser({ type: 'branche', branches: [], candidates: branchesEmploi, statut: 'hypothese', critere: 'aucun',
      source: 'conditions du classeur officiel (emplois relevés)', justification: `Aucun nom officiel ne correspond à « ${tete} ». ${questions.length} question(s) : ${questions.slice(0, 6).join(', ')}${questions.length > 6 ? '…' : ''}.` });
    continue;
  }
  if (suite && (circonstance || RESTREINT.test(suite))) {
    // LE NOM EST COMPRIS, CE QUI LE SUIT NE L'EST PAS : une condition en prose. Non résolu.
    pousser({ type: 'branche', branches: [], candidates: branches, statut: 'hypothese', critere: 'condition_en_prose',
      source: 'conditions du classeur officiel', justification: `« ${tete} » désigne ${nomme(branches)}, mais « ${suite} » est une condition que le moteur ne sait pas rendre vraie ou fausse. ${questions.length} question(s) : ${questions.slice(0, 6).join(', ')}.` });
    continue;
  }
  pousser({ type: 'branche', branches, statut: 'etablie', critere, source: critere === 'identite' ? 'banque du classeur officiel, colonne « branche »' : SRC_NOM,
    ...(suite ? { regroupement: suite } : {}),
    justification: pourquoi + (suite ? ` « ${suite} » est un titre de regroupement ou une note de rédaction : il ne conditionne pas l’ouverture (décision n° 3 du 18 nov.).` : '')
      + (pools.length > 1 && branches.length ? ` Ses emplois hors de ce domaine (${branchesEmploi.filter((b) => !branches.map(poolDe).includes(poolDe(b))).join(', ')}) sont des renvois.` : '') });
}

const fichier = RACINE + 'src/lib/discovery/open-v3/correspondances.json';
const contenu = JSON.stringify({
  version: '2026-11-19.1',
  note: 'Table FIGÉE et relue. Le moteur ne lit qu’elle. Seules les lignes « etablie » ouvrent quelque chose ; une « hypothese » laisse la condition non résolue. Régénérer ne se fait que pour proposer, et tout écart se relit.',
  source_noms_officiels: officiels.source, sha256_source_noms_officiels: officiels.sha256_source,
  noms: sortie,
}, null, 1) + '\n';
if (process.argv.includes('--verifier')) {
  const actuel = readFileSync(fichier, 'utf8');
  if (actuel !== contenu) { console.error('ÉCART entre la table figée et les candidats recalculés — à relire, la table figée reste en vigueur.'); process.exit(2); }
  console.log('table figée = candidats recalculés');
} else { writeFileSync(fichier, contenu); console.log(bilan, '→', fichier); }
