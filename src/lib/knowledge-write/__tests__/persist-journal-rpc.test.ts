// Lot RECÂBLAGE — persistKnowledge → persist_journal. Les SEPT invariants (T1…T7).
// Faux client : persistKnowledge n'écrit QUE par `rpc`. On inspecte l'appel et on pilote le retour.

import { describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  asContactId, asSubjectId, asUserId, contactAbout,
  createFact, createOpenKnowledge, createProfileEvidence, createSourceRecord,
  JOURNAL_VERSION_STAMP, type KnowledgeScope,
} from '../../knowledge';
import { persistKnowledge, PersistError, type PersistOutcome, type WriteClient } from '../persist';

const scope: KnowledgeScope = { about: contactAbout(asContactId('c1')), ownerId: asUserId('u1') };
const base = {
  ...scope, source_id: 'src1', raw_information: 'verbatim', confidence: 'high' as const, context: 'GLOBAL',
  timestamp: '2026-11-10T00:00:00Z', stability: 'contextual' as const, evidence_role: 'primary' as const,
  source_type: 'onboarding_closed' as const, assertionBasis: 'self_report' as const, version: JOURNAL_VERSION_STAMP,
};
const srcOf = (id = 'src1') => createSourceRecord({ ...scope, id, sourceType: 'onboarding_closed', questionText: 'q', answerText: 'a', timestamp: base.timestamp });
const evOf = (source_id = 'src1') => createProfileEvidence({ ...base, source_id, evidence_id: `e-${source_id}`, target_construct: 'PROFILE_OPENNESS', value: 1 });
const factOf = (source = 'src1') => createFact({ about: scope.about, ownerId: asUserId('u1'), fact_id: `f-${source}`, fact_type: 'habit', value: 'v', source, timestamp: base.timestamp, confidence: 'high', user_confirmed: false });
const okOf = (source = 'src1') => createOpenKnowledge({ about: scope.about, ownerId: asUserId('u1'), open_knowledge_id: `ok-${source}`, type: 'support_modality', subject: asSubjectId('x'), subjectLabel: 'X', relation: 'appears_to_help', context: 'distress', source, timestamp: base.timestamp, confidence: 'high', assertionStatus: 'explicit' });

/** Faux client enregistrant les appels rpc ; retour piloté. */
function rpcClient(data: unknown, error: { message: string } | null = null) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const client: WriteClient = { rpc: async (fn, args) => { calls.push({ fn, args }); return { data, error }; } };
  return { client, calls };
}
const COUNTS = (o: Partial<Record<'sources' | 'evidences' | 'facts' | 'open', number>>) => ({ sources: 0, evidences: 0, facts: 0, open: 0, ...o });

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
describe('T1 — un seul appel RPC par soumission, et c’est persist_journal', () => {
  it('exactement un rpc(persist_journal, {p_source,p_evidences,p_facts,p_open})', async () => {
    const { client, calls } = rpcClient(COUNTS({ sources: 1, evidences: 1 }));
    await persistKnowledge(client, { source: srcOf(), evidences: [evOf()], facts: [factOf()], openKnowledge: [okOf()] });
    expect(calls).toHaveLength(1);
    expect(calls[0].fn).toBe('persist_journal');
    expect(Object.keys(calls[0].args)).toEqual(['p_source', 'p_evidences', 'p_facts', 'p_open']);
  });
});

describe('T2 — pré-vol : rattachement ≠ source.id → lève AVANT l’appel (la RPC n’est pas appelée)', () => {
  it('evidence.source_id divergent', async () => {
    const { client, calls } = rpcClient(COUNTS({ sources: 1 }));
    await expect(persistKnowledge(client, { source: srcOf(), evidences: [evOf('AUTRE')] })).rejects.toBeInstanceOf(PersistError);
    expect(calls).toHaveLength(0);
  });
  it('fact.source divergent', async () => {
    const { client, calls } = rpcClient(COUNTS({ sources: 1 }));
    await expect(persistKnowledge(client, { source: srcOf(), facts: [factOf('AUTRE')] })).rejects.toBeInstanceOf(PersistError);
    expect(calls).toHaveLength(0);
  });
  it('openKnowledge.source divergent', async () => {
    const { client, calls } = rpcClient(COUNTS({ sources: 1 }));
    await expect(persistKnowledge(client, { source: srcOf(), openKnowledge: [okOf('AUTRE')] })).rejects.toBeInstanceOf(PersistError);
    expect(calls).toHaveLength(0);
  });
});

