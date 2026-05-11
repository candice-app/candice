import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/layout/MarketingNav";
import MarketingFooter from "@/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Mentions légales — Candice",
  description: "Mentions légales de Candice — éditeur, hébergeur, propriété intellectuelle.",
};

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const BORDER = "rgba(30,18,8,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: PLAYFAIR, fontSize: 19, fontWeight: 400, color: CON, marginBottom: 14, letterSpacing: -0.3 }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.85 }}>
        {children}
      </div>
    </section>
  );
}

export default function MentionsLegalesPage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <MarketingNav />

      {/* Disclaimer banner */}
      <div id="main-content" style={{ background: "#FFF8F0", borderBottom: `0.5px solid rgba(196,122,74,0.25)`, padding: "12px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 300, color: COND, margin: 0, fontStyle: "italic" }}>
          Document en cours de validation juridique. Version finale après revue avocat.
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "64px 24px 80px" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 12 }}>
            Mentions légales
          </p>
          <h1 style={{ fontFamily: PLAYFAIR, fontSize: 36, fontWeight: 400, color: CON, letterSpacing: -1, lineHeight: 1.1, marginBottom: 8 }}>
            Informations légales
          </h1>
          <p style={{ fontSize: 13, fontWeight: 300, color: COND }}>
            Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l&apos;économie numérique.
          </p>
        </div>

        <Section title="Éditeur du site">
          <p>
            Le site candice.app est édité par :<br />
            <strong style={{ fontWeight: 500, color: CON }}>Estelle Papillon</strong><br />
            Adresse : à compléter après immatriculation de la société<br />
            Email : <a href="mailto:candiceapp.hello@gmail.com" style={{ color: TERRA, textDecoration: "none" }}>candiceapp.hello@gmail.com</a>
          </p>
        </Section>

        <Section title="Directeur de la publication">
          <p>Estelle Papillon</p>
        </Section>

        <Section title="Hébergeur">
          <p>
            <strong style={{ fontWeight: 500, color: CON }}>Vercel Inc.</strong><br />
            440 N Barranca Ave #4133<br />
            Covina, CA 91723<br />
            États-Unis<br />
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: TERRA, textDecoration: "none" }}>vercel.com</a>
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            L&apos;ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, sons, logiciels, etc.) constitue une œuvre protégée par les lois françaises et internationales relatives à la propriété intellectuelle.
          </p>
          <p style={{ marginTop: 12 }}>
            Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est strictement interdite sans l&apos;autorisation écrite préalable de l&apos;éditeur.
          </p>
        </Section>

        <Section title="Marque">
          <p>
            La marque <strong style={{ fontWeight: 500, color: CON }}>Candice</strong> fait l&apos;objet d&apos;un dépôt auprès de l&apos;Institut National de la Propriété Industrielle (INPI). Toute utilisation non autorisée est susceptible de constituer une contrefaçon.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Pour toute question relative aux présentes mentions légales :{" "}
            <a href="mailto:candiceapp.hello@gmail.com" style={{ color: TERRA, textDecoration: "none" }}>
              candiceapp.hello@gmail.com
            </a>
          </p>
        </Section>

        <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 32, marginTop: 16 }}>
          <Link href="/" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </main>
  );
}
