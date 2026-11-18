// MARQUER LA PROGRESSION — une ligne par (compte, question), pour le compte lui-même.
//
// CONSTAT DU 18 NOV., sur la pile locale montée depuis les migrations du dépôt. Les quatre
// écritures de `profile_completion` passaient par `upsert(..., { onConflict:
// 'user_id,question_key' })`. Or l'unicité de la table est un index PARTIEL —
// `(user_id, question_key) WHERE contact_id IS NULL` (migration 29) — et PostgreSQL ne sait
// pas rattacher un `ON CONFLICT (user_id, question_key)` sans prédicat à un index partiel.
// Chaque upsert échouait donc : « there is no unique or exclusion constraint matching the ON
// CONFLICT specification ». L'erreur n'était que tracée. Conséquence observée sur les vraies
// routes : la réponse était écrite au journal, la progression ne l'était pas, et la même
// question revenait indéfiniment.
//
// (Si la base vivante porte une contrainte d'unicité complète posée hors migrations, l'ancien
// code y fonctionne ; celui-ci fonctionne dans les deux cas, et ne dépend plus de ce hasard.)
//
// ON MET À JOUR D'ABORD, ON INSÈRE SI RIEN N'EXISTAIT. Deux requêtes simultanées peuvent
// toutes deux vouloir insérer : l'index partiel en refuse une (23505), qui retombe alors sur
// la mise à jour. Aucune ligne en double, aucune écriture perdue.

interface ClientCompletion {
  from(table: string): {
    update(values: Record<string, unknown>): {
      eq(c: string, v: string): { eq(c: string, v: string): { is(c: string, v: null): { select(c: string): Promise<{ data: unknown[] | null; error: { message: string; code?: string } | null }> } } };
    };
    insert(values: Record<string, unknown>): Promise<{ error: { message: string; code?: string } | null }>;
  };
}

/** Écrit (ou complète) la ligne de progression du COMPTE pour une question. Rend l'erreur, jamais ne la tait. */
export async function marquerProgression(
  supabase: unknown,
  userId: string,
  questionKey: string,
  valeurs: Record<string, unknown>,
): Promise<{ error: { message: string } | null }> {
  const c = supabase as ClientCompletion;
  const mettreAJour = () => c.from('profile_completion').update(valeurs)
    .eq('user_id', userId).eq('question_key', questionKey).is('contact_id', null).select('id');

  const u1 = await mettreAJour();
  if (u1.error) return { error: u1.error };
  if ((u1.data ?? []).length > 0) return { error: null };

  const ins = await c.from('profile_completion').insert({ user_id: userId, question_key: questionKey, ...valeurs });
  if (!ins.error) return { error: null };
  if (ins.error.code !== '23505') return { error: ins.error };
  // Une autre requête a inséré entre-temps : la ligne existe, on la met à jour.
  const u2 = await mettreAJour();
  return { error: u2.error };
}
