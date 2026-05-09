import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Le concept — Candice",
  description: "On a tous quelqu'un à qui on tient. On n'a juste plus le temps de le montrer.",
};

const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";

export default function ConceptPage() {
  return (
    <main style={{ background: "#FAF7F2", fontFamily: "'Plus Jakarta Sans', sans-serif", color: CON, minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ height: 60, padding: "0 52px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid rgba(30,18,8,0.1)", background: "#FAF7F2", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: "flex", alignItems: "flex-start", gap: 4, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: CON }}>Candice</span>
          <span style={{ width: 7, height: 7, background: TERRA, borderRadius: "50%", marginTop: 3, flexShrink: 0, display: "inline-block" }} />
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          <Link href="/concept" style={{ fontSize: 12, fontWeight: 400, color: TERRA }}>Le concept</Link>
          <Link href="/comment-ca-marche" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Comment ça marche</Link>
          <Link href="/offre" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>L&apos;offre</Link>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Se connecter</Link>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Commencer</button>
          </Link>
        </div>
      </nav>

      {/* Hero text */}
      <section style={{ padding: "96px 52px 72px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 24 }}>Le concept</p>
        <h1 style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.1, letterSpacing: -1.5, color: CON, marginBottom: 32, fontFamily: "'Playfair Display', Georgia, serif" }}>
          On a tous quelqu&apos;un à qui on tient.<br />
          <span style={{ color: TERRA }}>On n&apos;a juste plus le temps de le montrer.</span>
        </h1>
        <p style={{ fontSize: 18, fontWeight: 300, color: COND, lineHeight: 1.8, maxWidth: 600, margin: "0 auto" }}>
          La vie va vite. Trop vite. Entre le boulot, les enfants, les obligations — les petites attentions qu&apos;on voulait faire finissent dans un coin de notre tête, et n&apos;en ressortent jamais. Ce n&apos;est pas un manque d&apos;amour. C&apos;est un manque de temps, d&apos;organisation, et parfois juste d&apos;idées.
        </p>
      </section>

      {/* Stats */}
      <section style={{ background: "#2C1A0E", padding: "64px 52px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
          {[
            { stat: "66%", text: "des gens oublient régulièrement de marquer les moments importants de leurs proches." },
            { stat: "54%", text: "aimeraient faire plus d'attentions mais ne savent pas comment s'organiser." },
          ].map((s, i) => (
            <div key={i} style={{ padding: "48px 44px", background: "rgba(255,255,255,0.03)" }}>
              <p style={{ fontSize: 72, fontWeight: 300, color: TERRA, lineHeight: 1, marginBottom: 16, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: -2 }}>{s.stat}</p>
              <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(250,247,242,0.75)", lineHeight: 1.7 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Candice vit avec toi */}
      <section style={{ padding: "88px 52px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 16, textAlign: "center" }}>Candice vit avec toi</p>
          <h2 style={{ fontSize: 36, fontWeight: 300, color: CON, letterSpacing: -1, lineHeight: 1.15, marginBottom: 56, textAlign: "center", maxWidth: 560, margin: "0 auto 56px", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Des vraies situations. Des vraies attentions.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { emoji: "🍽️", text: "Tu sors du resto. Manon avait l'air de ne pas aller fort ce soir. Tu dis à Candice : 'Manon est à plat, son boulot la dévore.' Le lendemain, Candice te propose d'organiser un week-end surprise pour elle — spa, hôtel, dîner. Tu valides. Elle réserve." },
              { emoji: "👗", text: "Thomas se balade avec Julie devant une boutique. Julie s'arrête : 'Oh j'adore cette robe.' Thomas prend une photo avec Candice. La robe est ajoutée à la liste de souhaits de Julie. Son anniversaire est dans 6 semaines. Candice s'en souvient." },
              { emoji: "🍼", text: "Tu viens de raccrocher avec Camille. Elle vient d'accoucher à Dubaï. Tu le dis à Candice. En 3 minutes, elle te propose une livraison de fleurs et un coffret naissance à son adresse à Dubaï. Tu valides. C'est parti." },
              { emoji: "✈️", text: "Julie part au Japon la semaine prochaine. Candice lui prépare un carnet de voyage personnalisé — ses adresses préférées dans ses quartiers, une playlist pour le vol, un message de ta part. Elle rentre avec des souvenirs. Toi tu n'as rien fait, sauf y penser." },
              { emoji: "👴", text: "Papa semble seul depuis quelques semaines. Candice te propose d'organiser un week-end père-enfant — itinéraire, hôtel, activité selon ce qu'il aime. Tu dis oui. Elle gère tout." },
              { emoji: "🥂", text: "Tu sors d'une réunion. Ton associé vient de décrocher le plus gros contrat de sa vie. Tu le dis à Candice. Elle commande une bouteille de champagne livrée à son bureau dans l'heure." },
            ].map((card, i) => (
              <div key={i} style={{ background: "#fff", border: "0.5px solid rgba(30,18,8,0.1)", borderRadius: 12, padding: "28px 24px" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{card.emoji}</div>
                <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75 }}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#2C1A0E", padding: "72px 52px", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#FAF7F2", letterSpacing: -0.8, marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif" }}>
          Prêt à ne plus jamais rater ce qui compte ?
        </h2>
        <Link href="/register">
          <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "15px 32px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
            Essayer Candice gratuitement →
          </button>
        </Link>
      </section>

      <footer style={{ background: "#FAF7F2", padding: "20px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid rgba(30,18,8,0.08)" }}>
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: "rgba(30,18,8,0.2)" }}>Candice ·</span>
        <div style={{ display: "flex", gap: 24 }}>
          {["Confidentialité", "Conditions générales", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}
