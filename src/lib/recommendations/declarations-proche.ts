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
// ET LA TROISIÈME EXIGENCE, LA PLUS FACILE À OUBLIER : tous les rejets qui vivent sur le
// compte de Thibaud ne viennent pas de Thibaud. Son journal porte aussi ce qu'un proche a
// rapporté de lui, ce qu'on a observé, et ce qu'un modèle a inféré d'un texte libre. Rien
// de tout cela n'est une déclaration. Un rejet INFÉRÉ qui écarterait une idée ferait
// décider, pour lui, une machine qui a cru comprendre — exactement ce que le fait
// d'exiger son consentement cherchait à éviter. La provenance est donc vérifiée ligne par
// ligne, et `source_type` ne vit PAS sur l'evidence : il faut le charger depuis la source.
//
// LECTURE SOUS SERVICE_ROLE, et il n'y a pas d'autre choix : la RLS de Thibaud interdit
// au pilote de lire ses lignes, ce qui est exactement ce qu'on veut. Le franchissement
// est donc concentré ICI, derrière un consentement actif et explicite, et le résultat ne
// quitte jamais le serveur.
import type { JournalRejection } from './rejection-match';
import { isSelfDeclaredAct, type SourceType } from '../knowledge/sources';

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
  /** Rejets présents sur son compte mais ÉCARTÉS faute de provenance déclarative, par
   *  motif. Sert au diagnostic ; ne porte aucun libellé, donc ne peut rien révéler. */
  readonly ecartesSansDeclaration: Readonly<Record<string, number>>;
}

const REFUS = (motif: MotifLecture): LectureDeclarations =>
  ({ autorise: false, motif, rejets: [], ecartesSansDeclaration: {} });

type Reponse = { data: Record<string, unknown>[] | null; error: unknown };
interface Requete extends PromiseLike<Reponse> {
  select(cols: string): Requete;
  eq(col: string, val: unknown): Requete;
  in(col: string, vals: readonly string[]): Requete;
  is(col: string, val: null): Requete;
  maybeSingle(): PromiseLike<{ data: Record<string, unknown> | null; error: unknown }>;
}
export interface ClientLecture { from(table: string): Requete; }

/** Un rejet n'est utilisable que s'il vient de la personne elle-même, explicitement.
 *  `assertion_status` écarte ce qui est inféré ; `isSelfDeclaredAct` écarte ce qu'un tiers
 *  a rapporté et ce qui a été observé. Les deux sont nécessaires : une inférence peut
 *  naître d'une source par ailleurs déclarative, et un rapport de tiers peut être
 *  « explicite » sans être SA parole. */
function motifDeRejetNonDeclaratif(assertionStatus: unknown, sourceType: SourceType): string | null {
  if (assertionStatus !== 'explicit') return 'infere';
  if (!isSelfDeclaredAct(sourceType)) {
    return sourceType === 'observed_behavior' ? 'observe' : 'rapporte_par_un_tiers';
  }
  return null;
}

/**
 * Les rejets que le proche a déclarés LUI-MÊME, s'il l'a autorisé.
 *
 * Échoue FERMÉ : toute incertitude — pas de compte, pas de consentement, portée absente,
 * lecture en erreur, source introuvable — rend `autorise: false` ou écarte la ligne. Un
 * échec de lecture ne se confond jamais avec « il n'a rien déclaré » : le premier doit
 * bloquer l'usage de ses données, le second l'autorise. Les confondre reviendrait à
 * traiter une panne comme un consentement.
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
    .from('contact_consents').select('scope, granted_by')
    .eq('pilote_id', piloteId).eq('contact_id', contactId).eq('proche_user_id', procheUserId)
    .eq('kind', 'contact_analysis').eq('status', 'active').maybeSingle();
  if (eConsent) return REFUS('lecture_impossible');
  if (!consent) return REFUS('aucun_consentement');
  // L'accord doit avoir été donné par le proche LUI-MÊME, pour CE compte : la preuve est
  // écrite par la base (migration 112). Le demandeur pouvait jusque-là se l'accorder.
  if (consent.granted_by !== procheUserId) return REFUS('aucun_consentement');
  const portees = (consent.scope as string[] | null) ?? [];
  if (!portees.includes(PORTEE_EXCLUSIONS_RECO)) return REFUS('portee_absente');

  // 3 ── Les lignes candidates : son compte, non remplacées. Le filtre de FORME est posé
  //      ici ; le filtre de PROVENANCE ne peut pas l'être, source_type vivant sur la source.
  const { data: lignes, error: eJournal } = await admin
    .from('knowledge_evidences')
    .select('source_id, target_family, target_construct, entity_label, relation, severity, assertion_status')
    .eq('user_id', procheUserId).eq('about_kind', 'account')
    .is('superseded_at', null);
  if (eJournal) return REFUS('lecture_impossible');

  const candidates = (lignes ?? []).filter((l) =>
    l.target_family === 'GUARDRAIL' || (l.target_family === 'ENTITY' && (l.relation === 'DISLIKE' || l.relation === 'AVOID')));
  if (candidates.length === 0) return { autorise: true, motif: 'autorise', rejets: [], ecartesSansDeclaration: {} };

  // 4 ── LA PROVENANCE. source_type n'existe pas sur l'evidence : il se charge depuis la
  //      source. Une source introuvable rend la provenance INVÉRIFIABLE — on écarte la
  //      ligne plutôt que de la supposer déclarative.
  const sourceIds = [...new Set(candidates.map((l) => String(l.source_id)))];
  const { data: sources, error: eSources } = await admin
    .from('knowledge_sources').select('id, source_type').in('id', sourceIds);
  if (eSources) return REFUS('lecture_impossible');
  const typeParSource = new Map((sources ?? []).map((s) => [String(s.id), s.source_type as SourceType]));

  const rejets: JournalRejection[] = [];
  const ecartes: Record<string, number> = {};
  const ecarter = (motif: string) => { ecartes[motif] = (ecartes[motif] ?? 0) + 1; };

  for (const l of candidates) {
    const sourceType = typeParSource.get(String(l.source_id));
    if (sourceType === undefined) { ecarter('source_introuvable'); continue; }

    let motif: string | null;
    try {
      motif = motifDeRejetNonDeclaratif(l.assertion_status, sourceType);
    } catch {
      // isSelfDeclaredAct jette sur un type non décidé : un type inconnu n'est pas
      // déclaratif par défaut. Échouer fermé, pas deviner.
      ecarter('source_type_inconnu'); continue;
    }
    if (motif !== null) { ecarter(motif); continue; }

    if (l.target_family === 'GUARDRAIL') {
      rejets.push({
        label: String(l.target_construct ?? ''), family: 'GUARDRAIL',
        severity: l.severity === 'HARD' ? 'HARD' : 'SOFT',
      });
    } else {
      rejets.push({
        label: String(l.entity_label ?? ''), family: 'ENTITY',
        relation: l.relation as string,
        severity: 'SOFT', // un rejet d'entité n'est jamais une interdiction absolue
      });
    }
  }
  return {
    autorise: true, motif: 'autorise',
    rejets: rejets.filter((r) => r.label !== ''),
    ecartesSansDeclaration: ecartes,
  };
}
