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
        .mkt-grid-2 { grid-template-columns: 1fr !important; gap: 12px !important; }
        .mkt-grid-3 { grid-template-columns: 1fr !important; gap: 24px !important; }
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

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .mkt-hero { padding: 112px 52px 108px; }
          .mkt-h1 { font-size: clamp(65px, 8vw, 108px) !important; letter-spacing: -3px !important; line-height: 1.02 !important; }
          .mkt-section { padding: 96px 52px; }
          .mkt-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .mkt-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 24px !important; }
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
        }

        /* iPhone mockup gradients line */
        .mkt-progress-line {
          display: none;
        }
        @media (min-width: 768px) {
          .mkt-progress-line {
            display: block;
            height: 1px;
            background: linear-gradient(to right, transparent, ${TERRA}, transparent);
            opacity: 0.5;
            margin: 0 0 32px 0;
          }
        }
        .mkt-progress-line-v {
          display: block;
          width: 1px;
          min-height: 32px;
          background: linear-gradient(to bottom, transparent, ${TERRA}, transparent);
          opacity: 0.5;
          margin: 0 0 0 0;
        }
        @media (min-width: 768px) {
          .mkt-progress-line-v { display: none; }
        }
      `}</style>

      <MarketingNav />

      {/* ── SECTION 1 — HERO ── */}
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

      {/* ── SECTION 2 — MOCKUPS iPHONE ── */}
      <section aria-label="Aperçu de l'application" className="mkt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div aria-hidden="true">
          <IPhoneMockups />
        </div>
        <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, textAlign: "center", maxWidth: 540, margin: "40px auto 0", fontStyle: "italic" }}>
          Candice peut déjà vous aider avec quelques informations. Plus vous lui en donnez, plus elle devient précise, personnelle et juste.
        </p>
      </section>

      {/* ── SECTION 3 — CANDICE GRANDIT AVEC VOUS ── */}
      <section id="fonctionnement" aria-label="Candice grandit avec vous" className="mkt-section" style={{ background: DEEP, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, color: BG, letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 14 }}>
              Candice grandit avec vous.
            </h2>
            <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(250,247,242,0.6)", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>
              Dès la première information, Candice est utile. Plus vous l&apos;enrichissez, plus elle anticipe.
            </p>
          </div>

          {/* Desktop: continuous terra line above all blocks */}
          <div className="mkt-progress-line" />

          <div className="mkt-grid-2" style={{ display: "grid", gap: 2 }}>
            {[
              {
                title: "Vous créez votre profil",
                body: "Vous renseignez vos préférences et votre façon de recevoir les attentions. Une seule fois — votre fiche vit avec vous ensuite.",
              },
              {
                title: "Vous ajoutez vos proches",
                body: "Vous complétez leur fiche vous-même, ou leur envoyez un lien privé pour qu'ils la remplissent et la partagent avec vous.",
              },
              {
                title: "Vous enrichissez au quotidien",
                body: "Une idée cadeau, une conversation, une photo, une envie, un changement de vie. Candice retient ce qui compte au fil du temps.",
              },
              {
                title: "Candice anticipe et prépare",
                body: "Message, idée, réservation, livraison. Candice propose une action adaptée, prête à valider. Vous décidez.",
              },
            ].map((bloc, i) => (
              <div key={i} style={{ position: "relative" }}>
                {/* Mobile: vertical terra line on the left */}
                {i > 0 && <div className="mkt-progress-line-v" style={{ position: "absolute", left: 28, top: -2, zIndex: 1 }} />}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <h3 style={{ fontFamily: PLAYFAIR, fontSize: 20, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.3, color: BG, margin: 0 }}>{bloc.title}</h3>
                  <p style={{ fontSize: 15, fontWeight: 300, color: "rgba(250,247,242,0.6)", lineHeight: 1.75, margin: 0 }}>{bloc.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — 3 EXEMPLES CONCRETS ── */}
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
                text: "Sa fiche dit qu'elle souffre du dos depuis l'automne et qu'elle adore son fauteuil de jardin. Trois mois plus tard, juste avant le printemps, Candice vous suggère un coussin ergonomique pour ce fauteuil. Pas pour un anniversaire — pour le bon moment.",
              },
              {
                who: "Votre sœur",
                text: "Elle traverse une période compliquée. Sa fiche dit qu'elle décompresse avec les livres et le thé. Un samedi pluvieux, Candice vous propose d'envoyer un roman qu'elle aimerait et son thé préféré, livrés ensemble. Sans attendre une occasion.",
              },
              {
                who: "Votre femme",
                text: "Vous prenez en photo une robe qu'elle regardait en vitrine. Candice l'ajoute à son profil. Quand vous lui dites qu'elle a décroché sa promotion, Candice vous repropose la robe — pour célébrer un moment qu'elle vivra, pas une date dans le calendrier.",
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

      {/* ── SECTION 5 — LA MAMIE ── */}
      <section aria-label="Construire une fiche à deux" className="mkt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 400, lineHeight: 1.3, letterSpacing: -0.4, color: CON, marginBottom: 24 }}>
            Certaines fiches se construisent à deux.
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 20 }}>
            Une grand-mère qui raconte ses habitudes à voix haute pendant qu&apos;on remplit sa fiche pour elle. Un parent qui partage doucement ses préférences. Un proche qui complète la sienne au fil des conversations.
          </p>
          <p style={{ fontFamily: PLAYFAIR, fontSize: 16, fontWeight: 400, fontStyle: "italic", color: COND, lineHeight: 1.75 }}>
            Une fois créée, une fiche peut ensuite être partagée avec les proches choisis. Un même profil, autant de relations qu&apos;il compte.
          </p>
        </div>
      </section>

      {/* ── SECTION 6 — TÉMOIGNAGES ── */}
      <section aria-label="Témoignages" className="mkt-section" style={{ background: WARM, borderBottom: `0.5px solid ${BORDER}` }}>
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

      {/* ── SECTION 7 — MÉMOIRE RELATIONNELLE ── */}
      <section aria-label="Mémoire relationnelle" className="mkt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 16 }}>
              Mémoire relationnelle
            </p>
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 14 }}>
              Une mémoire qui devient plus juste.
            </h2>
            <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.75, maxWidth: 540, margin: "0 auto" }}>
              Candice devient progressivement une mémoire relationnelle vivante&nbsp;: utile dès le départ, plus précise à mesure que vous l&apos;enrichissez.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ display: "grid", gap: 12 }}>
            {[
              { title: "Retient au fil du temps", body: "Chaque détail confié, chaque attention validée, chaque ajustement enrichit la fiche d'un proche." },
              { title: "Comprend le contexte", body: "Préférences, habitudes, dates importantes, signaux de vie. Candice ne raisonne pas en suggestions isolées mais en compréhension globale." },
              { title: "S'ajuste avec vous", body: "Une suggestion validée, refusée, modifiée. Candice retient ce qui vous correspond et affine ses propositions." },
              { title: "Reste à votre rythme", body: "Vous enrichissez quand vous voulez. À l'oral, à l'écrit, par photo. Candice n'attend pas d'être nourrie — elle commence avec ce qu'elle a." },
            ].map((b, i) => (
              <div key={i} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 36, display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ fontFamily: PLAYFAIR, fontSize: 20, fontWeight: 400, lineHeight: 1.22, letterSpacing: -0.3, color: CON, margin: 0 }}>{b.title}</h3>
                <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.75, color: COND, margin: 0 }}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8 — CONFIDENTIALITÉ ── */}
      <section aria-label="Vos données" className="mkt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20 }}>
            Vos données
          </p>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 400, lineHeight: 1.3, letterSpacing: -0.4, color: CON, marginBottom: 24 }}>
            Vous pouvez être honnête. Candice garde les détails.
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 20 }}>
            Vos réponses détaillées restent privées entre vous et Candice. Si vous partagez votre profil, vos proches ne voient pas vos mots exacts, vos confidences ou vos exigences personnelles. Ils accèdent uniquement à une analyse Candice claire, utile et respectueuse&nbsp;: vos préférences, votre façon de recevoir les attentions, et ce qui peut vraiment vous toucher.
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.75, marginBottom: 24 }}>
            Plus vous êtes précis dans le questionnaire, plus Candice peut aider vos proches à viser juste — sans jamais exposer ce que vous avez confié en détail.
          </p>
          <Link href="/confidentialite" style={{ fontSize: 13, color: TERRA, textDecoration: "none", fontWeight: 400 }}>
            Notre engagement confidentialité →
          </Link>
        </div>
      </section>

      {/* ── SECTION 9 — CTA FINAL ── */}
      <section aria-label="Démarrer avec Candice" className="mkt-section" style={{ background: DEEP, textAlign: "center", marginTop: 0 }}>
        <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 400, fontStyle: "italic", color: BG, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 20, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
          Plus jamais ces moments<br />où on aimerait avoir mieux su<br />s&apos;y prendre.
        </h2>
        <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(250,247,242,0.65)", lineHeight: 1.75, marginBottom: 44, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Candice retient ce qui compte, comprend chaque proche et prépare les bonnes attentions à votre place. Vous décidez. Elle s&apos;occupe du reste.
        </p>
        <Link href="/register" style={{ textDecoration: "none" }}>
          <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "16px 40px", fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: DM, height: 52 }}>
            Commencer avec Candice
          </button>
        </Link>
        <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 22, color: "rgba(250,247,242,0.8)", marginTop: 40, marginBottom: 0 }}>
          Penser à eux, sans y penser.
        </p>
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
          borderRadius: 44,
          padding: "12px 6px 16px",
          boxShadow: "0 24px 48px rgba(44,26,14,0.15), 0 2px 8px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: 200,
          position: "relative",
        }}
      >
        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px 6px", color: "rgba(255,255,255,0.85)", fontSize: 8, fontWeight: 600 }}>
          <span>9:41</span>
          <div style={{ width: 80, height: 16, background: "#1C1C1E", borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 8 }} />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <svg width="10" height="7" viewBox="0 0 10 7" fill="none" aria-hidden="true">
              <rect x="0" y="4" width="2" height="3" rx="0.5" fill="white" opacity="0.5" />
              <rect x="2.5" y="2.5" width="2" height="4.5" rx="0.5" fill="white" opacity="0.7" />
              <rect x="5" y="1" width="2" height="6" rx="0.5" fill="white" opacity="0.9" />
              <rect x="7.5" y="0" width="2" height="7" rx="0.5" fill="white" />
            </svg>
            <svg width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true">
              <path d="M5.5 1.5 C3 1.5 1 3.5 1 6" stroke="white" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" />
              <path d="M5.5 3.5 C4 3.5 3 4.5 3 6" stroke="white" strokeWidth="1" fill="none" opacity="0.7" strokeLinecap="round" />
              <circle cx="5.5" cy="6" r="1" fill="white" />
            </svg>
            <svg width="16" height="8" viewBox="0 0 16 8" fill="none" aria-hidden="true">
              <rect x="0.5" y="0.5" width="13" height="7" rx="2.5" stroke="white" strokeOpacity="0.35" />
              <rect x="1.5" y="1.5" width="9" height="5" rx="1.5" fill="white" />
              <path d="M14.5 2.5 Q16 4 14.5 5.5" stroke="white" strokeOpacity="0.5" strokeWidth="1" fill="none" />
            </svg>
          </div>
        </div>
        {/* Screen */}
        <div style={{ background: "#FAF7F2", borderRadius: 34, overflow: "hidden" }}>
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
  const C_DEEP_FAINT = "rgba(44,26,14,0.05)";

  return (
    <div className="mkt-iphone-grid">
      {/* MOCKUP 1 — Dashboard */}
      <IPhoneFrame title="L'app, au quotidien.">
        <div style={{ padding: "14px 12px" }}>
          <p style={{ fontSize: 9, fontWeight: 300, color: C_COND, margin: "0 0 12px", fontStyle: "italic" }}>Bonjour Estelle.</p>
          {[
            { init: "PL", grad: "linear-gradient(135deg,#534AB7,#3C3489)", name: "Paul", status: "Candice connaît bien Paul." },
            { init: "LM", grad: "linear-gradient(135deg,#9A3556,#72243E)", name: "Léa", status: "Commence à connaître Léa." },
            { init: "CP", grad: "linear-gradient(135deg,#4A7C59,#2A5C39)", name: "Maman", status: "Anticipe pour votre mère." },
          ].map((c) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 8, background: C_BG, marginBottom: 6, border: `0.5px solid ${C_BORDER}` }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: c.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{c.init}</div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 500, color: C_CON, margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 7, fontWeight: 300, color: C_COND, margin: 0, fontStyle: "italic" }}>{c.status}</p>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, background: C_BG, border: `0.5px solid ${C_BORDER}`, borderRadius: 8, padding: "8px 10px" }}>
            <p style={{ fontSize: 7.5, fontWeight: 300, color: "rgba(30,18,8,0.4)", margin: 0 }}>Parlez à Candice…</p>
          </div>
        </div>
      </IPhoneFrame>

      {/* MOCKUP 2 — Analyse profil */}
      <IPhoneFrame title="Ce que Candice comprend.">
        <div style={{ padding: "14px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `0.5px solid ${C_BORDER}` }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#C47A4A,#8A4020)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "#fff", flexShrink: 0 }}>SM</div>
            <div>
              <p style={{ fontSize: 9, fontWeight: 500, color: C_CON, margin: 0 }}>Sarah</p>
              <p style={{ fontSize: 7, fontWeight: 300, color: C_TERRA, margin: 0 }}>amie proche</p>
            </div>
          </div>
          <p style={{ fontSize: 8, fontWeight: 500, letterSpacing: 0.5, color: C_TERRA, margin: "0 0 10px", textTransform: "uppercase" }}>Analyse Candice</p>
          {[
            "Reçoit l'amour par les gestes intimes.",
            "Sensible aux attentions discrètes.",
            "Adore la cuisine italienne.",
            "Allergique aux fruits à coque.",
          ].map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 7 }}>
              <span style={{ color: C_TERRA, fontSize: 8, flexShrink: 0, marginTop: 1 }}>·</span>
              <p style={{ fontSize: 8, fontWeight: 300, color: C_CON, margin: 0, lineHeight: 1.5 }}>{line}</p>
            </div>
          ))}
        </div>
      </IPhoneFrame>

      {/* MOCKUP 3 — Suggestions */}
      <IPhoneFrame title="Les bonnes attentions.">
        <div style={{ padding: "14px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `0.5px solid ${C_BORDER}` }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#4A7C59,#2A5C39)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 600, color: "#fff", flexShrink: 0 }}>TL</div>
            <div>
              <p style={{ fontSize: 9, fontWeight: 500, color: C_CON, margin: 0 }}>Thomas</p>
              <p style={{ fontSize: 7, fontWeight: 300, color: C_TERRA, margin: 0 }}>ami · Paris</p>
            </div>
          </div>
          {[
            "Sa sœur arrive samedi. Préparer un message ?",
            "Soirée pizza dans 12 jours. Réserver ?",
            "Anniversaire dans 23 jours.",
          ].map((s, i) => (
            <div key={i} style={{ background: C_DEEP_FAINT, border: `0.5px solid ${C_BORDER}`, borderRadius: 6, padding: "8px 10px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
              <p style={{ fontSize: 7.5, fontWeight: 300, color: C_CON, margin: 0, lineHeight: 1.4, flex: 1 }}>{s}</p>
              <button style={{ background: C_TERRA, color: "#fff", fontSize: 6.5, fontWeight: 500, padding: "3px 7px", borderRadius: 4, border: "none", cursor: "pointer", flexShrink: 0 }}>Voir</button>
            </div>
          ))}
        </div>
      </IPhoneFrame>

      {/* MOCKUP 4 — Validation */}
      <IPhoneFrame title="Vous décidez.">
        <div style={{ padding: "14px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: `0.5px solid ${C_BORDER}` }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: C_TERRA, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 600, color: "#fff", flexShrink: 0 }}>C</div>
            <p style={{ fontSize: 9, fontWeight: 500, color: C_CON, margin: 0 }}>Candice</p>
          </div>
          <div style={{ background: C_BG, border: `0.5px solid ${C_BORDER}`, borderRadius: "4px 12px 12px 12px", padding: "10px 10px", marginBottom: 14 }}>
            <p style={{ fontSize: 7.5, fontWeight: 300, color: C_CON, margin: 0, lineHeight: 1.6 }}>
              Je pense qu&apos;un bouquet de pivoines ferait plaisir à Valentin demain. Bergamotte, livraison 14h, 38 €. Je m&apos;en occupe&nbsp;?
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ flex: 1, background: C_TERRA, color: "#fff", fontSize: 8, fontWeight: 500, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer" }}>Valider</button>
            <button style={{ flex: 1, background: "transparent", color: C_CON, fontSize: 8, fontWeight: 300, padding: "8px 0", borderRadius: 6, border: `0.5px solid ${C_BORDER}`, cursor: "pointer" }}>Modifier</button>
          </div>
        </div>
      </IPhoneFrame>

      {/* MOCKUP 5 — Graphe de relations */}
      <IPhoneFrame title="Votre réseau relationnel.">
        <div style={{ padding: "14px 12px", minHeight: 180 }}>
          <p style={{ fontSize: 8, fontWeight: 500, letterSpacing: 0.5, color: C_TERRA, margin: "0 0 12px", textTransform: "uppercase" }}>Réseau</p>
          <svg width="100%" viewBox="0 0 176 148" style={{ overflow: "visible" }} aria-hidden="true">
            {/* Lines */}
            <line x1="88" y1="74" x2="28" y2="30" stroke={C_TERRA} strokeWidth="0.6" strokeOpacity="0.4" />
            <line x1="88" y1="74" x2="148" y2="30" stroke={C_TERRA} strokeWidth="0.6" strokeOpacity="0.4" />
            <line x1="88" y1="74" x2="28" y2="118" stroke={C_TERRA} strokeWidth="0.6" strokeOpacity="0.4" />
            <line x1="88" y1="74" x2="148" y2="118" stroke={C_TERRA} strokeWidth="0.6" strokeOpacity="0.4" />
            <line x1="88" y1="74" x2="88" y2="8" stroke={C_TERRA} strokeWidth="0.6" strokeOpacity="0.25" />
            {/* Center node — Estelle */}
            <circle cx="88" cy="74" r="22" fill={C_WHITE} stroke={C_TERRA} strokeWidth="1" />
            <text x="88" y="71" textAnchor="middle" fontSize="6" fontWeight="500" fill={C_TERRA} fontFamily="sans-serif">Estelle</text>
            <text x="88" y="80" textAnchor="middle" fontSize="5" fontWeight="300" fill={C_COND} fontFamily="sans-serif">vous</text>
            {/* Surrounding nodes */}
            {[
              { cx: 28, cy: 30, initials: "PL", color: "#534AB7", label: "Paul" },
              { cx: 148, cy: 30, initials: "SM", color: "#C47A4A", label: "Sarah" },
              { cx: 28, cy: 118, initials: "CP", color: "#4A7C59", label: "Maman" },
              { cx: 148, cy: 118, initials: "TL", color: "#9A3556", label: "Thomas" },
              { cx: 88, cy: 8, initials: "LM", color: "#7A5E44", label: "Léa" },
            ].map((n) => (
              <g key={n.label}>
                <circle cx={n.cx} cy={n.cy} r="16" fill={n.color} opacity="0.9" />
                <text x={n.cx} y={n.cy + 2} textAnchor="middle" fontSize="6" fontWeight="600" fill="white" fontFamily="sans-serif">{n.initials}</text>
                <text x={n.cx} y={n.cy + 26} textAnchor="middle" fontSize="5.5" fontWeight="300" fill={C_COND} fontFamily="sans-serif">{n.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </IPhoneFrame>
    </div>
  );
}
