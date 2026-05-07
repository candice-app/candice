import { createAdminClient } from "@/utils/supabase/admin";
import SharedProfileFlow from "./SharedProfileFlow";

function InvalidLink() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: 400, textAlign: "center" }}>
        <p style={{ fontSize: 40, marginBottom: 20 }}>🔗</p>
        <h1 style={{ fontSize: 22, fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", color: "#1E1208", marginBottom: 12 }}>
          Ce lien a expiré ou n&apos;est plus valide.
        </h1>
        <p style={{ fontSize: 15, fontWeight: 300, color: "#7A5E44", lineHeight: 1.65 }}>
          Demande à la personne qui te l&apos;a envoyé de générer un nouveau lien depuis son application Candice.
        </p>
      </div>
    </div>
  );
}

export default async function ProfilPartagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: shareLink } = await admin
    .from("share_links")
    .select("sender_name, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!shareLink) return <InvalidLink />;
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) return <InvalidLink />;

  return <SharedProfileFlow token={token} senderName={shareLink.sender_name} />;
}
