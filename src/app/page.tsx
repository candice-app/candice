import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "./metadata";

export const metadata: Metadata = {
  title: { absolute: "Candice — Votre copilote relationnel" },
  description: "Ne plus jamais oublier ce qui compte pour vos proches. Candice retient, anticipe et agit pour que vos relations s'approfondissent.",
  alternates: { canonical: BASE_URL },
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

      {/* NAV */}
      <nav aria-label="Navigation principale" style={{ height: 60, padding: "0 52px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `0.5px solid ${BORDER}`, background: BG, position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: "flex", alignItems: "flex-start", gap: 4, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: CON, fontFamily: DM }}>Candice</span>
          <span aria-hidden="true" style={{ width: 7, height: 7, background: TERRA, borderRadius: "50%", marginTop: 3, flexShrink: 0, display: "inline-block" }} />
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          <Link href="/concept" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Le concept</Link>
          <Link href="/comment-ca-marche" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Comment ça marche</Link>
          <Link href="/offre" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>L&apos;offre</Link>
          <Link href="/login" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Se connecter</Link>
        </div>
        <Link href="/register">
          <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>Commencer</button>
        </Link>
      </nav>

      {/* HERO */}
      <section id="main-content" style={{ padding: "112px 52px 96px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 28, fontFamily: DM }}>Votre copilote relationnel</p>
        <h1 style={{ fontFamily: PLAYFAIR, fontSize: 64, fontWeight: 400, lineHeight: 1.05, letterSpacing: -2, color: CON, marginBottom: 24 }}>
          Ne plus jamais rater<br />
          <span style={{ color: TERRA }}>ce qui compte vraiment.</span>
        </h1>
        <p style={{ fontSize: 17, fontWeight: 300, color: COND, lineHeight: 1.75, maxWidth: 460, margin: "0 auto 44px" }}>
          Candice retient les détails, anticipe les moments, et vous aide à agir — pour que vos relations s&apos;approfondissent naturellement.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
              Commencer gratuitement →
            </button>
          </Link>
          <Link href="/concept">
            <button style={{ background: "transparent", color: CON, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
              Découvrir le concept
            </button>
          </Link>
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ background: WHITE, borderTop: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}`, padding: "80px 52px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20 }}>Le problème</p>
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: 32, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 20 }}>
              Vous pensez à eux.<br />Vous ne le montrez pas toujours.
            </h2>
            <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85 }}>
              La vie va vite. Les petites attentions qu&apos;on voulait faire finissent dans un coin de la tête, et n&apos;en ressortent jamais. Ce n&apos;est pas un manque d&apos;amour — c&apos;est un manque de temps et d&apos;organisation.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { stat: "66%", text: "des gens oublient régulièrement de marquer les moments importants de leurs proches" },
              { stat: "54%", text: "aimeraient faire plus d'attentions mais ne savent pas comment s'organiser" },
            ].map((s, i) => (
              <div key={i} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "28px 32px" }}>
                <p style={{ fontFamily: PLAYFAIR, fontSize: 52, fontWeight: 400, color: TERRA, lineHeight: 1, marginBottom: 10 }}>{s.stat}</p>
                <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.65 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "80px 52px" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 40, textAlign: "center" }}>
            Ils auraient voulu faire autrement.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { q: "Son anniversaire était passé. Je l'ai su le lendemain matin.", who: "Marie, 34 ans" },
              { q: "Je savais exactement quoi faire. Je n'ai jamais eu le temps de le faire.", who: "Thomas, 41 ans" },
              { q: "Je me suis dit que je m'en occuperais ce week-end. Le week-end est passé.", who: "Sophie, 29 ans" },
              { q: "Je voulais lui faire plaisir. Je n'avais aucune idée de ce qui lui ferait vraiment plaisir.", who: "Lucas, 38 ans" },
            ].map((c, i) => (
              <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: PLAYFAIR, fontSize: 32, fontWeight: 400, color: TERRA, opacity: 0.4, marginBottom: 12, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 14, fontWeight: 300, color: CON, lineHeight: 1.65, flex: 1, marginBottom: 16 }}>{c.q}</p>
                <p style={{ fontSize: 11, fontWeight: 400, color: COND }}>{c.who}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: WHITE, borderTop: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}`, padding: "80px 52px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 40, textAlign: "center" }}>Ce que Candice change</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { num: "01", h: "Mémoire relationnelle", p: "Goûts, habitudes, dates importantes — chaque détail devient une opportunité de geste juste, au bon moment." },
              { num: "02", h: "Intelligence contextuelle", p: "Candice croise les profils et le contexte. Elle sait quand agir, pour qui, et comment — sans que vous ayez à y penser." },
              { num: "03", h: "Exécution complète", p: "Commande, réservation, message rédigé — sans quitter l'application. L'intention reste la vôtre. L'effort, non." },
              { num: "04", h: "Zéro charge mentale", p: "Plus d'anxiété des occasions manquées. Plus de culpabilité. Vos relations s'approfondissent naturellement." },
            ].map((b, i) => (
              <div key={i} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "32px 28px" }}>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, color: TERRA, marginBottom: 12, textTransform: "uppercase" }}>{b.num}</p>
                <h3 style={{ fontFamily: PLAYFAIR, fontSize: 20, fontWeight: 400, lineHeight: 1.25, color: CON, marginBottom: 10 }}>{b.h}</h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75 }}>{b.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "104px 52px", textAlign: "center" }}>
        <h2 style={{ fontFamily: PLAYFAIR, fontSize: 44, fontWeight: 400, letterSpacing: -1.2, lineHeight: 1.1, color: CON, marginBottom: 16, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          Prêt à ne plus jamais rater<br /><span style={{ color: TERRA }}>ce qui compte vraiment ?</span>
        </h2>
        <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.75, marginBottom: 36, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
          Gratuit pour toujours. Sans carte bancaire.
        </p>
        <Link href="/register">
          <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "16px 40px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
            Commencer avec Candice →
          </button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: WHITE, padding: "20px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `0.5px solid ${BORDER}` }}>
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: "rgba(30,18,8,0.2)" }}>Candice ·</span>
        <nav aria-label="Liens légaux" style={{ display: "flex", gap: 24 }}>
          {["Confidentialité", "Conditions générales", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>{l}</a>
          ))}
        </nav>
      </footer>

    </main>
  );
}
