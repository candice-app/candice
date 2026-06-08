import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import AbonnementActions from "./AbonnementActions";

export default async function AbonnementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("my_profile")
    .select("subscription_status, deletion_scheduled_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const status = (profile?.subscription_status as string) ?? "trial";
  const deletionScheduledAt = profile?.deletion_scheduled_at as string | null;

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
        <Link href="/parametres" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Paramètres</span>
        </Link>
        <h1 className="page-title" style={{ marginBottom: 4, marginTop: 16 }}>Abonnement</h1>
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
