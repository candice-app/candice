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
/** Les genres de préparation qu'une personne peut déclarer en cours. Chacun est NOMMÉ par le
 *  référentiel dans ses conditions (« achat concret », « sortie concrète », « cadeau en préparation »…). */
export const TYPES_DE_PROJET = ['achat', 'sejour', 'occasion', 'sortie', 'cadeau', 'apprentissage', 'attention', 'experience'] as const;
export type TypeDeProjet = (typeof TYPES_DE_PROJET)[number];
/** Phrase exacte du référentiel → libellé de contexte. Table FIGÉE : rien n'y entre par ressemblance. */
export const FRAGMENTS_DE_PROJET: Readonly<Record<string, string>> = {
  'Achat concret uniquement': 'achat concret', 'Uniquement pour un achat concret': 'achat concret',
  'Événement concret': 'occasion en cours', 'CONTEXT.celebration.current_occasion={occasion}': 'occasion en cours',
  'Sortie concrète': 'sortie en cours',
  'Cadeau concret': 'cadeau en cours', 'Cadeau en préparation': 'cadeau en cours',
  'Apprentissage concret': 'apprentissage en cours',
  'Attention concrète': 'attention en cours', 'Attention concrète en préparation': 'attention en cours',
  'Expérience préparée — donnée contextuelle': 'experience en cours',
};
export const PROJET_PAR_CONTEXTE: Readonly<Record<string, TypeDeProjet>> = {
  'achat concret': 'achat', 'sejour concret': 'sejour', 'occasion en cours': 'occasion', 'sortie en cours': 'sortie', 'cadeau en cours': 'cadeau',
  'apprentissage en cours': 'apprentissage', 'attention en cours': 'attention', 'experience en cours': 'experience',
};

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
  /**
   * Ce que la personne a RÉPONDU aux questions qui font le tri d'une sous-partie : question →
   * identités des options choisies (`cleOption`). Relu dans la progression, jamais supposé. Absent ou sans
   * entrée pour une question = pas de réponse connue.
   */
  readonly optionsChoisies?: ReadonlyMap<string, ReadonlySet<string>>;
  /**
   * LES PROJETS EN COURS, par domaine (décision d'Estelle du 18 nov., n° 4) : un achat ou un
   * séjour que la personne a elle-même saisi ou choisi, avec un début et une fin. C'est le
   * seul « objet, action ou occasion nommés » que le moteur connaisse. ABSENT = le moteur ne
   * sait pas lire les projets : les conditions qui en dépendent sont non résolues. Présent et
   * vide = aucun projet en cours : elles sont fausses.
   */
  readonly projets?: ReadonlyMap<string, ReadonlySet<TypeDeProjet>>;
  /** L'objet nommé du projet en cours le plus récent, par `<pool>|<genre>` : c'est lui qui remplit
   *  le paramètre d'un énoncé (« Pour {occasion}… »). */
  readonly objetsDeProjet?: ReadonlyMap<string, string>;
  /**
   * CE QUI OUVRE UNE SOUS-PARTIE dont le référentiel ne nomme pas la question de tri : la règle
   * écrite pour sa branche (table figée `correspondances.json`). `niveau_B_du_parent` : la
   * feuille Branches range les sous-branches parmi les questions de niveau B. `non_resolue` :
   * la règle existe en prose et n'a pas de forme exécutable — la condition reste non résolue.
   * Absent = l'appelant ne fournit pas la table (essais unitaires) : la sous-partie suit sa branche.
   */
  readonly reglesSousParties?: ReadonlyMap<string, { readonly regle: 'dependance' | 'niveau_B_du_parent' | 'non_resolue'; readonly parents: readonly string[] }>;
  /**
   * Questions dont la dépendance est tenue pour satisfaite par un SIGNAL explicite équivalent
   * (avoir choisi « Vin & spiritueux » vaut « vin sélectionné »). Table figée, voir
   * `ouvertures-explicites.json`. Aucune réponse n'est écrite à la place de la personne.
   */
  readonly questionsSignalees?: ReadonlySet<string>;
  /** Branches ouvertes pour leurs seules questions d'orientation (catégorie composite). */
  readonly orientationSeulement?: ReadonlySet<string>;
  /** Domaines dont la personne a dit qu'ils tiennent « très peu de place » aujourd'hui. Ce
   *  n'est ni un rejet ni un refus : leurs questions restent posables, après celles des autres. */
  readonly placeFaible?: ReadonlySet<string>;
  /** La dernière question à laquelle la personne a répondu (ou qu'elle a passée). Sert à ne
   *  pas enchaîner une question historique juste après celle qui la remplace. */
  readonly dernierePosee?: string;
}

