// ÉTAPE 1.1 (hsg §48quater) — BLOC TRAITS de la fiche proche LU DEPUIS LE JOURNAL (about=contact),
// par construct. Remplace la lecture à plat de questionnaire_responses (slugs bruts). La donnée est
// propre à la source : AFFECTION_RECEIVE_WORDS → « Les mots », jamais « I1.1 » ni une phrase entière.
// PRÉSÉANCE par construct (resolveJournalRows, §48bis) : niveau le plus fort gagne, récence à niveau égal —
// comme tous les lecteurs du journal, jamais la récence seule. N'invente aucun libellé : réutilise les maps
// du vocabulaire canonique ; une famille sans libellé connu n'est pas rendue (plutôt que bricoler).

import { PROFILE_FUNCTIONING_LABELS, PROFILE_ORIENTATION_LABELS, NEED_LABELS } from '../knowledge/vocabulary';
import { resolveJournalRows } from '../knowledge/preseance';

/** Modalités d'affection → libellé (repris de la légende de respiration). */
const MODALITY_LABELS: Record<string, string> = {
  WORDS: 'Les mots', SERVICES: "Les gestes, l'aide", PERSONALIZED_GIFT: 'Un cadeau pensé',
  SYMBOLIC_GIFT: 'Un cadeau qui a du sens', QUALITY_TIME: 'Le temps partagé',
  MICRO_ATTENTIONS: 'Les petites attentions', SURPRISE: 'La surprise',
};

export interface TraitRow { readonly label: string; readonly value: string; }

interface EvidenceLite {
  target_family: string; target_construct: string;
  direction?: string | null; modality?: string | null; rank?: number | null;
  assertion_basis: string; source_type: string; created_at: string;
}
export interface ContactJournalClient {
  from(t: string): { select(c: string): { eq(c: string, v: string): { eq(c: string, v: string): Promise<{ data: unknown[] | null; error: { message: string } | null }> } } };
}

/**
 * Lit le journal du contact et en dérive les lignes de traits (familles à libellé canonique connu).
 * Récence par construct. Renvoie [] si rien (fiche vide → la personne (re)remplit).
 */
export async function readContactTraitRows(client: ContactJournalClient, userId: string, contactId: string): Promise<TraitRow[]> {
  const { data, error } = await client.from('knowledge_evidences')
    .select('target_family, target_construct, direction, modality, rank, assertion_basis, source_type, created_at')
    .eq('user_id', userId).eq('about_id', contactId);
  if (error) throw new Error(`[traits-from-journal] ${error.message}`);
  const rows = (data ?? []) as EvidenceLite[];

  // PRÉSÉANCE par construct (resolveJournalRows, hsg §48bis) : niveau le plus fort, récence à niveau égal —
  // JAMAIS la récence seule. La fiche proche lit le journal depuis le début ; sans préséance, une inférence
  // écrasait une déclaration en silence ici aussi.
  const ev = resolveJournalRows(rows);

  const out: TraitRow[] = [];
  const join = (xs: string[]) => xs.filter(Boolean).join(', ');

  // AFFECTION reçue (ex love_language/appreciation_style, qui affichaient des slugs) — par rang si présent
  const affection = ev.filter((e) => e.target_family === 'AFFECTION_LANGUAGE' && e.direction === 'receive')
    .sort((a, b) => (a.rank ?? 9) - (b.rank ?? 9))
    .map((e) => MODALITY_LABELS[e.modality ?? ''] ?? null).filter((x): x is string => !!x);
  if (affection.length) out.push({ label: 'Ce qui la touche', value: join(affection) });

  // PROFILE — fonctionnement
  const functioning = ev.filter((e) => e.target_construct in PROFILE_FUNCTIONING_LABELS)
    .map((e) => PROFILE_FUNCTIONING_LABELS[e.target_construct as keyof typeof PROFILE_FUNCTIONING_LABELS].split(' —')[0]);
  if (functioning.length) out.push({ label: 'Comment elle fonctionne', value: join(functioning) });

  // PROFILE — orientation (ce qui compte dans ses choix)
  const orientation = ev.filter((e) => e.target_construct in PROFILE_ORIENTATION_LABELS)
    .map((e) => PROFILE_ORIENTATION_LABELS[e.target_construct as keyof typeof PROFILE_ORIENTATION_LABELS].replace(/\s*\(.*\)$/, ''));
  if (orientation.length) out.push({ label: 'Ce qui compte dans ses choix', value: join(orientation) });

  // NEED — ses besoins
  const needs = ev.filter((e) => e.target_construct in NEED_LABELS)
    .map((e) => NEED_LABELS[e.target_construct as keyof typeof NEED_LABELS]);
  if (needs.length) out.push({ label: 'Ses besoins', value: join(needs) });

  // BEHAVIOR : NON rendu ici. Les options incognito (I5/I6/I8/I10) n'ont qu'un `text` (phrase entière,
  // interdite à l'affichage) + un `behavior.pattern` (code, ex. `internalize`) — AUCUN libellé court dans
  // la banque. Les libellés courts des patterns partent au REGISTRE ÉDITORIAL (Estelle les écrit) ; le
  // BEHAVIOR est « dans le journal mais pas rendu » tant qu'ils n'existent pas. Ne rien inventer.

  return out;
}
