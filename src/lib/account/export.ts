// L'EXPORT DE SES DONNÉES — un seul constructeur pour les deux routes (téléchargement, courriel).
//
// Trois règles :
//   1. COMPLET. Tout ce que Candice détient et qui APPARTIENT à la personne : ce qu'elle a dit
//      d'elle-même, ce qu'elle a saisi sur ses proches, ce que Candice en a déduit pour elle
//      (journal de connaissance), ses souvenirs, son Carnet, ses consentements.
//   2. PAS LES DONNÉES DES AUTRES. Ce que d'autres ont saisi, réglé ou réservé n'est pas remis,
//      même quand cela la concerne : l'identité d'un autre compte, ce qu'un proche a autorisé
//      (réglage qui doit rester inconnu d'elle), qui a réservé une envie (c'est une surprise),
//      ce qu'un autre pilote note sur elle. La section `non_inclus` dit lesquelles, par
//      catégorie — sans dire s'il en existe.
//   3. RIEN D'UTILISABLE CONTRE ELLE. Ni empreinte de jeton, ni clé de notification.
//
// Les lectures passent par le client privilégié, TOUJOURS filtrées sur l'identifiant de la
// personne connectée, et paginées : au-delà de mille lignes, une lecture simple est tronquée
// sans prévenir — un export qui se croit complet et ne l'est pas.

interface Requete { select(c: string): Requete; eq(c: string, v: unknown): Requete; neq(c: string, v: unknown): Requete; order(c: string, o?: { ascending?: boolean }): Requete; range(a: number, b: number): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }> }
interface ClientPrivilegie { from(table: string): unknown }

const PAGE = 1000;
type Ligne = Record<string, unknown>;

/** Colonne d'ordre (clé primaire) des tables qui n'ont pas de colonne `id` : la pagination exige un ordre stable. */
const CLE_D_ORDRE: Record<string, string> = { knowledge_signals: 'signal_key' };

async function toutLire(admin: ClientPrivilegie, table: string, colonne: string, valeur: string, filtre?: (q: Requete) => Requete): Promise<{ lignes: Ligne[]; erreur: string | null }> {
  const lignes: Ligne[] = [];
  for (let debut = 0; ; debut += PAGE) {
    let q = (admin.from(table) as Requete).select('*').eq(colonne, valeur);
    if (filtre) q = filtre(q);
    const { data, error } = await q.order(CLE_D_ORDRE[table] ?? 'id', { ascending: true }).range(debut, debut + PAGE - 1);
    if (error) return { lignes, erreur: `${table} : ${error.message}` };
    lignes.push(...((data ?? []) as Ligne[]));
    if ((data ?? []).length < PAGE) return { lignes, erreur: null };
  }
}

const sans = (cles: string[]) => (l: Ligne): Ligne => Object.fromEntries(Object.entries(l).filter(([k]) => !cles.includes(k)));

