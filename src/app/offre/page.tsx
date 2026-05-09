import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "L'offre — Candice",
  description: "Choisis ton Candice. Gratuit pour toujours ou Premium à 9€/mois.",
};

const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";

export default function OffrePage() {
  return (
    <main style={{ background: "#FAF7F2", fontFamily: "'Plus Jakarta Sans', sans-serif", color: CON, minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ height: 60, padding: "0 52px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid rgba(30,18,8,0.1)", background: "#FAF7F2", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: "flex", alignItems: "flex-start", gap: 4, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: CON }}>Candice</span>
          <span style={{ width: 7, height: 7, background: TERRA, borderRadius: "50%", marginTop: 3, flexShrink: 0, display: "inline-block" }} />
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          <Link href="/concept" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Le concept</Link>
          <Link href="/comment-ca-marche" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Comment ça marche</Link>
          <Link href="/offre" style={{ fontSize: 12, fontWeight: 400, color: TERRA }}>L&apos;offre</Link>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Se connecter</Link>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Commencer</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "88px 52px 64px", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 24 }}>L&apos;offre</p>
        <h1 style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.1, letterSpacing: -1.5, color: CON, fontFamily: "'Playfair Display', Georgia, serif" }}>
          Choisis ton Candice.
        </h1>
      </section>

      {/* Plans */}
      <section style={{ padding: "0 52px 96px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Free */}
          <div style={{ background: "#fff", border: "0.5px solid rgba(30,18,8,0.12)", borderRadius: 16, padding: "40px 36px", display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", color: COND, marginBottom: 8 }}>Gratuit</p>
            <p style={{ fontSize: 48, fontWeight: 300, color: CON, letterSpacing: -1.5, lineHeight: 1, marginBottom: 4, fontFamily: "'Playfair Display', Georgia, serif" }}>0€</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: COND, marginBottom: 32 }}>Pour toujours</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 32 }}>
              {[
                "2 proches",
                "Suggestions personnalisées IA",
                "Fiches partagées par lien",
                "Programme de points",
                "Accès à l'application complète",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: TERRA, fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 300, color: CON }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href="/register">
              <button style={{ width: "100%", background: "transparent", border: `1px solid ${TERRA}`, color: TERRA, borderRadius: 8, padding: "13px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                Commencer gratuitement →
              </button>
            </Link>
          </div>

          {/* Premium */}
          <div style={{ background: "#2C1A0E", border: "none", borderRadius: 16, padding: "40px 36px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 20, right: 20, background: TERRA, color: "#fff", fontSize: 10, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", padding: "4px 10px", borderRadius: 4 }}>
              14 jours offerts
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.5)", marginBottom: 8 }}>Premium</p>
            <p style={{ fontSize: 48, fontWeight: 300, color: "#FAF7F2", letterSpacing: -1.5, lineHeight: 1, marginBottom: 4, fontFamily: "'Playfair Display', Georgia, serif" }}>9€</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(250,247,242,0.5)", marginBottom: 32 }}>par mois · résiliable à tout moment</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 32 }}>
              {[
                "Proches illimités",
                "Suggestions avancées & personnalisées",
                "Exécution automatique des attentions",
                "Accès prioritaire aux partenaires",
                "Tout ce qui est inclus dans Gratuit",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: TERRA, fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.85)" }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href="/register">
              <button style={{ width: "100%", background: TERRA, border: "none", color: "#fff", borderRadius: 8, padding: "13px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                Commencer — 14 jours gratuits →
              </button>
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ background: "#FAF7F2", padding: "20px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid rgba(30,18,8,0.08)" }}>
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: "rgba(30,18,8,0.2)" }}>Candice ·</span>
        <div style={{ display: "flex", gap: 24 }}>
          {["Confidentialité", "Conditions générales", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}
