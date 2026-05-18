import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import AbonnementActions from "./AbonnementActions";

export default async function AbonnementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("my_profile")
    .select("subscription_status, trial_started_at, subscription_paused_at, deletion_scheduled_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const status = (profile?.subscription_status as string) ?? "trial";
  const trialStarted = profile?.trial_started_at ? new Date(profile.trial_started_at) : null;
  const deletionScheduledAt = profile?.deletion_scheduled_at as string | null;

  let daysLeft: number | null = null;
  if (status === "trial" && trialStarted) {
    const elapsed = (Date.now() - trialStarted.getTime()) / (1000 * 60 * 60 * 24);
    daysLeft = Math.max(0, Math.ceil(30 - elapsed));
  }

  const statusLabels: Record<string, string> = {
    trial: "Essai gratuit",
    active: "Actif",
    paused: "En pause",
    silent: "Silencieux",
    cancelled: "Annulé",
  };

  return (
    <DashboardShell>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label">Paramètres</p>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Abonnement</h1>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
          Gérez votre abonnement Candice.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Status card */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)" }}>Statut</p>
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
              color: status === "active" ? "#4A7C59" : status === "paused" || status === "cancelled" ? "#E05252" : "var(--terra)",
              background: status === "active" ? "rgba(74,124,89,0.1)" : status === "paused" || status === "cancelled" ? "rgba(224,82,82,0.08)" : "var(--t2)",
              border: "0.5px solid currentColor",
              padding: "3px 10px", borderRadius: 20,
            }}>
              {statusLabels[status] ?? status}
            </span>
          </div>

          {status === "trial" && daysLeft !== null && (
            <div style={{ padding: "12px 14px", background: "var(--t2)", borderRadius: "var(--r-sm)", border: "0.5px solid var(--t3)", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--con)", lineHeight: 1.6 }}>
                {daysLeft === 0
                  ? "Ton essai se termine aujourd'hui."
                  : `Il te reste ${daysLeft} jour${daysLeft > 1 ? "s" : ""} d'essai gratuit.`}
              </p>
            </div>
          )}

          {status === "active" && (
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6 }}>
              Prochaine facture : à venir (Phase 7 — Stripe).
            </p>
          )}

          {deletionScheduledAt && (
            <div style={{ padding: "12px 14px", background: "rgba(224,82,82,0.06)", borderRadius: "var(--r-sm)", border: "0.5px solid rgba(224,82,82,0.2)", marginTop: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 300, color: "#E05252", lineHeight: 1.6 }}>
                Suppression programmée le {new Date(deletionScheduledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <AbonnementActions
          status={status}
          deletionScheduledAt={deletionScheduledAt}
        />
      </div>
    </DashboardShell>
  );
}
