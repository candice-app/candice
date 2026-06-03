// Brain Orchestrator — section 46 (fondations)
// Point d'entrée unique : processMemory(rawInput, context)
// Enchaîne Memory → Signal → Trust dans l'ordre.
// Idempotent, reprise propre sur échec, jamais de plantage silencieux.
// Hiérarchie d'autorité : Sécurité émotionnelle > Forgetting > Trust > Scoring.

import { analyzeMemory } from './memory';
import { extractSignals } from './signal';
import { getBaseConfidence } from './trust';
import type {
  ProcessContext, ProcessResult, StructuredMemoryAnalysis, StructuredSignal,
} from './types';

// ── Processing log helper ────────────────────────────────────────────────────

async function log(
  supabase: ProcessContext['supabase'],
  correlationId: string,
  pilotId: string,
  memoryId: string | null,
  step: string,
  status: string,
  durationMs: number,
  errorMessage?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from('processing_log').insert({
      correlation_id: correlationId,
      pilot_id: pilotId,
      memory_id: memoryId,
      step,
      status,
      duration_ms: durationMs,
      error_message: errorMessage ?? null,
      metadata: metadata ?? null,
    });
  } catch { /* log failure must never break the orchestrator */ }
}

// ── Conflict detection ────────────────────────────────────────────────────────

async function detectAndLinkConflicts(
  supabase: ProcessContext['supabase'],
  contactId: string,
  pilotId: string,
  newSignals: StructuredSignal[],
  insertedIds: string[],
): Promise<void> {
  for (let i = 0; i < newSignals.length; i++) {
    const sig = newSignals[i];
    const newId = insertedIds[i];
    if (!newId) continue;

    const { data: conflicting } = await supabase
      .from('signals')
      .select('id, confidence, conflicting_signals')
      .eq('contact_id', contactId)
      .eq('pilot_id', pilotId)
      .eq('signal_type', sig.signal_type)
      .neq('polarity', sig.polarity)
      .eq('status', 'actif');

    if (!conflicting?.length) continue;

    // Reduce new signal's confidence
    const newConf = Math.max(0, sig.confidence - 10);
    await supabase
      .from('signals')
      .update({ confidence: newConf, status: 'à_clarifier' })
      .eq('id', newId);

    for (const existing of conflicting) {
      const existingConflicts: string[] = existing.conflicting_signals ?? [];
      const updatedConflicts = [...new Set([...existingConflicts, newId])];
      await supabase
        .from('signals')
        .update({
          confidence: Math.max(0, (existing.confidence ?? 60) - 10),
          status: 'à_clarifier',
          conflicting_signals: updatedConflicts,
        })
        .eq('id', existing.id);

      // Create a clarifying question in console (context_journal)
      try {
        // Look up contact name for the question
        const { data: contactRow } = await supabase
          .from('contacts')
          .select('name')
          .eq('id', contactId)
          .maybeSingle();
        const firstName = (contactRow?.name ?? 'ce proche').split(' ')[0];
        await supabase.from('context_journal').insert({
          user_id: pilotId,
          contact_id: contactId,
          type: 'signal_conflict',
          question: `Conflit détecté sur « ${sig.signal_type} » pour ${firstName} — signal positif et négatif coexistent. À clarifier.`,
          answer: null,
        });
      } catch { /* non-critical */ }
    }
  }
}

// ── Main orchestrator ────────────────────────────────────────────────────────

