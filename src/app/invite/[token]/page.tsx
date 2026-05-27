import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import Wordmark from "@/components/presence/Wordmark";

export const dynamic = "force-dynamic";

const PINE = "#173E31";
const CANVAS = "#FDFDFB";
const INK = "#1A1A1A";
const COND = "rgba(26,26,26,0.55)";
const BORDER = "rgba(23,62,49,0.1)";
const DM = "var(--font-sans)";
const SERIF = "var(--font-serif)";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invite_links")
    .select("pilote_name, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) notFound();
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) notFound();

  const piloteFirstName = invite.pilote_name?.split(" ")[0] ?? "Quelqu'un";

  return (
    <div style={{ minHeight: "100vh", background: CANVAS, fontFamily: DM, color: INK }}>
      <header style={{ padding: "20px 24px", borderBottom: `0.5px solid ${BORDER}` }}>
        <Wordmark href="/" />
      </header>

      <main style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "72px 24px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: 4,
          textTransform: "uppercase", color: PINE, marginBottom: 28,
        }}>
          Invitation personnelle
        </p>

        <h1 style={{
          fontFamily: SERIF,
          fontWeight: 300,
          fontSize: "clamp(28px, 6vw, 38px)",
          color: INK,
          letterSpacing: "-.022em",
          lineHeight: 1.15,
          marginBottom: 20,
        } as React.CSSProperties}>
          {piloteFirstName} t&apos;a invité(e)<br />sur Candice.
        </h1>

        <p style={{
          fontSize: 16, fontWeight: 300, color: COND,
          lineHeight: 1.7, marginBottom: 52, maxWidth: 380,
        }}>
          Crée ton compte en deux minutes — tes réponses restent privées et permettent à Candice de suggérer des attentions vraiment justes.
        </p>

        <Link href={`/register?invite_token=${encodeURIComponent(token)}`} style={{ textDecoration: "none", width: "100%" }}>
          <button style={{
            width: "100%",
            background: PINE,
            color: CANVAS,
            border: "none",
            borderRadius: 10,
            padding: "16px 24px",
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: DM,
          }}>
            Créer mon compte →
          </button>
        </Link>

        <p style={{
          fontSize: 13, fontWeight: 300, color: COND,
          marginTop: 24, lineHeight: 1.65,
        }}>
          {piloteFirstName} ne lira jamais tes réponses brutes.
          <br />Candice les analyse en silence, pour toi.
        </p>
      </main>
    </div>
  );
}
