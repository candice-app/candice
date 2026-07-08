// Refonte Profil V2, Phase B — moteur de statuts des micro-questions.
//
// SOURCE UNIQUE de la règle « ne jamais redemander » :
//   • answered / archived → la question ne réapparaît sur AUCUN chemin
//     (elle devient « Modifier ma réponse » côté UI) ;
//   • skipped / outdated / needs_precision / not_started → proposable.
// La présence d'une donnée en fiche RÉTRO-ALIMENTE answered : une donnée
// saisie au questionnaire vaut réponse, sans repasser par Discovery.

import { questionDataPresent, GUARDED_QUESTION_KEYS, type ProfileDataSnapshot } from "./dataPresence";

export type QuestionStatus =
  | "not_started"
  | "answered"
  | "skipped"
  | "outdated"
  | "needs_precision"
  | "archived";

/** Statuts qui bloquent définitivement la re-proposition. */
export const BLOCKING_STATUSES: QuestionStatus[] = ["answered", "archived"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupaDB = any;

/** Statuts stockés pour un user (question_key → status). */
export async function getQuestionStatuses(
  supabase: SupaDB,
  userId: string,
): Promise<Record<string, QuestionStatus>> {
  const { data } = await supabase
    .from("profile_completion")
    .select("question_key, status")
    .eq("user_id", userId)
    .is("contact_id", null);
  const map: Record<string, QuestionStatus> = {};
  for (const r of (data ?? []) as Array<{ question_key: string; status: QuestionStatus }>) {
    map[r.question_key] = r.status;
  }
  return map;
}

/**
 * D3 — partie PURE de la rétro-alimentation : calcule les statuts à jour
 * (donnée en fiche → answered) SANS écrire. Les écritures (writeSyncedStatuses)
 * peuvent alors sortir du chemin de rendu.
 */
export function applyDataSync(
  statuses: Record<string, QuestionStatus>,
  snapshot: ProfileDataSnapshot | null,
): { statuses: Record<string, QuestionStatus>; toSync: string[] } {
  if (!snapshot) return { statuses, toSync: [] };
  const toSync = GUARDED_QUESTION_KEYS.filter(key => {
    const stored = statuses[key] ?? "not_started";
    return !BLOCKING_STATUSES.includes(stored) && questionDataPresent(key, snapshot);
  });
  const merged = { ...statuses };
  for (const key of toSync) merged[key] = "answered";
  return { statuses: merged, toSync };
}

/** D3 — écritures de la rétro-alimentation (idempotentes, en parallèle). */
export async function writeSyncedStatuses(
  supabase: SupaDB,
  userId: string,
  toSync: string[],
): Promise<void> {
  if (toSync.length === 0) return;
  const now = new Date().toISOString();
  await Promise.all(toSync.map(key =>
    supabase
      .from("profile_completion")
      .upsert(
        { user_id: userId, question_key: key, status: "answered", answered_at: now },
        { onConflict: "user_id,question_key" },
      ),
  ));
}

/**
 * Rétro-alimentation : toute question dont la donnée existe déjà en fiche
 * passe answered si elle ne l'est pas encore. Idempotent — n'écrit que les
 * différences (aucune écriture sur un profil déjà synchronisé).
 * Retourne les statuts À JOUR (stockés + rétro-alimentés).
 */
export async function syncStatusesWithData(
  supabase: SupaDB,
  userId: string,
  snapshot: ProfileDataSnapshot | null,
  /** C2 : statuts préchargés (évite un aller-retour quand l'appelant les a déjà) */
  prefetched?: Record<string, QuestionStatus>,
): Promise<Record<string, QuestionStatus>> {
  const stored = prefetched ?? await getQuestionStatuses(supabase, userId);
  const { statuses, toSync } = applyDataSync(stored, snapshot);
  await writeSyncedStatuses(supabase, userId, toSync);
  return statuses;
}

/** Clés définitivement bloquées (answered/archived) après rétro-alimentation. */
export function blockedKeys(statuses: Record<string, QuestionStatus>): Set<string> {
  return new Set(
    Object.entries(statuses)
      .filter(([, s]) => BLOCKING_STATUSES.includes(s))
      .map(([k]) => k),
  );
}
