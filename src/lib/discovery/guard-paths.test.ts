// Refonte Profil V2, Phase B — DÉMONSTRATION de la garde anti-redemande
// sur les chemins recensés en Phase A (STOP B, exigence Estelle).
//
// ① emptyCta ProfileSheet  → piloté par availableSections = résultat de
//    getAvailableDiscoverySections (démontré ici) — même source que ②.
// ② bloc « Pour affiner »   → getAvailableDiscoverySections (démontré ici).
// ③ /moi/discovery          → getNextMicroQuestion (démontré ici).
// ④ EditMenu questionnaire  → modifie des données existantes (équivalent
//    « Modifier ma réponse ») — ne sélectionne jamais de micro-question.
// ⑤ rangée « Dates clés »   → affichage piloté par la donnée, pas une question.
// ⑥ chemins legacy          → route neutralisée (410, démontré ici).

import { describe, it, expect, beforeAll } from "vitest";

process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "test-key-guard-demo";

// ── Supabase simulé (en mémoire) ─────────────────────────────────────────────

interface MockState {
  questions: Array<Record<string, unknown>>;
  profile: Record<string, unknown> | null;
  completion: Array<{ question_key: string; status: string }>;
  session: Record<string, unknown> | null;
  writes: Array<{ table: string; op: string; payload: unknown }>;
}

function makeDb(state: MockState) {
  const resolve = (ctx: { table: string; op: string; payload: unknown; single: boolean }) => {
    const { table, op, single } = ctx;
    if (op === "insert" && table === "discovery_sessions") {
      const p = ctx.payload as Record<string, unknown>;
      state.session = { id: "s1", ...p };
      return { data: single ? state.session : [state.session] };
    }
    if (op === "update") return { data: single ? (state.session ?? null) : [] };
    if (op === "upsert") return { data: null };
    if (table === "discovery_questions") return { data: state.questions };
    if (table === "my_profile") return { data: single ? state.profile : [state.profile] };
    if (table === "profile_completion") return { data: state.completion };
    if (table === "discovery_sessions") return { data: single ? state.session : [state.session] };
    return { data: null };
  };

  const mkChain = (table: string) => {
    const ctx = { table, op: "select", payload: null as unknown, single: false };
    const chain: Record<string, unknown> = {};
    const methods = ["select", "eq", "is", "order", "limit", "maybeSingle", "single", "insert", "upsert", "update"];
    for (const m of methods) {
      chain[m] = (...args: unknown[]) => {
        if (m === "insert" || m === "upsert" || m === "update") {
          ctx.op = m;
          ctx.payload = args[0];
          state.writes.push({ table, op: m, payload: args[0] });
        }
        if (m === "single" || m === "maybeSingle") ctx.single = true;
        return chain;
      };
    }
    (chain as { then?: unknown }).then = (res: (v: unknown) => void) => res(resolve(ctx));
    return chain;
  };
  return { from: mkChain };
}

