import Wordmark from "@/components/presence/Wordmark";

// Neutralisé (lot B.2 — D.5) : l'accès à une fiche par simple connaissance
// d'URL viole le principe « jamais de profil sans autorisation explicite ».
// Le partage sortant est reconstruit en Phase 7 (consentement + sections).
export default async function PartagePage() {
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
          Demande à la personne qui t&apos;a invité(e) de te renvoyer un lien depuis son application Candice.
        </p>
      </div>
    </div>
  );
}