export type Clause =
  | { readonly type: 'tag'; readonly chemin: string; readonly operateur: '=' | '!='; readonly valeur: string }
  | { readonly type: 'ne_pas_creuser'; readonly domaine: string }
  | { readonly type: 'interet'; readonly domaine: string }
  | { readonly type: 'branche_ouverte'; readonly branche: string; readonly sousPartie?: boolean }
  /** « Ouverture branche X (voir onglet Branches) » : la question qui ENTRE dans la branche. */
  | { readonly type: 'ouverture_branche'; readonly branche: string }
  | { readonly type: 'niveau'; readonly niveau: 'A' | 'B' | 'C'; readonly branche: string }
  | { readonly type: 'information_manquante' }
  | { readonly type: 'score_suffisant' }
  | { readonly type: 'pas_si_sans_alcool' }
  | { readonly type: 'contexte'; readonly libelle: string }
  | { readonly type: 'domaines_actifs'; readonly noms: readonly string[] }
  /** « Réponse à live.0475 : Festival | Spectacle de danse » : la personne a choisi l'une de ces
   *  options à cette question. N'apparaît que dans une LECTURE de condition (lectures.ts), jamais
   *  dans le référentiel. `cles` : l'identité des options, résolue contre la banque au chargement ;
   *  absente, la clause est indécidable. */
  | { readonly type: 'reponse'; readonly selecteur: string; readonly libelles: readonly string[]; readonly cles?: readonly string[] }
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
  /** Consignes de rédaction accrochées à une ouverture de branche. Rapportées, jamais évaluées. */
  readonly consignes?: string;
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
  // EN PREMIER : un libellé d'option peut finir comme un autre motif (« … actifs »).
  // « Réponse à live.0475 : Festival | Spectacle de danse ». Écrite par une LECTURE de condition
  // (lectures-de-conditions.json), jamais par le référentiel. Le séparateur des options est
  // « | » : ni « ou » ni « , », qui figurent dans des libellés.
  {
    re: /^r[ée]ponse à ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\s*:\s*(.+)$/i,
    lire: (m) => ({ type: 'reponse', selecteur: m[1], libelles: m[2].split(/\s*\|\s*/).map((x) => x.trim()).filter(Boolean) }),
  },
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
    lire: (m) => ({ type: 'branche_ouverte', branche: clef(m[1]), sousPartie: true }),
  },
  // « Cuisine/gastronomie active », « Voyage, week-end ou hôtellerie actifs » : une LISTE DE
  // DOMAINES dont l'un au moins doit être actif — c'est-à-dire choisi ou détecté chez la
  // personne, comme « Intérêt lecture sélectionné ou détecté ». La première version rangeait
  // ces phrases avec « Achat concret », parmi les contextes de vie inconnus du moteur : les
  // 30 questions de cuisine et les 19 de voyage restaient fermées pour quelqu'un qui avait
  // coché « Cuisine » et « Voyage » (relevé le 18 nov. en faisant tourner dix profils).
  // Un contexte de vie a un début et une fin (un achat, un séjour) ; un domaine actif n'en a
  // pas. Ce ne sont pas la même chose, et seul « Achat concret » reste un contexte.
  {
    re: /^(.+?)\s+(?:actif|active|actifs|actives)$/i,
    lire: (m) => ({ type: 'domaines_actifs', noms: m[1].split(/\s*,\s*|\s+ou\s+|\s*\/\s*/i).map(clef).filter(Boolean) }),
  },
  {
    re: /^achat concret$/i,
    lire: () => ({ type: 'contexte', libelle: 'achat concret' }),
  },
  // LES AUTRES PRÉPARATIONS QUE LE RÉFÉRENTIEL NOMME. Même règle que « achat concret » : la
  // question ne se pose que pour une préparation EN COURS, déclarée et nommée par la personne.
  // Correspondance EXACTE, phrase par phrase : un fragment qui ajoute une condition (« budget
  // engagé », « multi-dates », « artiste identifié »…) n'est pas lu ici et reste non résolu.
  ...Object.entries(FRAGMENTS_DE_PROJET).map(([texte, libelle]) => ({
    re: new RegExp(`^${texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    lire: () => ({ type: 'contexte' as const, libelle }),
  })),
  // « Niveau C, séjour concret » : le niveau C exigeant déjà un projet, la phrase demande
  // que ce projet soit un séjour.
  {
    re: /^(?:niveau c,\s*)?s[ée]jour concret$/i,
    lire: () => ({ type: 'contexte', libelle: 'sejour concret' }),
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
  // Les phrases de préparation en cours passent AVANT les motifs généraux : l'une d'elles a la
  // forme d'un tag (`CONTEXT.celebration.current_occasion={occasion}`) qu'aucun tag ne sait lire.
  const preparation = Object.entries(FRAGMENTS_DE_PROJET).find(([texte]) => texte.toLowerCase() === sujet.toLowerCase());
  if (preparation) return { clause: { type: 'contexte', libelle: preparation[1] } };
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
  // ── « OUVERTURE BRANCHE X (voir onglet Branches) — … ». La question qui entre dans une
  //    branche. Ce qui suit la parenthèse est une CONSIGNE DE RÉDACTION (« MERGE FINAL :
  //    remplace… », « NOUVELLE BRANCHE ⭐⭐⭐⭐ », « ne jamais ressembler à un questionnaire
  //    financier ») : elle est conservée telle quelle pour le rapport (`consignes`), et les
  //    marques de sensibilité qu'elle porte ont déjà été lues ci-dessus sur le texte entier.
  //    La règle d'ouverture elle-même est dans la feuille Branches (voir ouvertures.ts).
  const ouverture = nettoye.match(/^Ouverture branche\s+(.+?)\s*\(([^)]*)voir onglet Branches\)\s*(.*)$/i);
  if (ouverture) {
    // « Hôtellerie (distincte du voyage — voir onglet Branches) » : le nom est devant.
    const clause: Clause = { type: 'ouverture_branche', branche: clef(ouverture[1].replace(/\s*—\s*AXE\s.*$/i, '')) };
    const consignes = norme(ouverture[3].replace(/^[—.\s]+/, ''));
    return {
      clauses: [clause], groupes: [[[clause]]], lisible: !sensible || ouvertureSurDemarche,
      inconnues: [], contientDisjonction: false, sensible, ouvertureSurDemarche,
      ...(niveau ? { niveauSensibilite: niveau } : {}), ...(consignes ? { consignes } : {}),
    };
  }
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
  /** Le domaine commun aux générations de la branche (`poolDe`) : un projet vaut pour lui. */
  readonly pool?: string;
  /** La réponse dont cette question dépend, quand le référentiel en écrit une (`dependances.ts`). */
  readonly dependance?: { readonly selecteur: string; readonly cles: readonly string[]; readonly resolu: boolean; readonly signalee?: boolean };
  /** La question présume que la personne boit de l'alcool (table figée). */
  readonly presumeAlcool?: boolean;
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
    case 'reponse': {
      // Options non résolues contre la banque : on ne sait pas ce qu'il faut avoir répondu.
      if (!c.cles || c.cles.length === 0) return 'indecidable';
      // Pas de réponse à la question source : la condition est connue, et fausse pour l'instant.
      const choisies = etat.optionsChoisies?.get(c.selecteur);
      if (!choisies) return 'fermer';
      return c.cles.some((k) => choisies.has(k)) ? 'ouvrir' : 'fermer';
    }
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
      //
      // Le NOM qu'écrit la condition (« art, musées et expositions ») n'est pas celui sous
      // lequel l'intérêt est écrit au journal (« art ») : comparés tels quels, ils ne se
      // retrouvaient que par chance (« lecture »). Le nom désigne une branche — celle des
      // questions qui l'emploient — et un intérêt choisi ou détecté OUVRE cette branche :
      // c'est exactement ce que la clause demande.
      if (etat.tags.get(`INTEREST.${c.domaine}`) === 'positive') return 'ouvrir';
      return designe(c.domaine, etat).some((b) => etat.branchesOuvertes.has(b)) ? 'ouvrir' : 'fermer';
    case 'domaines_actifs': {
      // UN des domaines nommés suffit. Un nom que rien ne permet de rattacher à une branche
      // ne vaut pas « inactif » : s'il en reste un et qu'aucun autre n'ouvre, on ne sait pas.
      let inconnu = false;
      for (const nom of c.noms) {
        if (etat.tags.get(`INTEREST.${nom}`) === 'positive') return 'ouvrir';
        if (designe(nom, etat).some((b) => etat.branchesOuvertes.has(b))) return 'ouvrir';
        if (!etat.aliasBranches?.has(nom)) inconnu = true;
      }
      return inconnu ? 'indecidable' : 'fermer';
    }
    case 'branche_ouverte': {
      // UNE SOUS-PARTIE QUI DÉPEND D'UNE RÉPONSE ne s'ouvre que sur cette réponse. Sans
      // rapprochement entre le nom et une option, on ne sait pas : non résolu. Sans réponse
      // à la question qui fait le tri, la condition est connue et fausse.
      if (c.sousPartie && contexte.dependance) {
        const d = contexte.dependance;
        // Un signal explicite équivalent à la réponse attendue (table figée) ouvre la sous-partie.
        if (d.signalee) return 'ouvrir';
        if (!d.resolu) return 'indecidable';
        const choisies = etat.optionsChoisies?.get(d.selecteur);
        if (!choisies) return 'fermer';
        return d.cles.some((o) => choisies.has(o)) ? 'ouvrir' : 'fermer';
      }
      const ids = designe(c.branche, etat);
      // UNE SOUS-PARTIE SANS QUESTION DE TRI suit la règle écrite pour sa branche.
      if (c.sousPartie && etat.reglesSousParties) {
        const sp = etat.reglesSousParties.get(c.branche);
        // Inconnue de la table, règle en prose, ou dépendance annoncée et introuvable : non résolu.
        if (!sp || sp.regle !== 'niveau_B_du_parent') return 'indecidable';
        const ordre = { A: 1, B: 2, C: 3 } as const;
        const atteint = Math.max(0, ...sp.parents.map((b) => ordre[etat.niveauParBranche.get(b) ?? ('' as 'A')] ?? 0));
        return atteint >= ordre.B ? 'ouvrir' : 'fermer';
      }
      if (ids.some((b) => etat.branchesOuvertes.has(b))) return 'ouvrir';
      // Un nom que ni la banque ni l'état ne connaissent : on ne sait pas de quelle branche
      // il parle. Ce n'est pas « fermée », c'est « non résolu » — et compté comme tel.
      return etat.aliasBranches && !etat.aliasBranches.has(c.branche) ? 'indecidable' : 'fermer';
    }
    case 'ouverture_branche': {
      // LA QUESTION QUI ENTRE DANS UNE BRANCHE se pose quand la branche est ouverte au sens du
      // moteur : son domaine a été choisi ou détecté chez la personne, ou elle a demandé à
      // explorer le sujet. C'est la part EXÉCUTABLE de la règle écrite (feuille Branches :
      // « X sélectionné · X cité spontanément… ») ; les autres signaux de cette règle — une
      // liste d'envies, un proche qui prépare une attention, une occasion — n'ont pas encore de
      // forme lisible et n'ouvrent rien. Un nom que la table ne rattache à aucune branche
      // (« Hôtellerie », branche distincte sans règle exécutable) reste non résolu.
      if (etat.aliasBranches && !etat.aliasBranches.has(c.branche)) return 'indecidable';
      return designe(c.branche, etat).some((b) => etat.branchesOuvertes.has(b)) ? 'ouvrir' : 'fermer';
    }
    case 'niveau': {
      // LE NIVEAU C N'EST PAS UNE PROFONDEUR. « Niveau C : exige un objet, une action ou une
      // occasion nommés » (politique de saturation du référentiel, 00_SYNTHESE et onglet 8 :
      // « C = action_id/occasion_id/item_id explicite »). La première version l'ouvrait après
      // huit réponses dans la branche : 202 questions du type « pour cet achat, tu préfères… »
      // pouvaient se poser sans qu'aucun achat n'existe. Il faut un projet en cours dans le
      // domaine ; sans lecture des projets, on ne sait pas.
      if (c.niveau === 'C') {
        // Le nom qui suit doit rester compris : « Niveau C Boissons — question CONTEXTUELLE »
        // porte un fragment qu'on n'a pas lu, et un projet en cours ne le rend pas lisible.
        if (etat.aliasBranches && !etat.aliasBranches.has(c.branche)) return 'indecidable';
        if (!etat.projets) return 'indecidable';
        return (etat.projets.get(contexte.pool ?? contexte.branche)?.size ?? 0) > 0 ? 'ouvrir' : 'fermer';
      }
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
      // « Ne jamais afficher les questions alcool si la personne ne boit pas » est écrit sur
      // les TRENTE questions de la branche historique food. Lue à la lettre, la consigne
      // fermait toute la cuisine à quelqu'un qui ne boit pas. Elle protège les questions QUI
      // PRÉSUMENT une consommation d'alcool — et celles-là seulement (décision du 19 nov.).
      return etat.sansAlcool && contexte.presumeAlcool ? 'fermer' : 'ouvrir';
    case 'contexte': {
      // « Achat concret », « séjour concret » : un projet de ce type, en cours, dans le domaine
      // de la question. L'intérêt pour le voyage ne crée pas un séjour.
      const type = PROJET_PAR_CONTEXTE[c.libelle] ?? null;
      if (type) {
        if (!etat.projets) return 'indecidable';
        return etat.projets.get(contexte.pool ?? contexte.branche)?.has(type) ? 'ouvrir' : 'fermer';
      }
      // Un contexte que le moteur ne connaît pas ne vaut PAS « inactif » : on ne ferme
      // pas une question au motif d'une condition qu'on n'a pas comprise, et on ne
      // l'ouvre pas non plus. Indécidable, donc non posée, et comptée comme telle.
      if (!etat.contextesConnus.has(c.libelle)) return 'indecidable';
      return etat.contextesActifs.has(c.libelle) ? 'ouvrir' : 'fermer';
    }
  }
}

/** Vrai seulement si la question peut être posée. `indecidable` vaut NON. */
export function peutPoser(
  cond: ConditionAnalysee, etat: EtatDiscovery,
  contexte: ContexteQuestion,
): boolean {
  return evaluerCondition(cond, etat, contexte) === 'ouvrir';
}
