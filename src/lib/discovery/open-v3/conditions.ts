// LES CONDITIONS D'OUVERTURE — ce qui décide si Candice a le droit de poser une question.
//
// LE PRINCIPE, ET IL N'EST PAS NÉGOCIABLE : une condition qu'on ne sait pas lire ferme la
// question. Jamais l'inverse.
//
// Une question Discovery n'est pas une question de questionnaire : elle arrive seule, au
// milieu d'autre chose, et elle suppose un terrain. « Quelle céramique t'attire ? » posée à
// quelqu'un qui n'a jamais parlé de céramique n'est pas une question maladroite, c'est une
// question qui ment : elle affirme que Candice a compris quelque chose qu'elle n'a pas
// compris. Ouvrir par défaut, c'est transformer 2 224 questions en interrogatoire.
//
// Le référentiel écrit ses conditions en FRANÇAIS, avec quelques expressions entre
// accents graves. Sur 2 224 conditions, 72 expressions machine distinctes et près de mille
// formulations en prose. Prétendre toutes les interpréter serait inventer ; les ignorer
// serait tout ouvrir. Ce module reconnaît un vocabulaire EXPLICITE et rend `indecidable`
// pour tout le reste — et `indecidable` ferme.
//
// Ce que ce fichier NE fait pas : deviner. Une clause inconnue n'est pas approximée vers la
// clause connue la plus proche. Elle est nommée telle quelle dans le rapport de couverture,
// pour qu'on sache exactement ce qui reste à écrire.

/** Ce que le moteur sait de la personne au moment de choisir une question. */
export interface EtatDiscovery {
  /** Tags du journal, forme « FAMILLE.chemin » → valeur consolidée. Lu, jamais supposé. */
  readonly tags: ReadonlyMap<string, string>;
  /** Domaines où la personne a demandé qu'on ne creuse plus. Un refus, pas une préférence. */
  readonly nePasCreuser: ReadonlySet<string>;
  /** Branches ouvertes par l'onboarding ou un texte libre. */
  readonly branchesOuvertes: ReadonlySet<string>;
  /** Niveau de profondeur atteint par branche : 'A' < 'B' < 'C'. Absent = pas encore ouvert. */
  readonly niveauParBranche: ReadonlyMap<string, 'A' | 'B' | 'C'>;
  /** Questions déjà posées — qu'elles aient reçu une réponse ou un passage. */
  readonly dejaPosees: ReadonlySet<string>;
  /** Attributs déjà connus, pour ne pas redemander ce que Candice sait. */
  readonly attributsConnus: ReadonlySet<string>;
  /** La personne ne boit pas : les questions alcool ne se posent jamais. */
  readonly sansAlcool: boolean;
  /** Contextes de vie que le moteur SAIT reconnaître (« achat concret », « voyage »…). */
  readonly contextesConnus: ReadonlySet<string>;
  /** Ceux qui sont en cours. Un contexte connu et absent d'ici est inactif ; un contexte
   *  ABSENT des deux est inconnu, et rend la condition indécidable. */
  readonly contextesActifs: ReadonlySet<string>;
  /**
   * Branches que la personne a EXPLICITEMENT choisi d'explorer, ou qu'elle a abordées
   * d'elle-même dans un texte libre. C'est la seule clé des questions marquées « ouverture
   * sur démarche explicite » : ni un score, ni un lien reçu dans une notification, ni une
   * réponse à une question fermée ne la tournent. Absent = aucune démarche connue.
   */
  readonly sujetsChoisis?: ReadonlySet<string>;
  /**
   * Le NOM qu'une condition donne à une branche (« Esthétique », « Animaux philosophie ») →
   * les identifiants de branche qu'il désigne. Dérivé de la banque (voir `branches.ts`).
   * Un nom ABSENT d'ici et inconnu de l'état n'est pas « fermé » : il est indécidable.
   */
  readonly aliasBranches?: ReadonlyMap<string, ReadonlySet<string>>;
}

