// LES SITUATIONS D'UN PROCHE — saisir, retrouver, faire évoluer, et s'en servir avec tact.
//
// Une situation est une note du pilote sur ce que traverse un proche (« Julie vient de perdre
// sa mère »). Deux spécifications se contredisaient : le lot d'origine écrivait des statuts
// `active` / `resolved` que la base refuse ; la spec V26, que la base applique, ne les connaît
// pas. La route échouait donc pour tout le monde, en local comme en production (contraintes
// relues par Estelle le 18 nov.). Décisions du 18 nov., qui alignent tout sur le cycle V26 :
//
//   · « Toujours d'actualité »      → la situation reste vivante, revalidation dans 30 jours ;
//   · « Ce n'est plus d'actualité » → `archivé` : elle quitte la fiche et les recommandations,
//                                     son historique est conservé ;
//   · « C'était une erreur »        → `invalidé` : réservé à l'information fausse.
//   · Une situation SENSIBLE (deuil, santé) est affichée dans la fiche PRIVÉE du pilote,
//     reformulée sobrement, et Candice s'en sert pour adapter ses propositions — sans jamais
//     en nommer le détail dans une suggestion.
//
// TROIS RÈGLES TENUES ICI, ET NULLE PART AILLEURS.
//   1. LA NOTE EST SAUVEGARDÉE AVANT TOUT APPEL AU MODÈLE, avec un résumé de repli. Une panne
//      du modèle ne perd rien : la situation existe, simplement pas encore reformulée.
//   2. LE CONTACT APPARTIENT À L'APPELANT, vérifié en base avant le reste. Aucun client
//      privilégié : tout passe par le client de l'utilisateur, donc par la RLS.
//   3. CE QUI PART VERS LE MODÈLE DE RECOMMANDATION EST PRÉPARÉ ICI, au minimum nécessaire :
//      pour une situation sensible, une consigne générale (« période difficile, privilégier
//      une proposition sans pression ») — le détail reste dans son stockage.
import Anthropic from '@anthropic-ai/sdk';

export const DELAI_REVALIDATION_JOURS = 30;
export const LONGUEUR_MAX_NOTE = 2000;

/** Statuts sous lesquels une situation est VIVANTE (affichée dans « Situation actuelle »). */
export const STATUTS_VIVANTS = ['actif', 'sensible', 'confirmé', 'incertain', 'à_revalider'] as const;
/** Statuts sous lesquels elle peut INFLUENCER une recommandation — si elle est encore à jour. */
export const STATUTS_UTILISABLES = ['actif', 'sensible', 'confirmé', 'incertain'] as const;

export type ActionSituation = 'toujours_actuelle' | 'terminee' | 'erreur';
export type Certitude = 'constat' | 'impression' | 'rapporte';

export interface LectureSituation {
  category: string;
  subcategory: string | null;
  tonality: 'fragile' | 'tendue' | 'positive' | 'neutre';
  emotional_intensity: 'low' | 'medium' | 'high';
  probable_needs: string[];
  /** 1 anodin → 4 très sensible (deuil, santé grave). */
  sensitivity_level: 1 | 2 | 3 | 4;
  /** Ce que la note AFFIRME : un fait constaté, une impression du pilote, ou un propos rapporté. */
  certitude: Certitude;
  /** 1–2 phrases sobres, fidèles, à la 3ᵉ personne. Jamais la note brute, jamais alarmiste. */
  reformulation: string;
}

const CATEGORIES = ['travail', 'santé', 'famille', 'couple', 'humeur', 'finances', 'deuil', 'autre'];
const INTENSITE_FR = { low: 'faible', medium: 'moyen', high: 'élevé' } as const;
/** Catégories dont le détail reste confidentiel quelles que soient les autres indications. */
const CATEGORIES_CONFIDENTIELLES = new Set(['santé', 'deuil']);

/** Résumé de repli, écrit AVANT le modèle : sobre, sans rien de la note. */
export const resumeDeRepli = (prenom: string) =>
  `${prenom || 'Ce proche'} traverse une situation que tu as notée.`;

const OUTIL = {
  name: 'situation',
  description: 'Lecture structurée d’une note du pilote sur la situation d’un proche.',
  input_schema: {
    type: 'object' as const,
    properties: {
      category: { type: 'string', enum: CATEGORIES },
      subcategory: { type: 'string' },
      tonality: { type: 'string', enum: ['fragile', 'tendue', 'positive', 'neutre'] },
      emotional_intensity: { type: 'string', enum: ['low', 'medium', 'high'] },
      probable_needs: { type: 'array', items: { type: 'string' } },
      sensitivity_level: { type: 'integer', minimum: 1, maximum: 4, description: '3 ou 4 dès qu’il s’agit de deuil, de santé, de rupture grave.' },
      certitude: { type: 'string', enum: ['constat', 'impression', 'rapporte'], description: 'constat : le pilote affirme un fait. impression : « j’ai l’impression », « elle a l’air ». rapporte : « on m’a dit », « il paraît ».' },
      reformulation: { type: 'string', description: '1–2 phrases sobres et fidèles, 3ᵉ personne, jamais alarmistes, jamais médicales. Une impression reste formulée comme une impression.' },
    },
    required: ['category', 'tonality', 'emotional_intensity', 'probable_needs', 'sensitivity_level', 'certitude', 'reformulation'],
  },
};

