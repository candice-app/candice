// FAUX CLIENT DE LECTURE, PARTAGÉ PAR LES TESTS — et il applique VRAIMENT les filtres.
//
// POURQUOI IL EXISTE. Chaque test avait son propre faux client, et tous ignoraient les
// filtres : `eq()` rendait toutes les lignes, quelle que soit la colonne demandée. Un faux
// client qui ignore les filtres ne peut pas voir qu'un filtre MANQUE — c'est ainsi que
// l'absence du filtre sur la personne décrite (`about_id`) est restée invisible, alors que
// plusieurs de ces tests lisaient précisément par ce chemin. Les preuves d'un proche portent
// le même `user_id` que celles du pilote : sans ce filtre, elles entraient dans sa prose.
//
// Celui-ci applique chaque `eq` par comparaison de chaînes, comme la base. Il est donc
// EXIGEANT : une fixture doit porter les colonnes sur lesquelles le code filtre, sinon elle
// est écartée — et c'est exactement ce qu'on veut. Une fixture irréaliste rend un test vert
// qui ne prouve rien.
export interface Reponse { data: unknown[] | null; error: { message: string } | null }

interface Chainable extends Promise<Reponse> {
  eq(col: string, val: string): Chainable;
  in(col: string, vals: readonly string[]): Chainable;
  is(col: string, val: null): Chainable;
  order(col: string, opts?: unknown): Chainable;
  limit(n: number): Chainable;
  maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }>;
}

/**
 * @param parTable lignes par table — `{ knowledge_evidences: [...], knowledge_sources: [...] }`.
 *                 Une table absente rend zéro ligne, jamais une erreur : c'est l'état d'un
 *                 journal vide, qui doit rester un cas testable.
 */
export function fauxClientLecture(parTable: Record<string, readonly unknown[]>) {
  const requetes: { table: string; filtres: [string, string][] }[] = [];

  const construire = (table: string): Chainable => {
    const filtres: [string, string][] = [];
    const dansEnsemble: [string, Set<string>][] = [];
    const estNul: string[] = [];
    requetes.push({ table, filtres });

    const resoudre = (): Promise<Reponse> => {
      let data = [...(parTable[table] ?? [])] as Record<string, unknown>[];
      for (const [col, val] of filtres) data = data.filter((r) => String(r[col]) === val);
      for (const [col, set] of dansEnsemble) data = data.filter((r) => set.has(String(r[col])));
      for (const col of estNul) data = data.filter((r) => r[col] === null || r[col] === undefined);
      return Promise.resolve({ data, error: null });
    };

    const c = {
      eq(col: string, val: string) { filtres.push([col, val]); return c; },
      in(col: string, vals: readonly string[]) { dansEnsemble.push([col, new Set(vals.map(String))]); return c; },
      is(col: string) { estNul.push(col); return c; },
      order() { return c; },
      limit() { return c; },
      async maybeSingle() {
        const { data } = await resoudre();
        return { data: (data ?? [])[0] ?? null, error: null };
      },
      then: <T1, T2>(ok?: ((v: Reponse) => T1 | PromiseLike<T1>) | null,
                     ko?: ((e: unknown) => T2 | PromiseLike<T2>) | null) => resoudre().then(ok, ko),
      catch: <T>(ko?: ((e: unknown) => T | PromiseLike<T>) | null) => resoudre().catch(ko),
      finally: (f?: (() => void) | null) => resoudre().finally(f),
      [Symbol.toStringTag]: 'Promise' as const,
    } as unknown as Chainable;
    return c;
  };

  return {
    /** Les requêtes observées, avec leurs filtres : de quoi vérifier qu'un filtre est bien là. */
    requetes,
    from: (table: string) => ({ select: (_cols?: string) => construire(table) }),
  };
}
