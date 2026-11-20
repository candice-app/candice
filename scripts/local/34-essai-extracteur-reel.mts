// ESSAI DU VÉRITABLE EXTRACTEUR, SUR DONNÉES FICTIVES — préparé le 19 nov., à lancer par Estelle.
//
// Ce que les autres essais ne prouvent pas : partout ailleurs, le modèle est SIMULÉ (on lui dicte
// sa lecture). Ici, les mêmes fonctions de l'application appellent le vrai modèle, avec la vraie
// consigne et le vrai schéma, sur des réponses INVENTÉES. On compare ce qui s'écrit à ce qui doit
// s'écrire — y compris les cas où RIEN ne doit s'écrire (négation, autre personne, passé,
// condition, ironie).
//
// SÉCURITÉ, et elle est structurelle :
//   · AUCUNE BASE : les écritures vont dans une base EN MÉMOIRE (la même que les essais unitaires).
//     Le script n'importe aucun client Supabase ; il ne peut ni lire ni écrire la production.
//   · LA CLÉ reste dans l'environnement du processus. Le script ne l'affiche jamais, ne l'écrit
//     dans aucun fichier, et refuse de démarrer si elle est absente — ou si l'adresse du modèle
//     pointe le faux modèle local (l'essai ne prouverait rien).
//   · LES DONNÉES sont fictives : aucun compte, aucune personne réelle.
//
// LANCEMENT : docs/discovery/procedure-vrai-modele.md — par le lanceur scripts/local/40-parcours-vrai-modele.sh
// (qui demande la clé lui-même), ou seul, sans base, comme la procédure l'écrit.
// Le rapport s'écrit dans docs/discovery/essai-extracteur-reel.json (sans la clé, sans en-tête).
// Coût : une quarantaine d'appels courts au modèle.
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fausseBase } from '../../src/lib/knowledge/__tests__/fausse-base.ts';
import { enregistrerReponseOuverte } from '../../src/lib/discovery/open-v3/service.ts';
import { MODELE_DESTINATIONS, VERSION_LECTURE, lireSegmentsParModele } from '../../src/lib/discovery/open-v3/destinations.ts';
import { MODELE_QUALIFICATION } from '../../src/lib/recommendations/qualifier-idees.ts';
import { MODELE_EXTRACTION_LIBRE } from '../../src/lib/knowledge-write/extract-free-text.ts';

// L'identité de l'essai : le commit testé (et s'il a des modifications non commitées), les modèles,
// la version du lecteur. Sans commit lisible, l'essai ne dit pas ce qu'il a testé : il s'arrête.
let COMMIT: string, MODIFIE: boolean;
try {
  COMMIT = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  MODIFIE = execSync('git status --porcelain -- src', { encoding: 'utf8' }).trim().length > 0;
} catch { console.error('ARRÊT — commit testé illisible (git).'); process.exit(2); }
// Ce que le modèle a RÉELLEMENT rendu, cas par cas (codes déjà traduits en déclencheurs).
// DEUX lecteurs, observés chacun : celui des destinations (onglet 17) et celui de l'envie culinaire
// (food2.0882A, contrat propre). L'instrumentation est tenue À PART du statut que rend le service :
// une panne se lit dans ce statut ; l'instrumentation dit seulement quel lecteur a été appelé.
let brutModele: unknown = null, appelsModele = 0;
const lecteurObserve: typeof lireSegmentsParModele = async (...a) => { appelsModele++; brutModele = await lireSegmentsParModele(...a); return brutModele; };
const { lireEnvieParModele } = await import('../../src/lib/discovery/open-v3/envie-culinaire.ts');
let brutEnvie: unknown = null, appelsEnvie = 0;
const lecteurEnvieObserve = async (t: string) => { appelsEnvie++; brutEnvie = await lireEnvieParModele(t); return brutEnvie; };

