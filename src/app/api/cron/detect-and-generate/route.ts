import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { detectSignalsForUser } from "@/lib/signals/detector";
import { generateSuggestionForSignal } from "@/lib/signals/generator";
import type { ContextualSignal } from "@/types";

const JOB_NAME = "detect-and-generate";
const MAX_SIGNALS_PER_RUN = 50;

export async function GET(request: NextRequest) {
  // Auth
  const authHeader = request.headers.get("Authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[CRON ${JOB_NAME}] Starting`);

  const supabaseAdmin = createAdminClient();
  let cronRunId: string | null = null;

  const { data: cronRun } = await supabaseAdmin
    .from("cron_runs")
    .insert({ job_name: JOB_NAME, status: "running" })
    .select("id")
    .single();
  cronRunId = cronRun?.id ?? null;

  let totalSignals = 0;
  let totalSuggestions = 0;
  const errors: string[] = [];

  try {
    // Distinct user IDs with at least one active contact
    const { data: userRows } = await supabaseAdmin
      .from("contacts")
      .select("user_id")
      .is("archived_at", null);

    const userIds = [...new Set((userRows ?? []).map((r: { user_id: string }) => r.user_id))];
    console.log(`[CRON ${JOB_NAME}] Processing ${userIds.length} users`);

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

    for (const userId of userIds) {
      if (totalSignals >= MAX_SIGNALS_PER_RUN) {
        console.log(`[CRON ${JOB_NAME}] Max signals reached (${MAX_SIGNALS_PER_RUN}), stopping`);
        break;
      }

      try {
        // 1. Detect signals
        const { signals_created } = await detectSignalsForUser(userId, supabaseAdmin);
        totalSignals += signals_created;
        console.log(`[CRON ${JOB_NAME}] user=${userId} signals_created=${signals_created}`);

        // 2. Fetch signals ready to generate (trigger_date <= today, status=active)
        const { data: readySignals } = await supabaseAdmin
          .from("contextual_signals")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .lte("trigger_date", today)
          .limit(10);

        // 3. Generate one suggestion per signal
        for (const signal of readySignals ?? []) {
          const generated = await generateSuggestionForSignal(signal as ContextualSignal, supabaseAdmin);
          if (generated) totalSuggestions++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[CRON ${JOB_NAME}] Error for user ${userId}: ${msg}`);
        errors.push(`user:${userId} — ${msg}`);
      }
    }

    if (cronRunId) {
      await supabaseAdmin
        .from("cron_runs")
        .update({
          status: "success",
          finished_at: new Date().toISOString(),
          signals_detected: totalSignals,
          suggestions_generated: totalSuggestions,
          metadata: { errors },
        })
        .eq("id", cronRunId);
    }

    console.log(`[CRON ${JOB_NAME}] Done — signals=${totalSignals} suggestions=${totalSuggestions} errors=${errors.length}`);

    return NextResponse.json({
      signals_detected: totalSignals,
      suggestions_generated: totalSuggestions,
      users_processed: userIds?.length ?? 0,
      errors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[CRON ${JOB_NAME}] Fatal: ${msg}`);

    if (cronRunId) {
      await supabaseAdmin
        .from("cron_runs")
        .update({
          status: "error",
          finished_at: new Date().toISOString(),
          error_message: msg,
        })
        .eq("id", cronRunId);
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