describe('T3 — source + zéro enfant → ÉCRIT, sources = 1', () => {
  it('écrit la source seule, outcome written', async () => {
    const { client, calls } = rpcClient(COUNTS({ sources: 1 }));
    const outcome: PersistOutcome = await persistKnowledge(client, { source: srcOf() });
    expect(outcome).toBe('written');
    expect((calls[0].args.p_evidences as unknown[])).toEqual([]);
    expect((calls[0].args.p_facts as unknown[])).toEqual([]);
    expect((calls[0].args.p_open as unknown[])).toEqual([]);
  });
});

describe('T4 — même charge rejouée → REJOUÉ, les quatre compteurs à 0', () => {
  it('tout absorbé par ON CONFLICT → outcome replayed (pas une erreur)', async () => {
    const { client } = rpcClient(COUNTS({})); // 0/0/0/0
    const outcome = await persistKnowledge(client, { source: srcOf(), evidences: [evOf()] });
    expect(outcome).toBe('replayed');
  });
  it('REJOUÉ est journalisé distinctement (console.info), ÉCRIT ne l’est pas', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      await persistKnowledge(rpcClient(COUNTS({ sources: 1 })).client, { source: srcOf() }); // written
      expect(info).not.toHaveBeenCalled();
      await persistKnowledge(rpcClient(COUNTS({})).client, { source: srcOf() }); // replayed
      expect(info).toHaveBeenCalledTimes(1);
      expect(String(info.mock.calls[0][0])).toMatch(/REJOU/);
    } finally { info.mockRestore(); }
  });
});

describe('T5 — erreur RPC → propagée, aucun repli', () => {
  it('error non nul → PersistError, aucun chemin de secours', async () => {
    const { client } = rpcClient(null, { message: 'db down' });
    await expect(persistKnowledge(client, { source: srcOf(), evidences: [evOf()] })).rejects.toThrow(/db down/);
  });
});

describe('T6 — INVARIANT B, une seule porte (test, pas grep)', () => {
  const TABLES = ['knowledge_sources', 'knowledge_evidences', 'knowledge_facts', 'knowledge_open_knowledge'];
  const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) { if (name !== '__tests__' && name !== 'node_modules') out.push(...walk(p)); }
      else if (/\.(ts|tsx)$/.test(name)) out.push(p);
    }
    return out;
  }
  it('aucune écriture PostgREST (.insert/.upsert/.update/.delete) sur les 4 tables, où que ce soit dans src/', () => {
    const offenders: string[] = [];
    for (const f of walk(join(process.cwd(), 'src'))) {
      const code = stripComments(readFileSync(f, 'utf8'));
      for (const t of TABLES) {
        const re = new RegExp(`from\\(\\s*['"\`]${t}['"\`]\\s*\\)[\\s\\S]{0,160}?\\.\\s*(insert|upsert|update|delete)\\s*\\(`);
        if (re.test(code)) offenders.push(`${f.replace(process.cwd() + '/', '')} → ${t}`);
      }
    }
    expect(offenders).toEqual([]);
  });
  it('persist.ts n’écrit QUE par rpc(persist_journal) — aucun insert/upsert/update/delete direct', () => {
    const code = stripComments(readFileSync(join(process.cwd(), 'src/lib/knowledge-write/persist.ts'), 'utf8'));
    expect(/\.\s*(insert|upsert|update|delete)\s*\(/.test(code)).toBe(false);
    expect(/\.rpc\(\s*['"`]persist_journal['"`]/.test(code)).toBe(true);
  });
  it('supersede.ts (seul autre écrivain) ne marque QUE superseded_at/superseded_by', () => {
    const code = readFileSync(join(process.cwd(), 'src/lib/knowledge-write/supersede.ts'), 'utf8');
    const m = code.match(/const values = (\{[^}]*\})/);
    expect(m, 'objet values introuvable dans supersede.ts').toBeTruthy();
    const keys = [...m![1].matchAll(/(\w+)\s*:/g)].map((x) => x[1]).sort();
    expect(keys).toEqual(['superseded_at', 'superseded_by']);
  });
});

describe('T7 — retour amputé d’une clé, ou clé non numérique → lève, et n’est PAS lu comme REJOUÉ', () => {
  it('clé manquante (open absente) → lève', async () => {
    const { client } = rpcClient({ sources: 1, evidences: 0, facts: 0 });
    await expect(persistKnowledge(client, { source: srcOf() })).rejects.toBeInstanceOf(PersistError);
  });
  it('valeur non numérique → lève', async () => {
    const { client } = rpcClient({ sources: 1, evidences: 0, facts: 0, open: 'x' });
    await expect(persistKnowledge(client, { source: srcOf() })).rejects.toBeInstanceOf(PersistError);
  });
  it('retour null → lève (jamais lu comme rejeu)', async () => {
    const { client } = rpcClient(null);
    await expect(persistKnowledge(client, { source: srcOf() })).rejects.toBeInstanceOf(PersistError);
  });
});