const FRAG_QUESTION = {
  id: "q1", question_key: "fragrance.families", dimension: "fragrance",
  subdimension: "families", question_text: "Les familles olfactives qui te plaisent le plus",
  question_type: "chips_multi", options: [], sort_order: 425,
  trigger_condition: null, priority: 50,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let engine: any;
beforeAll(async () => {
  engine = await import("./engine");
});

describe("chemins ②/③ — moteur Discovery (garde complète)", () => {
  it("③ donnée en fiche (parfums saisis au questionnaire) → question JAMAIS servie + rétro-alimentation answered", async () => {
    const state: MockState = {
      questions: [FRAG_QUESTION],
      profile: { practical_info: { parfums: ["poudre"] }, singularity_answers: null, relational_filters: null, discovery_answers: null },
      completion: [],
      session: null,
      writes: [],
    };
    const result = await engine.getNextMicroQuestion("u1", makeDb(state), null, "quick");
    expect(result).toBeNull();
    // Rétro-alimentation : le statut answered a été écrit
    const retro = state.writes.find(w => w.table === "profile_completion" && w.op === "upsert"
      && (w.payload as { question_key?: string; status?: string }).question_key === "fragrance.families");
    expect((retro?.payload as { status?: string })?.status).toBe("answered");
  });

  it("③ statut answered → JAMAIS reproposée (aucune donnée requise)", async () => {
    const state: MockState = {
      questions: [FRAG_QUESTION],
      profile: { practical_info: null, singularity_answers: null, relational_filters: null, discovery_answers: null },
      completion: [{ question_key: "fragrance.families", status: "answered" }],
      session: null,
      writes: [],
    };
    expect(await engine.getNextMicroQuestion("u1", makeDb(state), null, "quick")).toBeNull();
  });

  it("③ statut archived → JAMAIS reproposée", async () => {
    const state: MockState = {
      questions: [FRAG_QUESTION],
      profile: { practical_info: null, singularity_answers: null, relational_filters: null, discovery_answers: null },
      completion: [{ question_key: "fragrance.families", status: "archived" }],
      session: null, writes: [],
    };
    expect(await engine.getNextMicroQuestion("u1", makeDb(state), null, "quick")).toBeNull();
  });

  it("③ statut skipped → reproposable (passer n'est pas répondre)", async () => {
    const state: MockState = {
      questions: [FRAG_QUESTION],
      profile: { practical_info: null, singularity_answers: null, relational_filters: null, discovery_answers: null },
      completion: [{ question_key: "fragrance.families", status: "skipped" }],
      session: null, writes: [],
    };
    const result = await engine.getNextMicroQuestion("u1", makeDb(state), null, "quick");
    expect(result?.question?.question_key).toBe("fragrance.families");
  });

  it("② section disponible SEULEMENT si une question passe la garde (pilote emptyCta ① + « Pour affiner » ②)", async () => {
    const stateBlocked: MockState = {
      questions: [FRAG_QUESTION],
      profile: { practical_info: { parfums: ["poudre"] }, singularity_answers: null, relational_filters: null, discovery_answers: null },
      completion: [], session: null, writes: [],
    };
    const blocked = await engine.getAvailableDiscoverySections("u1", makeDb(stateBlocked), null);
    expect(blocked.has("fragrance-family")).toBe(false); // ← le bug d'Estelle, corrigé

    const stateOpen: MockState = {
      questions: [FRAG_QUESTION],
      profile: { practical_info: null, singularity_answers: null, relational_filters: null, discovery_answers: null },
      completion: [], session: null, writes: [],
    };
    const open = await engine.getAvailableDiscoverySections("u1", makeDb(stateOpen), null);
    expect(open.has("fragrance-family")).toBe(true);
  });

  it("recordAnswer écrit le statut (answered / skipped)", async () => {
    const state: MockState = {
      questions: [], profile: { discovery_answers: {} },
      completion: [], session: { id: "s1", pending_keys: ["fragrance.families"], current_index: 0 },
      writes: [],
    };
    await engine.recordAnswer("u1", "s1", "fragrance.families", ["powdery"], false, makeDb(state));
    const write = state.writes.find(w => w.table === "profile_completion");
    expect((write?.payload as { status?: string })?.status).toBe("answered");

    state.writes = [];
    await engine.recordAnswer("u1", "s1", "fragrance.families", null, true, makeDb(state));
    const skip = state.writes.find(w => w.table === "profile_completion");
    expect((skip?.payload as { status?: string })?.status).toBe("skipped");
  });
});

describe("chemin ⑥ — legacy neutralisé", () => {
  it("GET /api/discovery/next → 410, plus aucun sélecteur legacy exporté", async () => {
    const route = await import("../../app/api/discovery/next/route");
    const res = await route.GET();
    expect(res.status).toBe(410);
    expect(engine.getNextDripQuestion).toBeUndefined();
    expect(engine.createOrResumeSession).toBeUndefined();
  });
});