/** Tables dont chaque ligne appartient à la personne par une seule colonne. */
const A_SOI: [nom: string, table: string, colonne: string, nettoyer?: (l: Ligne) => Ligne][] = [
  // — ce qu'elle a dit d'elle-même
  ['profil', 'my_profile', 'user_id'],
  ['analyses', 'profile_analysis', 'user_id'],
  ['analyses_sections', 'profile_analysis_sections', 'user_id'],
  ['progression', 'profile_completion', 'user_id'],
  ['decouverte_sessions', 'discovery_sessions', 'user_id'],
  // Qui a réservé une de ses envies ne lui est pas dit : c'est une surprise, et l'identité d'un autre.
  ['envies', 'my_wishlist_items', 'user_id', sans(['reserved_by', 'reservation_status', 'reserved_at', 'reservation_expires_at'])],
  ['etats_declares', 'person_states', 'declared_by'],
  // — le journal de connaissance qu'elle possède (sur elle et sur ses proches)
  ['journal_sources', 'knowledge_sources', 'user_id'],
  ['journal_preuves', 'knowledge_evidences', 'user_id'],
  ['journal_faits', 'knowledge_facts', 'user_id'],
  ['journal_connaissance_ouverte', 'knowledge_open_knowledge', 'user_id'],
  ['journal_signaux', 'knowledge_signals', 'user_id'],
  ['journal_extractions', 'knowledge_extraction_records', 'user_id'],
  ['journal_instantanes', 'knowledge_signal_snapshots', 'user_id'],
  // — ce qu'elle a saisi sur ses proches
  ['questionnaires_de_proches', 'questionnaire_responses', 'user_id'],
  ['notes', 'profile_notes', 'user_id'],
  ['confidences', 'confidences', 'user_id'],
  ['mises_a_jour_depuis_confidences', 'profile_updates_from_confidences', 'user_id'],
  ['souvenirs', 'memories', 'pilot_id'],
  ['carnet_d_envies', 'carnet_envies_items', 'pilot_id'],
  ['idees_pour_proches', 'contact_reco_items', 'pilot_id', sans(['reserved_by'])],
  ['idees_refusees', 'reco_refusals', 'pilot_id'],
  ['conversations', 'conversation_threads', 'user_id'],
  ['questions_et_reponses', 'context_journal', 'user_id'],
  // — ce que Candice a produit pour elle
  ['recommandations', 'contact_recommendations', 'user_id', sans(['proche_compte', 'portees_proche'])],
  ['journal_des_attentions', 'attention_log', 'user_id', sans(['proche_compte', 'portees_proche'])],
  ['suggestions', 'suggestions', 'user_id'],
  ['suggestions_proactives', 'proactive_suggestions', 'user_id'],
  ['signaux', 'contextual_signals', 'user_id'],
  ['retours_cadence', 'cadence_feedback', 'user_id'],
  ['retours_budget', 'budget_feedback', 'user_id'],
  ['objectif_epargne', 'savings_goal', 'user_id'],
  ['points', 'user_points', 'user_id'],
  ['cadence', 'cadence_log', 'user_id'],
  ['signaux_internes', 'signals', 'pilot_id'],
  ['traitements', 'processing_log', 'pilot_id'],
  ['reponses_de_fiche_partagee', 'shared_profile_responses', 'user_id'],
  ['anciens_liens_d_invitation', 'share_links', 'sender_id'],
  // — son compte
  ['invitations_creees', 'invite_links', 'pilote_id'],
  ['liens_de_partage', 'profile_share_links', 'owner_id', sans(['token_hash', 'claimed_by'])],
  ['notifications', 'notification_log', 'user_id'],
  ['appareils_notifies', 'push_subscriptions', 'user_id', sans(['p256dh_key', 'auth_key', 'endpoint'])],
  ['vie_du_compte', 'account_lifecycle_events', 'user_id'],
  ['courriels_declenches', 'envois_courriel', 'expediteur', sans(['destinataire_h'])],
];

export const NON_INCLUS = [
  { categorie: "L'identité des autres comptes", pourquoi: "Dans tes consentements et sur tes fiches, l'autre personne est désignée par son rôle, jamais par son identifiant ou son adresse." },
  { categorie: "Ce qu'un proche a autorisé ou refusé à Candice", pourquoi: "Ces réglages lui appartiennent et ne te sont jamais montrés, pour qu'il puisse dire non sans que tu le saches." },
  { categorie: "Qui a réservé une de tes envies", pourquoi: "C'est une surprise, et c'est l'information de quelqu'un d'autre." },
  { categorie: "Ce que d'autres personnes ont saisi à ton sujet", pourquoi: "Leurs notes, leurs souvenirs et l'analyse qu'elles tiennent sur toi sont leurs données ; elles ne te sont visibles que si elles choisissent de te les partager." },
  { categorie: "Le profil des personnes qui partagent leur fiche avec toi", pourquoi: "Tu le consultes dans l'application tant qu'elles le partagent ; il ne t'appartient pas." },
] as const;

export interface Export {
  exporte_le: string;
  version: 2;
  compte: { id: string; email: string | null; cree_le: string | null };
  donnees: Record<string, Ligne[]>;
  tes_proches: Ligne[];
  consentements: Ligne[];
  non_inclus: typeof NON_INCLUS;
  lectures_incompletes: string[];
}

