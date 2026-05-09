import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comment ça marche — Candice",
  description: "Simple comme bonjour. Puissant comme jamais.",
};

const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";

export default function CommentCaMarchePage() {
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
          <Link href="/comment-ca-marche" style={{ fontSize: 12, fontWeight: 400, color: TERRA }}>Comment ça marche</Link>
          <Link href="/offre" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>L&apos;offre</Link>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Se connecter</Link>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Commencer</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "96px 52px 72px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 24 }}>Comment ça marche</p>
        <h1 style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.1, letterSpacing: -1.5, color: CON, marginBottom: 16, fontFamily: "'Playfair Display', Georgia, serif" }}>
          Simple comme bonjour.<br /><span style={{ color: TERRA }}>Puissant comme jamais.</span>
        </h1>
      </section>

      {/* 3 steps */}
      <section style={{ padding: "0 52px 96px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            {
              num: "01",
              title: "Tes proches racontent. Toi tu complètes.",
              body: "Tes proches remplissent leur fiche à leur rythme — leurs goûts, leurs envies, leurs dates importantes. Toi tu complètes au fil du temps : une phrase après un dîner, une photo d'une vitrine, un détail que tu ne veux pas oublier.",
              accent: "#FAF7F2",
              bg: "#2C1A0E",
              textColor: "rgba(250,247,242,0.85)",
              titleColor: "#FAF7F2",
              numColor: TERRA,
            },
            {
              num: "02",
              title: "Candice apprend et anticipe.",
              body: "Candice apprend et anticipe. Elle croise les profils, les dates, le contexte. Elle sait quand agir, pour qui, et comment. Elle pense à ton prochain dîner avec ta sœur, à l'anniversaire de ton meilleur ami dans 3 semaines, au massage qui ferait du bien à ta maman.",
              accent: TERRA,
              bg: TERRA,
              textColor: "rgba(255,255,255,0.85)",
              titleColor: "#fff",
              numColor: "rgba(255,255,255,0.5)",
            },
            {
              num: "03",
              title: "Tu valides en un tap.",
              body: "Candice propose. Tu dis oui. Elle s'occupe du reste — commande, réservation, message rédigé, livraison planifiée. L'intention reste la tienne. L'effort, non.",
              accent: "#FAF7F2",
              bg: "#F0E8DC",
              textColor: COND,
              titleColor: CON,
              numColor: TERRA,
            },
          ].map((step, i) => (
            <div key={i} style={{ background: step.bg, borderRadius: 12, padding: "52px 52px", marginBottom: i < 2 ? 0 : 0 }}>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 3, color: step.numColor, marginBottom: 16, textTransform: "uppercase" }}>{step.num}</p>
              <h2 style={{ fontSize: 28, fontWeight: 300, color: step.titleColor, lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 16, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {step.title}
              </h2>
              <p style={{ fontSize: 16, fontWeight: 300, color: step.textColor, lineHeight: 1.8, maxWidth: 580 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#2C1A0E", padding: "72px 52px", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#FAF7F2", letterSpacing: -0.8, marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif" }}>
          Prêt à essayer ?
        </h2>
        <Link href="/register">
          <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "15px 32px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
            Essayer Candice gratuitement →
          </button>
        </Link>
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
