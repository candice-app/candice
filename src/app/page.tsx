import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { BASE_URL } from "./metadata";
import MarketingNav from "@/components/layout/MarketingNav";
import MarketingFooter from "@/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: {
    absolute: "Candice — Votre copilote relationnel",
  },
  description:
    "Candice est votre mémoire relationnelle : elle retient ce qui compte sur vos proches, comprend chacun d'eux et prépare les bonnes attentions au bon moment.",
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
        .mkt-hero { padding: 64px 20px; }
        .mkt-hero-h1 { font-size: clamp(44px, 7vw, 80px); letter-spacing: -2px; line-height: 1.05; margin-bottom: 0; }
        .mkt-hero-sub { font-size: 18px; margin-top: 24px; margin-bottom: 48px; }
        .mkt-hero-cta { flex-direction: column; gap: 10px; }
        .mkt-hero-btn { width: 100%; box-sizing: border-box; text-align: center; display: block; }
        .mkt-intro { padding: 48px 20px; }
        .mkt-intro-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
        .mkt-section { padding: 72px 20px; }
        .mkt-grid-3 { grid-template-columns: 1fr !important; gap: 24px !important; }
        .mkt-grid-4 { grid-template-columns: 1fr 1fr !important; gap: 28px 20px !important; }
        .mkt-nav { padding: 0 20px !important; }
        .mkt-nav-links { display: none !important; }

        .mkt-iphone-grid {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 8px;
        }
        .mkt-iphone-grid::-webkit-scrollbar { display: none; }
        .mkt-iphone-grid > * {
          scroll-snap-align: start;
          flex-shrink: 0;
          width: 72vw;
          max-width: 240px;
        }

        .mkt-carousel {
          display: flex;
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
          flex-shrink: 0;
          width: 78vw;
          max-width: 300px;
        }

        /* Timeline mobile */
        .mkt-tl-mobile { display: flex; flex-direction: column; }
        .mkt-tl-desktop { display: none; }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .mkt-hero { padding: 100px 52px; }
          .mkt-hero-h1 { font-size: clamp(60px, 7vw, 80px); letter-spacing: -2.5px; }
          .mkt-hero-sub { font-size: 24px; }
          .mkt-hero-cta { flex-direction: row; gap: 12px; }
          .mkt-hero-btn { width: auto; display: inline-block; }
          .mkt-intro { padding: 64px 60px; }
          .mkt-intro-grid { grid-template-columns: 1fr 1fr; gap: 80px; }
          .mkt-section { padding: 96px 52px; }
          .mkt-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 24px !important; }
          .mkt-grid-4 { grid-template-columns: repeat(4, 1fr) !important; gap: 52px !important; }
          .mkt-nav { padding: 0 52px !important; }
          .mkt-nav-links { display: flex !important; }

          .mkt-iphone-grid {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: visible !important;
            scroll-snap-type: none !important;
            padding-bottom: 0 !important;
            align-items: flex-start !important;
            gap: 20px !important;
          }
          .mkt-iphone-grid > * {
            width: auto !important;
            max-width: none !important;
            flex: 1 !important;
          }

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

          /* Timeline desktop */
          .mkt-tl-mobile { display: none; }
          .mkt-tl-desktop { display: block; }
        }

        /* S3 — App preview section */
        .mkt-s3 { padding: 64px 0; }

        /* App preview cards grid */
        .mkt-cards-grid { display: grid; grid-template-columns: 1fr; gap: 16px; align-items: stretch; }
        @media (min-width: 768px) {
          .mkt-s3 { padding: 100px 0; }
          .mkt-cards-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
        }
        @media (min-width: 1024px) {
          .mkt-cards-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; }
        }

        /* Profiles section */
        .mkt-profiles-section { padding: 80px 20px; }
        .mkt-profiles-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }

        /* CTA final */
        .mkt-cta-final { padding: 96px 20px; }
        .mkt-cta-btns { display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: center; }

        @media (min-width: 768px) {
          .mkt-profiles-section { padding: 120px 52px; }
          .mkt-profiles-grid { grid-template-columns: repeat(3, 1fr); }
          .mkt-cta-final { padding: 160px 52px; }
          .mkt-cta-btns { flex-direction: row; gap: 12px; }
        }
      `}</style>

      <MarketingNav />

      {/* ── S1 — HERO ── */}
      <section id="main-content" className="mkt-hero" style={{ background: BG, textAlign: "center", borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <h1 className="mkt-hero-h1" style={{ fontFamily: PLAYFAIR, fontWeight: 400, color: CON }}>
            Votre copilote<br />
            <span style={{ fontStyle: "italic", color: TERRA }}>relationnel.</span>
          </h1>
          <p className="mkt-hero-sub" style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400, color: TERRA, textAlign: "center" }}>
            L&apos;attention juste, au bon moment.
          </p>
          <div className="mkt-hero-cta" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <button className="mkt-hero-btn" style={{ background: TERRA, color: "#FAF7F2", border: "none", borderRadius: 10, padding: "16px 36px", fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
                Commencer avec Candice
              </button>
            </Link>
            <Link href="/concept" style={{ textDecoration: "none" }}>
              <button className="mkt-hero-btn" style={{ background: "transparent", color: TERRA, border: `1.5px solid ${TERRA}`, borderRadius: 10, padding: "16px 36px", fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
                Explorer
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── S1b — INTRO 2 COLONNES ── */}
      <section aria-label="Présentation Candice" className="mkt-intro" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="mkt-intro-grid">
            <div style={{ borderLeft: `1.5px solid ${TERRA}`, paddingLeft: 24 }}>
              <p style={{ fontSize: 17, fontWeight: 400, color: "rgba(44,26,14,0.9)", lineHeight: 1.6, margin: 0, fontFamily: DM }}>
                Vivez pleinement les moments qui comptent.
              </p>
              <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 17, fontWeight: 400, color: TERRA, marginTop: 4, marginBottom: 0 }}>
                Candice s&apos;occupe du reste.
              </p>
            </div>
            <div style={{ borderLeft: `1.5px solid ${TERRA}`, paddingLeft: 24 }}>
              <p style={{ fontSize: 17, fontWeight: 400, color: "rgba(44,26,14,0.9)", lineHeight: 1.6, margin: 0, fontFamily: DM }}>
                Candice <strong style={{ fontWeight: 600 }}>apprend, anticipe et agit</strong> — pour que vos relations s&apos;approfondissent et que votre charge mentale disparaisse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── S2 — TÉMOIGNAGES ── */}
      <section aria-label="Ça arrive à tout le monde" className="mkt-section" style={{ background: WARM, borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 32, textAlign: "center" }}>
          Ça arrive à tout le monde.
        </p>
        <div className="mkt-carousel" style={{ gap: 12 }}>
          {[
            { q: "J'ai pensé à son anniversaire toute la semaine. Puis j'ai oublié.", name: "Julie", age: 38, label: "OUBLI" },
            { q: "Je savais exactement quoi faire. Je ne l'ai jamais fait.", name: "Thomas", age: 41, label: "MANQUE DE TEMPS" },
            { q: "Je voulais faire plaisir. Je me suis trompé.", name: "Sophie", age: 29, label: "MAUVAISE IDÉE" },
            { q: "Je voulais reprendre des nouvelles. Puis le temps est passé.", name: "Lucas", age: 38, label: "PROCRASTINATION" },
          ].map((c, i) => (
            <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
              <p style={{ fontFamily: PLAYFAIR, fontSize: 15, fontWeight: 400, fontStyle: "italic", color: CON, lineHeight: 1.65, flex: 1, marginBottom: 20 }}>&ldquo;{c.q}&rdquo;</p>
              <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 300, color: COND, margin: 0 }}>{c.name}, {c.age} ans</p>
                <p style={{ fontSize: 9, fontWeight: 500, color: TERRA, letterSpacing: 1.5, textTransform: "uppercase", margin: "4px 0 0" }}>{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── S3 — APP PREVIEW CARDS ── */}
      <section aria-label="Aperçu de l'application" className="mkt-s3" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1480, margin: "0 auto", paddingLeft: 24, paddingRight: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <h2 style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px, 4vw, 46px)", color: DEEP, letterSpacing: -1, lineHeight: 1.15, marginBottom: 0 }}>
              Tout ce qui compte pour eux,<br />réuni en un seul endroit.
            </h2>
            <p style={{ fontSize: 16, fontWeight: 400, color: "rgba(44,26,14,0.6)", lineHeight: 1.65, marginTop: 20, marginBottom: 0, fontFamily: DM }}>
              Pour ne plus jamais rien oublier. Pour ne plus jamais manquer un moment.
            </p>
          </div>
          <div className="mkt-cards-grid">
            <AppProchesCard />
            <AppSuggestionsCard />
            <AppSouvenirsCard />
            <AppFicheCard />
          </div>
        </div>
      </section>

      {/* ── S4 — TIMELINE "Candice grandit avec vous" ── */}
      <section aria-label="Candice grandit avec vous" className="mkt-section" style={{ background: DEEP, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, color: BG, letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 14 }}>
              Candice grandit avec vous.
            </h2>
            <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(250,247,242,0.6)", lineHeight: 1.75, maxWidth: 520, margin: "0 auto" }}>
              Dès la première information, Candice est utile. Plus vous l&apos;enrichissez, plus elle anticipe.
            </p>
          </div>

          {/* Mobile: vertical timeline */}
          <div className="mkt-tl-mobile">
            {[
              { eyebrow: "1er proche", name: "Léa", desc: "Dès le premier proche, Candice commence à comprendre votre style relationnel et propose des premières attentions." },
              { eyebrow: "2e proche", name: "Maman", desc: "Sa mémoire s'enrichit. Elle anticipe les moments importants et personnalise ses suggestions pour chaque relation." },
              { eyebrow: "3e proche", name: "Paul", desc: "Avec plusieurs profils, Candice devient un vrai copilote relationnel — précis, discret, toujours prêt." },
            ].map((m, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: i === 0 ? "rgba(196,122,74,0.45)" : i === 1 ? "rgba(196,122,74,0.72)" : TERRA,
                    border: `2px solid ${TERRA}`,
                    zIndex: 1,
                  }} />
                  {i < arr.length - 1 && (
                    <div style={{ width: 1.5, flex: 1, minHeight: 48, background: `linear-gradient(to bottom, ${TERRA}, rgba(196,122,74,0.3))`, opacity: 0.6, marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 36 : 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: TERRA, margin: "0 0 4px" }}>{m.eyebrow}</p>
                  <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 22, fontWeight: 400, color: BG, lineHeight: 1.2, margin: "0 0 10px" }}>{m.name}</p>
                  <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.65)", lineHeight: 1.75, margin: 0 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: horizontal timeline */}
          <div className="mkt-tl-desktop">
            {/* Top row — names */}
            <div style={{ display: "flex" }}>
              {[
                { eyebrow: "1er proche", name: "Léa" },
                { eyebrow: "2e proche", name: "Maman" },
                { eyebrow: "3e proche", name: "Paul" },
              ].map((m, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", paddingBottom: 20 }}>
                  <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: 2.5, textTransform: "uppercase", color: TERRA, margin: "0 0 6px" }}>{m.eyebrow}</p>
                  <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 28, fontWeight: 400, color: BG, lineHeight: 1.15, margin: 0 }}>{m.name}</p>
                </div>
              ))}
            </div>

            {/* Middle row — thickening line + dots */}
            <div style={{ position: "relative", height: 24, margin: "4px 0" }}>
              {/* Thickening terra line */}
              <div style={{
                position: "absolute",
                left: "16.7%", right: "16.7%",
                top: "50%", transform: "translateY(-50%)",
                height: 10,
                background: TERRA,
                clipPath: "polygon(0 40%, 100% 10%, 100% 90%, 0 60%)",
              }} />
              {/* Dots */}
              <div style={{ display: "flex", height: "100%", alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: i === 0 ? "rgba(196,122,74,0.45)" : i === 1 ? "rgba(196,122,74,0.72)" : TERRA,
                      border: `2px solid ${TERRA}`,
                      zIndex: 1, position: "relative",
                    }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row — descriptions */}
            <div style={{ display: "flex", marginTop: 20 }}>
              {[
                "Dès le premier proche, Candice commence à comprendre votre style relationnel et propose des premières attentions.",
                "Sa mémoire s'enrichit. Elle anticipe les moments importants et personnalise ses suggestions pour chaque relation.",
                "Avec plusieurs profils, Candice devient un vrai copilote relationnel — précis, discret, toujours prêt.",
              ].map((desc, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "0 24px" }}>
                  <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.65)", lineHeight: 1.8, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── S5 — 3 EXEMPLES CONCRETS ── */}
      <section aria-label="Exemples concrets" className="mkt-section" style={{ background: "#F5EDE3", borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20 }}>
            Des exemples concrets
          </p>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.5, color: CON, marginBottom: 56 }}>
            Un réflexe qui devient une mémoire.
          </h2>

          <div className="mkt-grid-3" style={{ display: "grid" }}>
            {[
              {
                who: "Votre grand-mère",
                text: "Vous avez indiqué à Candice qu'elle aime les romans policiers et déteste le bruit. Quelques semaines plus tard, elle change d'appartement. Candice vous suggère un casque antibruit et le dernier Fred Vargas — parce qu'elle sait que c'est le bon moment, pas n'importe quand.",
              },
              {
                who: "Votre frère",
                text: "Il traverse une période difficile au travail. Vous avez indiqué à Candice qu'il décompresse en faisant de la randonnée. Un vendredi soir, elle vous propose d'organiser une sortie en montagne pour le week-end suivant — et rédige même le message pour lui proposer.",
              },
              {
                who: "Votre femme",
                text: "Vous prenez en photo une robe qu'elle regardait en vitrine. Candice l'ajoute à sa fiche. Deux mois plus tard, quand elle décroche sa promotion, Candice vous la repropose — avec une carte rédigée, une livraison à son bureau, et le bon moment pour que ça compte vraiment.",
              },
            ].map((ex, i) => (
              <div key={i} style={{ padding: 24, background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 24, fontWeight: 400, color: TERRA, margin: 0, lineHeight: 1.15 }}>
                  {ex.who}
                </p>
                <p style={{ fontSize: 16, fontWeight: 300, color: CON, lineHeight: 1.8, margin: 0 }}>
                  {ex.text}
                </p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 15, fontWeight: 300, color: COND, letterSpacing: 0.1, marginTop: 40, textAlign: "center" }}>
            C&apos;est ça, un copilote relationnel.
          </p>
        </div>
      </section>

      {/* ── S6 — TECH WOW ── */}
      <section aria-label="Intelligence relationnelle" className="mkt-section" style={{ background: DEEP, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 24 }}>
              Intelligence
            </p>
            <h2 style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: -1, color: BG, marginBottom: 20, maxWidth: 680, marginLeft: "auto", marginRight: "auto" }}>
              L&apos;intelligence derrière chaque attention.
            </h2>
            <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(250,247,242,0.65)", lineHeight: 1.75, maxWidth: 520, margin: "0 auto" }}>
              Chaque détail enrichit sa compréhension. Chaque interaction l&apos;affine. Candice apprend vos relations — pas seulement vos contacts.
            </p>
          </div>

          <div className="mkt-grid-4" style={{ display: "grid" }}>
            {[
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <circle cx="16" cy="16" r="10" stroke="#C47A4A" strokeWidth="1.2" strokeOpacity="0.7" />
                    <circle cx="16" cy="16" r="4" fill="#C47A4A" fillOpacity="0.9" />
                    <line x1="16" y1="6" x2="16" y2="10" stroke="#C47A4A" strokeWidth="1" strokeOpacity="0.5" />
                    <line x1="16" y1="22" x2="16" y2="26" stroke="#C47A4A" strokeWidth="1" strokeOpacity="0.5" />
                    <line x1="6" y1="16" x2="10" y2="16" stroke="#C47A4A" strokeWidth="1" strokeOpacity="0.5" />
                    <line x1="22" y1="16" x2="26" y2="16" stroke="#C47A4A" strokeWidth="1" strokeOpacity="0.5" />
                    <circle cx="16" cy="6" r="2" fill="#C47A4A" fillOpacity="0.4" />
                    <circle cx="16" cy="26" r="2" fill="#C47A4A" fillOpacity="0.4" />
                    <circle cx="6" cy="16" r="2" fill="#C47A4A" fillOpacity="0.4" />
                    <circle cx="26" cy="16" r="2" fill="#C47A4A" fillOpacity="0.4" />
                  </svg>
                ),
                title: "Mémoire contextuelle",
                body: "Candice retient les détails de chaque proche : habitudes, envies, allergies, dates, contextes de vie.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M16 4 L17.5 12 L24 8 L19 14 L28 14 L20 17.5 L24 24 L16 19 L8 24 L12 17.5 L4 14 L13 14 L8 8 L14.5 12 Z" stroke="#C47A4A" strokeWidth="1.2" strokeOpacity="0.8" fill="none" strokeLinejoin="round" />
                    <circle cx="16" cy="14" r="2.5" fill="#C47A4A" fillOpacity="0.9" />
                  </svg>
                ),
                title: "Suggestions IA",
                body: "Elle croise profils, calendrier et contexte pour générer des attentions personnalisées, au bon moment.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M16 4 L26 8 L26 18 C26 23 21 27 16 28 C11 27 6 23 6 18 L6 8 Z" stroke="#C47A4A" strokeWidth="1.2" strokeOpacity="0.8" fill="none" strokeLinejoin="round" />
                    <rect x="13" y="14" width="6" height="7" rx="1" stroke="#C47A4A" strokeWidth="1" strokeOpacity="0.7" fill="none" />
                    <path d="M13.5 14 L13.5 12 C13.5 10.3 14.3 9 16 9 C17.7 9 18.5 10.3 18.5 12 L18.5 14" stroke="#C47A4A" strokeWidth="1" strokeOpacity="0.7" fill="none" />
                  </svg>
                ),
                title: "Confidentialité totale",
                body: "Vos informations restent privées. Vos proches ne voient jamais ce que vous avez confié à Candice.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <polyline points="4,24 10,16 16,19 22,10 28,6" stroke="#C47A4A" strokeWidth="1.4" strokeOpacity="0.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <circle cx="10" cy="16" r="2" fill="#C47A4A" fillOpacity="0.6" />
                    <circle cx="16" cy="19" r="2" fill="#C47A4A" fillOpacity="0.75" />
                    <circle cx="22" cy="10" r="2" fill="#C47A4A" fillOpacity="0.9" />
                    <circle cx="28" cy="6" r="2.5" fill="#C47A4A" />
                  </svg>
                ),
                title: "Apprentissage continu",
                body: "Chaque validation enrichit la mémoire. Candice s'affine avec chaque interaction, chaque relation.",
              },
            ].map((col, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>{col.icon}</div>
                <div style={{ width: 28, height: 1, background: TERRA, opacity: 0.4 }} />
                <h3 style={{ fontFamily: PLAYFAIR, fontSize: 18, fontWeight: 400, color: BG, margin: 0, lineHeight: 1.25 }}>{col.title}</h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.6)", lineHeight: 1.8, margin: 0 }}>{col.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── S7 — POURQUOI LES PROFILS CHANGENT TOUT ── */}
      <section aria-label="Pourquoi les profils changent tout" className="mkt-profiles-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: TERRA, marginBottom: 24, textAlign: "center" }}>
            Pourquoi les profils changent tout
          </p>
          <h2 style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px, 4vw, 44px)", color: CON, letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 64, maxWidth: 1000 }}>
            Un geste juste, c&apos;est un geste<br />qui correspond à qui ils sont vraiment.
          </h2>
          <div className="mkt-profiles-grid">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <path d="M14 24 C14 24 3.5 17 3.5 10.5 C3.5 7.5 6 5 9 5 C11 5 12.8 6.2 14 8 C15.2 6.2 17 5 19 5 C22 5 24.5 7.5 24.5 10.5 C24.5 17 14 24 14 24Z" stroke="#C47A4A" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
                  </svg>
                ),
                title: "Chaque personne reçoit différemment",
                body: "Pour certains, c'est un cadeau. Pour d'autres, un message au bon moment. Ou simplement une présence. Candice apprend comment chacun de vos proches reçoit les attentions.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <circle cx="14" cy="14" r="12" stroke="#C47A4A" strokeWidth="1.4"/>
                    <circle cx="14" cy="14" r="7.5" stroke="#C47A4A" strokeWidth="1.4"/>
                    <circle cx="14" cy="14" r="3" stroke="#C47A4A" strokeWidth="1.4"/>
                    <circle cx="14" cy="14" r="1" fill="#C47A4A"/>
                  </svg>
                ),
                title: "Les profils s'affinent dans le temps",
                body: "Plus vous interagissez, plus Candice affine sa compréhension. Chaque information enrichit le profil et améliore la justesse des suggestions.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <path d="M14 4 L15.4 10.6 L21 8 L17 13.5 L24 13 L17.5 16.5 L21 21.5 L14 17.5 L7 21.5 L10.5 16.5 L4 13 L11 13.5 L7 8 L12.6 10.6 Z" stroke="#C47A4A" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
                  </svg>
                ),
                title: "Ce que vous partagez reste entre vous",
                body: "Les profils sont privés. Vos proches peuvent choisir de compléter leur propre fiche — mais ce qu'ils partagent vous est destiné, et uniquement à vous.",
              },
            ].map((card, i) => (
              <div key={i} style={{ background: WHITE, border: `1px solid rgba(196,122,74,0.08)`, borderRadius: 16, boxShadow: "0 4px 24px rgba(44,26,14,0.06)", padding: "clamp(24px,3vw,36px)", display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ marginBottom: 24 }}>{card.icon}</div>
                <h3 style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 22, fontWeight: 400, color: CON, lineHeight: 1.2, letterSpacing: -0.3, marginBottom: 16 }}>{card.title}</h3>
                <p style={{ fontSize: 15, fontWeight: 400, color: "rgba(30,18,8,0.75)", lineHeight: 1.75, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 64, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 400, color: "rgba(30,18,8,0.7)", lineHeight: 1.75, maxWidth: 800, margin: "0 auto" }}>
              Vos données et celles de vos proches ne sont jamais partagées, vendues ou utilisées à des fins publicitaires.{" "}
              <Link href="/confidentialite" style={{ color: TERRA, textDecoration: "none", fontWeight: 500 }}>Notre engagement →</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── S8 — CTA FINAL ── */}
      <section aria-label="Démarrer avec Candice" className="mkt-cta-final" style={{ background: BG, textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(36px, 5vw, 56px)", color: CON, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 24 }}>
            Prêt à faire mieux,<br />sans porter plus&nbsp;?
          </h2>
          <p style={{ fontSize: 18, fontWeight: 400, color: "rgba(30,18,8,0.7)", lineHeight: 1.75, marginBottom: 48, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            Commencez simplement. Candice s&apos;occupe du reste.
          </p>
          <div className="mkt-cta-btns">
            <Link href="/register" style={{ textDecoration: "none" }}>
              <button style={{ background: TERRA, color: "#FAF7F2", border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: DM, whiteSpace: "nowrap" }}>
                Commencer
              </button>
            </Link>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <button style={{ background: "transparent", color: TERRA, border: `1.5px solid ${TERRA}`, borderRadius: 8, padding: "14px 32px", fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: DM, whiteSpace: "nowrap" }}>
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

const C_CARD = "#FFFFFF";
const C_SUB = "#F7F2E9";
const C_CARD_BORDER = "rgba(196,122,74,0.08)";
const C_TERRA = "#C47A4A";
const C_DEEP = "#2C1A0E";
const C_CREAM = "#FAF7F2";
const C_DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const C_PLAY = "'Playfair Display', Georgia, serif";

function CardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: C_CARD,
      borderRadius: 18,
      boxShadow: "0 6px 24px rgba(44,26,14,0.06), 0 1px 3px rgba(44,26,14,0.04)",
      borderLeft: `2px solid ${C_TERRA}`,
      padding: "24px 22px 24px 26px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      minHeight: 620,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(44,26,14,0.55)", fontFamily: C_DM, whiteSpace: "nowrap" }}>
        {title}
      </span>
      <span style={{ fontSize: 12, letterSpacing: "0.02em", color: C_TERRA, cursor: "pointer", fontFamily: C_DM, whiteSpace: "nowrap", marginLeft: 8 }}>
        + Ajouter
      </span>
    </div>
  );
}

function CardFooter({ text }: { text: string }) {
  return (
    <div style={{ marginTop: 20, textAlign: "center" }}>
      <span style={{ fontSize: 12, fontStyle: "italic", color: "rgba(44,26,14,0.45)", fontFamily: C_DM }}>{text}</span>
    </div>
  );
}

function AppProchesCard() {
  const contacts = [
    { init: "SM", color: "#C47A4A", name: "Sophie Martin",  detail: "Paris · Amie",   badge: "ANNIVERSAIRE J-4",       badgeBg: "rgba(196,122,74,0.18)",  badgeColor: "#C47A4A" },
    { init: "TL", color: "#6B8AAE", name: "Thomas Leroy",   detail: "Lyon · Frère",   badge: "2 MOIS SANS CONTACT",    badgeBg: "rgba(197,213,192,0.6)",  badgeColor: "#5C7558" },
    { init: "PL", color: "#8B6FAE", name: "Paul Lemaire",   detail: "Paris · Ami",    badge: "MARATHON DIMANCHE",      badgeBg: "rgba(197,213,192,0.6)",  badgeColor: "#5C7558" },
    { init: "CP", color: "#6B9E7B", name: "Claire — Maman", detail: "Bordeaux",       badge: "FÊTE DES MÈRES J-8",     badgeBg: "#E8D5C2",                badgeColor: "#B58661" },
    { init: "JR", color: "#B89058", name: "Julien R.",      detail: "Nantes · Ami",   badge: "3 MOIS SANS CONTACT",   badgeBg: "rgba(197,213,192,0.6)",  badgeColor: "#5C7558" },
  ];
  return (
    <CardWrapper>
      <div>
        <CardHeader title="MES PROCHES" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%", background: c.color, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 500, color: C_CREAM, fontFamily: C_DM,
              }}>
                {c.init}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C_DEEP, lineHeight: 1.3, fontFamily: C_DM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "rgba(44,26,14,0.55)", marginTop: 2, lineHeight: 1.3, fontFamily: C_DM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.detail}</div>
              </div>
              <div style={{
                flexShrink: 0, whiteSpace: "nowrap",
                fontSize: 9, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                color: c.badgeColor, background: c.badgeBg,
                padding: "4px 8px", borderRadius: 4, fontFamily: C_DM,
              }}>
                {c.badge}
              </div>
            </div>
          ))}
        </div>
      </div>
      <CardFooter text="Liste de proches" />
    </CardWrapper>
  );
}

function AppSuggestionsCard() {
  const suggestions = [
    { name: "SOPHIE MARTIN", desc: "Bouquet de pivoines de chez Debeaulieu — livraison le 14 mai.", btn: "Commander" },
    { name: "PAUL LEMAIRE",  desc: "Message d'encouragement pour son premier marathon. Prêt à envoyer.", btn: "Envoyer" },
    { name: "THOMAS LEROY",  desc: "Déjeuner dimanche — créneau commun trouvé.", btn: "Confirmer" },
  ];
  return (
    <CardWrapper>
      <div>
        <CardHeader title="SUGGESTIONS" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ background: C_SUB, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C_TERRA, marginBottom: 10, fontFamily: C_DM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
              <div style={{ fontSize: 13, fontWeight: 400, color: C_DEEP, lineHeight: 1.5, fontFamily: C_DM }}>{s.desc}</div>
              <button style={{ width: "100%", height: 36, background: C_TERRA, color: C_CREAM, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: C_DM, marginTop: 14 }}>
                {s.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
      <CardFooter text="Recommandations" />
    </CardWrapper>
  );
}

function AppSouvenirsCard() {
  const entries = [
    { day: "14", month: "FÉV", name: "Sophie Martin", desc: "Bouquet de roses envoyé. Elle a adoré.",  badge: "RÉACTION POSITIVE",  badgeBg: "rgba(197,213,192,0.6)",  badgeColor: "#5C7558" },
    { day: "02", month: "JAN", name: "Thomas Leroy",  desc: "Message nouvel an. Lu et répondu.",       badge: "MESSAGE · LU",       badgeBg: "#E8DDCB",                badgeColor: "rgba(44,26,14,0.65)" },
    { day: "25", month: "NOV", name: "Claire",        desc: "Dîner anniversaire. Excellent souvenir.", badge: "EXPÉRIENCE · TOP",   badgeBg: "rgba(196,122,74,0.18)", badgeColor: C_TERRA },
    { day: "10", month: "OCT", name: "Paul Lemaire",  desc: "Whisky Nikka lors de sa rupture.",        badge: "SOUTIEN · IMPACTANT",badgeBg: "#E8DDCB",                badgeColor: "rgba(44,26,14,0.65)" },
  ];
  return (
    <CardWrapper>
      <div>
        <CardHeader title="SOUVENIRS" />
        {/* Timeline container with vertical terra line */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute",
            left: 16,
            top: 0,
            bottom: 0,
            width: 1.5,
            background: "rgba(196,122,74,0.35)",
            pointerEvents: "none",
          }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {entries.map((e, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "row", gap: 16, position: "relative" }}>
                <div style={{ width: 44, flexShrink: 0 }}>
                  <div style={{ fontFamily: C_PLAY, fontStyle: "italic", fontSize: 18, fontWeight: 400, color: C_DEEP, lineHeight: 1 }}>{e.day}</div>
                  <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(44,26,14,0.55)", marginTop: 4, fontFamily: C_DM }}>{e.month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C_DEEP, fontFamily: C_DM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(44,26,14,0.7)", marginTop: 4, lineHeight: 1.5, fontFamily: C_DM }}>{e.desc}</div>
                  <div style={{ display: "inline-block", marginTop: 8, fontSize: 9, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: e.badgeColor, background: e.badgeBg, padding: "3px 7px", borderRadius: 4, fontFamily: C_DM, whiteSpace: "nowrap" }}>
                    {e.badge}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CardFooter text="Historique & souvenirs" />
    </CardWrapper>
  );
}

function AppFicheCard() {
  const kpis = [
    { value: "12",  label: "GESTES" },
    { value: "94%", label: "SATISFACTION" },
    { value: "J-4", label: "ANNIVERSAIRE" },
    { value: "8",   label: "INFOS" },
  ];
  const bars = [
    { label: "Cadeau", pct: 85 },
    { label: "Expé.",  pct: 72 },
    { label: "Mots",   pct: 60 },
    { label: "Geste",  pct: 45 },
  ];
  return (
    <CardWrapper>
      <div style={{ width: "100%" }}>
        <CardHeader title="SOPHIE MARTIN" />
        {/* Avatar block — centered */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%", background: C_TERRA,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 600, color: C_CREAM, fontFamily: C_DM, margin: "0 auto",
          }}>SM</div>
          <div style={{ fontFamily: C_PLAY, fontStyle: "italic", fontSize: 20, fontWeight: 400, color: C_DEEP, marginTop: 14, lineHeight: 1.2, whiteSpace: "nowrap" }}>Sophie Martin</div>
          <div style={{ fontSize: 12, color: "rgba(44,26,14,0.55)", marginTop: 4, fontFamily: C_DM, whiteSpace: "nowrap" }}>Amie proche · Paris</div>
        </div>
        {/* KPI 2×2 grid */}
        <div style={{ height: 24 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: C_SUB, border: `1px solid ${C_CARD_BORDER}`, borderRadius: 10, padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: C_PLAY, fontStyle: "italic", fontSize: 22, fontWeight: 400, color: C_DEEP, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(44,26,14,0.55)", marginTop: 6, fontFamily: C_DM, whiteSpace: "nowrap" }}>{k.label}</div>
            </div>
          ))}
        </div>
        {/* Bars */}
        <div style={{ height: 24 }} />
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: C_TERRA, marginBottom: 14, fontFamily: C_DM }}>Profil de réception</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, height: 18 }}>
              <span style={{ fontSize: 11, color: C_DEEP, width: 48, flexShrink: 0, fontFamily: C_DM }}>{b.label}</span>
              <div style={{ flex: 1, height: 3, borderRadius: 1.5, background: "rgba(44,26,14,0.08)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${b.pct}%`, background: C_TERRA, borderRadius: 1.5 }} />
              </div>
              <span style={{ fontSize: 11, color: C_DEEP, width: 32, textAlign: "right", flexShrink: 0, fontFamily: C_DM }}>{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <CardFooter text="Fiche · KPIs · Matching" />
    </CardWrapper>
  );
}
