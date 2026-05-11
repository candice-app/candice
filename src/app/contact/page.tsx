import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/layout/MarketingNav";
import MarketingFooter from "@/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Contact — Candice",
  description: "Contactez l'équipe Candice. Nous lisons chaque message — réponse sous 48 h ouvrées.",
};

const BG = "#FAF7F2";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const BORDER = "rgba(30,18,8,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

export default function ContactPage() {
  return (
    <main id="main-content" style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <MarketingNav />

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "96px 24px 120px", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20 }}>
          Contact
        </p>
        <h1 style={{ fontFamily: PLAYFAIR, fontSize: 38, fontWeight: 400, color: CON, letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 20 }}>
          Une question,<br />une remarque&nbsp;?
        </h1>
        <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.8, marginBottom: 48 }}>
          Nous lisons chaque message. Réponse sous 48 h ouvrées.
        </p>

        <a
          href="mailto:candiceapp.hello@gmail.com"
          style={{
            display: "inline-block",
            fontSize: 16,
            fontWeight: 400,
            color: TERRA,
            textDecoration: "none",
            borderBottom: `1px solid rgba(196,122,74,0.4)`,
            paddingBottom: 2,
            letterSpacing: -0.2,
          }}
        >
          candiceapp.hello@gmail.com
        </a>

        <div style={{ marginTop: 64, borderTop: `0.5px solid ${BORDER}`, paddingTop: 32 }}>
          <Link href="/" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </main>
  );
}
