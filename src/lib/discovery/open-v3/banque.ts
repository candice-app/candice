// LA BANQUE DISCOVERY OPEN V3 — lecture typée, validée au chargement, côté serveur seulement.
//
// D'OÙ ELLE VIENT. `scripts/discovery/importer-open-v3.py` la produit depuis le classeur
// revu, dont il vérifie le SHA-256 avant de lire une seule cellule. Le classeur n'est JAMAIS
// lu à l'exécution : une cellule modifiée à la main changerait ce que Candice demande et ce
// qu'elle écrit dans le journal, sans revue, sans diff et sans test. Le chemin du classeur
// vers la banque passe par un script, un commit et une relecture — ou il ne passe pas.
//
// CÔTÉ SERVEUR SEULEMENT, et la garde est explicite plutôt que documentaire. La banque pèse
// plus de 4 Mo : la laisser filer dans un bundle navigateur ferait payer ce poids à chaque
// visiteur, et surtout exposerait l'intégralité des contrats d'écriture — la carte de ce que
// Candice déduit de chaque réponse — à quiconque ouvre les outils de développement.
//
// VALIDÉE AU CHARGEMENT, pas à l'usage. Une banque mal formée doit tomber au démarrage, pas
// au milieu du parcours d'une personne. Et elle tombe BRUYAMMENT : un `catch` qui rendrait
// une banque vide donnerait une Candice qui ne pose plus aucune question, sans que rien ne
// le dise.
// LUE SUR LE DISQUE, PAS IMPORTÉE. Un `import` de JSON serait inliné dans le bundle : le
// poids et les contrats partiraient avec, et rien n'empêcherait un jour un composant client
// de tirer ce module par mégarde. Une lecture de fichier ne peut PAS être inlinée — la
// garantie est structurelle, pas une convention qu'on espère voir respectée.
//
// `next.config` doit tracer ces deux fichiers (outputFileTracingIncludes) pour qu'ils
// partent au déploiement. S'ils manquent, on le saura au démarrage, par l'erreur ci-dessous,
// et pas par une Candice silencieusement muette.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

if (typeof window !== 'undefined') {
  throw new Error(
    "banque Discovery : chargée côté NAVIGATEUR. Elle pèse plus de 4 Mo et contient tous les " +
    "contrats d'écriture du journal. Elle ne doit être importée que par du code serveur.",
  );
}

const DOSSIER = join(process.cwd(), 'src/lib/discovery/open-v3');

function lireJson(nom: string): unknown {
  const chemin = join(DOSSIER, nom);
  try {
    return JSON.parse(readFileSync(chemin, 'utf8'));
  } catch (e) {
    // BRUYANT. Une banque absente ou illisible rendrait une Candice qui ne pose plus aucune
    // question — un silence qu'aucun écran ne signale. Mieux vaut ne pas démarrer.
    throw new Error(
      `banque Discovery : ${chemin} illisible (${e instanceof Error ? e.message : String(e)}). ` +
      "Relance scripts/discovery/importer-open-v3.py --ecrire, et vérifie le traçage de ces " +
      "fichiers dans next.config.",
    );
  }
}

const brut = lireJson('banque.json');
const manifesteBrut = lireJson('manifeste.json');

/** Forme d'une question telle qu'elle est posée. */
export type FormeQuestion = 'single' | 'multi' | 'open' | 'ranked_multi';

/** Ce qu'une option fait de la réponse. */
export type VoieOption =
  | 'HSG_EVIDENCE'      // écrit une preuve dans le journal
  | 'FACT'              // écrit un fait
  | 'OPEN_KNOWLEDGE'    // conserve le verbatim, extrait sous condition
  | 'ACTION_PARAMETER'  // agit sur l'interface (ouvrir un champ libre…), n'écrit rien
  | 'DISCOVERY_STATE'   // note un état du parcours, n'écrit rien dans le journal
  | 'NO_EMISSION';      // n'écrit rien, et c'est le contrat

export interface OptionV3 {
  readonly rang: string | null;
  readonly libelle: string;
  readonly voie: VoieOption;
  readonly famille?: string;
  readonly domaine?: string;
  readonly attribut?: string;
  /** Soit `{__scalaire__: …}`, soit une table clé→valeur. Les deux formes existent dans le
   *  référentiel et sont toutes deux légitimes ; l'import refuse les formes mixtes. */
  readonly valeur?: Record<string, unknown>;
  readonly severite?: 'SOFT' | 'HARD';
  readonly polarite?: string;
  readonly stabilite?: string;
  /** Conservé pour les seules voies ouvertes : là, un modèle lit la réponse, et ce champ
   *  est la barrière qui l'empêche d'inventer. Ailleurs le contrat est déterministe. */
  readonly inferences_interdites?: string;
  readonly condition_emission?: string;
}

export interface QuestionV3 {
  readonly id: string;
  readonly enonce: string;
  readonly forme: FormeQuestion;
  readonly facultative?: boolean;
  readonly branche: string;
  readonly niveau: string | null;
  /** Condition d'ouverture. Parfois une expression de tags, parfois de la prose : c'est
   *  l'évaluateur de déclencheurs qui tranche, et il refuse ce qu'il ne sait pas lire. */
  readonly condition_emission: string;
  readonly inferences_interdites?: string;
  readonly options: readonly OptionV3[];
}

