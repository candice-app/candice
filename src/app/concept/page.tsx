import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/layout/MarketingNav";

export const metadata: Metadata = {
  title: "Candice — Comment ça marche",
  description: "Candice comprend vos proches, anticipe les bons moments et prépare les bonnes attentions.",
};

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const BORDER = "rgba(30,18,8,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

export default function ConceptPage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <style>{`
        /* ── Mobile base ── */
        .cpt-hero { padding: 64px 24px 52px; }
        .cpt-h1 { font-size: 36px !important; letter-spacing: -1px !important; line-height: 1.1 !important; }
        .cpt-pills { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
        .cpt-section { padding: 48px 24px; }
        .cpt-grid-2 { grid-template-columns: 1fr !important; gap: 12px !important; }
        .cpt-nav { padding: 0 20px !important; }
        .cpt-nav-links { display: none !important; }
        .cpt-footer { padding: 20px 24px !important; flex-direction: column !important; gap: 16px !important; align-items: flex-start !important; }

        .cpt-carousel {
          display: flex !important;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 8px;
        }
        .cpt-carousel::-webkit-scrollbar { display: none; }
        .cpt-carousel > * {
          scroll-snap-align: start;
          flex-shrink: 0 !important;
          width: 78vw !important;
          max-width: 300px !important;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .cpt-hero { padding: 96px 52px 80px; }
          .cpt-h1 { font-size: 56px !important; letter-spacing: -2px !important; line-height: 1.06 !important; }
          .cpt-pills { flex-direction: row !important; align-items: center !important; gap: 8px !important; }
          .cpt-section { padding: 72px 52px; }
          .cpt-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .cpt-nav { padding: 0 52px !important; }
          .cpt-nav-links { display: flex !important; }
          .cpt-footer { padding: 20px 52px !important; flex-direction: row !important; gap: 0 !important; align-items: center !important; }

          .cpt-carousel {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            overflow-x: visible !important;
            scroll-snap-type: none !important;
            padding-bottom: 0 !important;
          }
          .cpt-carousel > * {
            width: auto !important;
            max-width: none !important;
            flex-shrink: 1 !important;
          }
        }
      `}</style>

      <MarketingNav />

      {/* HERO */}
      <section className="cpt-hero" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20 }}>Candice</p>
          <h1 className="cpt-h1" style={{ fontFamily: PLAYFAIR, fontSize: 56, fontWeight: 400, lineHeight: 1.06, letterSpacing: -2, color: CON, marginBottom: 20 }}>
            Candice vous aide<br />à viser juste.
          </h1>
          <p style={{ fontSize: 17, fontWeight: 300, color: COND, lineHeight: 1.7, marginBottom: 32, maxWidth: 560 }}>
            Elle comprend vos proches, anticipe les bons moments et prépare les bonnes attentions avant même que vous y pensiez.
          </p>
          <div className="cpt-pills" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Moins d'oubli.", "Moins d'hésitation.", "Plus d'attentions qui tombent juste."].map((pill) => (
              <span key={pill} style={{ display: "inline-block", padding: "8px 16px", borderRadius: 100, border: `0.5px solid ${BORDER}`, background: WHITE, fontSize: 13, fontWeight: 300, color: CON, whiteSpace: "nowrap" }}>
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT SECTION */}
      <section className="cpt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 28 }}>Ce que Candice fait concrètement</p>
          <div className="cpt-grid-2" style={{ display: "grid" }}>
            {[
              { title: "Elle retient ce qui compte.", body: "Dates importantes, goûts, habitudes, allergies, préférences, moments difficiles." },
              { title: "Elle comprend les profils.", body: "Candice adapte ses suggestions à chaque personne et à chaque relation." },
              { title: "Elle prépare l'action.", body: "Message, cadeau, réservation, livraison : tout devient prêt à valider." },
              { title: "Vous gardez le contrôle.", body: "Rien n'est envoyé sans votre accord." },
            ].map((card, i) => (
              <div key={i} style={{ background: BG, borderRadius: 12, padding: "28px 28px 28px 24px", borderLeft: `2.5px solid ${TERRA}`, border: `0.5px solid ${BORDER}`, borderLeftWidth: "2.5px", borderLeftColor: TERRA, display: "flex", flexDirection: "column", gap: 8 }}>
                <h2 style={{ fontFamily: PLAYFAIR, fontSize: 18, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.3, color: CON, margin: 0 }}>{card.title}</h2>
                <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.7, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="cpt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 28, textAlign: "center" }}>Ça arrive à tout le monde.</p>
          <div className="cpt-carousel" style={{ gap: 12 }}>
            {[
              { q: "J'ai pensé à son anniversaire toute la semaine. Puis j'ai oublié.", label: "OUBLI" },
              { q: "Je savais exactement quoi faire. Je ne l'ai jamais fait.", label: "MANQUE DE TEMPS" },
              { q: "Je voulais faire plaisir. Je me suis trompé.", label: "MAUVAISE IDÉE" },
              { q: "Je voulais reprendre des nouvelles. Puis le temps est passé.", label: "PROCRASTINATION" },
            ].map((c, i) => (
              <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div aria-hidden="true" style={{ fontFamily: PLAYFAIR, fontSize: 28, fontWeight: 400, color: TERRA, opacity: 0.4, marginBottom: 12, lineHeight: 1 }}>&ldquo;</div>
                <p style={{ fontSize: 14, fontWeight: 400, color: CON, lineHeight: 1.5, flex: 1, marginBottom: 20 }}>{c.q}</p>
                <p style={{ fontSize: 9, fontWeight: 500, color: TERRA, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cpt-section" style={{ textAlign: "center", background: WHITE }}>
        <h2 style={{ fontFamily: PLAYFAIR, fontSize: 36, fontWeight: 400, color: CON, letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 14, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          Prêt à faire mieux,<br /><span style={{ color: TERRA }}>sans porter plus ?</span>
        </h2>
        <p style={{ fontSize: 13, fontWeight: 300, color: COND, marginBottom: 32 }}>
          Commencez gratuitement. Aucune carte requise.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
              Commencer avec Candice →
            </button>
          </Link>
          <Link href="/comment-ca-marche">
            <button style={{ background: "transparent", color: CON, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
              Voir comment ça marche
            </button>
          </Link>
        </div>
      </section>

      <footer className="cpt-footer" style={{ background: BG, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `0.5px solid ${BORDER}` }}>
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: "rgba(30,18,8,0.2)" }}>Candice ·</span>
        <nav aria-label="Liens légaux" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/confidentialite" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>Confidentialité</Link>
          <Link href="/conditions-generales" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>Conditions générales</Link>
          <a href="mailto:candiceapp.hello@gmail.com" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>Contact</a>
        </nav>
      </footer>
    </main>
  );
}
