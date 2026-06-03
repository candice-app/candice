import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import W2Flow from "@/components/workflows/W2Flow";

interface PageProps {
  searchParams: Promise<{ contactId?: string }>;
}

export default async function W2Page({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { contactId } = await searchParams;

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, photo_url")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("name", { ascending: true });

  return (
    <DashboardShell>
      <W2Flow
        contacts={contacts ?? []}
        initialContactId={contactId ?? null}
      />
    </DashboardShell>
  );
}