const SYSTEME = `Tu lis une note qu'une personne a écrite sur la situation d'un de ses proches. Tu la structures, sans rien ajouter.
- Sois factuel et bienveillant. Aucune interprétation clinique, aucun diagnostic.
- N'invente aucun besoin, aucun goût : une période difficile ne dit pas ce que la personne veut recevoir.
- Si la note est une impression ou un propos rapporté, dis-le dans « certitude » et garde ce ton dans la reformulation (« d'après ce que tu as perçu… »).
- La reformulation ne répète pas la note mot pour mot.`;

/** Appelle le modèle. LÈVE s'il ne répond pas ou répond hors format. */
export async function lireSituationParModele(note: string, prenom: string): Promise<LectureSituation> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 700,
    system: SYSTEME, tools: [OUTIL], tool_choice: { type: 'tool', name: 'situation' },
    messages: [{ role: 'user', content: `Prénom du proche : ${prenom}\nNote : « ${note} »` }],
  });
  const bloc = msg.content.find((b) => b.type === 'tool_use');
  if (!bloc || bloc.type !== 'tool_use') throw new Error('réponse du modèle sans lecture structurée');
  return validerLecture(bloc.input as Partial<LectureSituation>);
}

/** Rend une lecture conforme, ou LÈVE : on n'écrit pas une valeur que la base refusera. */
export function validerLecture(l: Partial<LectureSituation>): LectureSituation {
  const tonalites = ['fragile', 'tendue', 'positive', 'neutre'];
  if (!l.reformulation?.trim()) throw new Error('lecture sans reformulation');
  if (!tonalites.includes(l.tonality as string)) throw new Error(`tonalité inconnue « ${l.tonality} »`);
  if (!(l.emotional_intensity! in INTENSITE_FR)) throw new Error(`intensité inconnue « ${l.emotional_intensity} »`);
  const niveau = Number(l.sensitivity_level);
  return {
    category: CATEGORIES.includes(l.category as string) ? (l.category as string) : 'autre',
    subcategory: l.subcategory?.trim() || null,
    tonality: l.tonality as LectureSituation['tonality'],
    emotional_intensity: l.emotional_intensity as LectureSituation['emotional_intensity'],
    probable_needs: Array.isArray(l.probable_needs) ? l.probable_needs.filter((x) => typeof x === 'string').slice(0, 4) : [],
    // Une sensibilité illisible vaut la plus haute : on protège dans le doute.
    sensitivity_level: (niveau >= 1 && niveau <= 4 ? niveau : 4) as LectureSituation['sensitivity_level'],
    certitude: (['constat', 'impression', 'rapporte'].includes(l.certitude as string) ? l.certitude : 'impression') as Certitude,
    reformulation: l.reformulation.trim(),
  };
}

/** Ce que la base reçoit pour une lecture : vocabulaire V26, et rien que lui. */
export function colonnesDepuisLecture(l: LectureSituation) {
  const sensible = l.sensitivity_level >= 3 || CATEGORIES_CONFIDENTIELLES.has(l.category);
  return {
    reformulated_text: l.reformulation,
    sanitized_summary: l.reformulation,
    category: l.category,
    subcategory: l.subcategory,
    tonality: l.tonality,
    emotional_intensity: INTENSITE_FR[l.emotional_intensity],
    probable_needs: l.probable_needs,
    sensitivity_level: l.sensitivity_level,
    // Le STATUT dit le cycle de vie et la sensibilité ; la CERTITUDE est portée à part
    // (fiabilité de la source) : une impression reste une impression, même sensible.
    status: sensible ? 'sensible' : (l.certitude === 'constat' ? 'actif' : 'incertain'),
    source_reliability: l.certitude === 'constat' ? 'moyenne' : 'faible',
  };
}