export type Clause =
  | { readonly type: 'tag'; readonly chemin: string; readonly operateur: '=' | '!='; readonly valeur: string }
  | { readonly type: 'ne_pas_creuser'; readonly domaine: string }
  | { readonly type: 'interet'; readonly domaine: string }
  | { readonly type: 'branche_ouverte'; readonly branche: string }
  | { readonly type: 'niveau'; readonly niveau: 'A' | 'B' | 'C'; readonly branche: string }
  | { readonly type: 'information_manquante' }
  | { readonly type: 'score_suffisant' }
  | { readonly type: 'pas_si_sans_alcool' }
  | { readonly type: 'contexte'; readonly libelle: string }
  | { readonly type: 'prose'; readonly texte: string };

/** LES MARQUES DE SENSIBILITÉ DU RÉFÉRENTIEL. Il en écrit TROIS niveaux — « sensitivity:
 *  MOYENNE », « HIGH », « MAXIMALE » — plus des consignes en clair (« sous-branche
 *  sensible », « niveau S », « ne jamais ouvrir »). La première version de cette garde ne
 *  reconnaissait que HIGH : neuf questions MAXIMALE (santé, changement de vie) passaient
 *  pour ordinaires. Relevé le 18 nov. en affichant la marque de chaque question.
 *
 *  Une question qui porte l'une de ces marques ne s'ouvre JAMAIS par un score de
 *  pertinence. Ces questions existent, elles ne sont pas interdites ; si un jour un motif
 *  rendait leur condition « lisible », cette garde continuerait de les fermer, et c'est
 *  précisément pour ça qu'elle est séparée de la table des motifs.
 *
 *  MOYENNE : le référentiel pose la marque sans écrire la règle qui va avec (aucun des 19
 *  onglets ne la donne). Dans le doute elle ferme aussi, et les questions concernées sont
 *  listées dans les arbitrages ouverts : une règle qu'on n'a pas ne s'invente pas. */
const MARQUES_SENSIBLES = /sensitivity\s*:\s*(?:high|maximale|moyenne)|sous-branche sensible|niveau\s+s\b|ne jamais ouvrir/i;
const NIVEAU_SENSIBLE = /sensitivity\s*:\s*(high|maximale|moyenne)/i;

/** La marque posée par décision d'Estelle (18 nov.) sur la branche « causes » : la question
 *  est sensible, ET elle a un mode d'ouverture — la démarche explicite de la personne.
 *  Le texte est celui que la révision 2 écrit dans le référentiel ; ce qui suit « ║ » est
 *  la condition d'origine, qui continue de s'appliquer. */
const MARQUE_DEMARCHE = /OUVERTURE SUR DÉMARCHE EXPLICITE[^║]*║\s*/;

export interface ConditionAnalysee {
  /** Toutes les clauses, à plat, dans l'ordre du texte. La logique est dans `groupes`. */
  readonly clauses: readonly Clause[];
  /** Vraie seulement si TOUTES les clauses sont reconnues. */
  readonly lisible: boolean;
  /** Les fragments non reconnus, tels quels. De quoi écrire ce qui manque. */
  readonly inconnues: readonly string[];
  /** La condition contient une vraie alternative (un « OU » hors commentaire). */
  readonly contientDisjonction: boolean;
  /** Le référentiel marque cette question comme sensible : un score ne l'ouvre jamais. */
  readonly sensible: boolean;
  /** Niveau écrit par le référentiel, quand il en écrit un. */
  readonly niveauSensibilite?: 'moyenne' | 'high' | 'maximale';
  /** Sensible, mais ouvrable quand la personne a choisi d'explorer la branche. */
  readonly ouvertureSurDemarche: boolean;
  /**
   * LA FORME LOGIQUE. Un ET de groupes ; chaque groupe est un OU d'alternatives ; chaque
   * alternative est un ET de clauses. « A OU B ET C ; ET D » se lit (A OU (B ET C)) ET D :
   * le point-virgule sépare les conditions, et à l'intérieur d'une condition le ET lie plus
   * fort que le OU, comme partout.
   */
  readonly groupes: readonly (readonly (readonly Clause[])[])[];
}

const norme = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * LA FORME SOUS LAQUELLE UN NOM EST COMPARÉ : minuscules, sans accents. Partagée avec la
 * lecture de l'état — la première version retirait les accents d'un côté et pas de l'autre,
 * si bien que « Intérêt Céramique » ne retrouvait jamais l'intérêt « céramique » du journal.
 */
