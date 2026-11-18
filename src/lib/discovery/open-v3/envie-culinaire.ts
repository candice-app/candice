// LE CONTRAT DE `food2.0882A` — « As-tu une envie culinaire précise en ce moment ? »
//
// Décision d'Estelle, 18 nov. Ce que la réponse a le droit de produire :
//   · le VERBATIM, toujours (écrit par le service, avant tout appel au modèle) ;
//   · un FAIT d'envie culinaire ACTUELLE, si la réponse en exprime une, avec les détails et
//     la période que la personne a EFFECTIVEMENT écrits ;
//   · si elle déclare, à part, une allergie ou une contrainte alimentaire : ce passage suit
//     le chemin déjà autorisé pour un texte libre (connaissance conservée, marquée sensible).
// Et ce qu'elle n'a PAS le droit de produire : aucune préférence durable, aucun veto, aucune
// relation ENTITY, aucun intérêt. Une envie de plat ne prouve ni allergie, ni régime, ni
// conviction, ni habitude.
//
// DEUX VERROUS, ET LE MODÈLE N'EN TIENT AUCUN.
//   1. Le REFUS est décidé ici, sans modèle : une réponse vide, un refus, « aucune envie
//      particulière » ne créent aucune envie et n'appellent personne.
//   2. Tout ce que le modèle rend est comparé au texte : un détail, une période ou une
//      contrainte qui ne figure pas MOT POUR MOT dans la réponse est écarté. Le modèle
//      découpe la phrase ; il ne peut rien y ajouter.
// La FORME de ce qui est écrit est fixée par ce fichier : le modèle ne choisit ni la famille,
// ni la cible. Il ne pourrait pas écrire une préférence même s'il le voulait.
import Anthropic from '@anthropic-ai/sdk';

export const FAIT_ENVIE_CULINAIRE = 'food.current_craving';

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const aplat = (s: string) => sansAccents(s).toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

/** Réponses qui disent « non », en entier. On ne cherche pas ces mots DANS une phrase : « rien
 *  de spécial, sauf des ramen » exprime une envie, et doit être lu. */
const ABSENCES = [
  /^(?:non|nan|no|nope|rien|aucune?|pas vraiment|pas specialement|pas particulierement|bof|je ne sais pas|je sais pas|aucune idee|\?+|-+|\.+)(?: merci)?[ .!]*$/,
  /^(?:non[, ]+)?(?:je n'ai |j'ai )?(?:aucune|pas d') ?envie(?: culinaire)?(?: precise| particuliere| speciale)?(?: en ce moment| pour l'instant| actuellement)?[ .!]*$/,
  /^(?:non[, ]+)?rien (?:de (?:special|particulier|precis)|en particulier)(?: en ce moment| pour l'instant)?[ .!]*$/,
  /^(?:non[, ]+)?pas (?:en ce moment|pour l'instant|pour le moment|actuellement)[ .!]*$/,
  /^je (?:prefere|ne souhaite pas|ne veux pas) (?:ne pas )?(?:repondre|en parler)[ .!]*$/,
];

/** Vrai si la réponse, prise en entier, dit qu'il n'y a pas d'envie (ou ne dit rien). */
export function estAbsenceDEnvie(texte: string): boolean {
  const t = aplat(texte);
  if (t.length === 0) return true;
  return ABSENCES.some((re) => re.test(t));
}

/** Ce que le modèle rend. Rien ici n'est écrit tel quel : tout passe par `validerLecture`. */
export interface LectureBrute {
  exprime_envie?: boolean;
  details?: unknown;
  periode?: unknown;
  contraintes_declarees?: unknown;
}

export interface LectureValidee {
  readonly exprimeEnvie: boolean;
  /** Ce dont la personne a envie, dans ses mots. */
  readonly details: readonly string[];
  /** Le moment qu'elle a donné (« ce week-end », « en ce moment »), dans ses mots. */
  readonly periode?: string;
  /** Passages où elle DÉCLARE une allergie ou une contrainte, dans ses mots. */
  readonly contraintes: readonly string[];
  /** Ce que le modèle a proposé et qui n'était pas dans le texte. Écarté, et compté. */
  readonly ecartes: readonly string[];
}

/** Un passage n'est gardé que s'il figure dans la réponse (casse, accents et espaces à part). */
export function validerLecture(texte: string, brute: LectureBrute): LectureValidee {
  const source = aplat(texte);
  const ecartes: string[] = [];
  const garder = (x: unknown): string | undefined => {
    if (typeof x !== 'string' || !x.trim()) return undefined;
    const propose = x.trim();
    if (source.includes(aplat(propose))) return propose;
    ecartes.push(propose);
    return undefined;
  };
  const liste = (x: unknown) => (Array.isArray(x) ? x : []).map(garder).filter((s): s is string => !!s);
  const details = [...new Set(liste(brute.details))];
  const contraintes = [...new Set(liste(brute.contraintes_declarees))];
  const periode = garder(brute.periode);
  return {
    // Une envie sans aucun détail vérifiable n'est pas une envie qu'on puisse écrire.
    exprimeEnvie: brute.exprime_envie === true && details.length > 0,
    details, contraintes, ecartes,
    ...(periode ? { periode } : {}),
  };
}

const SYSTEME = `Tu lis UNE réponse à la question « As-tu une envie culinaire précise en ce moment ? ». Tu DÉCOUPES la réponse, tu n'interprètes rien.
- exprime_envie : true seulement si la personne dit avoir envie de quelque chose à manger ou à boire.
- details : les passages EXACTS de la réponse qui nomment ce dont elle a envie (plat, cuisine, restaurant, ingrédient). Copie mot pour mot, sans reformuler ni compléter.
- periode : le passage EXACT où elle situe cette envie dans le temps (« en ce moment », « ce week-end »), s'il y en a un. Sinon n'écris rien.
- contraintes_declarees : UNIQUEMENT les passages EXACTS où elle DÉCLARE elle-même une allergie, une intolérance, un régime ou une contrainte alimentaire (« je suis allergique aux fruits à coque »). Une envie de plat n'est JAMAIS une contrainte ; l'absence d'un aliment dans sa réponse non plus.
INTERDICTIONS : ne déduis aucune allergie, aucun régime, aucune conviction, aucune habitude, aucun goût durable. Si la réponse n'exprime aucune envie, renvoie exprime_envie=false et des listes vides.`;

const OUTIL = {
  name: 'envie_culinaire',
  description: 'Découpage de la réponse : envie exprimée, détails, période, contraintes déclarées.',
  input_schema: {
    type: 'object' as const,
    properties: {
      exprime_envie: { type: 'boolean' },
      details: { type: 'array', items: { type: 'string' } },
      periode: { type: 'string' },
      contraintes_declarees: { type: 'array', items: { type: 'string' } },
    },
    required: ['exprime_envie', 'details', 'contraintes_declarees'],
  },
};

/** Appelle le modèle. LÈVE si le modèle ne répond pas — une panne n'est pas « aucune envie ». */
export async function lireEnvieParModele(texte: string): Promise<LectureBrute> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 512,
    system: SYSTEME, tools: [OUTIL], tool_choice: { type: 'tool', name: 'envie_culinaire' },
    messages: [{ role: 'user', content: `Réponse : « ${texte} »` }],
  });
  const bloc = msg.content.find((b) => b.type === 'tool_use');
  if (!bloc || bloc.type !== 'tool_use') throw new Error('réponse du modèle sans découpage');
  return bloc.input as LectureBrute;
}
