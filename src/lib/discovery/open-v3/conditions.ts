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

/** Marques de sensibilité portées par le référentiel lui-même. Une condition qui en porte
 *  une ne s'ouvre JAMAIS par ce moteur — perte, deuil, conflit, spiritualité, nostalgie.
 *  Ces questions existent, elles ne sont pas interdites : elles ne s'ouvrent pas par un
 *  score de pertinence. Si un jour un motif rendait leur condition « lisible », cette garde
 *  continuerait de les fermer, et c'est précisément pour ça qu'elle est séparée de la
 *  table des motifs. */
const MARQUES_SENSIBLES = /sensitivity\s*:\s*high|sous-branche sensible|niveau\s+s\b|ne jamais ouvrir/i;

export interface ConditionAnalysee {
  /** Les clauses, dans l'ordre. Elles se combinent toutes par ET — voir la note ci-dessous. */
  readonly clauses: readonly Clause[];
  /** Vraie seulement si TOUTES les clauses sont reconnues. */
  readonly lisible: boolean;
  /** Les fragments non reconnus, tels quels. De quoi écrire ce qui manque. */
  readonly inconnues: readonly string[];
  /** Le texte d'origine contient un « OU » : la lecture par ET est alors plus STRICTE que
   *  l'intention. Signalé, parce qu'une question qui ne s'ouvre jamais est un défaut, même
   *  silencieux. */
  readonly contientDisjonction: boolean;
  /** Le référentiel marque cette question comme sensible. Elle ne s'ouvre jamais ici. */
  readonly sensible: boolean;
}

const norme = (s: string) => s.replace(/\s+/g, ' ').trim();

// ⚠ TOUTES LES CLAUSES SE COMBINENT PAR « ET », Y COMPRIS QUAND LE TEXTE ÉCRIT « OU ».
//    Traiter un OU comme un ET est plus RESTRICTIF : la question s'ouvre moins souvent
//    qu'escompté, jamais plus. Dans le doute, une question qu'on ne pose pas coûte une
//    occasion ; une question posée à tort coûte la confiance. On choisit la première.
//    `contientDisjonction` le signale pour que ce ne soit pas un oubli invisible.

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
  { re: /^score de pertinence suffisant$/i, lire: () => ({ type: 'score_suffisant' }) },
  {
    re: /^ne jamais afficher les questions alcool si la personne ne boit pas$/i,
    lire: () => ({ type: 'pas_si_sans_alcool' }),
  },
  {
    re: /^int[ée]r[êe]t (.+?) s[ée]lectionn[ée]e? ou d[ée]tect[ée]e?$/i,
    lire: (m) => ({ type: 'interet', domaine: norme(m[1]).toLowerCase() }),
  },
  {
    re: /^branche (.+?) ouverte(?: par le questionnaire initial ou un texte libre)?$/i,
    lire: (m) => ({ type: 'branche_ouverte', branche: norme(m[1]).toLowerCase() }),
  },
  {
    re: /^niveau ([ABC])\s+(.+)$/i,
    lire: (m) => ({ type: 'niveau', niveau: m[1].toUpperCase() as 'A' | 'B' | 'C', branche: norme(m[2]).toLowerCase() }),
  },
  // « AXE 1 — Comment j'aime être célébré — niveau B » : même porte de profondeur, écrite
  // dans l'autre sens. Le niveau est en fin de phrase, la branche devant.
  {
    re: /^(.+?)\s*[—-]\s*niveau ([ABC])$/i,
    lire: (m) => ({ type: 'niveau', niveau: m[2].toUpperCase() as 'A' | 'B' | 'C', branche: norme(m[1]).toLowerCase() }),
  },
  // « Sous-branche Famille », « Axe Pratiquant » : une sous-partie ouverte, pas une branche
  // entière. Même mécanique, autre granularité — on garde le libellé tel quel.
  {
    re: /^(?:sous-branche|axe)\s+(.+)$/i,
    lire: (m) => ({ type: 'branche_ouverte', branche: norme(m[1]).toLowerCase() }),
  },
  // « Achat concret », « Cuisine/gastronomie active », « Voyage, week-end ou hôtellerie
  // actifs » : un CONTEXTE de vie doit être en cours. Le libellé est conservé tel quel et
  // c'est le moteur qui dit s'il connaît ce contexte — un contexte INCONNU rend
  // `indecidable`, jamais « inactif » : affirmer qu'un contexte n'est pas en cours alors
  // qu'on ne sait pas ce qu'il désigne fermerait la question pour une mauvaise raison.
  {
    re: /^(.+?)\s+(?:actif|active|actifs|actives)$/i,
    lire: (m) => ({ type: 'contexte', libelle: norme(m[1]).toLowerCase() }),
  },
  {
    re: /^achat concret$/i,
    lire: () => ({ type: 'contexte', libelle: 'achat concret' }),
  },
];