export const clef = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Les NOTES DE RÉDACTION accrochées à une condition par un tiret : « — PONT avec la branche
 * Animaux », « — ⭐ question signature », « — FACULTATIVE ». Elles renvoient à une autre
 * partie du référentiel ou qualifient la question ; elles ne conditionnent pas son ouverture.
 * La liste est FERMÉE : tout autre texte après un tiret reste dans le fragment, qui devient
 * alors illisible — et la question se ferme.
 */
const NOTE_DE_REDACTION = /\s*[—–-]\s*(?:ponts?\b[^—–]*|croise\b[^—–]*|⭐[^—–]*|question signature[^—–]*|facultative|tr[èe]s optionnelle|nouvelle branche[^—–]*|sensitivity\s*:\s*\w+)\s*$/i;
function sansNotes(frag: string): string {
  let avant = frag, apres = frag.replace(NOTE_DE_REDACTION, '');
  while (apres !== avant) { avant = apres; apres = apres.replace(NOTE_DE_REDACTION, ''); }
  return apres.trim();
}

// UN « OU » EST ÉVALUÉ COMME UN « OU » (décision d'Estelle, 18 nov.).
//    La première version lisait tout par ET, au motif que c'était plus restrictif. C'était
//    surtout faux : « intérêt établi OU préférence déjà exprimée » exigeait les deux, et la
//    question ne s'ouvrait à peu près jamais. Une question qui ne se pose pas alors que sa
//    condition est remplie est un défaut, même silencieux.
//    Ce qui ne change pas : UN SEUL fragment illisible, où qu'il soit, rend la condition
//    illisible et ferme la question — y compris dans une alternative qui « n'aurait pas
//    compté ». On ne s'appuie pas sur la moitié comprise d'une phrase mal comprise.

/** Table EXPLICITE des formes reconnues. Rien n'est reconnu qui ne soit ici. */
const MOTIFS: ReadonlyArray<{ re: RegExp; lire: (m: RegExpMatchArray) => Clause | null }> = [
  // ── Expressions machine, entre accents graves dans le référentiel ───────────
  {
    re: /^([A-Z_]+(?:\.[A-Za-z0-9_]+)+)\s*(!?=)\s*([A-Za-z0-9_{}]+)$/,
    lire: (m) => {
      const chemin = m[1];
      if (chemin.startsWith('DO_NOT_PROBE.')) {
        // `DO_NOT_PROBE.x != true` = « on peut creuser x ». La clause porte le domaine,
        // et l'évaluation regarde le refus — pas une valeur de tag.
        return { type: 'ne_pas_creuser', domaine: chemin.slice('DO_NOT_PROBE.'.length) };
      }
      // Une valeur entre accolades est un paramètre du moteur ({occasion}), pas une
      // constante : on ne peut pas la comparer ici, et on ne fait pas semblant.
      if (/\{.*\}/.test(m[3])) return null;
      return { type: 'tag', chemin, operateur: m[2] === '!=' ? '!=' : '=', valeur: m[3] };
    },
  },
  // ── Formulations en prose, récurrentes et mécaniques ────────────────────────
  { re: /^information manquante$/i, lire: () => ({ type: 'information_manquante' }) },
  // « connaissance correspondante manquante » : la même porte, dite autrement par le
  // référentiel dans ses conditions à alternatives.
  { re: /^connaissance correspondante manquante$/i, lire: () => ({ type: 'information_manquante' }) },
  { re: /^score de pertinence suffisant$/i, lire: () => ({ type: 'score_suffisant' }) },
  {
    re: /^ne jamais afficher les questions alcool si la personne ne boit pas$/i,
    lire: () => ({ type: 'pas_si_sans_alcool' }),
  },
  {
    re: /^int[ée]r[êe]t (.+?) s[ée]lectionn[ée]e? ou d[ée]tect[ée]e?$/i,
    lire: (m) => ({ type: 'interet', domaine: clef(m[1]) }),
  },
  {
    re: /^branche (.+?) ouverte(?: par le questionnaire initial ou un texte libre)?$/i,
    lire: (m) => ({ type: 'branche_ouverte', branche: clef(m[1]) }),
  },
  {
    re: /^niveau ([ABC])\s+(.+)$/i,
    lire: (m) => ({ type: 'niveau', niveau: m[1].toUpperCase() as 'A' | 'B' | 'C', branche: clef(m[2]) }),
  },
  // « AXE 1 — Comment j'aime être célébré — niveau B » : même porte de profondeur, écrite
  // dans l'autre sens. Le niveau est en fin de phrase, la branche devant.
  {
    re: /^(.+?)\s*[—-]\s*niveau ([ABC])$/i,
    lire: (m) => ({ type: 'niveau', niveau: m[2].toUpperCase() as 'A' | 'B' | 'C', branche: clef(m[1]) }),
  },
  // « Sous-branche Famille », « Axe Pratiquant » : une sous-partie ouverte, pas une branche
  // entière. Même mécanique, autre granularité — on garde le libellé tel quel.
  {
    re: /^(?:sous-branche|axe)\s+(.+)$/i,
    lire: (m) => ({ type: 'branche_ouverte', branche: clef(m[1]) }),
  },
  // « Achat concret », « Cuisine/gastronomie active », « Voyage, week-end ou hôtellerie
  // actifs » : un CONTEXTE de vie doit être en cours. Le libellé est conservé tel quel et
  // c'est le moteur qui dit s'il connaît ce contexte — un contexte INCONNU rend
  // `indecidable`, jamais « inactif » : affirmer qu'un contexte n'est pas en cours alors
  // qu'on ne sait pas ce qu'il désigne fermerait la question pour une mauvaise raison.
  {
    re: /^(.+?)\s+(?:actif|active|actifs|actives)$/i,
    lire: (m) => ({ type: 'contexte', libelle: clef(m[1]) }),
  },
  {
    re: /^achat concret$/i,
    lire: () => ({ type: 'contexte', libelle: 'achat concret' }),
  },
];

