import { createAdminClient } from "@/utils/supabase/admin";
import Wordmark from "@/components/presence/Wordmark";

export const dynamic = "force-dynamic";

export default async function ProfilPartagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  // Legacy share_links — read sender name for a friendly message only
  const { data: shareLink } = await admin
    .from("share_links")
    .select("sender_name")
    .eq("token", token)
    .maybeSingle();

  const senderFirstName = shareLink?.sender_name?.split(" ")[0] ?? null;

  return (
    <div style={{
      minHeight: "100svh",
      background: "var(--canvas)",
      fontFamily: "var(--font-sans)",
      color: "var(--ink)",
    }}>
      <header style={{ padding: "20px 24px", borderBottom: "0.5px solid rgba(23,62,49,.1)" }}>
        <Wordmark href="/" />
      </header>

      <div style={{
        maxWidth: 480, margin: "0 auto",
        padding: "80px 24px", textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 26,
          color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.25,
          marginBottom: 16,
        } as React.CSSProperties}>
          Ce lien n&apos;est plus valide.
        </h1>
        <p style={{
          fontSize: 15, fontWeight: 300,
          color: "rgba(26,26,26,.6)", lineHeight: 1.7,
        }}>
          {senderFirstName
            ? `Demande à ${senderFirstName} de te renvoyer un nouveau lien d'invitation depuis son application Candice.`
            : "Demande à la personne qui t'a invité(e) de te renvoyer un lien depuis son application Candice."}
        </p>
      </div>
    </div>
  );
}
