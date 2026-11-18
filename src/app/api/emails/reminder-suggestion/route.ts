import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendReminderEmail } from "@/lib/notifications/email-reminder";
import { estAppelPlanifie } from '@/lib/cron/auth';

// Internal endpoint — called by the cron or manually with service-role context.
export async function POST(request: NextRequest) {
  if (!estAppelPlanifie(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user_id, suggestion_id, title, description, priority } = await request.json();
  if (!user_id || !suggestion_id || !title || !description || !priority) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const ok = await sendReminderEmail(user_id, { id: suggestion_id, title, description, priority }, supabaseAdmin);

  return NextResponse.json({ success: ok });
}
