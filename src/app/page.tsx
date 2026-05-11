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
    "Candice est votre mémoire relationnelle : elle retient ce qui compte sur vos proches, comprend chacun d'eux et prépare les bonnes attentions au bon moment. Un deuxième cerveau pour vos proches.",
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
        .mkt-hero { padding: 44px 20px 52px; }
        .mkt-h1 { font-size: clamp(38px, 10vw, 56px) !important; letter-spacing: -1.5px !important; line-height: 1.05 !important; }
        .mkt-section { padding: 56px 20px; }
        .mkt-grid-2 { grid-template-columns: 1fr !important; gap: 12px !important; }
        .mkt-grid-3 { grid-template-columns: 1fr !important; gap: 12px !important; }
        .mkt-nav { padding: 0 20px !important; }
        .mkt-nav-links { display: none !important; }

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
          gap: 16px;
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
          width: 80vw !important;
          max-width: 260px !important;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .mkt-hero { padding: 100px 52px 96px; }
          .mkt-h1 { font-size: clamp(54px, 8vw, 96px) !important; letter-spacing: -3px !important; line-height: 1.02 !important; }
          .mkt-section { padding: 80px 52px; }
          .mkt-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .mkt-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 16px !important; }
          .mkt-nav { padding: 0 52px !important; }
          .mkt-nav-links { display: flex !important; }

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

      {/* ── SECTION 1 — HERO ── */}
      <section id="main-content" className="mkt-hero" style={{ textAlign: "center", borderBottom: `0.5px solid ${BORDER}` }}>
        <h1 className="mkt-h1" style={{ fontFamily: PLAYFAIR, fontWeight: 400, color: CON, marginBottom: 20 }}>
          Votre copilote<br /><em style={{ color: TERRA, fontStyle: "italic" }}>relationnel.</em>
        </h1>
        <p style={{ fontSize: 18, fontWeight: 300, color: COND, letterSpacing: -0.2, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.65 }}>
          Candice devient votre mémoire relationnelle&nbsp;: elle retient, comprend et prépare les bonnes attentions au bon moment.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginBottom: 40 }}>
          {["Moins d’oubli.", "Moins de charge mentale.", "Plus d’attentions qui tombent juste."].map((text, i) => (
            <React.Fragment key={text}>
              {i > 0 && <span aria-hidden="true" style={{ color: BORDER, userSelect: "none", fontSize: 14 }}>·</span>}
              <span style={{ fontSize: 13, fontWeight: 300, color: COND }}>{text}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="mkt-cta-group" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Link href="/register" style={{ textDecoration: "none" }}>
            <button className="mkt-cta-btn" style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
              Commencer avec Candice
            </button>
          </Link>
          <a href="#comment-ca-marche" style={{ textDecoration: "none" }}>
            <button className="mkt-cta-btn" style={{ background: "transparent", color: CON, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
              Voir comment Candice fonctionne
            </button>
          </a>
        </div>
      </section>

      {/* ── SECTION 2 — MOCKUPS PRODUIT ── */}
      <section aria-label="Aperçu de l'application" className="mkt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div aria-hidden="true">
          <AppMockups />
        </div>
        <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.75, textAlign: "center", maxWidth: 540, margin: "32px auto 0", fontStyle: "italic" }}>
          Candice peut déjà vous aider avec quelques informations. Plus vous lui en donnez, plus elle devient précise, personnelle et juste.
        </p>
      </section>

      {/* ── SECTION 3 — COMMENT ÇA MARCHE (4 couches) ── */}
      <section id="comment-ca-marche" aria-label="Comment ça marche" className="mkt-section" style={{ background: DEEP, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 16 }}>
              Comment ça marche
            </p>
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: 30, fontWeight: 400, color: BG, letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 14 }}>
              Candice fonctionne en 4 couches.
            </h2>
            <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.6)", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>
              Dès la première information utile, elle commence à proposer mieux qu&apos;une idée générique. Avec le temps, elle devient un deuxième cerveau pour vos proches.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ display: "grid", gap: 12 }}>
            {[
              { num: "01", title: "Vous créez votre profil.", body: "Vous renseignez vos préférences, votre façon de recevoir les attentions et ce qui compte vraiment pour vous. Une seule fois — votre fiche vit avec vous ensuite." },
              { num: "02", title: "Vous ajoutez vos proches.", body: "Vous pouvez compléter leur fiche vous-même, ou leur envoyer un lien privé pour qu’ils la remplissent une seule fois et la partagent avec les personnes qu’ils choisissent." },
              { num: "03", title: "Vous enrichissez au quotidien.", body: "Une idée cadeau, une conversation, une photo, une envie, un changement de vie. Candice retient ce qui compte au fil du temps — par écrit, à la voix, ou par image." },
              { num: "04", title: "Candice prépare.", body: "Message, idée, réservation, livraison. Candice propose une action adaptée, prête à valider. Vous décidez. Elle exécute." },
            ].map((step) => (
              <div key={step.num} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "36px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ fontFamily: PLAYFAIR, fontSize: 44, fontWeight: 400, color: TERRA, lineHeight: 1, letterSpacing: -1, margin: 0 }}>{step.num}</p>
                <h3 style={{ fontFamily: PLAYFAIR, fontSize: 19, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.3, color: BG, margin: 0 }}>{step.title}</h3>
                <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(250,247,242,0.6)", lineHeight: 1.75, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — EXEMPLE FORT ── */}
      <section aria-label="Un exemple concret" className="mkt-section" style={{ background: "#F5EDE3", borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20 }}>
            Un exemple concret
          </p>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 28, fontWeight: 400, lineHeight: 1.25, letterSpacing: -0.5, color: CON, marginBottom: 24 }}>
            Un réflexe qui devient une mémoire.
          </h2>
          <p style={{ fontFamily: PLAYFAIR, fontSize: 16, fontWeight: 400, lineHeight: 1.9, color: COND, fontStyle: "italic", marginBottom: 24 }}>
            &ldquo;Votre femme s&apos;arrête devant une robe en vitrine. Vous prenez une photo. Vous l&apos;envoyez à Candice. Elle l&apos;ajoute à sa fiche. Deux mois plus tard, à la veille de son anniversaire, Candice vous repropose la robe — taille connue, boutique repérée, livraison prête. Vous validez en un geste.&rdquo;
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: COND, letterSpacing: 0.1 }}>
            C&apos;est ça, un copilote relationnel.
          </p>
        </div>
      </section>

      {/* ── SECTION 5 — LA MAMIE ── */}
      <section aria-label="Construire une fiche à deux" className="mkt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 26, fontWeight: 400, lineHeight: 1.3, letterSpacing: -0.4, color: CON, marginBottom: 24 }}>
            Certaines fiches se construisent à deux.
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 20 }}>
            Une grand-mère qui raconte ses habitudes à voix haute pendant qu&apos;on remplit sa fiche pour elle. Un parent qui partage doucement ses préférences. Un proche qui complète la sienne au fil des conversations.
          </p>
          <p style={{ fontFamily: PLAYFAIR, fontSize: 15, fontWeight: 400, fontStyle: "italic", color: COND, lineHeight: 1.75 }}>
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
            { q: "J’ai pensé à son anniversaire toute la semaine. Puis j’ai oublié.", name: "Julie", age: 38, label: "OUBLI" },
            { q: "Je savais exactement quoi faire. Je ne l’ai jamais fait.", name: "Thomas", age: 41, label: "MANQUE DE TEMPS" },
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
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: 30, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 14 }}>
              Une mémoire qui devient plus juste.
            </h2>
            <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, maxWidth: 540, margin: "0 auto" }}>
              Candice devient progressivement une mémoire relationnelle vivante&nbsp;: utile dès le départ, plus précise à mesure que vous l&apos;enrichissez.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ display: "grid", gap: 12 }}>
            {[
              { num: "01", title: "Retient au fil du temps", body: "Chaque détail confié, chaque attention validée, chaque ajustement enrichit la fiche d’un proche." },
              { num: "02", title: "Comprend le contexte", body: "Préférences, habitudes, dates importantes, signaux de vie. Candice ne raisonne pas en suggestions isolées mais en compréhension globale." },
              { num: "03", title: "S’ajuste avec vous", body: "Une suggestion validée, refusée, modifiée. Candice apprend votre œil et s’aligne sur votre manière de faire." },
              { num: "04", title: "Reste à votre rythme", body: "Vous enrichissez quand vous voulez. À l’oral, à l’écrit, par photo. Candice n’attend pas d’être nourrie — elle commence avec ce qu’elle a." },
            ].map((b, i) => (
              <div key={i} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 32, display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: 2, color: TERRA, textTransform: "uppercase", margin: 0 }}>{b.num}</p>
                <h3 style={{ fontFamily: PLAYFAIR, fontSize: 18, fontWeight: 400, lineHeight: 1.22, letterSpacing: -0.3, color: CON, margin: 0 }}>{b.title}</h3>
                <p style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.75, color: COND, margin: 0 }}>{b.body}</p>
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
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 26, fontWeight: 400, lineHeight: 1.3, letterSpacing: -0.4, color: CON, marginBottom: 24 }}>
            Vous pouvez être honnête. Candice garde les détails.
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 20 }}>
            Vos réponses détaillées restent privées entre vous et Candice. Si vous partagez votre profil, vos proches ne voient pas vos mots exacts, vos confidences ou vos exigences personnelles. Ils accèdent uniquement à une analyse Candice claire, utile et respectueuse&nbsp;: vos préférences, votre façon de recevoir les attentions, et ce qui peut vraiment vous toucher.
          </p>
          <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, marginBottom: 24 }}>
            Plus vous êtes précis dans le questionnaire, plus Candice peut aider vos proches à viser juste — sans jamais exposer ce que vous avez confié en détail.
          </p>
          <Link href="/confidentialite" style={{ fontSize: 12, color: TERRA, textDecoration: "none", fontWeight: 400 }}>
            Notre engagement confidentialité →
          </Link>
        </div>
      </section>

      {/* ── SECTION 9 — CTA FINAL ── */}
      <section aria-label="Démarrer avec Candice" className="mkt-section" style={{ background: DEEP, textAlign: "center" }}>
        <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 400, fontStyle: "italic", color: BG, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 20, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
          Plus jamais ces moments<br />où on aimerait avoir mieux su<br />s&apos;y prendre.
        </h2>
        <p style={{ fontSize: 15, fontWeight: 300, color: "rgba(250,247,242,0.65)", lineHeight: 1.75, marginBottom: 44, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Candice retient ce qui compte, comprend chaque proche et prépare les bonnes attentions à votre place. Vous décidez. Elle s&apos;occupe du reste.
        </p>
        <Link href="/register" style={{ textDecoration: "none" }}>
          <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "16px 36px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
            Commencer avec Candice
          </button>
        </Link>
        <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 12, color: "rgba(250,247,242,0.28)", marginTop: 60, marginBottom: 0 }}>
          Un CRM social. Repensé.
        </p>
      </section>

      <MarketingFooter />
    </main>
  );
}