if (!process.env.ANTHROPIC_API_KEY) { console.error('ARRÊT — aucune clé dans l’environnement. Voir l’en-tête du script.'); process.exit(2); }
if (process.env.ANTHROPIC_BASE_URL && /127\.0\.0\.1|localhost/.test(process.env.ANTHROPIC_BASE_URL)) {
  console.error('ARRÊT — ANTHROPIC_BASE_URL pointe un modèle local : l’essai doit parler au vrai modèle.'); process.exit(2);
}
console.log(`clé présente : oui (jamais affichée) · commit ${COMMIT}${MODIFIE ? ' (+ modifications non commitées dans src)' : ''} · lecteur v${VERSION_LECTURE} · modèles : destinations ${MODELE_DESTINATIONS}, extracteur libre ${MODELE_EXTRACTION_LIBRE}, qualification ${MODELE_QUALIFICATION}\n`);

type Base = ReturnType<typeof fausseBase>;
const preuves = (b: Base) => (b.tables.knowledge_evidences ?? []) as Record<string, unknown>[];
const faits = (b: Base) => ((b.tables.knowledge_facts ?? []) as Record<string, unknown>[]).filter((f) => String(f.fact_type).startsWith('discovery.fait.') || String(f.fact_type).startsWith('discovery.envie'));
const ouvertes = (b: Base) => (b.tables.knowledge_open_knowledge ?? []) as Record<string, unknown>[];
const resume = (b: Base) => ({
  preuves: preuves(b).map((e) => `${e.target_family}:${e.subject_label ?? e.target_construct}${e.polarity && e.polarity !== 'positive' ? ` [${e.polarity}]` : ''}${e.stability ? ` (${e.stability})` : ''}`),
  faits: faits(b).map((f) => `${f.fact_type}=${String(f.value).slice(0, 80)}`),
  ouvertes: ouvertes(b).map((o) => String(o.subject_label ?? o.subject)),
  // La correspondance exacte : attribut, valeur, polarité, stabilité — pas seulement un compte.
  attributs: preuves(b).map((e) => ({ attribut: String(e.target_construct ?? ''), valeur: String(e.preferenceValue ?? e.preference_value ?? e.subjectLabel ?? e.subject_label ?? ''), polarite: String(e.polarity ?? 'positive'), stabilite: String(e.stability ?? '') })),
});
type Attr = ReturnType<typeof resume>['attributs'][number];
const sans = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const a = (r: ReturnType<typeof resume>, attribut: RegExp, valeur: RegExp, polarite: string, stabilite: string) =>
  r.attributs.filter((x: Attr) => attribut.test(x.attribut) && valeur.test(sans(x.valeur)) && x.polarite === polarite && x.stabilite === stabilite).length === 1;
