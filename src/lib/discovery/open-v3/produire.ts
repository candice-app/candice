// DE LA RÉPONSE AU JOURNAL — le producteur Discovery OPEN V3.
//
// Il traduit une option choisie en preuve, selon le contrat que le référentiel porte pour
// cette option. Il ne décide rien : tout ce qu'il écrit vient du contrat, et ce que le
// contrat ne dit pas n'est pas écrit.
//
// ─────────────────────────────────────────────────────────────────────────────────────
// CE QUI N'EST PAS ÉCRIT, ET POURQUOI. La base n'impose AUCUNE contrainte sur
// `target_construct` : elle accepterait n'importe quelle chaîne. C'est précisément ce qui
// rend ce fichier nécessaire. Une écriture hors vocabulaire ne serait pas rejetée — elle
// passerait, se consoliderait, et remonterait dans le portrait sous un nom que personne
// n'a défini. Les écrans de respiration reçoivent ces constructs : Candice parlerait d'un
// « DRV:value_sought » comme d'un moteur de la personne.
//
// Le référentiel et le journal ne parlent pas tout à fait la même langue :
//   · DRIVER    — 148 options, 0 portant un code du journal. Le référentiel y range
//                 « leur affection », « leur intelligence » sous l'attribut `value_sought` :
//                 ce que la personne apprécie CHEZ QUELQU'UN. Ce ne sont pas les moteurs
//                 d'attention que DRIVER désigne (DRV_PERSONALIZATION, DRV_ATTENTIVENESS…).
//                 Les écrire comme des DRIVER inventerait 143 moteurs que rien ne comprend.
//                 → REFUSÉES, comptées, en attente d'arbitrage.
//   · GUARDRAIL — 1 010 options, 5 portant un code du journal. Mais GUARDRAIL admet par
//                 conception des CHEMINS VERTICAUX libres sous préfixes connus (« ce ne sont
//                 PAS des codes fermés », vocabulary.ts). On écrit donc
//                 `<domaine>.<attribut>.<valeur>`, ce qui n'invente aucune sémantique : le
//                 refus garde sa portée exacte, sa sévérité déclarée, et continue d'armer
//                 le veto — `isRejection` filtre sur la FAMILLE, pas sur le code.
// ─────────────────────────────────────────────────────────────────────────────────────
import type { OptionV3, QuestionV3 } from './banque';

/** Ce qu'une option produit, ou la raison pour laquelle elle ne produit rien. */
export type Production =
  | { readonly type: 'evidence'; readonly evidence: EvidenceBrute }
  | { readonly type: 'rien'; readonly motif: MotifNonEcriture; readonly detail: string };

export type MotifNonEcriture =
  /** Le contrat dit explicitement de ne rien écrire. Ce n'est pas un défaut. */
  | 'contrat_sans_emission'
  /** Une action d'interface (ouvrir un champ libre), pas une connaissance. */
  | 'action_interface'
  /** Un état du parcours, pas une connaissance sur la personne. */
  | 'etat_parcours'
  /** Le verbatim est conservé ailleurs ; l'extraction suit son propre contrat. */
  | 'connaissance_ouverte'
  /** Le contrat ne dit pas assez pour écrire sans deviner. */
  | 'contrat_incomplet'
  /** La famille du référentiel ne se traduit pas dans le vocabulaire du journal. */
  | 'vocabulaire_incompatible';

/** Forme intermédiaire : tout ce que le contrat détermine, avant la provenance. */
export interface EvidenceBrute {
  readonly target_family: string;
  readonly target_construct: string;
  readonly strength: 'weak' | 'moderate' | 'strong';
  readonly context: string;
  readonly raw_information: string;
  readonly stability: 'stable' | 'evolving' | 'contextual' | 'temporary';
  readonly severity?: 'SOFT' | 'HARD';
  readonly guardrailScope?: 'selection' | 'execution' | 'context';
  readonly relation?: string;
  readonly subject?: string;
  readonly subjectLabel?: string;
  readonly entity_id?: string;
  readonly entityLabel?: string;
  readonly entityType?: string;
  readonly preferenceValue?: string;
  readonly behaviorContext?: string;
  readonly pattern?: string;
  readonly direction?: 'receive' | 'give';
  readonly modality?: string;
}