interface Client {
  from(table: string): any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class SituationRefusee extends Error {
  constructor(message: string, readonly code: 400 | 404 | 503) { super(message); }
}

/**
 * Enregistre une situation. Ordre : contrôle du lien → sauvegarde → modèle → enrichissement.
 * `lire` est injectable pour les essais ; par défaut, le modèle.
 */
export async function enregistrerSituation(
  supabase: Client,
  input: { userId: string; contactId: string; rawText: string },
  lire: (note: string, prenom: string) => Promise<LectureSituation> = lireSituationParModele,
): Promise<{ id: string; enrichie: boolean }> {
  const note = (input.rawText ?? '').trim();
  if (!note) throw new SituationRefusee('note vide', 400);
  if (note.length > LONGUEUR_MAX_NOTE) throw new SituationRefusee(`note trop longue (${LONGUEUR_MAX_NOTE} caractères au plus)`, 400);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.contactId ?? '')) {
    throw new SituationRefusee('contactId invalide', 400);
  }

  // ── 1. LE LIEN. Le contact doit appartenir à l'appelant. AVANT tout appel au modèle.
  const { data: contact, error: eC } = await supabase.from('contacts')
    .select('id, name').eq('id', input.contactId).eq('user_id', input.userId).maybeSingle();
  if (eC) throw new SituationRefusee('vérification impossible', 503);
  if (!contact) throw new SituationRefusee('Not found', 404);
  const prenom = String(contact.name ?? '').trim().split(/\s+/)[0] ?? '';

  // ── 2. LA SAUVEGARDE. La note existe avant que le modèle soit sollicité.
  const revalidation = new Date(Date.now() + DELAI_REVALIDATION_JOURS * 86_400_000).toISOString();
  const { data: cree, error: eI } = await supabase.from('memories').insert({
    pilot_id: input.userId, contact_id: input.contactId,
    raw_input: note, raw_text: note,
    sanitized_summary: resumeDeRepli(prenom),
    type: 'situation', memory_type: 'situation_émotionnelle',
    // Pas encore lue : on ne sait ni sa sensibilité ni sa certitude. On protège dans le doute.
    status: 'sensible', sensitivity_level: 4,
    source: 'pilote', source_reliability: 'moyenne',
    revalidation_date: revalidation, revalidate_at: revalidation,
  }).select('id').single();
  if (eI || !cree) throw new SituationRefusee(eI?.message ?? 'écriture impossible', 503);

  // ── 3. LA LECTURE, puis l'enrichissement. Un échec laisse la note sauvegardée telle quelle.
  try {
    const lecture = await lire(note, prenom);
    const { error: eU } = await supabase.from('memories')
      .update({ ...colonnesDepuisLecture(lecture), updated_at: new Date().toISOString() })
      .eq('id', cree.id).eq('pilot_id', input.userId);
    if (eU) throw new Error(eU.message);
    return { id: cree.id, enrichie: true };
  } catch (e) {
    console.error('[situations] lecture impossible — la note reste sauvegardée', e instanceof Error ? e.message : e);
    return { id: cree.id, enrichie: false };
  }
}

/** Fait évoluer une situation. Rend `false` si elle n'existe pas pour cet appelant. */
export async function agirSurSituation(
  supabase: Client,
  input: { userId: string; id: string; action: ActionSituation },
): Promise<boolean> {
  const { data: mem } = await supabase.from('memories')
    .select('id, status').eq('id', input.id).eq('pilot_id', input.userId).eq('type', 'situation').maybeSingle();
  if (!mem) return false;
  const maintenant = new Date().toISOString();
  const valeurs: Record<string, unknown> = { updated_at: maintenant };
  if (input.action === 'toujours_actuelle') {
    const d = new Date(Date.now() + DELAI_REVALIDATION_JOURS * 86_400_000).toISOString();
    valeurs.revalidation_date = d; valeurs.revalidate_at = d;
    if (mem.status === 'à_revalider') valeurs.status = 'actif';
  } else if (input.action === 'terminee') valeurs.status = 'archivé';
  else valeurs.status = 'invalidé';
  const { error } = await supabase.from('memories').update(valeurs).eq('id', input.id).eq('pilot_id', input.userId);
  if (error) throw new Error(error.message);
  return true;
}

export interface SituationAffichee {
  id: string; reformulated_text: string | null; sanitized_summary: string; category: string | null;
  tonality: string | null; emotional_intensity: string | null; probable_needs: string[] | null;
  status: string; source_reliability: string | null; revalidation_date: string | null; created_at: string;
}

