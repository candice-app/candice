import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import DashboardShell from "@/components/layout/DashboardShell";
import SharingClient from "./SharingClient";

export default async function SharingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: pendingRows }, { data: activeRows }] = await Promise.all([
    admin
      .from("profile_share_requests")
      .select("id, requester_id, created_at")
      .eq("profile_owner_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    admin
      .from("profile_share_requests")
      .select("id, requester_id, reauth_at")
      .eq("profile_owner_id", user.id)
      .eq("status", "accepted")
      .eq("confirmed_with_reauth", true)
      .order("reauth_at", { ascending: false }),
  ]);

  const uniqueIds = [...new Set([
    ...(pendingRows ?? []).map((r) => r.requester_id),
    ...(activeRows ?? []).map((r) => r.requester_id),
  ])];

  const identityMap: Record<string, { name: string; email: string }> = {};
  await Promise.all(
    uniqueIds.map(async (uid) => {
      const { data } = await admin.auth.admin.getUserById(uid);
      if (data?.user) {
        identityMap[uid] = {
          name: data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? "Utilisateur",
          email: data.user.email ?? "",
        };
      }
    })
  );

  const pendingRequests = (pendingRows ?? []).map((r) => ({
    id: r.id,
    requester_id: r.requester_id,
    requester_name: identityMap[r.requester_id]?.name ?? "Utilisateur",
    requester_email: identityMap[r.requester_id]?.email ?? "",
    created_at: r.created_at,
  }));

  const activeShares = (activeRows ?? []).map((r) => ({
    id: r.id,
    requester_id: r.requester_id,
    requester_name: identityMap[r.requester_id]?.name ?? "Utilisateur",
    requester_email: identityMap[r.requester_id]?.email ?? "",
    reauth_at: r.reauth_at,
  }));

  return (
    <DashboardShell>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label">Confidentialité</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Mes partages</h1>
          <Link
            href="/dashboard"
            style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", paddingBottom: 2 }}
          >
            ← Retour
          </Link>
        </div>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginTop: 6 }}>
          Gère qui peut consulter ta fiche personnelle.
        </p>
      </div>

      <SharingClient pendingRequests={pendingRequests} activeShares={activeShares} />
    </DashboardShell>
  );
}
