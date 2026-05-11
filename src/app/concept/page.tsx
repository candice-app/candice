import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/layout/MarketingNav";

export const metadata: Metadata = {
  title: "Candice — Pourquoi Candice",
  description: "Les personnes qui comptent méritent votre meilleur. Candice vous aide à y arriver.",
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

      {/* Nav */}
      <MarketingNav />

      {/* Hero */}
      <section style={{ padding: "96px 52px 72px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 24 }}>Candice</p>
        <h1 style={{ fontFamily: PLAYFAIR, fontSize: 52, fontWeight: 400, lineHeight: 1.1, letterSpacing: -1.5, color: CON, marginBottom: 0 }}>
          Les personnes qui comptent<br />
          <span style={{ color: TERRA }}>méritent votre meilleur.</span>
        </h1>
      </section>

      {/* Body — 3 paragraphs */}
      <section style={{ background: WHITE, borderTop: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}`, padding: "72px 52px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>
          <p style={{ fontSize: 17, fontWeight: 300, color: CON, lineHeight: 1.85 }}>
            Vous avez du mal à vous en souvenir, mais vous y pensez tout le temps. L&apos;anniversaire de votre meilleur ami, la date d&apos;anniversaire de vos parents, l&apos;allergie de votre collègue — ces petits détails qui font toute la différence entre un geste qui touche et un geste qui rate. La vie va vite, trop vite. Entre le travail, les enfants, les obligations du quotidien, les petites attentions qu&apos;on voulait faire finissent dans un coin de la tête, et n&apos;en ressortent jamais. Ce n&apos;est pas un manque d&apos;amour. C&apos;est un manque de temps, d&apos;organisation, et parfois juste d&apos;idées.
          </p>
          <p style={{ fontSize: 17, fontWeight: 300, color: CON, lineHeight: 1.85 }}>
            Candice est votre copilote relationnel. Elle retient tout ce que vous apprenez sur vos proches — leurs goûts, leurs habitudes, leurs dates importantes, leurs moments difficiles. Elle croise ces informations avec le contexte du moment et vous propose la bonne attention, pour la bonne personne, au bon moment. Vous approuvez. Elle s&apos;occupe du reste — commande, réservation, message rédigé, livraison planifiée. L&apos;intention reste la vôtre. L&apos;effort, non.
          </p>
          <p style={{ fontSize: 17, fontWeight: 300, color: CON, lineHeight: 1.85 }}>
            Le résultat ? Des relations qui s&apos;approfondissent naturellement. Votre mère qui reçoit des fleurs le jour de sa retraite. Votre ami qui sait que vous pensiez à lui pendant son marathon. Votre collègue qui comprend que vous avez retenu qu&apos;elle est allergique aux noix. Des petits gestes qui changent tout — sans que vous ayez à tout porter seul.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "72px 52px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { stat: "66%", text: "des gens oublient régulièrement de marquer les moments importants de leurs proches." },
            { stat: "54%", text: "aimeraient faire plus d'attentions mais ne savent pas comment s'organiser." },
          ].map((s, i) => (
            <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "48px 44px" }}>
              <p style={{ fontFamily: PLAYFAIR, fontSize: 72, fontWeight: 400, color: TERRA, lineHeight: 1, marginBottom: 16, letterSpacing: -2 }}>{s.stat}</p>
              <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.7 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "88px 52px", textAlign: "center" }}>
        <h2 style={{ fontFamily: PLAYFAIR, fontSize: 36, fontWeight: 400, color: CON, letterSpacing: -0.8, marginBottom: 20 }}>
          Prêt à donner le meilleur de vous-même ?
        </h2>
        <Link href="/register">
          <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "15px 36px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
            Commencer gratuitement →
          </button>
        </Link>
      </section>

      <footer style={{ background: WHITE, padding: "20px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `0.5px solid ${BORDER}` }}>
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: "rgba(30,18,8,0.2)" }}>Candice ·</span>
        <div style={{ display: "flex", gap: 24 }}>
          <Link href="/confidentialite" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>Confidentialité</Link>
          <Link href="/conditions-generales" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>Conditions générales</Link>
          <a href="mailto:candiceapp.hello@gmail.com" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>Contact</a>
        </div>
      </footer>
    </main>
  );
}
