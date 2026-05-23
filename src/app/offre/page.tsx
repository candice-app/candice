import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/layout/MarketingNav";
import MarketingFooter from "@/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Tarifs — Candice",
  description: "Candice Essentiel ou Candice — trouvez la formule qui vous correspond.",
};

const BG = "#FDFDFB";
const WHITE = "#FFFFFF";
const TERRA = "#173E31";
const CON = "#1A1A1A";
const COND = "rgba(26,26,26,0.55)";
const DARK = "#0E2219";
const BORDER = "rgba(23,62,49,0.1)";
const DM = "var(--font-sans)";
const PLAYFAIR = "var(--font-serif)";

export default function OffrePage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <style>{`
        .offre-hero { padding: 56px 20px 40px; text-align: center; }
        .offre-h1   { font-size: clamp(32px, 8vw, 52px); }
        .offre-plans { padding: 0 20px 64px; }
        .offre-grid  { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .offre-card  { padding: 28px 22px; }
        @media (min-width: 640px) {
          .offre-hero  { padding: 88px 52px 64px; }
          .offre-plans { padding: 0 52px 96px; }
          .offre-grid  { grid-template-columns: 1fr 1fr; gap: 16px; }
          .offre-card  { padding: 40px 36px; }
        }
      `}</style>

      {/* Nav */}
      <MarketingNav />

      {/* Hero */}
      <section className="offre-hero">
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 24 }}>Tarifs</p>
        <h1 className="offre-h1" style={{ fontFamily: PLAYFAIR, fontWeight: 400, lineHeight: 1.1, letterSpacing: -1.5, color: CON }}>
          Simple. Transparent.
        </h1>
      </section>

      {/* Plans */}
      <section className="offre-plans">
        <div style={{ maxWidth: 820, margin: "0 auto" }} className="offre-grid">

          {/* Candice Essentiel */}
          <div className="offre-card" style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 16, display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", color: COND, marginBottom: 8 }}>Candice Essentiel</p>
            <p style={{ fontFamily: PLAYFAIR, fontSize: 52, fontWeight: 400, color: CON, letterSpacing: -1.5, lineHeight: 1, marginBottom: 4 }}>0€</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: COND, marginBottom: 32 }}>Pour toujours</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 32 }}>
              {[
                "2 proches",
                "Suggestions personnalisées IA",
                "Fiches partagées par lien",
                "Accès à l'application complète",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: TERRA, fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 300, color: CON }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href="/register">
              <button style={{ width: "100%", background: "transparent", border: `1px solid ${TERRA}`, color: TERRA, borderRadius: 8, padding: "13px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
                Commencer gratuitement →
              </button>
            </Link>
          </div>

          {/* Candice */}
          <div className="offre-card" style={{ background: DARK, border: "none", borderRadius: 16, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 20, right: 20, background: TERRA, color: "#fff", fontSize: 10, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", padding: "4px 10px", borderRadius: 4 }}>
              14 jours offerts
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.5)", marginBottom: 8 }}>Candice</p>
            <p style={{ fontFamily: PLAYFAIR, fontSize: 52, fontWeight: 400, color: "#FAF7F2", letterSpacing: -1.5, lineHeight: 1, marginBottom: 4 }}>9€</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(250,247,242,0.5)", marginBottom: 32 }}>par mois · résiliable à tout moment</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 32 }}>
              {[
                "Proches illimités",
                "Suggestions avancées & personnalisées",
                "Exécution automatique des attentions",
                "Accès prioritaire aux partenaires",
                "Tout ce qui est inclus dans Essentiel",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: TERRA, fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.85)" }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href="/register">
              <button style={{ width: "100%", background: TERRA, border: "none", color: "#fff", borderRadius: 8, padding: "13px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
                Essayer gratuitement — 14 jours →
              </button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />

    </main>
  );
}
