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
    "Candice apprend à connaître vos proches et propose les bons gestes — au bon moment, sans effort.",
  alternates: {
    canonical: BASE_URL,
  },
};

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const BORDER = "rgba(30,18,8,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

export default function HomePage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <style>{`
        html { scroll-behavior: smooth; }

        /* ── Mobile base ── */
        .mkt-hero { padding: 64px 24px 56px; }
        .mkt-h1 { font-size: 32px !important; letter-spacing: -1px !important; line-height: 1.1 !important; }
        .mkt-section { padding: 48px 24px; }
        .mkt-bridge { padding: 24px; flex-direction: column !important; gap: 20px !important; }
        .mkt-grid-2 { grid-template-columns: 1fr !important; gap: 16px !important; }
        .mkt-grid-3 { grid-template-columns: 1fr !important; gap: 16px !important; }
        .mkt-nav { padding: 0 20px !important; }
        .mkt-nav-links { display: none !important; }
        .mkt-footer { padding: 20px 24px !important; flex-direction: column !important; gap: 16px !important; align-items: flex-start !important; }

        .mkt-carousel {
          display: flex !important;
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
          max-width: 220px !important;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .mkt-hero { padding: 96px 52px 88px; }
          .mkt-h1 { font-size: 64px !important; letter-spacing: -2.5px !important; line-height: 1.04 !important; }
          .mkt-section { padding: 72px 52px; }
          .mkt-bridge { padding: 28px 52px !important; flex-direction: row !important; gap: 40px !important; }
          .mkt-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .mkt-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 16px !important; }
          .mkt-nav { padding: 0 52px !important; }
          .mkt-nav-links { display: flex !important; }
          .mkt-footer { padding: 20px 52px !important; flex-direction: row !important; gap: 0 !important; align-items: center !important; }

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

      {/* NAV */}
      <MarketingNav />

      {/* HERO */}
      <section id="main-content" className="mkt-hero" style={{ textAlign: "center", borderBottom: `0.5px solid ${BORDER}` }}>
        <h1 className="mkt-h1" style={{ fontFamily: PLAYFAIR, fontSize: 64, fontWeight: 400, color: CON, lineHeight: 1.04, letterSpacing: -2.5, marginBottom: 20 }}>
          Votre copilote<br /><span style={{ color: TERRA }}>relationnel.</span>
        </h1>
        <p style={{ fontSize: 18, fontWeight: 300, color: COND, letterSpacing: -0.2, maxWidth: 480, margin: "0 auto 44px" }}>
          Candice comprend vos proches, anticipe les bons gestes et vous aide à ne jamais manquer ce qui compte pour eux.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
              Commencer →
            </button>
          </Link>
          <a href="#comment-ca-marche" style={{ textDecoration: "none" }}>
            <button style={{ background: "transparent", color: CON, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
              Comment ça marche
            </button>
          </a>
        </div>
      </section>

      {/* BRIDGE */}
      <div className="mkt-bridge" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 18, fontWeight: 300, color: CON, letterSpacing: -0.3, lineHeight: 1.3, maxWidth: 380 }}>
          Moins d&apos;oubli. Moins d&apos;hésitation.<br />
          <span style={{ color: TERRA }}>Des attentions plus justes.</span>
        </p>
        <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.65, maxWidth: 400, borderLeft: `1.5px solid ${TERRA}`, paddingLeft: 20 }}>
          Candice analyse les profils de vos proches pour vous proposer <strong style={{ color: CON, fontWeight: 400 }}>la bonne attention, pour la bonne personne, au bon moment.</strong>
        </p>
      </div>

      {/* PRODUCT DEMO */}
      <section aria-label="Aperçu de l'application" className="mkt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 28, fontWeight: 400, color: CON, letterSpacing: -0.8, lineHeight: 1.25, marginBottom: 8 }}>
            Tout ce qui compte pour eux,<br />réuni en un seul endroit.
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.65 }}>
            Profils, suggestions, historique — en un coup d&apos;œil.
          </p>
        </div>
        <div aria-hidden="true">
          <AppScreenshots />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="comment-ca-marche" aria-label="Comment ça marche" className="mkt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 40, textAlign: "center" }}>
          Comment ça marche
        </p>
        <div className="mkt-grid-3" style={{ maxWidth: 900, margin: "0 auto", display: "grid" }}>
          {[
            {
              num: "01",
              title: "Vous construisez les profils",
              body: "Invitez vos proches à compléter leur fiche — ou renseignez-la vous-même. Goûts, habitudes, dates importantes, façons de recevoir les attentions.",
            },
            {
              num: "02",
              title: "Candice apprend et anticipe",
              body: "Candice analyse chaque profil et croise les informations avec le contexte du moment — anniversaire, période difficile, nouvelle étape de vie.",
            },
            {
              num: "03",
              title: "Vous validez. Candice agit.",
              body: "Vous recevez une suggestion personnalisée. Vous approuvez. Candice se charge du reste — commande, message rédigé, réservation planifiée.",
            },
          ].map((step) => (
            <div key={step.num} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "40px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontFamily: PLAYFAIR, fontSize: 52, fontWeight: 400, color: TERRA, lineHeight: 1, letterSpacing: -1, margin: 0 }}>{step.num}</p>
              <h3 style={{ fontFamily: PLAYFAIR, fontSize: 20, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.3, color: CON, margin: 0 }}>{step.title}</h3>
              <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mkt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20 }}>Le problème</p>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 36, fontWeight: 400, lineHeight: 1.15, letterSpacing: -0.8, color: CON, marginBottom: 24 }}>
            On pense à eux.<br />On ne le montre pas toujours.
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 20 }}>
            La vie va vite. Les petites attentions qu&apos;on voulait faire finissent dans un coin de la tête et n&apos;en ressortent jamais. Pas par manque d&apos;amour. Par manque de temps, d&apos;idées — ou parce qu&apos;on ne connaît pas toujours assez bien l&apos;autre pour lui faire vraiment plaisir.
          </p>
          <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.85 }}>
            L&apos;intention est là. Ce qui manque, c&apos;est l&apos;organisation, la mémoire, et parfois juste l&apos;idée juste.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section aria-label="Témoignages" className="mkt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 40, textAlign: "center" }}>
          Ils auraient voulu faire autrement.
        </p>
        <div className="mkt-carousel" style={{ gap: 12 }}>
          {[
            { q: "Son anniversaire était passé. Je l'ai su le lendemain matin en voyant sa story.", who: "Marie, 34 ans", label: "OUBLI" },
            { q: "Je savais exactement ce que je voulais faire. Je n'ai jamais trouvé le moment.", who: "Thomas, 41 ans", label: "MANQUE DE TEMPS" },
            { q: "J'avais envie de lui faire un cadeau. Mais je ne savais vraiment pas quoi.", who: "Sophie, 29 ans", label: "PAS D'IDÉE" },
            { q: "Je lui ai offert quelque chose. Elle a souri. Mais j'ai su que ce n'était pas ça.", who: "Lucas, 38 ans", label: "MAUVAISE INTENTION" },
          ].map((c, i) => (
            <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "32px 28px", display: "flex", flexDirection: "column" }}>
              <div aria-hidden="true" style={{ fontFamily: PLAYFAIR, fontSize: 32, fontWeight: 400, color: TERRA, opacity: 0.5, marginBottom: 14, lineHeight: 1 }}>&ldquo;</div>
              <p style={{ fontSize: 14, fontWeight: 400, color: CON, lineHeight: 1.55, marginBottom: 16, flex: 1 }}>{c.q}</p>
              <div style={{ height: "0.5px", background: BORDER, marginBottom: 14 }} />
              <p style={{ fontSize: 11, fontWeight: 300, color: COND }}>{c.who}</p>
              <p style={{ fontSize: 9, fontWeight: 500, color: TERRA, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 4 }}>{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT CANDICE CHANGES */}
      <section aria-label="Ce que Candice change" className="mkt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 36 }}>Ce que Candice change</p>
        <div className="mkt-grid-2" style={{ display: "grid" }}>
          {[
            { num: "01 · Mémoire relationnelle", h: "Chaque détail compte. Aucun ne se perd.", p: "Goûts, habitudes, dates importantes, moments partagés — Candice construit une mémoire fine de chacun de vos proches, là où votre tête était pleine." },
            { num: "02 · Intelligence contextuelle", h: "La bonne suggestion. Pour la bonne personne. Au bon moment.", p: "Candice analyse le profil de chacun et propose uniquement ce qui a du sens — maintenant, pour cette personne précise." },
            { num: "03 · Exécution fluide", h: "Vous décidez. Candice fait le travail.", p: "Commande, réservation, message rédigé — sans quitter l'application. L'intention reste la vôtre. L'effort, non." },
            { num: "04 · Moins de culpabilité", h: "Plus d'occasions manquées. Plus de regrets.", p: "Vous avez l'intention. Candice s'assure qu'elle se transforme en geste. À chaque fois. Pour chaque proche qui compte." },
          ].map((b, i) => (
            <div key={i} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 36, display: "flex", flexDirection: "column", gap: 12 }}>
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
              {
                icon: "♡",
                title: "Chaque personne reçoit différemment",
                body: "Pour certains, c'est un cadeau. Pour d'autres, un message au bon moment. Ou simplement une présence. Candice apprend comment chacun de vos proches reçoit les attentions.",
              },
              {
                icon: "◎",
                title: "Les profils s'affinent dans le temps",
                body: "Plus vous interagissez, plus Candice affine sa compréhension. Chaque information enrichit le profil et améliore la justesse des suggestions.",
              },
              {
                icon: "✦",
                title: "Ce que vous partagez reste entre vous",
                body: "Les profils sont privés. Vos proches peuvent choisir de compléter leur propre fiche — mais ce qu'ils partagent vous est destiné, et uniquement à vous.",
              },
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
        <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, marginBottom: 36, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          Commencez gratuitement. Aucune carte requise.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "15px 32px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>Commencer →</button>
          </Link>
          <Link href="/login">
            <button style={{ background: "transparent", color: TERRA, border: `1px solid ${TERRA}`, borderRadius: 8, padding: "15px 32px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>Se connecter</button>
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

function AppScreenshots() {
  const AVATARS = ["linear-gradient(135deg,#C47A4A,#8A4020)", "linear-gradient(135deg,#4A7C59,#2A5C39)", "linear-gradient(135deg,#534AB7,#3C3489)", "linear-gradient(135deg,#9A3556,#72243E)", "linear-gradient(135deg,#BA7517,#854F0B)"];
  const BG = "#FAF7F2";
  const WHITE = "#FFFFFF";
  const CON = "#1E1208";
  const COND = "#7A5E44";
  const TERRA = "#C47A4A";
  const BORDER = "rgba(30,18,8,0.1)";
  const BORDER2 = "rgba(30,18,8,0.06)";

  return (
    <div className="mkt-screens" style={{ gap: 14 }}>
      {/* Phone 1 — Proches */}
      <MiniPhone title="Mes proches" label="Vos proches, en un coup d'œil">
        {[["SM", "Sophie Martin", "Paris · Amie", "u", "Anniversaire J-4"], ["TL", "Thomas Leroy", "Lyon · Frère", "n", "2 mois sans contact"], ["PL", "Paul Lemaire", "Paris · Ami", "g", "Marathon dimanche"], ["CP", "Claire — Maman", "Bordeaux", "u", "Fête des mères J-8"], ["JR", "Julien R.", "Nantes · Ami", "n", "3 mois sans contact"]].map(([init, name, meta, type, badge], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 8px", background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 5, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: AVATARS[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 500, color: "#fff", flexShrink: 0 }}>{init}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 9, fontWeight: 400, color: CON }}>{name}</div><div style={{ fontSize: 7, fontWeight: 300, color: COND }}>{meta}</div></div>
            <span style={{ fontSize: 6, letterSpacing: .5, textTransform: "uppercase", padding: "2px 5px", borderRadius: 2, background: type === "u" ? "rgba(196,122,74,0.12)" : type === "g" ? "rgba(74,124,89,0.10)" : BORDER2, color: type === "u" ? TERRA : type === "g" ? "#4A7C59" : COND, border: `0.5px solid ${type === "u" ? "rgba(196,122,74,0.28)" : type === "g" ? "rgba(74,124,89,0.25)" : "transparent"}`, whiteSpace: "nowrap" }}>{badge}</span>
          </div>
        ))}
      </MiniPhone>

      {/* Phone 2 — Suggestions */}
      <MiniPhone title="Suggestions" label="La suggestion du moment">
        {[{ who: "Sophie Martin", txt: "Bouquet de pivoines de chez Debeaulieu — livraison le 14 mai.", cta: "Commander", hi: true }, { who: "Paul Lemaire", txt: "Message d'encouragement pour son premier marathon. Prêt à envoyer.", cta: "Envoyer", hi: false }, { who: "Thomas Leroy", txt: "Déjeuner dimanche — créneau commun trouvé.", cta: "Confirmer", hi: false }].map((s, i) => (
          <div key={i} style={{ background: WHITE, border: `0.5px solid ${s.hi ? "rgba(196,122,74,0.35)" : BORDER}`, borderRadius: 5, padding: 9, marginBottom: 5 }}>
            <p style={{ fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", color: TERRA, marginBottom: 3 }}>{s.who}</p>
            <p style={{ fontSize: 8, fontWeight: 300, color: COND, lineHeight: 1.45, marginBottom: 6 }}>{s.txt}</p>
            <button style={{ background: TERRA, color: "#fff", fontSize: 7, padding: "3px 0", borderRadius: 2, border: "none", width: "100%", cursor: "pointer" }}>{s.cta}</button>
          </div>
        ))}
      </MiniPhone>

      {/* Phone 3 — Historique */}
      <MiniPhone title="Avec Sophie" label="L'histoire avec Sophie">
        {[{ d: "14", m: "Fév", who: "Sophie Martin", txt: "Bouquet de roses envoyé. Elle a adoré.", tag: "Réaction positive" }, { d: "02", m: "Jan", who: "Thomas Leroy", txt: "Message nouvel an. Lu et répondu.", tag: "Message · Lu" }, { d: "25", m: "Nov", who: "Claire", txt: "Dîner anniversaire. Excellent souvenir.", tag: "Expérience · Top" }, { d: "10", m: "Oct", who: "Paul Lemaire", txt: "Whisky Nikka lors de sa rupture.", tag: "Soutien · Impactant" }].map((mem, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 5, padding: 8, marginBottom: 4 }}>
            <div style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 3, padding: "3px 5px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: CON, lineHeight: 1 }}>{mem.d}</div>
              <div style={{ fontSize: 6, color: COND, textTransform: "uppercase", letterSpacing: 1 }}>{mem.m}</div>
            </div>
            <div>
              <p style={{ fontSize: 7, fontWeight: 500, color: TERRA, marginBottom: 2 }}>{mem.who}</p>
              <p style={{ fontSize: 8, fontWeight: 300, color: COND, lineHeight: 1.4 }}>{mem.txt}</p>
              <span style={{ display: "inline-block", marginTop: 3, fontSize: 6, letterSpacing: 1, textTransform: "uppercase", padding: "1px 5px", borderRadius: 2, background: "rgba(196,122,74,0.10)", color: TERRA }}>{mem.tag}</span>
            </div>
          </div>
        ))}
      </MiniPhone>

      {/* Phone 4 — Fiche */}
      <MiniPhone title="Sophie Martin" label="Profil de Sophie">
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#C47A4A,#8A4020)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 500, color: "#fff", margin: "0 auto 5px" }}>SM</div>
        <p style={{ textAlign: "center", fontSize: 9, fontWeight: 500, color: CON, marginBottom: 1 }}>Sophie Martin</p>
        <p style={{ textAlign: "center", fontSize: 7, fontWeight: 300, color: COND, marginBottom: 8 }}>Amie proche · Paris</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
          {[["12", "Gestes"], ["J-4", "Anniversaire"], ["8", "Infos"], ["100%", "Profil"]].map(([v, l]) => (
            <div key={l} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 4, padding: 5, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 300, color: TERRA, letterSpacing: -.5, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 6, fontWeight: 300, color: COND, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 4, padding: 7 }}>
          <p style={{ fontSize: 6, letterSpacing: 1.5, textTransform: "uppercase", color: TERRA, marginBottom: 6 }}>Comment elle reçoit les attentions</p>
          {[["Cadeau", 85], ["Expé.", 72], ["Mots", 60], ["Geste", 45]].map(([l, v]) => (
            <div key={l as string} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              <span style={{ fontSize: 6, color: COND, width: 28, textAlign: "right", flexShrink: 0 }}>{l}</span>
              <div style={{ flex: 1, height: 3, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${v}%`, height: "100%", background: TERRA, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 6, color: COND, width: 16, textAlign: "right", flexShrink: 0 }}>{v}%</span>
            </div>
          ))}
        </div>
      </MiniPhone>
    </div>
  );
}

function MiniPhone({ title, label, children }: { title: string; label: string; children: React.ReactNode }) {
  const BG = "#FAF7F2";
  const WHITE = "#FFFFFF";
  const CON = "#1E1208";
  const COND = "#7A5E44";
  const TERRA = "#C47A4A";
  const BORDER = "rgba(30,18,8,0.1)";

  return (
    <div style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 18, padding: 8 }}>
      <div style={{ width: 32, height: 3, background: BORDER, borderRadius: 2, margin: "0 auto 7px" }} />
      <div style={{ background: WHITE, borderRadius: 12, padding: 9, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 7, borderBottom: `0.5px solid ${BORDER}` }}>
          <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", color: CON }}>{title}</span>
          <span style={{ fontSize: 7, color: TERRA }}>+ Ajouter</span>
        </div>
        {children}
      </div>
      <p style={{ textAlign: "center", marginTop: 8, fontSize: 10, fontWeight: 300, color: COND }}>{label}</p>
    </div>
  );
}
