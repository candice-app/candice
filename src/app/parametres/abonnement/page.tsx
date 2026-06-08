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
    .select("subscription_status, trial_started_at, lifetime_trial, deletion_scheduled_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const status = (profile?.subscription_status as string) ?? "trial";
  const trialStartedAt = (profile?.trial_started_at as string | null) ?? null;
  const lifetimeTrial = (profile?.lifetime_trial as boolean) ?? false;
  const deletionScheduledAt = (profile?.deletion_scheduled_at as string | null) ?? null;

  let daysLeft: number | null = null;
  if (status === "trial" && trialStartedAt && !lifetimeTrial) {
    const msElapsed = Date.now() - new Date(trialStartedAt).getTime();
    const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
    daysLeft = Math.max(0, Math.ceil(30 - daysElapsed));
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
      <div className="content-col" style={{ paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/parametres" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Paramètres</span>
          </Link>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 28,
            color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.2,
            marginTop: 16, marginBottom: 4,
          } as React.CSSProperties}>
            Abonnement
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* ── Plan ── */}
          <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 4 }}>
              Offre
            </p>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>
              Candice — 9 €/mois
            </p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.6 }}>
              1 mois d&apos;essai offert. Sans engagement.
            </p>
          </div>

          {/* ── Statut ── */}
          <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 8 }}>
              Statut
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>
                {statusLabels[status] ?? status}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase",
                color: status === "active" ? "#4A7C59" : status === "paused" || status === "cancelled" ? "#E05252" : "var(--ink-3)",
                background: status === "active" ? "rgba(74,124,89,.08)" : status === "paused" || status === "cancelled" ? "rgba(224,82,82,0.08)" : "var(--line)",
                padding: "3px 10px", borderRadius: 20,
              }}>
                {status === "active" ? "Actif" : status === "paused" ? "En pause" : status === "cancelled" ? "Annulé" : "Essai"}
              </span>
            </div>
          </div>

          {/* ── Essai ── */}
          {status === "trial" && (
            <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 4 }}>
                Période d&apos;essai
              </p>
              {lifetimeTrial ? (
                <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>
                  Essai illimité
                </p>
              ) : daysLeft !== null ? (
                <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>
                  {daysLeft === 0
                    ? "Dernier jour"
                    : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`}
                </p>
              ) : (
                <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>
                  30 jours offerts
                </p>
              )}
            </div>
          )}

          {/* ── Passer à l'abonnement ── */}
          {(status === "trial" || status === "paused") && !lifetimeTrial && (
            <div style={{ padding: "20px 0", borderBottom: "0.5px solid var(--line)" }}>
              <button
                disabled
                style={{
                  width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 400,
                  color: "var(--canvas)", background: "var(--pine)",
                  border: "none", borderRadius: 20, cursor: "not-allowed",
                  opacity: 0.4, fontFamily: "var(--font-sans)",
                }}
              >
                Passer à l&apos;abonnement
              </button>
              <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", textAlign: "center", marginTop: 8 }}>
                Disponible prochainement.
              </p>
            </div>
          )}

          {/* ── Reprendre Candice (paused) ── */}
          {status === "paused" && (
            <div style={{ padding: "16px 0", borderBottom: "0.5px solid var(--line)" }}>
              <AbonnementActions status={status} deletionScheduledAt={deletionScheduledAt} />
            </div>
          )}

          {/* ── Suppression programmée ── */}
          {deletionScheduledAt && (
            <div style={{ padding: "16px 0", borderBottom: "0.5px solid var(--line)" }}>
              <div style={{
                padding: "12px 14px",
                background: "rgba(224,82,82,0.06)",
                borderRadius: 10,
                border: "0.5px solid rgba(224,82,82,0.2)",
              }}>
                <p style={{ fontSize: 12, fontWeight: 300, color: "#E05252", lineHeight: 1.6 }}>
                  Suppression programmée le{" "}
                  {new Date(deletionScheduledAt).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}.
                </p>
              </div>
            </div>
          )}

          {/* ── Actions secondaires (cancel deletion for non-paused) ── */}
          {status !== "paused" && (
            <AbonnementActions status={status} deletionScheduledAt={deletionScheduledAt} />
          )}

        </div>
      </div>
    </DashboardShell>
  );
}
