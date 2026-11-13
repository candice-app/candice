// APPROFONDISSEMENT — Candice mène plusieurs tours à partir d'un récit libre.
//
// Point d'entrée réel : /api/confidences (dashboard → HeroInput / CandiceInput). Aujourd'hui
// la personne écrit une phrase, Candice répond et s'arrête. Ici elle relance, une question à
// la fois, et choisit la suivante d'après la réponse.
//
// LA DISTINCTION QUI GOUVERNE TOUT LE MODULE : une PISTE n'est pas une CONNAISSANCE.
// Une piste guide la question suivante. Une connaissance s'écrit dans le journal, et pour
// cela elle doit être étayée par un segment EXACT des propos, rattachée à la bonne personne,
// placée dans sa portée réelle, et autorisée par le contrat d'écriture. Les deux listes
// sortent séparées du modèle et ne se rejoignent jamais : rien dans ce fichier ne permet
// à une piste de devenir une écriture sans passer par la validation.
//
// CE QUE LE MODULE NE FAIT PAS, et ne doit jamais faire :
//   · écrire quoi que ce soit — il PROPOSE, la persistance décide ailleurs ;
//   · rattacher une information à un proche dont l'identité n'est pas résolue ;
//   · transformer une action ponctuelle en intérêt durable ;
//   · élargir une portée (« j'ai détesté attendre entre les étapes » ne rejette ni le pain,
//     ni la cuisine, ni les activités avec Thibaud).
import type { AboutRef } from '../knowledge/identity';

export type ProvenanceRecit =
  | 'narrateur_sur_lui'       // « moi j'ai aimé le faire »
  | 'narrateur_impression'    // « il avait l'air content »
  | 'narrateur_rapporte'      // « il m'a dit qu'il avait adoré pétrir »
  | 'declaration_propre';     // saisi par le proche sur SON compte

export type Destination = 'INTEREST' | 'ENTITY' | 'FACT' | 'OPEN_KNOWLEDGE';

export interface PersonneDuFil {
  /** Tel que la personne l'a dit : « Thibaud », « lui », « nous deux ». */
  readonly mention: string;
  readonly contactId: string | null;
  /** Plusieurs contacts correspondent : l'identité n'est PAS résolue. */
  readonly ambigu: boolean;
}

export interface Tour {
  readonly question: string;
  readonly reponse: string;
  readonly ts: string;
}

export interface FilApprofondissement {
  readonly filId: string;
  readonly about: AboutRef;
  /** Verbatim, jamais réécrit : c'est la matière où se vérifient les segments. */
  readonly recitInitial: string;
  readonly tours: readonly Tour[];
  readonly personnes: readonly PersonneDuFil[];
}

export interface CandidatConnaissance {
  /** L'extrait EXACT des propos qui l'étaye. Vérifié, jamais cru sur parole. */
  readonly segment: string;
  readonly sujet: string;
  readonly aQuiCaSeRapporte: { readonly kind: 'account' | 'contact'; readonly mention: string | null };
  readonly provenance: ProvenanceRecit;
  readonly destination: Destination;
  /** « cette recette », « le pain rapide », « en général ». Jamais vide. */
  readonly portee: string;
}

export interface SortieDeTour {
  /** Une question, une seule. null = le fil s'arrête (la personne décline ou change de sujet). */
  readonly relance: string | null;
  /** Guident la relance. N'ÉCRIVENT RIEN. */
  readonly pistes: readonly string[];
  readonly candidats: readonly CandidatConnaissance[];
}

export type MotifRefus =
  | 'segment_absent'        // le segment ne figure pas dans les propos → le modèle l'a reformulé
  | 'segment_vide'
  | 'portee_absente'        // sans portée, on ne sait pas ce que l'information couvre
  | 'identite_non_resolue'  // rattaché à un proche qu'on n'a pas identifié
  | 'identite_ambigue'      // plusieurs contacts portent cette mention
  | 'impression_sur_autrui' // mon impression ne fait pas une déclaration de sa part
  | 'destination_inconnue';

