import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendReminderEmail } from "@/lib/notifications/email-reminder";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();
  const runStart = new Date().toISOString();

  const { data: runRow } = await supabaseAdmin
    .from("cron_runs")
    .insert({ job_name: "email-reminders", started_at: runStart, status: "running" })
    .select("id")
    .single();

  let emails_sent = 0;
  let emails_failed = 0;
  let errorMessage: string | null = null;

  try {
    // Suggestions pending for >48h
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: pending } = await supabaseAdmin
      .from("proactive_suggestions")
      .select("id, user_id, title, description, priority")
      .eq("status", "pending")
      .lt("generated_at", cutoff)
      .limit(50);

    if (pending?.length) {
      const ids = pending.map(s => s.id);

      // Exclude already-emailed suggestions
      const { data: alreadyLogged } = await supabaseAdmin
        .from("notification_log")
        .select("related_suggestion_id")
        .eq("channel", "email")
        .in("related_suggestion_id", ids);

      const notifiedIds = new Set((alreadyLogged ?? []).map(n => n.related_suggestion_id));
      const toNotify = pending.filter(s => !notifiedIds.has(s.id));

      for (const suggestion of toNotify) {
        const ok = await sendReminderEmail(suggestion.user_id, suggestion, supabaseAdmin);
        ok ? emails_sent++ : emails_failed++;
      }
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[cron/email-reminders]", errorMessage);
  }

  if (runRow?.id) {
    await supabaseAdmin
      .from("cron_runs")
      .update({
        status: errorMessage ? "error" : "success",
        finished_at: new Date().toISOString(),
        error_message: errorMessage,
        metadata: { emails_sent, emails_failed },
      })
      .eq("id", runRow.id);
  }

  return NextResponse.json({ emails_sent, emails_failed });
}