const contient = (liste: string[], mot: string) => liste.some((x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(mot));

type Ligne = { declencheur: string; issue: string; motif?: string };
const releveDe = (brut: unknown): Ligne[] => ((brut as { destinations?: { releve?: Ligne[] } }).destinations?.releve ?? []);
interface Cas { id: string; question: string; texte: string; attendu: string; juger: (r: ReturnType<typeof resume>, brut: unknown) => boolean }
const RIEN = (r: ReturnType<typeof resume>) => r.preuves.length === 0 && r.faits.length === 0;
const CAS: Cas[] = [
  // ── Onglet 17, learning2.1459 « Quels sujets t’intéressent ponctuellement ? » ───────────────
  { id: 'sujet-present', question: 'learning2.1459', texte: 'En ce moment la géologie, et un peu l’histoire des cartes anciennes.',
    attendu: 'deux intérêts (géologie, histoire des cartes), stabilité contextual', juger: (r) => r.attributs.length === 2 && contient(r.preuves, 'geologie') && contient(r.preuves, 'cartes') && r.attributs.every((x: Attr) => x.stabilite === 'contextual' && x.polarite === 'positive') },
  { id: 'sujet-nie', question: 'learning2.1459', texte: 'La géologie ne m’intéresse pas du tout, contrairement à ce qu’on croit.', attendu: 'rien (négation)', juger: RIEN },
  { id: 'sujet-autre-personne', question: 'learning2.1459', texte: 'Mon frère est passionné de géologie, moi je l’écoute.', attendu: 'rien (autre personne)', juger: RIEN },
  { id: 'sujet-passe', question: 'learning2.1459', texte: 'J’adorais la géologie quand j’étais petite.', attendu: 'rien (passé)', juger: RIEN },
  { id: 'sujet-condition', question: 'learning2.1459', texte: 'Si j’avais le temps, peut-être la géologie.', attendu: 'rien (condition)', juger: RIEN },
  { id: 'sujet-ironie', question: 'learning2.1459', texte: 'La géologie, passionnant, vraiment… je plaisante.', attendu: 'rien (ironie dite)', juger: RIEN },
  // ── Onglet 17, CRE-06 « une technique, un style ou une matière que tu n’aimes vraiment pas » ─
  { id: 'rejet-technique-style', question: 'CRE-06', texte: 'Je n’aime vraiment pas le macramé, et le style shabby chic me hérisse.',
    // 20 nov. : l'ancien jugement comptait deux rejets ; le passage réel a rangé le macramé en MATIÈRE et
    // le cas passait. Exigé désormais : la correspondance exacte, et zéro matière inventée.
    attendu: 'macramé → type_preference [rejet] ; shabby chic → aesthetic_universe [rejet] ; stabilité undetermined ; aucune matière',
    juger: (r) => r.attributs.length === 2 && a(r, /type_preference$/, /macrame/, 'rejet', 'undetermined') && a(r, /aesthetic_universe$/, /shabby/, 'rejet', 'undetermined') && !r.attributs.some((x: Attr) => /material_preference$/.test(x.attribut)) },
  { id: 'rejet-inverse', question: 'CRE-06', texte: 'Franchement j’adore le macramé, je n’ai rien contre aucune technique.', attendu: 'rien (aucun rejet dit)', juger: RIEN },
  // ── Onglet 17, comics.0422 « titres, auteurs » ───────────────────────────────────────────────
  { id: 'auteur-et-titre', question: 'comics.0422', texte: 'Tout ce que fait Moebius, et la série Blacksad.',
    attendu: 'un fait auteur (Moebius) ; le titre écrit comme référent ou mis en clarification, jamais inventé', juger: (r) => contient(r.faits, 'moebius') },
  { id: 'auteur-nie', question: 'comics.0422', texte: 'Pas Moebius, je n’ai jamais accroché.', attendu: 'rien (négation)', juger: RIEN },
  // ── Onglet 17, time.1566 et drinks.2102 (projection déclarée) ────────────────────────────────
  { id: 'projection', question: 'time.1566', texte: 'L’an prochain, j’aimerais prendre un mois entier pour marcher jusqu’à Compostelle.', attendu: 'un fait de projection', juger: (r) => r.faits.length >= 1 },
  { id: 'projection-autre', question: 'time.1566', texte: 'Ma sœur veut partir un mois à Compostelle.', attendu: 'rien (autre personne)', juger: RIEN },
  // ── Couverture des 15 destinations (décision 10 du 19 nov., 18h54) : déclenchement ET interdit ──
  // CRE-06 #3 matière (rejet) — et ce qui ne doit pas la déclencher (une matière aimée).
  { id: 'rejet-matiere', question: 'CRE-06', texte: 'Je n’aime vraiment pas travailler le plastique.', attendu: 'un rejet de matière, undetermined', juger: (r) => r.preuves.length >= 1 && r.preuves.every((p) => p.includes('[rejet]')) },
  { id: 'matiere-aimee', question: 'CRE-06', texte: 'J’aime beaucoup le lin et la laine.', attendu: 'rien (aucun rejet)', juger: RIEN },
  // comics.0422 #1 œuvre appréciée (sans œuvre connue en base : clarification, jamais une œuvre inventée) · #2 auteur seulement mentionné.
  { id: 'oeuvre-appreciee', question: 'comics.0422', texte: 'J’adore Blacksad.', attendu: 'œuvre non résolue en base vide → clarification, aucune œuvre inventée',
    // Contrat comics.0422 #1 : « résolution unique de l'œuvre ET appréciation explicite ». La règle de
    // résolution écrite (destinations.ts, `resoudre`) : un titre COPIÉ de la réponse, dans le médium de
    // la question, identifie l'œuvre ; seul un épisode exige son émission. L'attendu d'origine (une
    // clarification) contredisait cette règle : corrigé le 20 nov., sans changer le code. Ce qui reste
    // interdit : une autre œuvre que celle écrite, et toute relation envers un auteur.
    juger: (r, brut) => (r.preuves.length === 1 && /ENTITY:.*blacksad/i.test(r.preuves[0]))
      || (((brut as { destinations?: { clarifications: number } }).destinations?.clarifications ?? 0) >= 1 && r.preuves.length === 0) },
  { id: 'auteur-mentionne', question: 'comics.0422', texte: 'On m’a parlé de Moebius, je ne connais pas.', attendu: 'rien d’appréciation (mention ou rien)', juger: (r) => !r.preuves.some((p) => p.toLowerCase().includes('moebius')) },
  // drinks.2102 #1 projection — et l'habitude présente, qui n'en est pas une.
  { id: 'boisson-projection', question: 'drinks.2102', texte: 'Un verre de vin nature sur une terrasse à Lisbonne, au coucher du soleil.', attendu: 'un seul fait de projection (moment_ideal_boisson) ; aucune preuve (ni goût, ni habitude, ni envie de visite) ; rien d’inventé (Portugal)',
    // 20 nov. (troisième passage réel, eea2f38) : le modèle avait ajouté identite.rattachement « Portugal » et
    // relation WANT_TO_VISIT ; la projection était perdue. Le jugement exige désormais le fait SEUL, et rien d'inventé.
    juger: (r) => r.faits.length === 1 && r.faits[0].includes('moment_ideal_boisson') && r.preuves.length === 0 && !JSON.stringify(r).includes('Portugal') },
  { id: 'boisson-autre', question: 'drinks.2102', texte: 'Mon mari adore le whisky tourbé.', attendu: 'rien (autre personne)', juger: RIEN },
  // pets.0403 #1 souhait pour SON animal : sans animal déclaré, rien n'est écrit d'office (clarification ou rien).
  { id: 'souhait-animal', question: 'pets.0403', texte: 'Un nouveau panier pour Moka.', attendu: 'aucun animal déclaré en base → pas de souhait écrit sans identifiant', juger: (r) => r.faits.length === 0 || r.faits.every((f) => !f.includes('Moka') || f.includes('clarification')) },
  { id: 'souhait-animal-autre', question: 'pets.0403', texte: 'Le chien de ma voisine aurait besoin d’un manteau.', attendu: 'rien (animal d’une autre personne)', juger: RIEN },
  // podcast.0467 #1 épisode référent · #2 appréciation distincte du même épisode.
  { id: 'episode', question: 'podcast.0467', texte: 'L’épisode de Transfert sur la disparition de Lucie m’a bouleversée.', attendu: 'épisode non résolu en base vide → clarification ; aucune appréciation écrite sur un référent inconnu',
    // Attendu INCHANGÉ (revue du 20 nov.) : la réponse décrit le SUJET de l'épisode, elle ne donne ni son
    // titre ni son numéro ; une identité unique n'est pas démontrée. Clarification, aucun fait d'épisode
    // qui prétendrait l'avoir identifié, aucune appréciation. Le verbatim reste entier (vérifié à part).
    juger: (r, brut) => ((brut as { destinations?: { clarifications: number } }).destinations?.clarifications ?? 0) >= 1
      && !r.faits.some((f) => f.startsWith('discovery.fait.podcast.episode_marquant')) && !r.preuves.some((p) => p.startsWith('ENTITY')) },
  { id: 'episode-nie', question: 'podcast.0467', texte: 'Aucun, je n’écoute pas de podcasts.', attendu: 'rien', juger: RIEN },
  // sensory2.1482 #1 lieu référent · #2 appréciation distincte.
  { id: 'lieu-bien-etre', question: 'sensory2.1482', texte: 'Les thermes de Bagnères-de-Bigorre, pour la chaleur de l’eau et le silence.', attendu: 'lieu non résolu → clarification ou référent ; aucune préférence générale inventée',
    // sensory2.1482 #1 a pour voie un FAIT (lieu_de_bien_etre) : l'ancien jugement ne regardait que les
    // preuves et comptait faux un référent correctement écrit. Corrigé : fait du lieu écrit, ou clarification ;
    // et toujours aucune préférence générale (« chaleur de l'eau », « silence ») inventée.
    juger: (r, brut) => ((((brut as { destinations?: { clarifications: number } }).destinations?.clarifications ?? 0) >= 1)
      || r.faits.some((f) => f.startsWith('discovery.fait.sensory.lieu_de_bien_etre') && /bagn/i.test(f))) && r.preuves.length === 0 },
  // 19 nov., 19h56 — la CIBLE de l'appréciation, lue par le vrai modèle puis vérifiée dans les mots.
  { id: 'cible-aspect-lieu', question: 'sensory2.1482', texte: 'Les thermes de Bagnères, à Bagnères-de-Bigorre : j’y ai adoré le silence.', attendu: 'aucune relation envers l’établissement (l’appréciation porte sur le silence)',
    juger: (r, brut) => !r.preuves.some((p) => p.startsWith('ENTITY')) && !releveDe(brut).some((l) => l.declencheur === 'RELATION_EXPLICITE_DISTINCTE' && (l.issue === 'ecrit' || l.motif === 'referent_en_attente')) },
  { id: 'cible-referent-lieu', question: 'sensory2.1482', texte: 'Les thermes de Bagnères, à Bagnères-de-Bigorre : j’adore cet établissement.', attendu: 'relation LOVE/LIKE envers le lieu, écrite ou en attente de sa clarification',
    juger: (_r, brut) => releveDe(brut).some((l) => l.declencheur === 'RELATION_EXPLICITE_DISTINCTE' && (l.issue === 'ecrit' || l.motif === 'referent_en_attente')) },
  { id: 'cible-aspect-episode', question: 'podcast.0467', texte: 'L’épisode 12 de Transfert. J’ai adoré la voix de l’invitée.', attendu: 'aucune relation envers l’épisode',
    juger: (r, brut) => !r.preuves.some((p) => p.startsWith('ENTITY')) && !releveDe(brut).some((l) => l.declencheur === 'RELATION_EXPLICITE_DISTINCTE' && (l.issue === 'ecrit' || l.motif === 'referent_en_attente')) },
  { id: 'cible-aspect-oeuvre', question: 'comics.0422', texte: 'J’adore le dessin de Blacksad.', attendu: 'aucune relation envers Blacksad',
    juger: (r, brut) => !r.preuves.some((p) => p.startsWith('ENTITY')) && !releveDe(brut).some((l) => l.declencheur === 'OEUVRE_RESOLUE_APPRECIEE' && l.issue !== 'ecarte') },
  { id: 'lieu-autre', question: 'sensory2.1482', texte: 'Ma mère adore son spa à Biarritz.', attendu: 'rien (autre personne)', juger: RIEN },
  // sensory2.1487 #1 élément esthétique · #2 élément sensoriel (présence voulue).
  { id: 'lieu-ideal', question: 'sensory2.1487', texte: 'Beaucoup de bois clair, une grande baie vitrée, et l’odeur du feu de cheminée.', attendu: 'des éléments voulus : au moins un ESTHÉTIQUE et au moins un SENSORIEL', juger: (r) => r.preuves.some((p) => p.includes('aesthetic_universe')) && r.preuves.some((p) => p.includes('sensory_preference')) && !r.preuves.some((p) => p.includes('[rejet]')) },
  { id: 'lieu-ideal-nie', question: 'sensory2.1487', texte: 'Surtout pas de moquette ni de musique d’ambiance.', attendu: 'aucune présence voulue écrite (ce sont des refus)', juger: (r) => !r.preuves.some((p) => !p.includes('[rejet]')) },
  // ── Contrat dédié food2.0882A (envie culinaire) ──────────────────────────────────────────────
  { id: 'envie', question: 'food2.0882A', texte: 'J’ai très envie de ramen tonkotsu en ce moment.', attendu: 'une envie, à proposer au Carnet (rien ajouté d’office)', juger: (r, brut) => (brut as { envie?: { ecrite: boolean } }).envie?.ecrite === true },
  { id: 'pas-envie', question: 'food2.0882A', texte: 'Rien de particulier, je mange de tout.', attendu: 'aucune envie', juger: (_r, brut) => (brut as { envie?: { ecrite: boolean } }).envie?.ecrite !== true },
];

const resultats: { id: string; question: string; texte: string; attendu: string; observe: unknown; conforme: boolean; erreur?: string; [k: string]: unknown }[] = [];
let n = 0;
for (const c of CAS) {
  const b = fausseBase();
  const userId = `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  try {
    brutModele = null; brutEnvie = null; const avantD = appelsModele, avantE = appelsEnvie;
    const brut = await enregistrerReponseOuverte(b.client, { userId, questionId: c.question, texte: c.texte, acteId: `essai-${c.id}`, lecteur: lecteurObserve, lecteurEnvie: lecteurEnvieObserve } as never);
    const r = resume(b);
    const service = brut as { extractionEnAttente?: boolean; verbatimEcrit?: boolean; envie?: { ecrite: boolean; luParLeModele?: boolean } };
    // Ce que le SERVICE dit, tel quel.
    const statutService = { verbatimEcrit: service.verbatimEcrit === true, extractionEnAttente: service.extractionEnAttente === true, ...(service.envie ? { envie: service.envie } : {}) };
    // Ce que l'INSTRUMENTATION a vu, lecteur par lecteur.
    const instrumentation = { lecteur_destinations: { appels: appelsModele - avantD, rendu: brutModele !== null }, lecteur_envie: { appels: appelsEnvie - avantE, rendu: brutEnvie !== null } };
    // Une panne n'est jamais « rien à extraire ». Elle se lit : (1) dans le statut du service ; (2) dans un
    // lecteur ATTENDU qui n'a pas rendu. Le lecteur attendu dépend du contrat : celui des destinations pour
    // l'onglet 17 ; celui de l'envie pour food2.0882A, SAUF absence d'envie décidée sans modèle (luParLeModele=false),
    // qui est un traitement légitime et doit alors n'avoir fait AUCUN appel.
    const estEnvie = c.question === 'food2.0882A';
    const lecteurManquant = estEnvie
      ? (service.envie?.luParLeModele === true ? !(instrumentation.lecteur_envie.appels === 1 && instrumentation.lecteur_envie.rendu) : instrumentation.lecteur_envie.appels !== 0 || !service.envie)
      : !(instrumentation.lecteur_destinations.appels === 1 && instrumentation.lecteur_destinations.rendu);
    const panne = statutService.extractionEnAttente || !statutService.verbatimEcrit || lecteurManquant;
    const conforme = !panne && c.juger(r, brut);
    resultats.push({ id: c.id, question: c.question, texte: c.texte, attendu: c.attendu, observe: { ...r, releve: (brut as { destinations?: { releve: unknown } }).destinations?.releve }, statut_du_service: statutService, instrumentation, panne, rendu_par_le_modele: estEnvie ? brutEnvie : brutModele, conforme });
    console.log(`${conforme ? '✓' : '✗'} ${c.id.padEnd(22)} ${c.attendu}\n    observé : ${JSON.stringify(r)}${panne ? ` — PANNE OU LECTEUR NON OBSERVÉ (service ${JSON.stringify(statutService)}, instrumentation ${JSON.stringify(instrumentation)})` : ''}`);
  } catch (e) {
    resultats.push({ id: c.id, question: c.question, texte: c.texte, attendu: c.attendu, observe: null, conforme: false, erreur: e instanceof Error ? e.message.replace(/sk-ant-[A-Za-z0-9_-]+/g, '[clé masquée]') : 'erreur' });
    console.log(`✗ ${c.id} : erreur ${resultats.at(-1)!.erreur}`);
  }
}
// ═══ LA CIBLE D'UNE RELATION D'ENTITÉ, lue par l'extracteur des réponses libres et des récits (19 nov., 19h56) ═══
// « J'adore l'ambiance du Café de Flore » n'établit pas LOVE envers le café ; « J'aimerais découvrir la
// cuisine du Japon » n'établit pas l'envie d'aller au Japon. Vrai modèle, puis vérification par les mots.
{
  const { buildFromFreeText } = await import('../../src/lib/knowledge-write/extract-free-text.ts');
  const { accountAbout, asUserId } = await import('../../src/lib/knowledge/identity.ts');
  const proprietaire = asUserId('00000000-0000-4000-8000-0000000000c1');
  const casCible: { id: string; texte: string; label: RegExp; relation: string; attendu: 'ecrite' | 'absente' }[] = [
    { id: 'cible-recit-aspect-lieu', texte: 'J’adore l’ambiance du Café de Flore le matin.', label: /flore/i, relation: 'LOVE', attendu: 'absente' },
    { id: 'cible-recit-referent-marque', texte: 'J’adore Patagonia, j’ai presque tout chez eux.', label: /patagonia/i, relation: 'LOVE', attendu: 'ecrite' },
    { id: 'cible-recit-aspect-destination', texte: 'J’aimerais découvrir la cuisine du Japon.', label: /japon/i, relation: 'WANT_TO_VISIT', attendu: 'absente' },
    { id: 'cible-recit-referent-destination', texte: 'J’aimerais vraiment aller au Japon un jour.', label: /japon/i, relation: 'WANT_TO_VISIT', attendu: 'ecrite' },
    { id: 'cible-recit-aspect-auteur', texte: 'J’adore les couvertures des livres d’Annie Ernaux.', label: /ernaux/i, relation: 'LOVE', attendu: 'absente' },
  ];
  for (const c of casCible) {
    try {
      const r = await buildFromFreeText({ ownerId: proprietaire, about: accountAbout(proprietaire), rawText: c.texte, fieldContext: 'Raconte ce que tu veux de toi.', timestamp: new Date().toISOString() });
      const ecrite = r.evidences.some((e) => (e as { target_family?: string }).target_family === 'ENTITY' && c.label.test(String((e as { entityLabel?: string }).entityLabel ?? '')) && (e as { relation?: string }).relation === c.relation);
      const toutes = r.evidences.filter((e) => (e as { target_family?: string }).target_family === 'ENTITY').map((e) => `${(e as { entityLabel?: string }).entityLabel}:${(e as { relation?: string }).relation}`);
      const conforme = c.attendu === 'ecrite' ? ecrite : !r.evidences.some((e) => (e as { target_family?: string }).target_family === 'ENTITY' && c.label.test(String((e as { entityLabel?: string }).entityLabel ?? '')));
      resultats.push({ id: c.id, question: 'récit', texte: c.texte, attendu: `${c.relation} ${c.attendu}`, observe: { entites: toutes, ouvertes: r.openKnowledge.map((o) => `${o.subjectLabel} (${o.relation})`) } as never, conforme });
      console.log(`${conforme ? '✓' : '✗'} ${c.id.padEnd(30)} ${c.relation} ${c.attendu}\n    observé : ${JSON.stringify({ entites: toutes })}`);
    } catch (e) {
      resultats.push({ id: c.id, question: 'récit', texte: c.texte, attendu: c.attendu, observe: null, conforme: false, erreur: e instanceof Error ? e.message.replace(/sk-ant-[A-Za-z0-9_-]+/g, '[clé masquée]') : 'erreur' });
      console.log(`✗ ${c.id} : erreur ${resultats.at(-1)!.erreur}`);
    }
  }
}
// ═══ D1 — LA QUALIFICATION DES IDÉES PAR LE VRAI MODÈLE (décision du 19 nov.) ═══
// Le modèle reçoit des idées FICTIVES et la taxonomie publique — jamais un refus. La comparaison aux
// garde-fous se fait ensuite ici, côté serveur. Attendus (corrigés le 20 nov. : l'ancien commentaire
// annonçait un refus HARD du cuir que le semis ne contenait pas) :
//   · refus SOFT CHS-01 « pas de chaussures » → les baskets RÉTROGRADÉES ;
//   · refus HARD fragrance2.1152 « Cuir » (famille olfactive évitée) → le parfum aux notes de cuir ÉCARTÉ ;
//   · ce refus porte sur le parfum : le portefeuille en cuir reste COMPATIBLE (le domaine borne le refus) ;
//   · le livre de cuisine compatible.
{
  const { appliquerGardeFous } = await import('../../src/lib/recommendations/garde-fous-discovery.ts');
  const { qualificateurParModele } = await import('../../src/lib/recommendations/qualifier-idees.ts');
  const { gardeFouDe } = await import('../../src/lib/recommendations/garde-fous-discovery.ts');
  const refus = [gardeFouDe('CHS-01', 'Je préfère qu’on ne m’offre pas de chaussures'), gardeFouDe('fragrance2.1152', 'Cuir')].filter((g): g is NonNullable<typeof g> => g !== null);
  if (refus.length !== 2 || refus[1].contrainte !== 'HARD') throw new Error('garde-fous CHS-01 (SOFT) et fragrance2.1152 « Cuir » (HARD) introuvables dans la matrice');
  const idees = [
    { title: 'Une paire de baskets en toile', justification: 'Des baskets légères pour l’été.', canal: 'cadeau' },
    { title: 'Un livre de cuisine japonaise', justification: 'Un beau livre de recettes.', canal: 'cadeau' },
    { title: 'Un portefeuille en cuir pleine fleur', justification: 'Un portefeuille en cuir tanné végétal.', canal: 'cadeau' },
    { title: 'Un parfum boisé aux notes de cuir', justification: 'Une eau de parfum aux accords cuir et bouleau.', canal: 'cadeau' },
  ];
  try {
    const r = await appliquerGardeFous(idees, refus, qualificateurParModele);
    const verdict = Object.fromEntries(r.gardees.map((i) => [i.title, i.compatibilite]));
    const ecartees = idees.map((i) => i.title).filter((t) => !(t in verdict));
    const conforme = verdict['Une paire de baskets en toile'] === 'retrogradee' && verdict['Un livre de cuisine japonaise'] === 'compatible_verifiee'
      && ecartees.includes('Un parfum boisé aux notes de cuir') && verdict['Un portefeuille en cuir pleine fleur'] === 'compatible_verifiee';
    resultats.push({ id: 'D1-qualification', question: 'garde-fous', texte: idees.map((i) => i.title).join(' · '), attendu: 'baskets rétrogradées (SOFT) ; parfum cuir écarté (HARD) ; portefeuille en cuir et livre compatibles', observe: { verdict, ecartees, bilan: r.bilan } as never, conforme });
    console.log(`${conforme ? '✓' : '✗'} D1-qualification      baskets rétrogradées · parfum cuir écarté · portefeuille et livre compatibles\n    observé : ${JSON.stringify({ verdict, ecartees })}`);
  } catch (e) {
    resultats.push({ id: 'D1-qualification', question: 'garde-fous', texte: '', attendu: 'qualification', observe: null, conforme: false, erreur: e instanceof Error ? e.message.replace(/sk-ant-[A-Za-z0-9_-]+/g, '[clé masquée]') : 'erreur' });
    console.log(`✗ D1-qualification : erreur ${resultats.at(-1)!.erreur}`);
  }
}

const ok = resultats.filter((r) => r.conforme).length;
const rapport = JSON.stringify({
  date: new Date().toISOString(), commit: COMMIT, modifications_non_commitees_dans_src: MODIFIE, version_du_lecteur: VERSION_LECTURE,
  modeles: { destinations: MODELE_DESTINATIONS, extraction_libre: MODELE_EXTRACTION_LIBRE, qualification: MODELE_QUALIFICATION },
  cas: resultats.length, conformes: ok, echecs: resultats.filter((r) => !r.conforme).map((r) => r.id),
  note: 'Vrai modèle, données fictives, base en mémoire. Aucune clé ni en-tête dans ce fichier.', resultats,
}, null, 1);
try { writeFileSync('docs/discovery/essai-extracteur-reel.json', rapport); }
catch (e) { console.error(`ÉCHEC — rapport non écrit : ${e instanceof Error ? e.message : 'erreur'}`); process.exit(3); }
console.log(`\n${ok}/${resultats.length} conformes. Rapport : docs/discovery/essai-extracteur-reel.json`);
process.exit(ok === resultats.length ? 0 : 1);