export interface ManifesteV3 {
  readonly genere_par: string;
  readonly genere_le: string;
  readonly classeur: string;
  readonly sha256_classeur: string;
  readonly questions_actives: number;
  readonly questions_en_arbitrage: number;
  readonly questions_retirees: number;
  readonly options_totales: number;
  /** Attributs portés par plusieurs familles. GUARDRAIL arme un veto, PREFERENCE non :
   *  deux options d'une même question peuvent donc avoir des effets opposés. En attente
   *  d'arbitrage — la banque les porte tels quels, sans trancher à la place d'Estelle. */
  readonly attributs_multi_familles: Readonly<Record<string, readonly string[]>>;
}

const FORMES = new Set<string>(['single', 'multi', 'open', 'ranked_multi']);
const VOIES = new Set<string>([
  'HSG_EVIDENCE', 'FACT', 'OPEN_KNOWLEDGE', 'ACTION_PARAMETER', 'DISCOVERY_STATE', 'NO_EMISSION',
]);

export class BanqueInvalideError extends Error {}

function valider(qs: readonly unknown[]): readonly QuestionV3[] {
  const vues = new Set<string>();
  qs.forEach((q, i) => {
    const o = q as Partial<QuestionV3>;
    const ou = `question #${i}${o.id ? ` (${o.id})` : ''}`;
    if (!o.id) throw new BanqueInvalideError(`${ou} : identifiant manquant`);
    if (vues.has(o.id)) throw new BanqueInvalideError(`${ou} : identifiant en double — une réponse ne saurait plus à quelle question elle appartient`);
    vues.add(o.id);
    if (!o.enonce) throw new BanqueInvalideError(`${ou} : énoncé vide — on ne pose pas une question sans question`);
    if (!o.forme || !FORMES.has(o.forme)) throw new BanqueInvalideError(`${ou} : forme inconnue (${String(o.forme)})`);
    if (!o.condition_emission) throw new BanqueInvalideError(`${ou} : aucune condition d'ouverture — une question sans condition se poserait à tout le monde, tout le temps`);
    if (!Array.isArray(o.options)) throw new BanqueInvalideError(`${ou} : options absentes`);
    if (o.forme !== 'open' && o.options.length === 0) throw new BanqueInvalideError(`${ou} : question fermée sans aucune option`);
    // UNE QUESTION OUVERTE SANS BARRIÈRE N'ENTRE PAS DANS LA BANQUE. Sur une question fermée,
    // l'option choisie dit exactement quoi écrire. Sur une question ouverte, c'est un MODÈLE
    // qui lit, et `inferences_interdites` est la seule chose qui l'empêche de conclure au-delà
    // des mots — de transformer une phrase sur ce qu'on aime manger en allergie ou en régime
    // religieux. L'import l'écarte déjà ; cette garde est la seconde couche, parce qu'une
    // banque peut être regénérée par un script plus permissif.
    if (o.forme === 'open'
        && !o.inferences_interdites
        && !o.options.some((opt) => opt.inferences_interdites)) {
      throw new BanqueInvalideError(
        `${ou} : question OUVERTE sans inférences interdites. Un modèle lirait la réponse sans ` +
        `barrière : le contrat d'extraction doit être écrit avant qu'elle soit posée.`);
    }
    o.options.forEach((opt, j) => {
      if (!VOIES.has(opt.voie)) throw new BanqueInvalideError(`${ou}, option #${j} : voie inconnue (${String(opt.voie)})`);
      if (opt.voie === 'HSG_EVIDENCE' && !opt.famille) {
        throw new BanqueInvalideError(`${ou}, option #${j} : HSG_EVIDENCE sans famille — on ne sait pas où écrire la preuve`);
      }
    });
  });
  return qs as readonly QuestionV3[];
}

/** Les 2225 questions prêtes à être posées. Les 68 en arbitrage et les 114 retirées ne sont
 *  PAS ici : une question dont le contrat n'est pas tranché ne se pose pas « en attendant ». */
export const BANQUE: readonly QuestionV3[] = valider(brut as readonly unknown[]);

export const MANIFESTE = manifesteBrut as unknown as ManifesteV3;

const PAR_ID = new Map(BANQUE.map((q) => [q.id, q]));
const PAR_BRANCHE = (() => {
  const m = new Map<string, QuestionV3[]>();
  for (const q of BANQUE) (m.get(q.branche) ?? m.set(q.branche, []).get(q.branche)!).push(q);
  return m as ReadonlyMap<string, readonly QuestionV3[]>;
})();

/** `undefined` si l'identifiant n'existe pas — jamais une question approchante. */
export function question(id: string): QuestionV3 | undefined {
  return PAR_ID.get(id);
}

/** Les questions d'une branche, dans l'ordre du référentiel. Vide si la branche est inconnue :
 *  rendre les questions d'une autre branche serait pire que n'en rendre aucune. */
export function branche(nom: string): readonly QuestionV3[] {
  return PAR_BRANCHE.get(nom) ?? [];
}

export function branches(): readonly string[] {
  return [...PAR_BRANCHE.keys()].sort();
}
