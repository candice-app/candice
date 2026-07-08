// B.2 Phase 7 — réception du lien de partage sortant.
//
// Connecté : réclamation immédiate (« ajout auto ») → /fiche/[consentId]
// (qui applique la garde questionnaire). Sans compte : porte d'entrée —
// créer un compte ou se connecter. Un lien ne donne JAMAIS accès sans
// compte + le consentement du partageur (scope figé à la génération).

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import Wordmark from "@/components/presence/Wordmark";
import { claimShareLink, hashShareToken } from "@/lib/share-links";

export default async function RejoindrePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Connecté : ajout auto puis redirection vers la fiche ──────────────────
  if (user) {
    const result = await claimShareLink(token, user.id);
    if (result.ok) redirect(`/fiche/${result.consentId}`);
    return (
      <Landing>
        <h1 style={h1Style}>
          {result.reason === "self" ? "C'est ton propre lien." : "Ce lien n'est plus valide."}
        </h1>
        <p style={pStyle}>
          {result.reason === "self"
            ? "Envoie-le à la personne de ton choix — il s'activera chez elle."
            : "Il a déjà été utilisé ou annulé. Demande à la personne de t'en générer un nouveau depuis son application Candice."}
        </p>
        <Link href={result.reason === "self" ? "/moi/partage" : "/dashboard"} style={ctaSecondary}>
          {result.reason === "self" ? "Gérer mes partages →" : "Retour à l'accueil →"}
        </Link>
      </Landing>
    );
  }

  // ── Sans compte : porte d'entrée ──────────────────────────────────────────
  // Le prénom du partageur n'est montré que si le lien est encore valable.
  // Résolution par empreinte SHA-256 : le token n'est jamais stocké en clair.
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("profile_share_links")
    .select("owner_id, claimed_at, revoked_at, expires_at")
    .eq("token_hash", hashShareToken(token))
    .maybeSingle();

  if (!link || link.revoked_at || link.claimed_at || new Date(link.expires_at as string) <= new Date()) {
    return (
      <Landing>
        <h1 style={h1Style}>Ce lien n&apos;est plus valide.</h1>
        <p style={pStyle}>
          Il a déjà été utilisé ou annulé. Demande à la personne de t&apos;en
          générer un nouveau depuis son application Candice.
        </p>
      </Landing>
    );
  }

  const { data: { user: owner } } = await admin.auth.admin.getUserById(link.owner_id);
  const ownerFirstName = (owner?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Quelqu'un";

  return (
    <Landing>
      <p style={{
        fontSize: 11, fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase",
        color: "var(--pine)", marginBottom: 12,
      }}>
        Fiche partagée
      </p>
      <h1 style={h1Style}>{ownerFirstName} partage sa fiche avec toi.</h1>
      <p style={pStyle}>
        Sur Candice, chacun décrit ce qui lui fait vraiment plaisir — et choisit
        ce qu&apos;il partage. Crée ton compte pour découvrir ce que {ownerFirstName} a
        choisi de te confier, et remplis ta fiche à ton tour.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", marginTop: 24 }}>
        <Link href={`/register?share_token=${encodeURIComponent(token)}&de=${encodeURIComponent(ownerFirstName)}`} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minHeight: 52, padding: "0 28px", background: "var(--pine)", color: "#fff",
          borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: "none",
        }}>
          Créer mon compte gratuit →
        </Link>
        <Link href={`/login?next=${encodeURIComponent(`/rejoindre/${token}`)}`} style={ctaSecondary}>
          J&apos;ai déjà un compte
        </Link>
      </div>
    </Landing>
  );
}

const h1Style: React.CSSProperties = {
  fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 26,
  color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.25,
  marginBottom: 16,
};
const pStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7,
};
const ctaSecondary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  minHeight: 44, padding: "0 16px", fontSize: 13.5, fontWeight: 600,
  color: "var(--pine)", textDecoration: "none",
};

function Landing({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100svh", background: "var(--canvas)",
      fontFamily: "var(--font-sans)", color: "var(--ink)",
    }}>
      <header style={{ padding: "20px 24px", borderBottom: "0.5px solid rgba(23,62,49,.1)" }}>
        <Wordmark href="/" />
      </header>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "72px 24px", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}