const ENTITY_RELATIONS = new Set([
  'LOVE', 'LIKE', 'CURIOUS', 'WANT_TO_TRY', 'WANT_TO_OWN', 'WANT_TO_VISIT',
  'NEUTRAL', 'DISLIKE', 'AVOID', 'OWNS',
]);
const MODALITES = new Set([
  'WORDS', 'SERVICES', 'PERSONALIZED_GIFT', 'SYMBOLIC_GIFT',
  'QUALITY_TIME', 'MICRO_ATTENTIONS', 'SURPRISE',
]);

/** Valeur scalaire d'une cellule `valeur`, ou undefined si elle est une table. */
function scalaire(v: Record<string, unknown> | undefined): string | undefined {
  const s = v?.__scalaire__;
  return typeof s === 'string' ? s : undefined;
}
function champ(v: Record<string, unknown> | undefined, cle: string): string | undefined {
  const x = v?.[cle];
  return typeof x === 'string' && x.trim() ? x.trim() : undefined;
}

/**
 * LA VALEUR DU CONTRAT, EN ENTIER.
 *
 * Le référentiel écrit la valeur d'une préférence sous des dizaines de clés différentes —
 * `forme`, `critere`, `ouverture`, `registre`, `compagnie`… Une liste de clés privilégiées
 * en perdait l'essentiel : 5 052 options sur 9 838 sortaient « sans valeur lisible » parce
 * que leur clé n'était pas dans MA liste, pas parce que le contrat ne disait rien.
 *
 * On sérialise donc la table ENTIÈRE, clés triées pour que la même option donne toujours
 * la même valeur — l'identité de la preuve en dépend. Rien n'est choisi, rien n'est écarté :
 * ce que le contrat dit est ce qui est écrit.
 *
 * `__libres__` (les qualificatifs sans clé) est rendu en dernier, sous son nom, pour qu'on
 * voie qu'il n'était rattaché à aucune clé plutôt que de le voir collé à la précédente.
 */
function valeurCanonique(v: Record<string, unknown> | undefined): string | undefined {
  if (!v) return undefined;
  const scal = scalaire(v);
  if (scal) return scal;
  const morceaux: string[] = [];
  for (const cle of Object.keys(v).filter((k) => k !== '__libres__' && k !== '__scalaire__').sort()) {
    const x = v[cle];
    if (typeof x === 'string' && x.trim()) morceaux.push(`${cle}=${x.trim()}`);
  }
  const libres = v.__libres__;
  if (Array.isArray(libres) && libres.length > 0) morceaux.push(libres.map(String).join('+'));
  return morceaux.length > 0 ? morceaux.join(';') : undefined;
}
/** Un paramètre non résolu — « {occasion} » — n'est pas une valeur. */
const estParametre = (s: string | undefined) => !!s && /\{.*\}/.test(s);

