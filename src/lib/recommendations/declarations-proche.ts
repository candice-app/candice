// CE QUE LE PROCHE A DÉCLARÉ LUI-MÊME — chemin de lecture autorisé, côté serveur.
//
// LE CAS QUI GOUVERNE CE MODULE. Je dis « Thibaud a adoré faire du pain ». C'est MON
// impression, ou ses mots rapportés par moi. Thibaud, sur son propre compte, a déclaré
// qu'il déteste faire du pain. Candice ne doit pas lui proposer de faire du pain — et
// elle ne doit pas non plus me faire savoir qu'il a déclaré l'inverse.
//
// Deux exigences qui tirent en sens opposé, et qui tiennent ensemble par la STRUCTURE :
//
//   1. L'exclusion a lieu APRÈS la génération, jamais avant. Les rejets de Thibaud
//      n'entrent dans AUCUN prompt : le modèle produit ses idées sans les connaître, et
//      les idées couvertes par un rejet sont retirées ensuite. Ce n'est donc pas une
//      discipline tenue par celui qui écrit le prompt — c'est une impossibilité : ce qui
//      n'est pas passé par là ne peut pas en ressortir.
//
//   2. Ce module ne rend QUE des rejets. Jamais une préférence positive, jamais un
//      intérêt, jamais un degré d'engagement. Un rejet retire une idée — un retrait est
//      invisible. Une préférence ferait APPARAÎTRE une idée, et l'apparition se remarque :
//      elle me dirait indirectement ce que Thibaud a déclaré. La portée positive est une
//      autre décision, avec une autre difficulté (justifier sans révéler) ; elle n'est
//      pas prise ici, et ce module ne peut pas la prendre par accident.
//
// LECTURE SOUS SERVICE_ROLE, et il n'y a pas d'autre choix : la RLS de Thibaud interdit
// au pilote de lire ses lignes, ce qui est exactement ce qu'on veut. Le franchissement
// est donc concentré ICI, derrière un consentement actif et explicite, et le résultat ne
// quitte jamais le serveur.
import type { JournalRejection } from './rejection-match';

/** Portée de consentement : « mes déclarations peuvent ÉCARTER des idées me concernant ».
 *  Ne donne aucun droit de lecture, aucun usage positif, aucune restitution au pilote. */
export const PORTEE_EXCLUSIONS_RECO = 'reco_exclusions';

export type MotifLecture =
  | 'autorise'            // consentement actif portant la bonne portée
  | 'aucun_compte'        // le proche n'a pas de compte relié (proche_user_id nul)
  | 'aucun_consentement'  // aucun consentement actif pilote ↔ contact
  | 'portee_absente'      // consentement actif, mais il ne couvre pas cet usage
  | 'lecture_impossible'; // la lecture a échoué — on refuse l'usage, on n'invente rien

export interface LectureDeclarations {
  /** La lecture a-t-elle eu lieu légitimement ? FAUX ne veut pas dire « aucun rejet ». */
  readonly autorise: boolean;
  readonly motif: MotifLecture;
  /** Vide quand `autorise` est faux. Vide AUSSI quand la fiche est silencieuse : les deux
   *  cas se distinguent par `motif`, jamais par la longueur de cette liste. */
  readonly rejets: readonly JournalRejection[];
}

const REFUS = (motif: MotifLecture): LectureDeclarations => ({ autorise: false, motif, rejets: [] });

interface ClientLecture {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: unknown): {
        eq(col: string, val: unknown): {
          maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: unknown }>;
          eq(col: string, val: unknown): {
            maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: unknown }>;
          };
          in(col: string, vals: readonly string[]): Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
          is(col: string, val: null): Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
        };
      };
    };
  };
}

/**
 * Les rejets que le proche a déclarés LUI-MÊME, s'il l'a autorisé.
 *
 * Échoue FERMÉ : toute incertitude — pas de compte, pas de consentement, portée absente,
 * lecture en erreur — rend `autorise: false` et aucun rejet. Un échec de lecture ne se
 * confond jamais avec « il n'a rien déclaré » : le premier doit bloquer l'usage de ses
 * données, le second l'autorise. Les confondre reviendrait à traiter une panne comme un
 * consentement.
 */
export async function lireRejetsDuProche(
  admin: ClientLecture,
  { piloteId, contactId }: { piloteId: string; contactId: string },
): Promise<LectureDeclarations> {
  // 1 ── Le contact porte-t-il un compte ? Et appartient-il bien au pilote qui demande ?
  //      Le second filtre n'est pas une précaution de confort : sans lui, un contactId
  //      deviné suffirait à lire les déclarations de n'importe qui.
  const { data: contact, error: eContact } = await admin
    .from('contacts').select('proche_user_id')
    .eq('id', contactId).eq('user_id', piloteId).maybeSingle();
  if (eContact) return REFUS('lecture_impossible');
  const procheUserId = contact?.proche_user_id as string | null | undefined;
  if (!procheUserId) return REFUS('aucun_compte');

  // 2 ── Un consentement ACTIF, et portant CET usage.
  const { data: consent, error: eConsent } = await admin
    .from('contact_consents').select('scope')
    .eq('pilote_id', piloteId).eq('contact_id', contactId).eq('status', 'active').maybeSingle();
  if (eConsent) return REFUS('lecture_impossible');
  if (!consent) return REFUS('aucun_consentement');
  const portees = (consent.scope as string[] | null) ?? [];
  if (!portees.includes(PORTEE_EXCLUSIONS_RECO)) return REFUS('portee_absente');

  // 3 ── Ses rejets, et RIEN d'autre. Le filtre sur la famille et la relation est posé
  //      dans la requête : ce qui n'est pas un rejet ne traverse même pas le réseau.
  const { data: lignes, error: eJournal } = await admin
    .from('knowledge_evidences')
    .select('target_family, target_construct, entity_label, relation, severity, superseded_at')
    .eq('user_id', procheUserId).eq('about_kind', 'account')
    .is('superseded_at', null);
  if (eJournal) return REFUS('lecture_impossible');

  const rejets: JournalRejection[] = [];
  for (const l of lignes ?? []) {
    const famille = l.target_family as string;
    if (famille === 'GUARDRAIL') {
      rejets.push({
        label: String(l.target_construct ?? ''),
        family: 'GUARDRAIL',
        severity: l.severity === 'HARD' ? 'HARD' : 'SOFT',
      });
    } else if (famille === 'ENTITY' && (l.relation === 'DISLIKE' || l.relation === 'AVOID')) {
      rejets.push({
        label: String(l.entity_label ?? ''),
        family: 'ENTITY',
        relation: l.relation as string,
        severity: 'SOFT', // un rejet d'entité n'est jamais une interdiction absolue
      });
    }
    // Tout le reste — INTEREST, PREFERENCE, PROFILE, AFFECTION… — est ignoré ICI, et pas
    // « pour plus tard » : l'usage positif n'est pas autorisé par cette portée.
  }
  return { autorise: true, motif: 'autorise', rejets: rejets.filter((r) => r.label !== '') };
}