export async function construireExport(
  admin: ClientPrivilegie,
  personne: { id: string; email?: string | null; created_at?: string | null },
): Promise<Export> {
  const uid = personne.id;
  const incompletes: string[] = [];
  const donnees: Record<string, Ligne[]> = {};
  for (const [nom, table, colonne, nettoyer] of A_SOI) {
    const { lignes, erreur } = await toutLire(admin, table, colonne, uid);
    if (erreur) incompletes.push(erreur);
    donnees[nom] = nettoyer ? lignes.map(nettoyer) : lignes;
  }

  // Ses fiches : le compte rattaché est celui d'une autre personne — on dit seulement s'il y en a un.
  const fiches = await toutLire(admin, 'contacts', 'user_id', uid);
  if (fiches.erreur) incompletes.push(fiches.erreur);
  const tes_proches = fiches.lignes.map((f) => {
    const { proche_user_id, proche_lien_confirme_par, ...reste } = f;
    return { ...reste, rattachee_a_un_compte: !!proche_user_id, lien_confirme_par_la_personne: !!proche_lien_confirme_par };
  });

  // Ses consentements — vus de SA place, l'autre partie réduite à son rôle.
  const consentements: Ligne[] = [];
  // … ceux où elle est du côté « pilote » : ce qu'elle partage (sa fiche, son analyse). JAMAIS les
  //   autorisations d'usage de ses proches (`profile_usage`), qui ne lui appartiennent pas.
  const cotePilote = await toutLire(admin, 'contact_consents', 'pilote_id', uid, (q) => q.neq('kind', 'profile_usage'));
  if (cotePilote.erreur) incompletes.push(cotePilote.erreur);
  for (const c of cotePilote.lignes) consentements.push(vuDeSaPlace(c, uid));
  // … ceux où elle est l'autre partie : ce qu'elle a autorisé, accepté ou demandé.
  const coteProche = await toutLire(admin, 'contact_consents', 'proche_user_id', uid);
  if (coteProche.erreur) incompletes.push(coteProche.erreur);
  for (const c of coteProche.lignes) consentements.push(vuDeSaPlace(c, uid));
  // Les questions qu'on lui a posées à propos d'une idée, et ses propres réponses.
  const validations = await toutLire(admin, 'cross_validations', 'proche_user_id', uid);
  if (validations.erreur) incompletes.push(validations.erreur);
  donnees.questions_recues = validations.lignes.map((l) => ({ id: l.id, question: l.question_text, ta_reponse: l.proche_answer, statut: l.status, cree_le: l.created_at, repondu_le: l.answered_at }));
  const posees = await toutLire(admin, 'cross_validations', 'pilot_id', uid);
  if (posees.erreur) incompletes.push(posees.erreur);
  donnees.questions_posees = posees.lignes.map(sans(['proche_user_id']));

  return {
    exporte_le: new Date().toISOString(), version: 2,
    compte: { id: uid, email: personne.email ?? null, cree_le: personne.created_at ?? null },
    donnees, tes_proches, consentements, non_inclus: NON_INCLUS, lectures_incompletes: incompletes,
  };
}

/** Un consentement tel que la personne peut le recevoir : son rôle, celui de l'autre, jamais l'identité de l'autre. */
export function vuDeSaPlace(c: Ligne, uid: string): Ligne {
  const estPilote = c.pilote_id === uid;
  const type = c.kind as string;
  const role =
    type === 'profile_view' ? (estPilote ? 'tu partages ta fiche' : 'on partage une fiche avec toi')
    : type === 'profile_usage' ? 'tu autorises l’usage de tes données'
    : estPilote ? 'tu proposes de partager ton analyse' : 'on te propose de voir une analyse';
  return {
    id: c.id, type, ton_role: role, statut: c.status, portee: c.scope,
    demande_par_toi: c.requested_by === uid, accorde_par_toi: c.granted_by === uid,
    demande_le: c.requested_at ?? c.created_at ?? null, repondu_le: c.responded_at ?? null, accorde_le: c.granted_at ?? null,
    autre_partie: 'une autre personne',
  };
}