function assainir(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Traduit UNE option choisie en ce qu'elle écrit — ou en la raison de ne rien écrire.
 *
 * `strength` vaut toujours `moderate` : le référentiel ne gradue pas la force d'une option
 * cochée, et en inventer une (« fort parce que c'est un refus ») ajouterait une information
 * que la personne n'a pas donnée. La SÉVÉRITÉ, elle, est déclarée par le contrat et voyage.
 */
export function produireDepuisOption(q: QuestionV3, o: OptionV3): Production {
  const rien = (motif: MotifNonEcriture, detail: string): Production =>
    ({ type: 'rien', motif, detail });

  switch (o.voie) {
    case 'NO_EMISSION':   return rien('contrat_sans_emission', o.libelle);
    case 'ACTION_PARAMETER': return rien('action_interface', o.libelle);
    case 'DISCOVERY_STATE':  return rien('etat_parcours', o.libelle);
    case 'OPEN_KNOWLEDGE':   return rien('connaissance_ouverte', o.libelle);
    case 'FACT':             return rien('contrat_incomplet', `FACT : écrit par le producteur de faits, pas ici (${o.libelle})`);
    case 'HSG_EVIDENCE':     break;
  }

  const fam = o.famille;
  if (!fam) return rien('contrat_incomplet', `preuve sans famille (${o.libelle})`);
  const domaine = o.domaine ?? q.branche;
  const base = {
    target_family: fam,
    strength: 'moderate' as const,
    context: domaine,
    raw_information: o.libelle,
    stability: (o.stabilite as EvidenceBrute['stability']) ?? 'evolving',
  };

  switch (fam) {
    case 'DRIVER':
      // Voir l'en-tête : le référentiel range ici ce que la personne apprécie chez
      // quelqu'un, pas un moteur d'attention. Aucune traduction ne va de l'un à l'autre
      // sans décider à la place d'Estelle ce que Candice doit en comprendre.
      return rien('vocabulaire_incompatible',
        `DRIVER « ${o.attribut ?? '?'} » : le référentiel ne porte aucun code DRV_ (${o.libelle})`);

    case 'NEED':
      return rien('vocabulaire_incompatible',
        `NEED « ${o.attribut ?? '?'} » : vocabulaire fermé, aucun code NEED_ au contrat (${o.libelle})`);

    case 'GUARDRAIL': {
      if (!o.attribut) return rien('contrat_incomplet', `garde-fou sans attribut (${o.libelle})`);
      const precision = scalaire(o.valeur) ?? champ(o.valeur, 'objet');
      if (estParametre(precision)) {
        return rien('contrat_incomplet', `garde-fou à paramètre non résolu « ${precision} » (${o.libelle})`);
      }
      // CHEMIN VERTICAL, mécanisme prévu par le journal pour les refus qui ne tiennent pas
      // dans un code fermé. Le chemin garde la portée exacte du refus : un refus sur les
      // chaussures ne devient pas un refus sur les cadeaux.
      const chemin = [assainir(domaine), assainir(o.attribut), precision ? assainir(precision) : null]
        .filter(Boolean).join('.');
      return {
        type: 'evidence',
        evidence: {
          ...base,
          target_construct: chemin,
          // La sévérité vient du contrat. Sans elle, SOFT : on ne durcit jamais un refus
          // que la personne n'a pas durci — un HARD supposé interdirait pour de bon.
          severity: o.severite ?? 'SOFT',
          guardrailScope: 'selection',
        },
      };
    }

    case 'PREFERENCE': {
      if (!o.attribut) return rien('contrat_incomplet', `préférence sans attribut (${o.libelle})`);
      const valeur = valeurCanonique(o.valeur);
      if (!valeur) return rien('contrat_incomplet', `préférence sans valeur lisible (${o.libelle})`);
      if (estParametre(valeur)) return rien('contrat_incomplet', `préférence à paramètre non résolu (${o.libelle})`);
      return {
        type: 'evidence',
        evidence: {
          ...base,
          target_construct: `PREFERENCE.${assainir(domaine)}.${assainir(o.attribut)}`,
          preferenceValue: valeur,
        },
      };
    }

    case 'INTEREST': {
      const sujet = scalaire(o.valeur) ?? champ(o.valeur, 'objet') ?? o.attribut;
      if (!sujet || estParametre(sujet)) return rien('contrat_incomplet', `intérêt sans sujet lisible (${o.libelle})`);
      return {
        type: 'evidence',
        evidence: {
          ...base,
          target_construct: assainir(sujet),
          subject: assainir(sujet),
          subjectLabel: o.libelle,
          // AUCUN `relationship` : le référentiel ne gradue pas, et l'absence de degré est
          // une information juste. En poser un (« casual ») serait inventer une tiédeur.
        },
      };
    }

    case 'ENTITY': {
      const relation = champ(o.valeur, 'relation');
      if (!relation) return rien('contrat_incomplet', `entité sans relation déclarée (${o.libelle})`);
      if (!ENTITY_RELATIONS.has(relation)) {
        // « WANT_TO_TRY|WANT_TO_OWN (à résoudre depuis le verbatim) » : deux relations
        // possibles, c'est-à-dire aucune de tranchée. Choisir serait décider pour la personne.
        return rien('contrat_incomplet', `relation « ${relation} » non canonique ou ambiguë (${o.libelle})`);
      }
      const objet = champ(o.valeur, 'objet') ?? scalaire(o.valeur) ?? o.attribut;
      if (!objet || estParametre(objet)) return rien('contrat_incomplet', `entité sans objet lisible (${o.libelle})`);
      return {
        type: 'evidence',
        evidence: {
          ...base,
          target_construct: assainir(objet),
          entity_id: assainir(objet),
          entityLabel: o.libelle,
          entityType: 'unknown',
          relation,
        },
      };
    }

    case 'BEHAVIOR': {
      const pattern = champ(o.valeur, 'pattern') ?? champ(o.valeur, 'comportement') ?? valeurCanonique(o.valeur);
      if (!pattern || estParametre(pattern)) return rien('contrat_incomplet', `comportement sans motif lisible (${o.libelle})`);
      const contexte = assainir(o.attribut ?? domaine);
      return {
        type: 'evidence',
        evidence: {
          ...base,
          target_construct: `${contexte}:${assainir(pattern)}`,
          behaviorContext: contexte,
          pattern: assainir(pattern),
        },
      };
    }

    case 'CONTEXT': {
      const valeur = champ(o.valeur, 'usage') ?? champ(o.valeur, 'occasion') ?? valeurCanonique(o.valeur);
      if (!valeur || estParametre(valeur)) return rien('contrat_incomplet', `contexte sans valeur lisible (${o.libelle})`);
      return {
        type: 'evidence',
        evidence: { ...base, target_construct: `${assainir(o.attribut ?? domaine)}.${assainir(valeur)}` },
      };
    }

    case 'AFFECTION_LANGUAGE': {
      // La modalité s'écrit de trois manières dans le référentiel : sous la clé
      // `modality`, parfois suivie d'un commentaire après un tiret (« WORDS — canal=lettre
      // manuscrite »), et parfois comme qualificatif libre à côté de la direction. On prend
      // le CODE, qui est toujours le premier mot, et on laisse le commentaire de côté — il
      // nuance la modalité, il ne la remplace pas.
      const libres = o.valeur?.__libres__;
      const candidat = champ(o.valeur, 'modality')
        ?? (Array.isArray(libres) ? String(libres[0] ?? '') : undefined)
        ?? scalaire(o.valeur) ?? '';
      const brut = candidat.split(/[—–-]/)[0].trim().toUpperCase();
      if (!MODALITES.has(brut)) return rien('contrat_incomplet', `langage d'affection hors modalités (${o.libelle})`);
      // La DIRECTION n'est pas déductible du contrat seul : recevoir et donner ne se
      // confondent pas (R5), et supposer « recevoir » écrirait la moitié d'une personne.
      const direction = champ(o.valeur, 'direction');
      if (direction !== 'receive' && direction !== 'give') {
        return rien('contrat_incomplet', `langage d'affection sans direction déclarée (${o.libelle})`);
      }
      return {
        type: 'evidence',
        evidence: {
          ...base,
          target_construct: `AFFECTION_${direction.toUpperCase()}_${brut}`,
          direction, modality: brut,
        },
      };
    }

    default:
      return rien('vocabulaire_incompatible', `famille « ${fam} » inconnue du journal (${o.libelle})`);
  }
}