function AppMockups() {
  const C_BG = "#FAF7F2";
  const C_WHITE = "#FFFFFF";
  const C_CON = "#1E1208";
  const C_COND = "#7A5E44";
  const C_TERRA = "#C47A4A";
  const C_BORDER = "rgba(30,18,8,0.1)";
  const C_DEEP = "#2C1A0E";
  const C_DEEP_FAINT = "rgba(44,26,14,0.06)";

  const phoneFrame = (title: string, child: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 400, color: C_COND, textAlign: "center", margin: 0, letterSpacing: -0.1 }}>{title}</p>
      <div style={{ background: C_BG, border: `0.5px solid ${C_BORDER}`, borderRadius: 20, padding: 10, boxShadow: "0 4px 20px rgba(30,18,8,0.08)" }}>
        <div style={{ width: 28, height: 3, background: C_BORDER, borderRadius: 2, margin: "0 auto 8px" }} />
        <div style={{ background: C_WHITE, borderRadius: 12, overflow: "hidden" }}>
          {child}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mkt-screens" style={{ gap: 16 }}>
      {/* MOCKUP 1 — Dashboard */}
      {phoneFrame("L’app, au quotidien.",
        <div style={{ padding: "12px 10px" }}>
          <p style={{ fontSize: 9, fontWeight: 300, color: C_COND, margin: "0 0 10px", fontStyle: "italic" }}>Bonjour Estelle.</p>
          {[
            { init: "PL", grad: "linear-gradient(135deg,#534AB7,#3C3489)", name: "Paul", status: "Candice connaît bien Paul." },
            { init: "LM", grad: "linear-gradient(135deg,#9A3556,#72243E)", name: "Léa", status: "Candice commence à connaître Léa." },
            { init: "CP", grad: "linear-gradient(135deg,#4A7C59,#2A5C39)", name: "Maman", status: "Candice anticipe pour votre mère." },
          ].map((c) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 8, background: C_BG, marginBottom: 6, border: `0.5px solid ${C_BORDER}` }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: c.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{c.init}</div>
              <div>
                <p style={{ fontSize: 8, fontWeight: 500, color: C_CON, margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 7, fontWeight: 300, color: C_COND, margin: 0, fontStyle: "italic" }}>{c.status}</p>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, background: C_BG, border: `0.5px solid ${C_BORDER}`, borderRadius: 8, padding: "8px 10px" }}>
            <p style={{ fontSize: 7, fontWeight: 300, color: "rgba(30,18,8,0.35)", margin: 0 }}>Parlez à Candice — ou laissez un message vocal.</p>
          </div>
        </div>
      )}

      {/* MOCKUP 2 — Profile analysis */}
      {phoneFrame("Ce que Candice comprend d’un proche.",
        <div style={{ padding: "12px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `0.5px solid ${C_BORDER}` }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#C47A4A,#8A4020)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "#fff", flexShrink: 0 }}>SM</div>
            <div>
              <p style={{ fontSize: 9, fontWeight: 500, color: C_CON, margin: 0 }}>Sarah</p>
              <p style={{ fontSize: 7, fontWeight: 300, color: C_TERRA, margin: 0 }}>amie proche</p>
            </div>
          </div>
          <p style={{ fontSize: 8, fontWeight: 500, letterSpacing: 0.5, color: C_TERRA, margin: "0 0 8px", textTransform: "uppercase" }}>Analyse Candice</p>
          {[
            "Reçoit l’amour par les mots et les gestes intimes.",
            "Sensible aux attentions discrètes, mal à l’aise au centre de l’attention.",
            "Adore la cuisine italienne, allergique aux fruits à coque.",
            "Souvent fatiguée le dimanche soir.",
          ].map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <span style={{ color: C_TERRA, fontSize: 7, flexShrink: 0, marginTop: 1 }}>·</span>
              <p style={{ fontSize: 7, fontWeight: 300, color: C_CON, margin: 0, lineHeight: 1.5 }}>{line}</p>
            </div>
          ))}
          <p style={{ fontSize: 7, fontWeight: 300, color: C_COND, fontStyle: "italic", margin: "10px 0 0" }}>Mémoire enrichie au fil de vos échanges.</p>
        </div>
      )}

      {/* MOCKUP 3 — Suggestions actives */}
      {phoneFrame("Les bonnes attentions, au bon moment.",
        <div style={{ padding: "12px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `0.5px solid ${C_BORDER}` }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#4A7C59,#2A5C39)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 600, color: "#fff", flexShrink: 0 }}>TL</div>
            <div>
              <p style={{ fontSize: 9, fontWeight: 500, color: C_CON, margin: 0 }}>Thomas</p>
              <p style={{ fontSize: 7, fontWeight: 300, color: C_TERRA, margin: 0 }}>ami · Paris</p>
            </div>
          </div>
          <p style={{ fontSize: 8, fontWeight: 500, letterSpacing: 0.5, color: C_TERRA, margin: "0 0 8px", textTransform: "uppercase" }}>Suggestions de la semaine</p>
          {[
            "Sa sœur arrive samedi. Préparer un message d’accueil ?",
            "Soirée pizza dans 12 jours. Réserver chez Pizza Pino ?",
            "Anniversaire dans 23 jours. Relire son profil.",
          ].map((s, i) => (
            <div key={i} style={{ background: C_DEEP_FAINT, border: `0.5px solid ${C_BORDER}`, borderRadius: 6, padding: "7px 8px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
              <p style={{ fontSize: 7, fontWeight: 300, color: C_CON, margin: 0, lineHeight: 1.4, flex: 1 }}>{s}</p>
              <button style={{ background: C_TERRA, color: "#fff", fontSize: 6, fontWeight: 500, padding: "3px 6px", borderRadius: 3, border: "none", cursor: "pointer", flexShrink: 0 }}>Voir</button>
            </div>
          ))}
        </div>
      )}

      {/* MOCKUP 4 — Candice proposes */}
      {phoneFrame("Vous décidez. Candice s’occupe du reste.",
        <div style={{ padding: "12px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: `0.5px solid ${C_BORDER}` }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: C_TERRA, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 600, color: "#fff", flexShrink: 0 }}>C</div>
            <p style={{ fontSize: 8, fontWeight: 500, color: C_CON, margin: 0 }}>Candice</p>
          </div>
          <div style={{ background: C_BG, border: `0.5px solid ${C_BORDER}`, borderRadius: "0 10px 10px 10px", padding: "10px 10px", marginBottom: 14 }}>
            <p style={{ fontSize: 7.5, fontWeight: 300, color: C_CON, margin: 0, lineHeight: 1.6 }}>
              Je pense qu&apos;un bouquet de pivoines ferait plaisir à Valentin pour son anniversaire demain. Bergamotte, livraison 14 h, 38 €. Je m&apos;en occupe&nbsp;?
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ flex: 1, background: C_TERRA, color: "#fff", fontSize: 8, fontWeight: 500, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer" }}>Valider</button>
            <button style={{ flex: 1, background: "transparent", color: C_CON, fontSize: 8, fontWeight: 300, padding: "7px 0", borderRadius: 6, border: `0.5px solid ${C_BORDER}`, cursor: "pointer" }}>Je m&apos;en occupe</button>
          </div>
        </div>
      )}
    </div>
  );
}
