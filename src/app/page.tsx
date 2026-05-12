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
        .mkt-hero { padding: 52px 20px 60px; }
        .mkt-h1 { font-size: clamp(46px, 10vw, 68px) !important; letter-spacing: -1.5px !important; line-height: 1.05 !important; }
        .mkt-section { padding: 72px 20px; }
        .mkt-grid-3 { grid-template-columns: 1fr !important; gap: 24px !important; }
        .mkt-grid-4 { grid-template-columns: 1fr 1fr !important; gap: 28px 20px !important; }
        .mkt-nav { padding: 0 20px !important; }
        .mkt-nav-links { display: none !important; }

        .mkt-cta-group { flex-direction: column !important; gap: 10px !important; }
        .mkt-cta-btn { width: 100% !important; box-sizing: border-box !important; text-align: center !important; display: block !important; }

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
          .mkt-hero { padding: 112px 52px 108px; }
          .mkt-h1 { font-size: clamp(65px, 8vw, 108px) !important; letter-spacing: -3px !important; line-height: 1.02 !important; }
          .mkt-section { padding: 96px 52px; }
          .mkt-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 24px !important; }
          .mkt-grid-4 { grid-template-columns: repeat(4, 1fr) !important; gap: 52px !important; }
          .mkt-nav { padding: 0 52px !important; }
          .mkt-nav-links { display: flex !important; }

          .mkt-cta-group { flex-direction: row !important; gap: 12px !important; }
          .mkt-cta-btn { width: auto !important; display: inline-block !important; }

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
      `}</style>

      <MarketingNav />

      {/* ── S1 — HERO ── */}
      <section id="main-content" className="mkt-hero" style={{ textAlign: "center", borderBottom: `0.5px solid ${BORDER}` }}>
        <h1 className="mkt-h1" style={{ fontFamily: PLAYFAIR, fontWeight: 400, color: CON, marginBottom: 20 }}>
          Votre copilote<br /><em style={{ color: TERRA, fontStyle: "italic" }}>relationnel.</em>
        </h1>
        <p style={{ fontSize: 18, fontWeight: 300, color: COND, letterSpacing: -0.2, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.65 }}>
          Candice devient votre mémoire relationnelle&nbsp;: elle retient, comprend et prépare les bonnes attentions au bon moment.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginBottom: 40 }}>
          {["Moins d'oubli.", "Moins de charge mentale.", "Plus d'attentions qui tombent juste."].map((text, i) => (
            <React.Fragment key={text}>
              {i > 0 && <span aria-hidden="true" style={{ color: BORDER, userSelect: "none", fontSize: 14 }}>·</span>}
              <span style={{ fontSize: 13, fontWeight: 300, color: COND }}>{text}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="mkt-cta-group" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Link href="/register" style={{ textDecoration: "none" }}>
            <button className="mkt-cta-btn" style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "16px 32px", fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: DM, height: 52 }}>
              Commencer avec Candice
            </button>
          </Link>
          <Link href="/concept" style={{ textDecoration: "none" }}>
            <button className="mkt-cta-btn" style={{ background: "transparent", color: TERRA, border: `1.5px solid ${TERRA}`, borderRadius: 8, padding: "16px 32px", fontSize: 16, fontWeight: 400, cursor: "pointer", fontFamily: DM, height: 52 }}>
              Explorer
            </button>
          </Link>
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

      {/* ── S3 — MOCKUPS iPhone ── */}
      <section aria-label="Aperçu de l'application" className="mkt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div aria-hidden="true">
          <IPhoneMockups />
        </div>
        <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, textAlign: "center", maxWidth: 540, margin: "40px auto 0", fontStyle: "italic" }}>
          Candice peut déjà vous aider avec quelques informations. Plus vous lui en donnez, plus elle devient précise, personnelle et juste.
        </p>
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
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: BG, marginBottom: 20, maxWidth: 680, marginLeft: "auto", marginRight: "auto" }}>
              Candice n&apos;est pas un rappel.<br />C&apos;est une intelligence qui apprend votre relation.
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

      {/* ── S7 — CTA FINAL ── */}
      <section aria-label="Démarrer avec Candice" className="mkt-section" style={{ background: DEEP, textAlign: "center", marginTop: 0 }}>
        <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 400, fontStyle: "italic", color: BG, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 24, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          Penser à eux,<br />sans y penser.
        </h2>
        <p style={{ fontSize: 18, fontWeight: 300, color: "rgba(250,247,242,0.65)", lineHeight: 1.75, marginBottom: 44, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Candice retient ce qui compte, comprend chaque proche et prépare les bonnes attentions à votre place. Vous décidez. Elle s&apos;occupe du reste.
        </p>
        <Link href="/register" style={{ textDecoration: "none" }}>
          <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "16px 40px", fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: DM, height: 52 }}>
            Commencer avec Candice
          </button>
        </Link>
      </section>

      <MarketingFooter />
    </main>
  );
}

function IPhoneFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
      <p style={{ fontSize: 12, fontWeight: 300, color: "#7A5E44", textAlign: "center", margin: 0, letterSpacing: -0.1 }}>{title}</p>
      <div
        style={{
          background: "#1C1C1E",
          borderRadius: 48,
          padding: "14px 8px 20px",
          boxShadow: "0 32px 64px -16px rgba(44,26,14,0.18), 0 2px 8px rgba(0,0,0,0.12)",
          width: "100%",
          maxWidth: 240,
          position: "relative",
        }}
      >
        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 8px", color: "rgba(255,255,255,0.85)", fontSize: 8, fontWeight: 600 }}>
          <span>9:41</span>
          {/* Dynamic island */}
          <div style={{ width: 72, height: 14, background: "#1C1C1E", borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 10 }} />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden="true">
              <rect x="0" y="5" width="2" height="3" rx="0.5" fill="white" opacity="0.4" />
              <rect x="3" y="3" width="2" height="5" rx="0.5" fill="white" opacity="0.65" />
              <rect x="6" y="1" width="2" height="7" rx="0.5" fill="white" opacity="0.85" />
              <rect x="9" y="0" width="2" height="8" rx="0.5" fill="white" />
            </svg>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
              <path d="M6 1.5 C3.5 1.5 1.5 3.5 1.5 6" stroke="white" strokeWidth="1.1" fill="none" opacity="0.45" strokeLinecap="round" />
              <path d="M6 3.5 C4.5 3.5 3.5 4.5 3.5 6" stroke="white" strokeWidth="1.1" fill="none" opacity="0.7" strokeLinecap="round" />
              <circle cx="6" cy="6" r="1" fill="white" />
            </svg>
            <svg width="17" height="9" viewBox="0 0 17 9" fill="none" aria-hidden="true">
              <rect x="0.5" y="0.5" width="14" height="8" rx="2.5" stroke="white" strokeOpacity="0.35" />
              <rect x="1.5" y="1.5" width="9" height="6" rx="1.5" fill="white" />
              <path d="M15.5 3 Q17 4.5 15.5 6" stroke="white" strokeOpacity="0.45" strokeWidth="1" fill="none" />
            </svg>
          </div>
        </div>
        {/* Screen */}
        <div style={{ background: "#FAF7F2", borderRadius: 36, overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function IPhoneMockups() {
  const C_BG = "#FAF7F2";
  const C_WHITE = "#FFFFFF";
  const C_CON = "#1E1208";
  const C_COND = "#7A5E44";
  const C_TERRA = "#C47A4A";
  const C_BORDER = "rgba(30,18,8,0.1)";
  const C_FAINT = "rgba(30,18,8,0.04)";

  return (
    <div className="mkt-iphone-grid">
      {/* MOCKUP 1 — Dashboard */}
      <IPhoneFrame title="L'app, au quotidien.">
        <div style={{ padding: "16px 14px" }}>
          <p style={{ fontSize: 9, fontWeight: 300, color: C_COND, margin: "0 0 14px", fontStyle: "italic" }}>Bonjour Estelle.</p>
          {[
            { init: "PL", grad: "linear-gradient(135deg,#534AB7,#3C3489)", name: "Paul", status: "Candice connaît bien Paul." },
            { init: "LÉ", grad: "linear-gradient(135deg,#9A3556,#72243E)", name: "Léa", status: "Commence à connaître Léa." },
            { init: "MA", grad: "linear-gradient(135deg,#4A7C59,#2A5C39)", name: "Maman", status: "Anticipe pour votre mère." },
          ].map((c) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: C_WHITE, marginBottom: 6, border: `0.5px solid ${C_BORDER}` }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7.5, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{c.init}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: C_CON, margin: 0, lineHeight: 1.3 }}>{c.name}</p>
                <p style={{ fontSize: 7.5, fontWeight: 300, color: C_COND, margin: "2px 0 0", fontStyle: "italic", lineHeight: 1.4 }}>{c.status}</p>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, background: C_FAINT, border: `0.5px solid ${C_BORDER}`, borderRadius: 10, padding: "9px 12px" }}>
            <p style={{ fontSize: 8, fontWeight: 300, color: "rgba(30,18,8,0.35)", margin: 0 }}>Parlez à Candice…</p>
          </div>
        </div>
      </IPhoneFrame>

      {/* MOCKUP 2 — Analyse profil */}
      <IPhoneFrame title="Ce que Candice comprend.">
        <div style={{ padding: "16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `0.5px solid ${C_BORDER}` }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#C47A4A,#8A4020)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, fontWeight: 600, color: "#fff", flexShrink: 0 }}>SM</div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 500, color: C_CON, margin: 0, lineHeight: 1.3 }}>Sarah</p>
              <p style={{ fontSize: 7.5, fontWeight: 300, color: C_TERRA, margin: "2px 0 0", lineHeight: 1.3 }}>amie proche</p>
            </div>
          </div>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: 0.8, color: C_TERRA, margin: "0 0 12px", textTransform: "uppercase" }}>Analyse Candice</p>
          {[
            "Reçoit l'amour par les gestes intimes.",
            "Sensible aux attentions discrètes.",
            "Adore la cuisine italienne.",
            "Allergique aux fruits à coque.",
          ].map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ color: C_TERRA, fontSize: 9, flexShrink: 0, marginTop: 1, lineHeight: 1.5 }}>·</span>
              <p style={{ fontSize: 8.5, fontWeight: 300, color: C_CON, margin: 0, lineHeight: 1.55 }}>{line}</p>
            </div>
          ))}
        </div>
      </IPhoneFrame>

      {/* MOCKUP 3 — Suggestions */}
      <IPhoneFrame title="Les bonnes attentions.">
        <div style={{ padding: "16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `0.5px solid ${C_BORDER}` }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#4A7C59,#2A5C39)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7.5, fontWeight: 600, color: "#fff", flexShrink: 0 }}>TL</div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 500, color: C_CON, margin: 0, lineHeight: 1.3 }}>Thomas</p>
              <p style={{ fontSize: 7.5, fontWeight: 300, color: C_TERRA, margin: "2px 0 0", lineHeight: 1.3 }}>ami · Paris</p>
            </div>
          </div>
          {[
            "Sa sœur arrive samedi. Préparer un message ?",
            "Soirée pizza dans 12 jours. Réserver ?",
            "Anniversaire dans 23 jours.",
          ].map((s, i) => (
            <div key={i} style={{ background: C_FAINT, border: `0.5px solid ${C_BORDER}`, borderRadius: 8, padding: "9px 10px", marginBottom: 7, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 8, fontWeight: 300, color: C_CON, margin: 0, lineHeight: 1.5, flex: 1 }}>{s}</p>
              <button style={{ background: C_TERRA, color: "#fff", fontSize: 7, fontWeight: 500, padding: "4px 8px", borderRadius: 5, border: "none", cursor: "pointer", flexShrink: 0 }}>Voir</button>
            </div>
          ))}
        </div>
      </IPhoneFrame>

      {/* MOCKUP 4 — Validation */}
      <IPhoneFrame title="Vous décidez.">
        <div style={{ padding: "16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `0.5px solid ${C_BORDER}` }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: C_TERRA, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>C</div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 500, color: C_CON, margin: 0, lineHeight: 1.3 }}>Candice</p>
              <p style={{ fontSize: 7.5, fontWeight: 300, color: "rgba(30,18,8,0.4)", margin: "1px 0 0", lineHeight: 1.3 }}>il y a 2 min</p>
            </div>
          </div>
          <div style={{ background: C_BG, border: `0.5px solid ${C_BORDER}`, borderRadius: "4px 12px 12px 12px", padding: "11px 12px", marginBottom: 16 }}>
            <p style={{ fontSize: 8, fontWeight: 300, color: C_CON, margin: 0, lineHeight: 1.65 }}>
              Je pense qu&apos;un bouquet de pivoines ferait plaisir à Valentin demain. Bergamotte, livraison 14h, 38&nbsp;€. Je m&apos;en occupe&nbsp;?
            </p>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button style={{ flex: 1, background: C_TERRA, color: "#fff", fontSize: 8.5, fontWeight: 500, padding: "9px 0", borderRadius: 7, border: "none", cursor: "pointer" }}>Valider</button>
            <button style={{ flex: 1, background: "transparent", color: C_CON, fontSize: 8.5, fontWeight: 300, padding: "9px 0", borderRadius: 7, border: `0.5px solid ${C_BORDER}`, cursor: "pointer" }}>Modifier</button>
          </div>
        </div>
      </IPhoneFrame>

      {/* MOCKUP 5 — Graphe de relations */}
      <IPhoneFrame title="Votre réseau relationnel.">
        <div style={{ padding: "16px 14px", minHeight: 180 }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: 0.8, color: C_TERRA, margin: "0 0 12px", textTransform: "uppercase" }}>Réseau</p>
          <svg width="100%" viewBox="0 0 176 150" style={{ overflow: "visible" }} aria-hidden="true">
            <line x1="88" y1="75" x2="28" y2="30" stroke={C_TERRA} strokeWidth="0.7" strokeOpacity="0.35" />
            <line x1="88" y1="75" x2="148" y2="30" stroke={C_TERRA} strokeWidth="0.7" strokeOpacity="0.35" />
            <line x1="88" y1="75" x2="28" y2="120" stroke={C_TERRA} strokeWidth="0.7" strokeOpacity="0.35" />
            <line x1="88" y1="75" x2="148" y2="120" stroke={C_TERRA} strokeWidth="0.7" strokeOpacity="0.35" />
            <line x1="88" y1="75" x2="88" y2="8" stroke={C_TERRA} strokeWidth="0.7" strokeOpacity="0.2" />
            <circle cx="88" cy="75" r="24" fill={C_WHITE} stroke={C_TERRA} strokeWidth="1.2" />
            <text x="88" y="72" textAnchor="middle" fontSize="6.5" fontWeight="500" fill={C_TERRA} fontFamily="sans-serif">Estelle</text>
            <text x="88" y="82" textAnchor="middle" fontSize="5.5" fontWeight="300" fill={C_COND} fontFamily="sans-serif">vous</text>
            {[
              { cx: 28, cy: 30, initials: "PL", color: "#534AB7", label: "Paul" },
              { cx: 148, cy: 30, initials: "SM", color: "#C47A4A", label: "Sarah" },
              { cx: 28, cy: 120, initials: "MA", color: "#4A7C59", label: "Maman" },
              { cx: 148, cy: 120, initials: "TL", color: "#9A3556", label: "Thomas" },
              { cx: 88, cy: 8, initials: "LÉ", color: "#7A5E44", label: "Léa" },
            ].map((n) => (
              <g key={n.label}>
                <circle cx={n.cx} cy={n.cy} r="17" fill={n.color} opacity="0.9" />
                <text x={n.cx} y={n.cy + 2.5} textAnchor="middle" fontSize="6.5" fontWeight="600" fill="white" fontFamily="sans-serif">{n.initials}</text>
                <text x={n.cx} y={n.cy + 28} textAnchor="middle" fontSize="5.5" fontWeight="300" fill={C_COND} fontFamily="sans-serif">{n.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </IPhoneFrame>
    </div>
  );
}
