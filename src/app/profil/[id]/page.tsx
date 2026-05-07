import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin";
import PublicForm from "./PublicForm";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("id, name, user_id")
    .eq("id", id)
    .single();

  if (!contact) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--br)" }}>
      <header style={{ padding: "16px 24px", borderBottom: "0.5px solid var(--brd)" }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 400, color: "var(--iv)", textDecoration: "none", letterSpacing: -0.5 }}>
          candice
        </Link>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: "var(--terra)", marginBottom: 12 }}>
            5 minutes
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "var(--con)", marginBottom: 10, lineHeight: 1.3 }}>
            Aide-nous à mieux prendre soin de toi.
          </h1>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6 }}>
            Quelqu&apos;un qui tient à toi utilise Candice pour mieux te faire plaisir.
            Réponds honnêtement — tes réponses restent privées et ne servent qu&apos;à ça.
          </p>
        </div>

        <PublicForm contactId={contact.id} userId={contact.user_id} />
      </main>
    </div>
  );
}
