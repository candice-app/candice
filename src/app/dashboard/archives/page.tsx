import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import { Contact } from "@/types";
import ArchivesClient from "./ArchivesClient";

export default async function ArchivesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user.id)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  const contacts = (data ?? []) as Contact[];

  return (
    <DashboardShell>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label">Archivés</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Contacts archivés</h1>
          <Link
            href="/dashboard"
            style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", paddingBottom: 2 }}
          >
            ← Retour
          </Link>
        </div>
      </div>

      <ArchivesClient initialContacts={contacts} />
    </DashboardShell>
  );
}
