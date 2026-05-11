import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { BASE_URL } from "./metadata";
import MarketingNav from "@/components/layout/MarketingNav";

export const metadata: Metadata = {
  title: {
    absolute: "Candice — Votre copilote relationnel",
  },
  description:
    "Candice comprend vos proches, identifie les attentions qui comptent vraiment et prépare l'action au bon moment.",
  alternates: {
    canonical: BASE_URL,
  },
};

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const DEEP = "#2C1A0E";
const WARM = "#F2EBE0";
const BORDER = "rgba(30,18,8,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

export default function HomePage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <style>{`
        html { scroll-behavior: smooth; }

        /* ── Mobile base ── */
        .mkt-hero { padding: 44px 20px 48px; }
        .mkt-h1 { font-size: 30px !important; letter-spacing: -0.8px !important; line-height: 1.1 !important; }
        .mkt-section { padding: 48px 20px; }
        .mkt-grid-2 { grid-template-columns: 1fr !important; gap: 12px !important; }
        .mkt-grid-3 { grid-template-columns: 1fr !important; gap: 12px !important; }
        .mkt-nav { padding: 0 20px !important; }
        .mkt-nav-links { display: none !important; }
        .mkt-footer { padding: 20px 20px !important; flex-direction: column !important; gap: 16px !important; align-items: flex-start !important; }

        .mkt-cta-group { flex-direction: column !important; gap: 10px !important; }
        .mkt-cta-btn { width: 100% !important; box-sizing: border-box !important; text-align: center !important; display: block !important; }

        .mkt-carousel {
          display: flex !important;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 8px;
        }
        .mkt-carousel::-webkit-scrollbar { display: none; }
        .mkt-carousel > * {
          scroll-snap-align: start;
          flex-shrink: 0 !important;
          width: 78vw !important;
          max-width: 300px !important;
        }

        .mkt-screens {
          display: flex !important;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 8px;
        }
        .mkt-screens::-webkit-scrollbar { display: none; }
        .mkt-screens > * {
          scroll-snap-align: start;
          flex-shrink: 0 !important;
          width: 72vw !important;
          max-width: 230px !important;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .mkt-hero { padding: 100px 52px 92px; }
          .mkt-h1 { font-size: 84px !important; letter-spacing: -3px !important; line-height: 1.02 !important; }
          .mkt-section { padding: 72px 52px; }
          .mkt-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .mkt-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 16px !important; }
          .mkt-nav { padding: 0 52px !important; }
          .mkt-nav-links { display: flex !important; }
          .mkt-footer { padding: 20px 52px !important; flex-direction: row !important; gap: 0 !important; align-items: center !important; }

          .mkt-cta-group { flex-direction: row !important; gap: 12px !important; }
          .mkt-cta-btn { width: auto !important; display: inline-block !important; }

          .mkt-carousel {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            overflow-x: visible !important;
            scroll-snap-type: none !important;
            padding-bottom: 0 !important;
          }
          .mkt-carousel > * {
            width: auto !important;
            max-width: none !important;
            flex-shrink: 1 !important;
          }

          .mkt-screens {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            overflow-x: visible !important;
            scroll-snap-type: none !important;
            padding-bottom: 0 !important;
          }
          .mkt-screens > * {
            width: auto !important;
            max-width: none !important;
            flex-shrink: 1 !important;
          }
        }
      `}</style>

      <MarketingNav />

      {/* HERO */}
      <section id="main-content" className="mkt-hero" style={{ textAlign: "center", borderBottom: `0.5px solid ${BORDER}` }}>
        <h1 className="mkt-h1" style={{ fontFamily: PLAYFAIR, fontSize: 84, fontWeight: 400, color: CON, lineHeight: 1.02, letterSpacing: -3, marginBottom: 24 }}>
          Votre copilote<br /><em style={{ color: TERRA, fontStyle: "italic" }}>relationnel.</em>
        </h1>
        <p style={{ fontSize: 18, fontWeight: 300, color: COND, letterSpacing: -0.2, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.65 }}>
          Candice comprend vos proches, identifie les attentions qui comptent vraiment et prépare l&apos;action au bon moment.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 36 }}>
          {["Moins d'oubli.", "Moins d'hésitation.", "Plus d'attentions qui tombent juste."].map((pill) => (
            <span key={pill} style={{ display: "inline-block", padding: "7px 16px", borderRadius: 100, border: `0.5px solid ${BORDER}`, background: WHITE, fontSize: 13, fontWeight: 300, color: CON }}>
              {pill}
            </span>
          ))}
        </div>
        <div className="mkt-cta-group" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Link href="/register" style={{ textDecoration: "none" }}>
            <button className="mkt-cta-btn" style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
              Commencer avec Candice →
            </button>
          </Link>
          <a href="#product-demo" style={{ textDecoration: "none" }}>
            <button className="mkt-cta-btn" style={{ background: "transparent", color: CON, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
              Découvrir Candice
            </button>
          </a>
        </div>
      </section>

      {/* PRODUCT DEMO */}
      <section id="product-demo" aria-label="Aperçu de l'application" className="mkt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 30, fontWeight: 400, color: CON, letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 0 }}>
            Candice vous aide déjà à savoir quoi faire.
          </h2>
        </div>
        <div aria-hidden="true">
          <SuggestionMockups />
        </div>
        <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.65, textAlign: "center", maxWidth: 520, margin: "28px auto 0" }}>
          Plus Candice connaît vos proches, plus ses suggestions deviennent précises, personnelles et faciles à lancer.
        </p>
      </section>

      {/* HOW IT WORKS — dark section */}
      <section id="comment-ca-marche" aria-label="Comment ça marche" className="mkt-section" style={{ background: DEEP, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 40, textAlign: "center" }}>
          Comment ça marche
        </p>
        <div className="mkt-grid-3" style={{ maxWidth: 900, margin: "0 auto", display: "grid" }}>
          {[
            { num: "01", title: "Vous ajoutez vos proches.", body: "Goûts, habitudes, dates importantes, manière de recevoir les attentions." },
            { num: "02", title: "Candice comprend le contexte.", body: "Moments importants, périodes difficiles, habitudes, préférences." },
            { num: "03", title: "Candice prépare.", body: "Message, idée, réservation, livraison : tout est prêt à valider." },
          ].map((step) => (
            <div key={step.num} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "36px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontFamily: PLAYFAIR, fontSize: 48, fontWeight: 400, color: TERRA, lineHeight: 1, letterSpacing: -1, margin: 0 }}>{step.num}</p>
              <h3 style={{ fontFamily: PLAYFAIR, fontSize: 19, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.3, color: BG, margin: 0 }}>{step.title}</h3>
              <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(250,247,242,0.6)", lineHeight: 1.7, margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section aria-label="Témoignages" className="mkt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 32, textAlign: "center" }}>
          Ça arrive à tout le monde.
        </p>
        <div className="mkt-carousel" style={{ gap: 12 }}>
          {[
            { q: "J'ai pensé à son anniversaire toute la semaine. Puis j'ai oublié.", label: "OUBLI" },
            { q: "Je savais exactement quoi faire. Je ne l'ai jamais fait.", label: "MANQUE DE TEMPS" },
            { q: "Je voulais faire plaisir. Je me suis trompé.", label: "MAUVAISE IDÉE" },
            { q: "Je voulais reprendre des nouvelles. Puis le temps est passé.", label: "PROCRASTINATION" },
          ].map((c, i) => (
            <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
              <div aria-hidden="true" style={{ fontFamily: PLAYFAIR, fontSize: 28, fontWeight: 400, color: TERRA, opacity: 0.4, marginBottom: 12, lineHeight: 1 }}>&ldquo;</div>
              <p style={{ fontSize: 14, fontWeight: 400, color: CON, lineHeight: 1.5, flex: 1, marginBottom: 20 }}>{c.q}</p>
              <p style={{ fontSize: 9, fontWeight: 500, color: TERRA, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT CANDICE CHANGES — warm background */}
      <section aria-label="Ce que Candice change" className="mkt-section" style={{ background: WARM, borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 36 }}>Ce que Candice change</p>
        <div className="mkt-grid-2" style={{ display: "grid" }}>
          {[
            { num: "01 · MÉMOIRE RELATIONNELLE", h: "Chaque détail compte. Aucun ne se perd.", p: "Goûts, habitudes, dates importantes, moments partagés — Candice construit une mémoire fine de chacun de vos proches, là où votre tête était pleine." },
            { num: "02 · INTELLIGENCE CONTEXTUELLE", h: "La bonne suggestion. Pour la bonne personne. Au bon moment.", p: "Candice analyse le profil de chacun et propose uniquement ce qui a du sens — maintenant, pour cette personne précise." },
            { num: "03 · EXÉCUTION FLUIDE", h: "Vous décidez. Candice fait le travail.", p: "Commande, réservation, message rédigé — sans quitter l'application. L'intention reste la vôtre. L'effort, non." },
            { num: "04 · CHARGE MENTALE RÉDUITE", h: "Moins d'occasions manquées. Moins de regrets.", p: "Vous avez l'intention. Candice s'assure qu'elle se transforme en geste. À chaque fois. Pour chaque proche qui compte." },
          ].map((b, i) => (
            <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 36, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: 2, color: TERRA, textTransform: "uppercase", margin: 0 }}>{b.num}</p>
              <h3 style={{ fontFamily: PLAYFAIR, fontSize: 18, fontWeight: 400, lineHeight: 1.22, letterSpacing: -0.3, color: CON, margin: 0 }}>{b.h}</h3>
              <p style={{ fontSize: 12, fontWeight: 300, lineHeight: 1.75, color: COND, margin: 0 }}>{b.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY PROFILES MATTER */}
      <section aria-label="Pourquoi les profils changent tout" className="mkt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 16 }}>Pourquoi les profils changent tout</p>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 32, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 40 }}>
            Un geste juste, c&apos;est un geste<br />qui correspond à qui ils sont vraiment.
          </h2>
          <div className="mkt-grid-3" style={{ display: "grid", marginBottom: 32 }}>
            {[
              { icon: "♡", title: "Chaque personne reçoit différemment", body: "Pour certains, c'est un cadeau. Pour d'autres, un message au bon moment. Ou simplement une présence. Candice apprend comment chacun de vos proches reçoit les attentions." },
              { icon: "◎", title: "Les profils s'affinent dans le temps", body: "Plus vous interagissez, plus Candice affine sa compréhension. Chaque information enrichit le profil et améliore la justesse des suggestions." },
              { icon: "✦", title: "Ce que vous partagez reste entre vous", body: "Les profils sont privés. Vos proches peuvent choisir de compléter leur propre fiche — mais ce qu'ils partagent vous est destiné, et uniquement à vous." },
            ].map((card, i) => (
              <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
                <span style={{ fontSize: 22, color: TERRA }}>{card.icon}</span>
                <h3 style={{ fontFamily: PLAYFAIR, fontSize: 17, fontWeight: 400, lineHeight: 1.25, letterSpacing: -0.3, color: CON, margin: 0 }}>{card.title}</h3>
                <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.75, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, fontWeight: 300, color: COND, textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
            Vos données et celles de vos proches ne sont jamais partagées, vendues ou utilisées à des fins publicitaires.{" "}
            <Link href="/confidentialite" style={{ color: TERRA, textDecoration: "none" }}>Notre engagement →</Link>
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mkt-section" style={{ textAlign: "center", background: WHITE }}>
        <h2 style={{ fontFamily: PLAYFAIR, fontSize: 40, fontWeight: 400, color: CON, letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 14, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
          Prêt à faire mieux,<br /><span style={{ color: TERRA }}>sans porter plus ?</span>
        </h2>
        <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, marginBottom: 36, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
          Candice prépare les bonnes attentions. Vous n&apos;avez plus à tout porter seul.
        </p>
        <div className="mkt-cta-group" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Link href="/register" style={{ textDecoration: "none" }}>
            <button className="mkt-cta-btn" style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "15px 32px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
              Commencer avec Candice →
            </button>
          </Link>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <button className="mkt-cta-btn" style={{ background: "transparent", color: TERRA, border: `1px solid ${TERRA}`, borderRadius: 8, padding: "15px 32px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
              Se connecter
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mkt-footer" style={{ background: BG, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `0.5px solid ${BORDER}` }}>
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

function SuggestionMockups() {
  const BG = "#FAF7F2";
  const WHITE = "#FFFFFF";
  const CON = "#1E1208";
  const COND = "#7A5E44";
  const TERRA = "#C47A4A";
  const BORDER = "rgba(30,18,8,0.1)";

  const suggestions = [
    {
      init: "TL",
      gradient: "linear-gradient(135deg,#4A7C59,#2A5C39)",
      name: "Thomas Leroy",
      context: "Période difficile en ce moment",
      body: "Thomas traverse une période difficile. Candice suggère d'envoyer un dîner chez lui ce soir.",
      cta: "Commander →",
      label: "Période difficile",
    },
    {
      init: "CP",
      gradient: "linear-gradient(135deg,#9A3556,#72243E)",
      name: "Claire — Maman",
      context: "Anniversaire dans 6 jours",
      body: "Votre mère parle souvent de ce restaurant. Candice propose une réservation pour son anniversaire.",
      cta: "Réserver →",
      label: "Anniversaire J-6",
    },
    {
      init: "SM",
      gradient: "linear-gradient(135deg,#C47A4A,#8A4020)",
      name: "Sophie Martin",
      context: "Amie proche · Paris",
      body: "Sophie déteste les cadeaux impersonnels. Candice suggère un message + fleurs livrées demain matin.",
      cta: "Envoyer →",
      label: "Amie proche",
    },
    {
      init: "PL",
      gradient: "linear-gradient(135deg,#534AB7,#3C3489)",
      name: "Paul Lemaire",
      context: "Marathon dimanche",
      body: "Paul prépare son marathon dimanche. Candice propose un message d'encouragement prêt à envoyer.",
      cta: "Valider →",
      label: "Marathon dimanche",
    },
  ];

  return (
    <div className="mkt-screens" style={{ gap: 14 }}>
      {suggestions.map((s, i) => (
        <div key={i} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 18, padding: 8 }}>
          {/* Phone notch */}
          <div style={{ width: 32, height: 3, background: BORDER, borderRadius: 2, margin: "0 auto 7px" }} />
          <div style={{ background: WHITE, borderRadius: 12, padding: 10, overflow: "hidden" }}>
            {/* App bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: `0.5px solid ${BORDER}` }}>
              <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", color: CON }}>Suggestion</span>
              <span style={{ fontSize: 6, color: COND, opacity: 0.6 }}>✕ Ignorer</span>
            </div>
            {/* Contact row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{s.init}</div>
              <div>
                <p style={{ fontSize: 8, fontWeight: 500, color: CON, margin: 0, lineHeight: 1.2 }}>{s.name.replace(" — ", " · ")}</p>
                <p style={{ fontSize: 6, fontWeight: 300, color: TERRA, margin: 0 }}>{s.context}</p>
              </div>
            </div>
            {/* Suggestion text */}
            <div style={{ background: BG, borderRadius: 6, padding: "8px 8px", border: `0.5px solid ${BORDER}`, marginBottom: 8 }}>
              <p style={{ fontSize: 8, fontWeight: 400, color: CON, lineHeight: 1.5, margin: 0 }}>{s.body}</p>
            </div>
            {/* Action */}
            <button style={{ background: TERRA, color: "#fff", fontSize: 8, fontWeight: 500, padding: "5px 0", borderRadius: 4, border: "none", width: "100%", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{s.cta}</button>
          </div>
          <p style={{ textAlign: "center", marginTop: 8, fontSize: 10, fontWeight: 300, color: COND }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}
