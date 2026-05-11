import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import MarketingNav from "@/components/layout/MarketingNav";
import MarketingFooter from "@/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Candice — Comment ça marche",
  description:
    "Candice comprend vos proches, anticipe les bons moments et prépare les bonnes attentions — cadeaux, messages, réservations — avant même que vous y pensiez.",
};

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const DEEP = "#2C1A0E";
const WARM = "#F2EBE0";
const BORDER = "rgba(30,18,8,0.1)";
const TERRA_BORDER = "rgba(196,122,74,0.35)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

export default function ConceptPage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <style>{`
        html { scroll-behavior: smooth; }

        /* ── Mobile base ── */
        .cpt-hero   { padding: 80px 20px 64px; }
        .cpt-h1     { font-size: 40px !important; letter-spacing: -1.5px !important; line-height: 1.08 !important; }
        .cpt-section { padding: 56px 20px; }
        .cpt-grid-2 { grid-template-columns: 1fr !important; gap: 12px !important; }
        .cpt-grid-3 { grid-template-columns: 1fr !important; gap: 16px !important; }
        .cpt-nav    { padding: 0 20px !important; }
        .cpt-nav-links { display: none !important; }
        .cpt-footer { padding: 20px 20px !important; flex-direction: column !important; gap: 16px !important; align-items: flex-start !important; }

        .cpt-cta-group { flex-direction: column !important; gap: 10px !important; }
        .cpt-cta-btn   { width: 100% !important; box-sizing: border-box !important; text-align: center !important; display: block !important; }

        .cpt-card { border: 0.5px solid ${TERRA_BORDER}; transition: border-color 0.2s ease; }
        .cpt-card:hover { border-color: rgba(196,122,74,0.65) !important; }

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

        .cpt-screens {
          display: flex !important;
          gap: 14px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 8px;
        }
        .cpt-screens::-webkit-scrollbar { display: none; }
        .cpt-screens > * {
          scroll-snap-align: start;
          flex-shrink: 0 !important;
          min-width: 280px !important;
          width: 80vw !important;
          max-width: 320px !important;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .cpt-hero    { padding: 120px 64px 96px; }
          .cpt-h1      { font-size: 72px !important; letter-spacing: -2.5px !important; line-height: 1.04 !important; }
          .cpt-section { padding: 88px 64px; }
          .cpt-grid-2  { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
          .cpt-grid-3  { grid-template-columns: 1fr 1fr 1fr !important; gap: 20px !important; }
          .cpt-nav     { padding: 0 52px !important; }
          .cpt-nav-links { display: flex !important; }
          .cpt-footer  { padding: 20px 64px !important; flex-direction: row !important; gap: 0 !important; align-items: center !important; }

          .cpt-cta-group { flex-direction: row !important; gap: 12px !important; }
          .cpt-cta-btn   { width: auto !important; display: inline-block !important; }

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

          .cpt-screens {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            max-width: 900px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            overflow-x: visible !important;
            scroll-snap-type: none !important;
            padding-bottom: 0 !important;
          }
          .cpt-screens > * {
            min-width: unset !important;
            width: auto !important;
            max-width: none !important;
            flex-shrink: 1 !important;
          }
        }
      `}</style>

      <MarketingNav />

      {/* ── S1 HERO — cream ── */}
      <section className="cpt-hero" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 24 }}>Candice</p>
          <h1 className="cpt-h1" style={{ fontFamily: PLAYFAIR, fontSize: 72, fontWeight: 400, lineHeight: 1.04, letterSpacing: -2.5, color: CON, marginBottom: 24 }}>
            Candice vous aide<br />à viser juste.
          </h1>
          <p style={{ fontSize: 18, fontWeight: 300, color: COND, lineHeight: 1.7, marginBottom: 36, maxWidth: 580 }}>
            Elle comprend vos proches, anticipe les bons moments et prépare les bonnes attentions avant même que vous y pensiez.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 40 }}>
            {["Moins d'oubli.", "Moins d'hésitation.", "Plus d'attentions qui tombent juste."].map((pill) => (
              <span key={pill} style={{ display: "inline-block", padding: "8px 18px", borderRadius: 100, border: `1px solid ${TERRA_BORDER}`, background: BG, fontSize: 13, fontWeight: 300, color: CON }}>
                {pill}
              </span>
            ))}
          </div>
          <div className="cpt-cta-group" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <button className="cpt-cta-btn" style={{ background: TERRA, color: BG, border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
                Commencer
              </button>
            </Link>
            <a href="#comment-ca-marche" style={{ textDecoration: "none" }}>
              <button className="cpt-cta-btn" style={{ background: "transparent", color: CON, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 32px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
                Voir comment Candice fonctionne
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── S2 WHAT CANDICE DOES — white ── */}
      <section className="cpt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 32 }}>Ce que Candice fait concrètement</p>
          <div className="cpt-grid-2" style={{ display: "grid" }}>
            {[
              { h: "Elle retient ce qui compte.", b: "Dates importantes, goûts, habitudes, allergies, préférences, moments difficiles." },
              { h: "Elle comprend les profils.", b: "Candice adapte ses suggestions à chaque personne et à chaque relation." },
              { h: "Elle prépare l'action.", b: "Message, cadeau, réservation, livraison : tout devient prêt à valider." },
              { h: "Vous gardez le contrôle.", b: "Rien n'est envoyé sans votre accord." },
            ].map((card, i) => (
              <div key={i} className="cpt-card" style={{ background: WHITE, borderRadius: 12, padding: 28, display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontFamily: PLAYFAIR, fontSize: 20, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.4, color: CON, margin: 0 }}>{card.h}</h2>
                <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, margin: 0 }}>{card.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── S3 PRODUCT VISUALIZATION — deep ── */}
      <section className="cpt-section" style={{ background: DEEP, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 32, fontWeight: 400, color: BG, letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 12 }}>
            Tout ce qui compte pour eux,<br />réuni au même endroit.
          </h2>
          <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.6)", lineHeight: 1.65 }}>
            Profils, suggestions, historique — en un coup d&apos;œil.
          </p>
        </div>
        <div aria-hidden="true">
          <ConceptMockups />
        </div>
      </section>

      {/* ── S4 HOW IT WORKS — warm ── */}
      <section id="comment-ca-marche" className="cpt-section" style={{ background: WARM, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 40, textAlign: "center" }}>Comment Candice fonctionne</p>
          <div className="cpt-grid-3" style={{ display: "grid" }}>
            {[
              { num: "01", h: "Vous construisez les profils.", b: "Vous ajoutez les goûts, habitudes, dates importantes et préférences de vos proches." },
              { num: "02", h: "Candice comprend le contexte.", b: "Anniversaire, période difficile, accomplissement, reprise de contact : Candice identifie les bons moments." },
              { num: "03", h: "Vous validez. Candice prépare.", b: "Message, idée, réservation ou cadeau : tout est prêt avant même que vous cherchiez quoi faire." },
            ].map((step) => (
              <div key={step.num} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "44px 36px", display: "flex", flexDirection: "column", gap: 18 }}>
                <p style={{ fontFamily: PLAYFAIR, fontSize: 52, fontWeight: 400, color: TERRA, lineHeight: 1, letterSpacing: -1, margin: 0 }}>{step.num}</p>
                <h3 style={{ fontFamily: PLAYFAIR, fontSize: 21, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.4, color: CON, margin: 0 }}>{step.h}</h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.8, margin: 0 }}>{step.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── S5 HUMAN PROBLEM — cream ── */}
      <section className="cpt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20, textAlign: "center" }}>Ça arrive à tout le monde.</p>
          <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.75, textAlign: "center", maxWidth: 560, margin: "0 auto 40px" }}>
            L&apos;intention est là. Ce qui manque, c&apos;est souvent le temps, l&apos;organisation ou simplement l&apos;idée juste.
          </p>
          <div className="cpt-carousel" style={{ gap: 12 }}>
            {[
              { q: "J'ai pensé à son anniversaire toute la semaine. Puis j'ai oublié.", label: "OUBLI" },
              { q: "Je savais exactement quoi faire. Je ne l'ai jamais fait.", label: "MANQUE DE TEMPS" },
              { q: "Je voulais faire plaisir. Je me suis trompé.", label: "MAUVAISE IDÉE" },
              { q: "Je voulais reprendre des nouvelles. Puis le temps est passé.", label: "PROCRASTINATION" },
            ].map((c, i) => (
              <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
                <div aria-hidden="true" style={{ fontFamily: PLAYFAIR, fontSize: 28, fontWeight: 400, color: TERRA, opacity: 0.4, marginBottom: 14, lineHeight: 1 }}>&ldquo;</div>
                <p style={{ fontSize: 14, fontWeight: 400, color: CON, lineHeight: 1.55, flex: 1, marginBottom: 20 }}>{c.q}</p>
                <p style={{ fontSize: 9, fontWeight: 500, color: TERRA, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── S6 WOW PRODUCT — cream ── */}
      <section className="cpt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 40, fontWeight: 400, lineHeight: 1.15, letterSpacing: -1, color: CON, marginBottom: 16 }}>
            Candice devient plus juste<br />avec le temps.
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.75, marginBottom: 56, maxWidth: 560 }}>
            Plus vous utilisez Candice, plus elle comprend ce qui compte vraiment pour chaque proche.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                h: "Chaque personne reçoit différemment.",
                b: "Pour certains, c'est un cadeau. Pour d'autres, un message au bon moment. Ou simplement une présence. Candice apprend comment chacun de vos proches reçoit les attentions.",
              },
              {
                h: "Les profils s'affinent dans le temps.",
                b: "Plus vous interagissez, plus Candice affine sa compréhension. Chaque information enrichit le profil et améliore la justesse des suggestions.",
              },
              {
                h: "Ce que vous partagez reste entre vous.",
                b: "Les profils sont privés. Vos proches peuvent compléter leur fiche — mais ce qu'ils partagent vous est destiné, et uniquement à vous.",
              },
            ].map((block, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${TERRA}`, paddingLeft: 28, paddingTop: 4, paddingBottom: 40 }}>
                <h3 style={{ fontFamily: PLAYFAIR, fontSize: 22, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.4, color: CON, marginBottom: 12, marginTop: 0 }}>{block.h}</h3>
                <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.8, margin: 0 }}>{block.b}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, fontWeight: 300, color: COND, marginTop: 8 }}>
            Vos données et celles de vos proches ne sont jamais partagées ou vendues.{" "}
            <Link href="/confidentialite" style={{ color: TERRA, textDecoration: "none" }}>Notre engagement →</Link>
          </p>
        </div>
      </section>

      {/* ── S7 FINAL CTA — deep ── */}
      <section className="cpt-section" style={{ background: DEEP, textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 40, fontWeight: 400, color: BG, letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 16 }}>
            Prêt à faire mieux,<br />sans porter plus ?
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: "rgba(250,247,242,0.6)", lineHeight: 1.7, marginBottom: 40 }}>
            Commencez simplement. Candice s&apos;occupe du reste.
          </p>
          <div className="cpt-cta-group" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <button className="cpt-cta-btn" style={{ background: TERRA, color: BG, border: "none", borderRadius: 8, padding: "16px 36px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
                Commencer
              </button>
            </Link>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <button className="cpt-cta-btn" style={{ background: "transparent", color: BG, border: `1px solid rgba(250,247,242,0.25)`, borderRadius: 8, padding: "16px 36px", fontSize: 15, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
                Se connecter
              </button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

function ConceptMockups() {
  const BG_C = "#FAF7F2";
  const WHITE_C = "#FFFFFF";
  const CON_C = "#1E1208";
  const COND_C = "#7A5E44";
  const TERRA_C = "#C47A4A";
  const BORDER_C = "rgba(30,18,8,0.1)";

  const items = [
    {
      init: "TL", gradient: "linear-gradient(135deg,#4A7C59,#2A5C39)",
      name: "Thomas Leroy", context: "Période difficile",
      body: "Thomas traverse une période difficile. Candice suggère d'envoyer un dîner chez lui ce soir.",
      cta: "Commander →", label: "Soutien",
    },
    {
      init: "CP", gradient: "linear-gradient(135deg,#9A3556,#72243E)",
      name: "Maman", context: "Anniversaire dans 6 jours",
      body: "Votre mère parle souvent de ce restaurant. Candice propose une réservation pour son anniversaire.",
      cta: "Réserver →", label: "Anniversaire",
    },
    {
      init: "SM", gradient: "linear-gradient(135deg,#C47A4A,#8A4020)",
      name: "Sophie Martin", context: "Amie proche · Paris",
      body: "Sophie déteste les cadeaux impersonnels. Candice suggère un message et des fleurs livrées demain.",
      cta: "Envoyer →", label: "Attention",
    },
    {
      init: "PL", gradient: "linear-gradient(135deg,#534AB7,#3C3489)",
      name: "Paul Lemaire", context: "Marathon dimanche",
      body: "Paul prépare son marathon dimanche. Candice propose un message d'encouragement prêt à envoyer.",
      cta: "Valider →", label: "Encouragement",
    },
  ];

  return (
    <div className="cpt-screens" style={{ gap: 14 }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: BG_C, border: `0.5px solid ${BORDER_C}`, borderRadius: 18, padding: 8 }}>
          <div style={{ width: 32, height: 3, background: BORDER_C, borderRadius: 2, margin: "0 auto 7px" }} />
          <div style={{ background: WHITE_C, borderRadius: 12, padding: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: `0.5px solid ${BORDER_C}` }}>
              <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", color: CON_C }}>Suggestion</span>
              <span style={{ fontSize: 6, color: COND_C, opacity: 0.5 }}>✕ Ignorer</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{s.init}</div>
              <div>
                <p style={{ fontSize: 8, fontWeight: 500, color: CON_C, margin: 0, lineHeight: 1.2 }}>{s.name}</p>
                <p style={{ fontSize: 6, fontWeight: 300, color: TERRA_C, margin: 0 }}>{s.context}</p>
              </div>
            </div>
            <div style={{ background: BG_C, borderRadius: 6, padding: "8px", border: `0.5px solid ${BORDER_C}`, marginBottom: 8 }}>
              <p style={{ fontSize: 8, fontWeight: 400, color: CON_C, lineHeight: 1.5, margin: 0 }}>{s.body}</p>
            </div>
            <button style={{ background: TERRA_C, color: "#fff", fontSize: 8, fontWeight: 500, padding: "5px 0", borderRadius: 4, border: "none", width: "100%", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{s.cta}</button>
          </div>
          <p style={{ textAlign: "center", marginTop: 8, fontSize: 10, fontWeight: 300, color: COND_C }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}