export interface Verdict {
  readonly retenus: readonly CandidatConnaissance[];
  readonly refuses: readonly { readonly candidat: CandidatConnaissance; readonly motif: MotifRefus }[];
}

const DESTINATIONS: readonly Destination[] = ['INTEREST', 'ENTITY', 'FACT', 'OPEN_KNOWLEDGE'];

/** Toute la matière où un segment a le droit d'exister : le récit et les RÉPONSES.
 *  Les questions de Candice en sont exclues — un segment tiré de sa propre question
 *  prouverait seulement qu'elle se cite elle-même. */
export function matiereDuFil(fil: FilApprofondissement): string {
  return [fil.recitInitial, ...fil.tours.map((t) => t.reponse)].join('\n');
}

/** Comparaison tolérante à la casse, aux accents et aux variantes d'apostrophe — mais PAS
 *  au contenu : le segment doit être dans les propos, seule sa graphie peut varier. */
function aplatir(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’‘‛]/g, "'").replace(/\s+/g, ' ').trim();
}

/**
 * Valide les candidats d'un tour. PUR : aucun appel, aucune écriture.
 *
 * Échoue FERMÉ et par candidat : un candidat refusé ne fait pas tomber les autres, et un
 * refus n'efface rien — le motif est rendu, pour que l'information puisse rester une piste
 * ou partir en connaissance ouverte plutôt que de disparaître (§27.6).
 */
export function validerCandidats(fil: FilApprofondissement, candidats: readonly CandidatConnaissance[]): Verdict {
  const matiere = aplatir(matiereDuFil(fil));
  const retenus: CandidatConnaissance[] = [];
  const refuses: { candidat: CandidatConnaissance; motif: MotifRefus }[] = [];
  const refuser = (c: CandidatConnaissance, motif: MotifRefus) => refuses.push({ candidat: c, motif });

  for (const c of candidats) {
    if (!DESTINATIONS.includes(c.destination)) { refuser(c, 'destination_inconnue'); continue; }
    if (c.segment.trim() === '') { refuser(c, 'segment_vide'); continue; }
    // LE CONTRÔLE QUI COMPTE : le modèle reformule volontiers. Un segment reformulé est une
    // invention présentée comme une citation — et c'est elle qui justifierait l'écriture.
    if (!matiere.includes(aplatir(c.segment))) { refuser(c, 'segment_absent'); continue; }
    if (c.portee.trim() === '') { refuser(c, 'portee_absente'); continue; }

    if (c.aQuiCaSeRapporte.kind === 'contact') {
      const mention = c.aQuiCaSeRapporte.mention;
      const personne = mention === null ? undefined
        : fil.personnes.find((p) => aplatir(p.mention) === aplatir(mention));
      if (!personne || personne.contactId === null) { refuser(c, 'identite_non_resolue'); continue; }
      if (personne.ambigu) { refuser(c, 'identite_ambigue'); continue; }
      // Mon impression sur quelqu'un n'est pas une déclaration de sa part. Elle peut vivre
      // dans MON contexte, jamais comme une préférence confirmée sur sa fiche.
      if (c.provenance === 'narrateur_impression') { refuser(c, 'impression_sur_autrui'); continue; }
    }
    retenus.push(c);
  }
  return { retenus, refuses };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Le tour suivant, proposé par le modèle.
 * ──────────────────────────────────────────────────────────────────────────── */

export const OUTIL_TOUR = {
  name: 'tour',
  description: 'La relance suivante, les pistes qui la guident, et les connaissances candidates.',
  input_schema: {
    type: 'object' as const,
    properties: {
      relance: { type: ['string', 'null'], description: "UNE question, une seule. null si la personne décline, change de sujet, ou qu'il n'y a plus rien d'utile à demander — s'arrêter est une réponse valable." },
      pistes: { type: 'array', items: { type: 'string' }, description: "Ce que tu envisages d'explorer ensuite. Guide la conversation. N'EST JAMAIS enregistré." },
      candidats: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            segment: { type: 'string', description: 'CITATION EXACTE tirée des propos de la personne, copiée mot pour mot. Une reformulation est refusée.' },
            sujet: { type: 'string' },
            aQuiCaSeRapporte: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['account', 'contact'] },
                mention: { type: ['string', 'null'], description: "Le mot employé pour désigner le proche (« Thibaud », « lui »). null quand il s'agit de la personne qui parle." },
              },
              required: ['kind', 'mention'],
            },
            provenance: { type: 'string', enum: ['narrateur_sur_lui', 'narrateur_impression', 'narrateur_rapporte', 'declaration_propre'], description: "« il avait l'air content » = narrateur_impression. « il m'a dit qu'il a adoré » = narrateur_rapporte. Ne les confonds jamais." },
            destination: { type: 'string', enum: [...DESTINATIONS] },
            portee: { type: 'string', description: "Ce que l'information couvre EXACTEMENT : « cette recette », « le pain rapide », « en général ». Une portée trop large est un contresens." },
          },
          required: ['segment', 'sujet', 'aQuiCaSeRapporte', 'provenance', 'destination', 'portee'],
        },
      },
    },
    required: ['relance', 'pistes', 'candidats'],
  },
};

