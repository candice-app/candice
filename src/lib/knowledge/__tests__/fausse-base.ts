// FAUSSE BASE EN MÉMOIRE, AVEC ÉCRITURES — pour éprouver ce qui dépend de l'ORDRE des écritures.
//
// `faux-client.ts` ne sait que lire. Les défauts d'identité d'acte (double envoi, A → B → A,
// panne entre deux écritures) ne se voient qu'avec une base qui retient ce qu'on lui écrit et
// qui applique, comme la vraie :
//   · `persist_journal` : les quatre insertions, `ON CONFLICT (id) DO NOTHING`, et le décompte ;
//   · les filtres `eq` / `in` / `is null` / `match` sur lecture ET mise à jour ;
//   · l'unicité des clés primaires à l'insertion (code 23505), y compris l'index partiel de
//     `profile_completion` (user_id, question_key) WHERE contact_id IS NULL.
// Elle sait aussi TOMBER EN PANNE sur commande (`panne`), pour couper entre deux écritures.
// Ce n'est pas PostgreSQL : ni politiques d'accès, ni transactions. Ces points-là sont prouvés
// sur la pile locale (scripts/local).
type Ligne = Record<string, unknown>;
interface Rep { data: unknown; error: { message: string; code?: string } | null }

export interface FausseBase {
  readonly tables: Record<string, Ligne[]>;
  /** Chaque écriture, dans l'ordre : de quoi vérifier qu'un refus n'a RIEN écrit. */
  readonly ecritures: { table: string; op: 'insert' | 'update' | 'rpc'; valeurs: unknown }[];
  /** Rend une erreur à la place de l'écriture quand la fonction rend un message. */
  panne: ((e: { table: string; op: 'insert' | 'update' | 'rpc' | 'select' }) => string | null) | null;
  from(table: string): never;
  rpc(fn: string, args: Record<string, unknown>): Promise<Rep>;
  /** Le client tel que le code l'attend (typé large). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly client: any;
}

export function fausseBase(initial: Record<string, Ligne[]> = {}): FausseBase {
  const tables: Record<string, Ligne[]> = {};
  for (const [t, l] of Object.entries(initial)) tables[t] = l.map((x) => ({ ...x }));
  const lignes = (t: string) => (tables[t] ??= []);
  const ecritures: FausseBase['ecritures'] = [];

  const base: { panne: FausseBase['panne'] } = { panne: null };
  const enPanne = (table: string, op: 'insert' | 'update' | 'rpc' | 'select') => {
    const m = base.panne?.({ table, op });
    return m ? { data: null, error: { message: m } } : null;
  };

  const from = (table: string) => {
    let op: 'select' | 'insert' | 'update' = 'select';
    let valeurs: Ligne | Ligne[] | null = null;
    let rendre = false;
    const filtres: ((r: Ligne) => boolean)[] = [];
    let limite: number | null = null;
    let plage: [number, number] | null = null;

    const executer = (): Rep => {
      const p = enPanne(table, op);
      if (p) return p;
      if (op === 'insert') {
        const aInserer = (Array.isArray(valeurs) ? valeurs : [valeurs!]).map((v) => ({ ...v }));
        for (const v of aInserer) {
          if (v.id === undefined) v.id = `auto-${table}-${(tables[table] ?? []).length + 1}`;
          const doublon = (tables[table] ?? []).some((r) => r.id === v.id)
            || (table === 'profile_completion' && (v.contact_id ?? null) === null
              && (tables[table] ?? []).some((r) => r.user_id === v.user_id && r.question_key === v.question_key && (r.contact_id ?? null) === null));
          if (doublon) return { data: null, error: { message: 'duplicate key value violates unique constraint', code: '23505' } };
        }
        for (const v of aInserer) { if (table === 'profile_completion' && v.contact_id === undefined) v.contact_id = null; lignes(table).push(v); }
        ecritures.push({ table, op: 'insert', valeurs });
        return { data: rendre ? aInserer : null, error: null };
      }
      const visees = (tables[table] ?? []).filter((r) => filtres.every((f) => f(r)));
      if (op === 'update') {
        for (const r of visees) Object.assign(r, valeurs as Ligne);
        if (visees.length > 0) ecritures.push({ table, op: 'update', valeurs });
        return { data: rendre ? visees.map((r) => ({ ...r })) : null, error: null };
      }
      const data = visees.map((r) => ({ ...r }));
      const bornee = plage ? data.slice(plage[0], plage[1] + 1) : data;
      return { data: limite === null ? bornee : bornee.slice(0, limite), error: null };
    };

    const c: Record<string, unknown> = {
      select() { if (op !== 'select') rendre = true; return c; },
      insert(v: Ligne | Ligne[]) { op = 'insert'; valeurs = v; return c; },
      update(v: Ligne) { op = 'update'; valeurs = v; return c; },
      eq(col: string, val: unknown) { filtres.push((r) => String(r[col]) === String(val)); return c; },
      neq(col: string, val: unknown) { filtres.push((r) => String(r[col]) !== String(val)); return c; },
      in(col: string, vals: readonly unknown[]) { const s = new Set(vals.map(String)); filtres.push((r) => s.has(String(r[col]))); return c; },
      is(col: string, val: null) { void val; filtres.push((r) => r[col] === null || r[col] === undefined); return c; },
      not() { return c; },
      match(q: Ligne) { for (const [k, v] of Object.entries(q)) filtres.push((r) => String(r[k]) === String(v)); return c; },
      order() { return c; },
      limit(n: number) { limite = n; return c; },
      range(de: number, a: number) { plage = [de, a]; return c; },
      async maybeSingle() { const r = executer(); return r.error ? r : { data: (r.data as Ligne[] | null)?.[0] ?? null, error: null }; },
      async single() { const r = executer(); if (r.error) return r; const l = (r.data as Ligne[] | null) ?? []; return l.length === 1 ? { data: l[0], error: null } : { data: null, error: { message: 'not exactly one row' } }; },
      then(ok: (v: Rep) => unknown, ko?: (e: unknown) => unknown) { return Promise.resolve().then(executer).then(ok, ko); },
    };
    return c as never;
  };

  const rpc = async (fn: string, args: Record<string, unknown>): Promise<Rep> => {
    const p = enPanne(fn, 'rpc');
    if (p) return p;
    if (fn !== 'persist_journal') return { data: null, error: { message: `rpc inconnue : ${fn}` } };
    const ajouter = (table: string, l: Ligne[]) => {
      let n = 0;
      for (const v of l) { if (lignes(table).some((r) => r.id === v.id)) continue; lignes(table).push({ superseded_at: null, superseded_by: null, ...v }); n++; }
      return n;
    };
    const compte = {
      sources: ajouter('knowledge_sources', [args.p_source as Ligne]),
      evidences: ajouter('knowledge_evidences', (args.p_evidences as Ligne[]) ?? []),
      facts: ajouter('knowledge_facts', (args.p_facts as Ligne[]) ?? []),
      open: ajouter('knowledge_open_knowledge', (args.p_open as Ligne[]) ?? []),
    };
    ecritures.push({ table: 'persist_journal', op: 'rpc', valeurs: compte });
    return { data: compte, error: null };
  };

  const fb = {
    tables, ecritures, from: from as never, rpc,
    get panne() { return base.panne; }, set panne(f: FausseBase['panne']) { base.panne = f; },
    client: null as unknown,
  };
  fb.client = { from, rpc };
  return fb as FausseBase;
}