/** Lit UN fragment. `null` = non reconnu. */
function lireFragment(brut: string): { clause: Clause; inconnue?: string } | null {
  const frag = norme(brut).replace(/^(?:ET|OU)\s+/i, '')
    // « — produit par CRE-04 » : une note de provenance, pas une condition.
    .replace(/\s*[—-]\s*produit par\s+[A-Za-z0-9._-]+\s*$/i, '')
    .replace(/[.,]+$/, '').replace(/^\)|\($/g, '').trim();
  if (!frag) return null;
  return lireSujet(sansNotes(frag));
}
function lireSujet(frag: string): { clause: Clause; inconnue?: string } | null {
  if (!frag) return null;
  // Un fragment peut être une expression entre accents graves, seule ou enrobée.
  const atome = frag.match(/^`([^`]+)`$/);
  const sujet = atome ? atome[1] : frag.replace(/`/g, '');
  for (const { re, lire } of MOTIFS) {
    const m = sujet.match(re);
    if (m) {
      const lu = lire(m);
      if (lu) return { clause: lu };
      break;
    }
  }
  return { clause: { type: 'prose', texte: sujet }, inconnue: sujet };
}

/** Découpe une condition en groupes, alternatives et clauses. Ce qui n'est pas reconnu le reste. */
export function analyserCondition(texte: string): ConditionAnalysee {
  const complet = norme(texte);
  const sensible = MARQUES_SENSIBLES.test(complet);
  const niveau = complet.match(NIVEAU_SENSIBLE)?.[1]?.toLowerCase() as ConditionAnalysee['niveauSensibilite'];
  const ouvertureSurDemarche = MARQUE_DEMARCHE.test(complet);
  // La marque de démarche est une consigne, pas une clause : on la retire avant de lire la
  // condition d'origine, qui suit « ║ » et continue de s'appliquer.
  const nettoye = complet.replace(/^.*?OUVERTURE SUR DÉMARCHE EXPLICITE[^║]*║\s*/, '')
    .replace(/^Tags ENTRANTS\s*—\s*ouvrir si\s*/i, '');

  // Les parenthèses portent des commentaires de rédaction, pas de la logique. On les
  // retire AVANT le découpage : une parenthèse ouverte avant un « ; » laissait sinon une
  // fin de commentaire orpheline, comptée comme une clause inconnue. Le « OU » d'un
  // commentaire (« issu de l'onboarding OU d'une microquestion ») n'est pas une alternative.
  const sansCommentaires = nettoye.replace(/\([^)]*\)/g, ' ');
  const contientDisjonction = /\sOU\s/.test(sansCommentaires);

  const clauses: Clause[] = [];
  const inconnues: string[] = [];
  const groupes: Clause[][][] = [];
  for (const segment of sansCommentaires.split(/\s*;\s*/)) {
    const alternatives: Clause[][] = [];
    for (const alt of segment.split(/\s+OU\s+/)) {
      const conj: Clause[] = [];
      for (const brut of alt.split(/\s+ET\s+/)) {
        const lu = lireFragment(brut);
        if (!lu) continue;
        conj.push(lu.clause); clauses.push(lu.clause);
        if (lu.inconnue) inconnues.push(lu.inconnue);
      }
      if (conj.length) alternatives.push(conj);
    }
    if (alternatives.length) groupes.push(alternatives);
  }
  return {
    clauses, groupes,
    // Une question sensible n'est « lisible » pour ce moteur que si elle a un mode
    // d'ouverture écrit : la fermer est une décision, pas un manque d'information.
    lisible: inconnues.length === 0 && (!sensible || ouvertureSurDemarche),
    inconnues, contientDisjonction, sensible, ouvertureSurDemarche,
    ...(niveau ? { niveauSensibilite: niveau } : {}),
  };
}