export const SYSTEME_TOUR = `Tu es Candice, conciergerie relationnelle. Tu approfondis ce que la personne raconte.

Une question à la fois. Choisis-la d'après ce qu'elle vient de répondre, pas d'après un plan.

Ce qui mérite une relance : le plaisir, le rejet, la fréquence, le rôle de chacun, le contexte,
ce qu'elle aimerait faire autrement. « J'ai détesté » mérite autant de relances que « j'ai adoré ».

Distingue toujours :
— le plaisir de FAIRE et le plaisir de PARTAGER le moment : ce ne sont pas la même chose ;
— une action ponctuelle et un intérêt durable : avoir fait quelque chose une fois n'établit aucun goût ;
— la portée réelle d'un rejet : détester l'attente entre deux étapes ne rejette pas la chose entière ;
— qui a aimé quoi : « moi j'ai aimé le faire, lui il a adoré le manger » parle de deux personnes
  et de deux choses.

Si la personne décline, change de sujet ou n'a rien à ajouter : relance = null. S'arrêter est
une réponse valable ; insister ne l'est pas.

Un segment est une CITATION EXACTE. Si tu ne peux pas citer, ne propose pas de candidat.`;

export interface ClientModele {
  messages: { create(p: unknown): Promise<{ content: { type: string; input?: unknown }[] }> };
}

/** Propose le tour suivant. Un modèle qui ne rend rien d'exploitable arrête le fil
 *  proprement — jamais une relance inventée, jamais un candidat de repli. */
export async function planifierTour(modele: ClientModele, fil: FilApprofondissement): Promise<SortieDeTour> {
  const echange = [
    `Récit initial : ${fil.recitInitial}`,
    ...fil.tours.map((t) => `Candice : ${t.question}\nElle : ${t.reponse}`),
    fil.personnes.length
      ? `Personnes citées : ${fil.personnes.map((p) => `${p.mention}${p.contactId ? '' : ' (non identifié)'}${p.ambigu ? ' (ambigu)' : ''}`).join(', ')}`
      : '',
  ].filter(Boolean).join('\n\n');

  try {
    const msg = await modele.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 1200,
      system: SYSTEME_TOUR, tools: [OUTIL_TOUR], tool_choice: { type: 'tool', name: 'tour' },
      messages: [{ role: 'user', content: echange }],
    });
    const bloc = msg.content.find((c) => c.type === 'tool_use');
    if (!bloc?.input) return { relance: null, pistes: [], candidats: [] };
    const brut = bloc.input as Partial<SortieDeTour>;
    return {
      relance: typeof brut.relance === 'string' && brut.relance.trim() !== '' ? brut.relance : null,
      pistes: Array.isArray(brut.pistes) ? brut.pistes : [],
      candidats: Array.isArray(brut.candidats) ? brut.candidats : [],
    };
  } catch {
    return { relance: null, pistes: [], candidats: [] }; // échec modèle → zéro, jamais d'invention
  }
}