export async function processMemory(
  rawInput: string,
  context: ProcessContext,
): Promise<ProcessResult> {
  const { contactId, userId, source, supabase } = context;
  const correlationId = crypto.randomUUID();
  const fallbackUsed = { memory: false, signal: false };

  // ── Step 1: Memory analysis ───────────────────────────────────────────────

  let analysis: StructuredMemoryAnalysis;
  const t1 = Date.now();

  try {
    const result = await analyzeMemory(rawInput, source);
    analysis = result.analysis;
    fallbackUsed.memory = result.fallbackUsed;
    await log(supabase, correlationId, userId, null, 'memory',
      result.fallbackUsed ? 'fallback' : 'success', Date.now() - t1);
  } catch (err) {
    // Should not happen (analyzeMemory has internal fallback), but safety net
    const { analysis: fallback } = await import('./memory').then(m =>
      m.analyzeMemory(rawInput.slice(0, 20) + '…', source)
    );
    analysis = fallback;
    fallbackUsed.memory = true;
    await log(supabase, correlationId, userId, null, 'memory', 'error', Date.now() - t1, String(err));
  }

  // ── Step 2: Trust score ───────────────────────────────────────────────────

  const confidence_score = getBaseConfidence(source);

  // ── Step 3: Persist memory ────────────────────────────────────────────────

  const now = new Date();
  const validUntil = analysis.valid_until_days
    ? new Date(now.getTime() + analysis.valid_until_days * 86400000).toISOString()
    : null;
  const revalidationDate = analysis.revalidation_days
    ? new Date(now.getTime() + analysis.revalidation_days * 86400000).toISOString()
    : null;

  // Hiérarchie d'autorité : si sensitivity >= 3, statut = sensible (Sécurité émotionnelle prime)
  const status = analysis.sensitivity_level >= 3 ? 'sensible' : 'actif';

  const { data: memoryRow, error: memErr } = await supabase
    .from('memories')
    .insert({
      contact_id: contactId,
      pilot_id: userId,
      raw_input: rawInput.trim(),
      sanitized_summary: analysis.sanitized_summary,
      memory_type: analysis.memory_type,
      category: analysis.category,
      subcategory: analysis.subcategory ?? null,
      sentiment: analysis.sentiment,
      emotional_intensity: analysis.emotional_intensity,
      sensitivity_level: analysis.sensitivity_level,
      source,
      source_reliability: 'moyenne',
      confidence_score,
      status,
      visibility_level: 'privé',
      recommendation_impact: analysis.recommendation_impact ?? null,
      valid_until: validUntil,
      revalidation_date: revalidationDate,
    })
    .select('id')
    .single();

  if (memErr || !memoryRow) {
    await log(supabase, correlationId, userId, null, 'orchestrator', 'error', 0,
      memErr?.message ?? 'memory insert failed');
    throw new Error(memErr?.message ?? 'Memory insert failed');
  }

  const memoryId: string = memoryRow.id;
  await log(supabase, correlationId, userId, memoryId, 'trust', 'success', 0,
    undefined, { confidence_score, source });

  // ── Step 4: Signal extraction ─────────────────────────────────────────────

  let signals: StructuredSignal[] = [];
  const t4 = Date.now();

  try {
    const result = await extractSignals(analysis);
    signals = result.signals;
    fallbackUsed.signal = result.fallbackUsed;
    await log(supabase, correlationId, userId, memoryId, 'signal',
      result.fallbackUsed ? 'fallback' : 'success', Date.now() - t4,
      undefined, { count: signals.length });
  } catch (err) {
    fallbackUsed.signal = true;
    await log(supabase, correlationId, userId, memoryId, 'signal', 'error',
      Date.now() - t4, String(err));
  }

  // ── Step 5: Persist signals + conflict detection ──────────────────────────

  const insertedSignalIds: string[] = [];

  if (signals.length > 0) {
    const rows = signals.map(s => ({
      contact_id: contactId,
      pilot_id: userId,
      signal_type: s.signal_type,
      signal_value: s.signal_value,
      polarity: s.polarity,
      confidence: Math.max(0, Math.min(100, s.confidence)),
      source_memory_id: memoryId,
    }));

    const { data: insertedSignals } = await supabase
      .from('signals')
      .insert(rows)
      .select('id');

    if (insertedSignals) {
      insertedSignalIds.push(...insertedSignals.map((r: { id: string }) => r.id));
      await detectAndLinkConflicts(supabase, contactId, userId, signals, insertedSignalIds);
    }
  }

  // ── Step 6: Final orchestrator log ────────────────────────────────────────

  await log(supabase, correlationId, userId, memoryId, 'orchestrator', 'success', 0,
    undefined, { fallback_used: fallbackUsed.memory || fallbackUsed.signal, signal_count: signals.length });

  return {
    memoryId,
    sanitized_summary: analysis.sanitized_summary,
    sentiment: analysis.sentiment,
    category: analysis.category,
    emotional_intensity: analysis.emotional_intensity,
    sensitivity_level: analysis.sensitivity_level,
    confidence_score,
    signal_count: signals.length,
    correlation_id: correlationId,
    fallback_used: fallbackUsed.memory || fallbackUsed.signal,
  };
}