export type Verdict = 'ouvrir' | 'fermer' | 'indecidable';

/** Ce qu'on sait de la QUESTION au moment d'évaluer sa condition. */
export interface ContexteQuestion {
  readonly branche: string;
  /** Une seule information visée (forme historique, conservée). */
  readonly attribut?: string;
  /** Les informations visées, sous la forme « <domaine>.<attribut> ». */
  readonly attributs?: readonly string[];
  /** Une de ces informations est aussi écrite par une autre question : la savoir renseignée
   *  ne prouve pas que CETTE question a eu sa réponse. */
  readonly attributsPartages?: boolean;
}

/**
 * Évalue une condition analysée.
 *
 * `indecidable` dès qu'une clause n'est pas lisible — et l'appelant DOIT traiter
 * `indecidable` comme « ne pas poser ». Le type distingue les deux pour qu'on puisse
 * compter ce qui manque, pas pour qu'on puisse l'ignorer.
 */
export function evaluerCondition(
  cond: ConditionAnalysee,
  etat: EtatDiscovery,
  contexte: ContexteQuestion,
): Verdict {
  // La sensibilité est tranchée AVANT tout le reste, et rend « fermer » — pas
  // « indecidable ». Ce n'est pas une condition qu'on n'a pas su lire : c'est une condition
  // qu'on a lue, et qui dit non.
  if (cond.sensible) {
    // Seule exception : la question porte un mode d'ouverture ÉCRIT, et la personne a fait
    // la démarche pour CETTE branche. Rien d'autre ne tourne la clé.
    if (!cond.ouvertureSurDemarche) return 'fermer';
    if (!etat.sujetsChoisis?.has(contexte.branche)) return 'fermer';
  }
  if (!cond.lisible) return 'indecidable';

  // (G1) ET (G2) ET … — chaque groupe est (A1) OU (A2) OU … — chaque alternative un ET.
  let groupeIndecidable = false;
  for (const groupe of cond.groupes) {
    let verdictGroupe: Verdict = 'fermer';
    for (const alternative of groupe) {
      const v = evaluerConjonction(alternative, etat, contexte);
      if (v === 'ouvrir') { verdictGroupe = 'ouvrir'; break; }
      if (v === 'indecidable') verdictGroupe = 'indecidable';
    }
    if (verdictGroupe === 'fermer') return 'fermer';
    if (verdictGroupe === 'indecidable') groupeIndecidable = true;
  }
  return groupeIndecidable ? 'indecidable' : 'ouvrir';
}

/** Un ET de clauses. Une clause fausse ferme ; sinon une clause indécidable l'emporte. */
function evaluerConjonction(
  clauses: readonly Clause[], etat: EtatDiscovery,
  contexte: ContexteQuestion,
): Verdict {
  let indecidable = false;
  for (const c of clauses) {
    const v = evaluerClause(c, etat, contexte);
    if (v === 'fermer') return 'fermer';
    if (v === 'indecidable') indecidable = true;
  }
  return indecidable ? 'indecidable' : 'ouvrir';
}