/** Découpe une condition en fragments, et lit chacun. Ce qui n'est pas reconnu le reste. */
export function analyserCondition(texte: string): ConditionAnalysee {
  const nettoye = norme(texte).replace(/^Tags ENTRANTS\s*—\s*ouvrir si\s*/i, '');
  const contientDisjonction = /\bOU\b/.test(nettoye);
  const clauses: Clause[] = [];
  const inconnues: string[] = [];

  // Les parenthèses portent des commentaires de rédaction, pas de la logique. On les
  // retire AVANT le découpage : une parenthèse ouverte avant un « ; » laissait sinon une
  // fin de commentaire orpheline, comptée comme une clause inconnue.
  const sansCommentaires = nettoye.replace(/\([^)]*\)/g, ' ');
  for (const brut of sansCommentaires.split(/\s*;\s*|\s+ET\s+|\s+OU\s+/)) {
    // Un « ET » ou un « OU » en TÊTE de fragment survit au découpage (rien ne le précède).
    const frag = norme(brut).replace(/^(?:ET|OU)\s+/i, '').replace(/[.,]+$/, '').replace(/^\)|\($/g, '').trim();
    if (!frag) continue;
    // Un fragment peut être une expression entre accents graves, seule ou enrobée.
    const atome = frag.match(/^`([^`]+)`$/);
    const sujet = atome ? atome[1] : frag.replace(/`/g, '');
    let lu: Clause | null = null;
    for (const { re, lire } of MOTIFS) {
      const m = sujet.match(re);
      if (m) { lu = lire(m); break; }
    }
    if (lu) clauses.push(lu);
    else { clauses.push({ type: 'prose', texte: sujet }); inconnues.push(sujet); }
  }
  const sensible = MARQUES_SENSIBLES.test(nettoye);
  return {
    clauses,
    // Une question sensible n'est jamais « lisible » pour ce moteur : la fermer est une
    // décision, pas un manque d'information.
    lisible: inconnues.length === 0 && !sensible,
    inconnues, contientDisjonction, sensible,
  };
}

export type Verdict = 'ouvrir' | 'fermer' | 'indecidable';

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
  contexte: { readonly branche: string; readonly attribut?: string },
): Verdict {
  // La sensibilité est tranchée AVANT tout le reste, et rend « fermer » — pas
  // « indecidable ». Ce n'est pas une condition qu'on n'a pas su lire : c'est une condition
  // qu'on a lue, et qui dit non.
  if (cond.sensible) return 'fermer';
  if (!cond.lisible) return 'indecidable';
  for (const c of cond.clauses) {
    switch (c.type) {
      case 'prose':
        return 'indecidable';
      case 'tag': {
        const v = etat.tags.get(c.chemin);
        const egal = v !== undefined && v === c.valeur;
        if (c.operateur === '=' ? !egal : egal) return 'fermer';
        break;
      }
      case 'ne_pas_creuser':
        if (etat.nePasCreuser.has(c.domaine)) return 'fermer';
        break;
      case 'interet': {
        // Un intérêt doit être POSITIF et écrit. Son absence n'est pas un « non » :
        // c'est l'absence de terrain, et on ne pose pas une question sans terrain.
        const v = etat.tags.get(`INTEREST.${c.domaine}`);
        if (v !== 'positive') return 'fermer';
        break;
      }
      case 'branche_ouverte':
        if (!etat.branchesOuvertes.has(c.branche)) return 'fermer';
        break;
      case 'niveau': {
        const ordre = { A: 1, B: 2, C: 3 } as const;
        const atteint = etat.niveauParBranche.get(c.branche);
        if (!atteint || ordre[atteint] < ordre[c.niveau]) return 'fermer';
        break;
      }
      case 'information_manquante':
        // Sans attribut nommé, on ne peut pas savoir si l'information manque : on ne
        // suppose pas qu'elle manque pour avoir le droit de poser la question.
        if (!contexte.attribut) return 'indecidable';
        if (etat.attributsConnus.has(contexte.attribut)) return 'fermer';
        break;
      case 'score_suffisant':
        // Le score de pertinence est calculé par le moteur, pas par la condition.
        // Il est donc neutre ici : c'est la sélection qui tranche, et elle en répond.
        break;
      case 'pas_si_sans_alcool':
        if (etat.sansAlcool) return 'fermer';
        break;
      case 'contexte':
        // Un contexte que le moteur ne connaît pas ne vaut PAS « inactif » : on ne ferme
        // pas une question au motif d'une condition qu'on n'a pas comprise, et on ne
        // l'ouvre pas non plus. Indécidable, donc non posée, et comptée comme telle.
        if (!etat.contextesConnus.has(c.libelle)) return 'indecidable';
        if (!etat.contextesActifs.has(c.libelle)) return 'fermer';
        break;
    }
  }
  return 'ouvrir';
}

/** Vrai seulement si la question peut être posée. `indecidable` vaut NON. */
export function peutPoser(
  cond: ConditionAnalysee, etat: EtatDiscovery,
  contexte: { readonly branche: string; readonly attribut?: string },
): boolean {
  return evaluerCondition(cond, etat, contexte) === 'ouvrir';
}
