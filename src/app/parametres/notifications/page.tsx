import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import NotificationSettings from "@/components/dashboard/NotificationSettings";
export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("my_profile")
    .select("notif_push_enabled, notif_email_enabled, notif_quiet_hours_start, notif_quiet_hours_end, notif_max_per_day")
    .eq("user_id", user.id)
    .maybeSingle();

  type NotifPrefs = {
    notif_push_enabled: boolean | null;
    notif_email_enabled: boolean | null;
    notif_quiet_hours_start: number | null;
    notif_quiet_hours_end: number | null;
    notif_max_per_day: number | null;
  };
  const prefs = profile as NotifPrefs | null;

  return (
    <DashboardShell>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label">Paramètres</p>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Notifications</h1>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
          Choisissez comment Candice vous contacte.
        </p>
      </div>

      <NotificationSettings
        initialPushEnabled={prefs?.notif_push_enabled ?? true}
        initialEmailEnabled={prefs?.notif_email_enabled ?? true}
        initialQuietStart={prefs?.notif_quiet_hours_start ?? 21}
        initialQuietEnd={prefs?.notif_quiet_hours_end ?? 8}
        initialMaxPerDay={prefs?.notif_max_per_day ?? 2}
      />
    </DashboardShell>
  );
}