/** Les branches qu'un nom désigne : lui-même, et ce que la table d'alias lui associe. */
function designe(nom: string, etat: EtatDiscovery): string[] {
  return [nom, ...(etat.aliasBranches?.get(nom) ?? [])];
}

function evaluerClause(
  c: Clause, etat: EtatDiscovery,
  contexte: ContexteQuestion,
): Verdict {
  switch (c.type) {
    case 'prose':
      return 'indecidable';
    case 'tag': {
      const v = etat.tags.get(c.chemin);
      const egal = v !== undefined && v === c.valeur;
      return (c.operateur === '=' ? egal : !egal) ? 'ouvrir' : 'fermer';
    }
    case 'ne_pas_creuser':
      return etat.nePasCreuser.has(c.domaine) ? 'fermer' : 'ouvrir';
    case 'interet':
      // Un intérêt doit être POSITIF et écrit. Son absence n'est pas un « non » :
      // c'est l'absence de terrain, et on ne pose pas une question sans terrain.
      return etat.tags.get(`INTEREST.${c.domaine}`) === 'positive' ? 'ouvrir' : 'fermer';
    case 'branche_ouverte': {
      const ids = designe(c.branche, etat);
      if (ids.some((b) => etat.branchesOuvertes.has(b))) return 'ouvrir';
      // Un nom que ni la banque ni l'état ne connaissent : on ne sait pas de quelle branche
      // il parle. Ce n'est pas « fermée », c'est « non résolu » — et compté comme tel.
      return etat.aliasBranches && !etat.aliasBranches.has(c.branche) ? 'indecidable' : 'fermer';
    }
    case 'niveau': {
      const ordre = { A: 1, B: 2, C: 3 } as const;
      const ids = designe(c.branche, etat);
      // Le nom peut désigner deux générations de la même branche (« Cinéma » → cinema,
      // cinema2) : la profondeur atteinte dans l'une vaut pour le nom.
      const atteint = Math.max(0, ...ids.map((b) => ordre[etat.niveauParBranche.get(b) ?? ('' as 'A')] ?? 0));
      if (atteint >= ordre[c.niveau]) return 'ouvrir';
      return etat.aliasBranches && !etat.aliasBranches.has(c.branche) && atteint === 0 ? 'indecidable' : 'fermer';
    }
    case 'information_manquante':
      // Sans attribut nommé, on ne peut pas savoir si l'information manque : on ne
      // suppose pas qu'elle manque pour avoir le droit de poser la question.
      const cles = contexte.attributs ?? (contexte.attribut ? [contexte.attribut] : []);
      if (cles.length === 0) return 'indecidable';
      // Chemin partagé : sa présence ne dit rien de CETTE question. Elle n'est pas « déjà
      // posée » (la sélection l'aurait écartée avant d'arriver ici) : l'information manque.
      if (contexte.attributsPartages) return 'ouvrir';
      // Fermée seulement si TOUT ce qu'elle cherche est déjà connu.
      return cles.every((k) => etat.attributsConnus.has(k)) ? 'fermer' : 'ouvrir';
    case 'score_suffisant':
      // Le score de pertinence est calculé par le moteur, pas par la condition.
      // Il est donc neutre ici : c'est la sélection qui tranche, et elle en répond.
      return 'ouvrir';
    case 'pas_si_sans_alcool':
      return etat.sansAlcool ? 'fermer' : 'ouvrir';
    case 'contexte':
      // Un contexte que le moteur ne connaît pas ne vaut PAS « inactif » : on ne ferme
      // pas une question au motif d'une condition qu'on n'a pas comprise, et on ne
      // l'ouvre pas non plus. Indécidable, donc non posée, et comptée comme telle.
      if (!etat.contextesConnus.has(c.libelle)) return 'indecidable';
      return etat.contextesActifs.has(c.libelle) ? 'ouvrir' : 'fermer';
  }
}

/** Vrai seulement si la question peut être posée. `indecidable` vaut NON. */
export function peutPoser(
  cond: ConditionAnalysee, etat: EtatDiscovery,
  contexte: ContexteQuestion,
): boolean {
  return evaluerCondition(cond, etat, contexte) === 'ouvrir';
}