/** Les situations vivantes d'un proche, pour la carte « Situation actuelle » de la fiche PRIVÉE. */
export async function situationsActuelles(
  supabase: Client, input: { userId: string; contactId: string },
): Promise<SituationAffichee[]> {
  const { data, error } = await supabase.from('memories')
    .select('id, reformulated_text, sanitized_summary, category, tonality, emotional_intensity, probable_needs, status, source_reliability, revalidation_date, created_at')
    .eq('contact_id', input.contactId).eq('pilot_id', input.userId).eq('type', 'situation')
    .in('status', [...STATUTS_VIVANTS])
    .order('created_at', { ascending: false }).limit(10);
  if (error) throw new Error(error.message);
  return (data ?? []) as SituationAffichee[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * CE QUE LE MOTEUR DE RECOMMANDATION REÇOIT.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface SituationPourReco {
  /** La consigne transmise au modèle. Pour une situation confidentielle : générale, sans détail. */
  readonly consigne: string;
  readonly confidentielle: boolean;
  readonly incertaine: boolean;
  /** Mots que la suggestion ne doit PAS contenir. Jamais transmis au modèle : filtre de sortie. */
  readonly termesInterdits: readonly string[];
}

const CONSIGNE_GENERALE: Record<string, string> = {
  fragile: 'période difficile, privilégier une proposition sans pression',
  tendue: 'période tendue, privilégier la simplicité et la discrétion',
  positive: 'moment heureux, une attention qui le célèbre est possible',
  neutre: 'période particulière, rester simple',
};
const TERMES_PAR_CATEGORIE: Record<string, string[]> = {
  deuil: ['deuil', 'décès', 'décéd', 'mort', 'perdu sa', 'perdu son', 'perte de sa', 'perte de son', 'enterrement', 'obsèques', 'funérailles', 'condoléances'],
  santé: ['maladie', 'malade', 'cancer', 'hôpital', 'hospital', 'opération', 'chirurg', 'traitement', 'diagnostic', 'dépression', 'burn-out', 'burn out', 'chimio', 'médic', 'thérapie'],
};

/** Une ligne de `memories` → ce que la recommandation a le droit d'en savoir, ou `null`. */
export function preparerPourReco(
  s: { status: string; category: string | null; subcategory?: string | null; tonality: string | null;
       sensitivity_level?: number | null; source_reliability?: string | null; revalidation_date?: string | null },
  maintenant: Date = new Date(),
): SituationPourReco | null {
  // Archivée, invalidée, masquée, à revalider : elle n'influence plus rien.
  if (!(STATUTS_UTILISABLES as readonly string[]).includes(s.status)) return null;
  // Date de revalidation dépassée : l'information n'est plus tenue pour actuelle.
  if (s.revalidation_date && Date.parse(s.revalidation_date) < maintenant.getTime()) return null;
  // Pas encore lue par le modèle (pas de tonalité) : on ne sait pas quoi en dire.
  if (!s.tonality || !(s.tonality in CONSIGNE_GENERALE)) return null;

  const confidentielle = s.status === 'sensible' || (s.sensitivity_level ?? 4) >= 3
    || CATEGORIES_CONFIDENTIELLES.has(s.category ?? '');
  const incertaine = s.status === 'incertain' || s.source_reliability === 'faible' || s.source_reliability === 'très_faible';
  let consigne = CONSIGNE_GENERALE[s.tonality];
  // Le sujet n'est nommé que s'il n'est pas confidentiel.
  if (!confidentielle && s.category && s.category !== 'autre') consigne += ` (contexte : ${s.category})`;
  if (incertaine) consigne = `d'après une impression non confirmée — ${consigne} ; ne rien tenir pour acquis`;
  const termes = confidentielle
    ? [...(TERMES_PAR_CATEGORIE[s.category ?? ''] ?? []), ...Object.values(TERMES_PAR_CATEGORIE).flat()]
    : [];
  return { consigne, confidentielle, incertaine, termesInterdits: [...new Set(termes)] };
}

/**
 * Le contexte de situation d'un proche pour une recommandation. Vérifie l'identité du proche
 * (le contact appartient à l'appelant) par la requête elle-même ; rend [] dans tous les cas
 * d'incertitude — une recommandation sans ce contexte vaut mieux qu'un contexte mal acquis.
 */
export async function situationsPourReco(
  supabase: Client, input: { userId: string; contactId: string }, maintenant: Date = new Date(),
): Promise<SituationPourReco[]> {
  try {
    const { data: contact } = await supabase.from('contacts').select('id').eq('id', input.contactId).eq('user_id', input.userId).maybeSingle();
    if (!contact) return [];
    const { data, error } = await supabase.from('memories')
      .select('status, category, subcategory, tonality, sensitivity_level, source_reliability, revalidation_date')
      .eq('contact_id', input.contactId).eq('pilot_id', input.userId).eq('type', 'situation')
      .in('status', [...STATUTS_UTILISABLES]).order('created_at', { ascending: false }).limit(5);
    if (error) return [];
    return ((data ?? []) as Parameters<typeof preparerPourReco>[0][])
      .map((s) => preparerPourReco(s, maintenant)).filter((x): x is SituationPourReco => x !== null);
  } catch { return []; }
}

/** Vrai si un texte de suggestion nomme un détail confidentiel. */
export function nommeUnDetailConfidentiel(texte: string, situations: readonly SituationPourReco[]): boolean {
  const t = texte.toLowerCase();
  return situations.some((s) => s.termesInterdits.some((mot) => t.includes(mot.toLowerCase())));
}
