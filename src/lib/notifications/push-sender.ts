import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

// VAPID configured once at module load (server-side only)
webpush.setVapidDetails(
  "mailto:hello@candice.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  notification_id?: string;
}

function currentParisHour(): number {
  const str = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  const h = parseInt(str === "24" ? "0" : str, 10);
  return isNaN(h) ? 0 : h;
}

function isInQuietHours(start: number, end: number): boolean {
  const h = currentParisHour();
  // Overnight range: e.g. 21-8 → quiet if h >= 21 OR h < 8
  return start < end ? h >= start && h < end : h >= start || h < end;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  supabaseAdmin: SupabaseClient
): Promise<{ sent: number; failed: number }> {
  // Load preferences
  const { data: prefs } = await supabaseAdmin
    .from("my_profile")
    .select("notif_push_enabled, notif_quiet_hours_start, notif_quiet_hours_end, notif_max_per_day")
    .eq("user_id", userId)
    .maybeSingle();

  if (prefs?.notif_push_enabled === false) return { sent: 0, failed: 0 };

  const quietStart = prefs?.notif_quiet_hours_start ?? 21;
  const quietEnd = prefs?.notif_quiet_hours_end ?? 8;
  if (isInQuietHours(quietStart, quietEnd)) return { sent: 0, failed: 0 };

  // Daily cap
  const maxPerDay = prefs?.notif_max_per_day ?? 2;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabaseAdmin
    .from("notification_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("channel", "push")
    .gte("sent_at", todayStart.toISOString());

  if ((todayCount ?? 0) >= maxPerDay) return { sent: 0, failed: 0 };

  // Load subscriptions
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh_key, auth_key")
    .eq("user_id", userId);

  if (!subs?.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    let status = "sent";
    let errorMessage: string | null = null;

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      status = "failed";
      const webErr = err as { statusCode?: number; message?: string };
      errorMessage = webErr.message ?? "Unknown error";
      // Subscription expired — clean up
      if (webErr.statusCode === 410) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }

    await supabaseAdmin.from("notification_log").insert({
      user_id: userId,
      channel: "push",
      notification_type: payload.tag ?? "proactive",
      title: payload.title,
      body: payload.body,
      status,
      error_message: errorMessage,
    });
  }

  return { sent, failed };
}
