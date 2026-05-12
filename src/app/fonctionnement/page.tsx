import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/layout/MarketingNav";
import MarketingFooter from "@/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Fonctionnement — Candice",
  description: "Chaque détail compte. Candice s'en souvient.",
};

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const BORDER = "rgba(30,18,8,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

export default function FonctionnementPage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>

      {/* Nav */}
      <MarketingNav />

      {/* Hero */}
      <section style={{ padding: "96px 52px 72px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 24 }}>Fonctionnement</p>
        <h1 style={{ fontFamily: PLAYFAIR, fontSize: 52, fontWeight: 400, lineHeight: 1.1, letterSpacing: -1.5, color: CON, marginBottom: 16 }}>
          Chaque détail compte.<br /><span style={{ color: TERRA }}>Candice s&apos;en souvient.</span>
        </h1>
        <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.75, maxWidth: 480, margin: "0 auto" }}>
          En trois étapes simples, Candice devient le copilote de vos relations les plus importantes.
        </p>
      </section>

      {/* 3 steps */}
      <section style={{ padding: "0 52px 80px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              num: "01",
              title: "Tes proches racontent. Toi tu complètes.",
              body: "Tes proches remplissent leur fiche à leur rythme — leurs goûts, leurs envies, leurs dates importantes. Toi tu complètes au fil du temps : une phrase après un dîner, une photo d'une vitrine, un détail que tu ne veux pas oublier.",
              bg: WHITE,
              titleColor: CON,
              textColor: COND,
              numColor: TERRA,
              border: `0.5px solid ${BORDER}`,
            },
            {
              num: "02",
              title: "Candice apprend et anticipe.",
              body: "Candice croise les profils, les dates, le contexte. Elle sait quand agir, pour qui, et comment. Elle pense à ton prochain dîner avec ta sœur, à l'anniversaire de ton meilleur ami dans 3 semaines, au massage qui ferait du bien à ta maman.",
              bg: TERRA,
              titleColor: "#fff",
              textColor: "rgba(255,255,255,0.85)",
              numColor: "rgba(255,255,255,0.5)",
              border: "none",
            },
            {
              num: "03",
              title: "Tu valides en un clic.",
              body: "Candice propose. Tu dis oui. Elle s'occupe du reste — commande, réservation, message rédigé, livraison planifiée. L'intention reste la tienne. L'effort, non.",
              bg: WHITE,
              titleColor: CON,
              textColor: COND,
              numColor: TERRA,
              border: `0.5px solid ${BORDER}`,
            },
          ].map((step, i) => (
            <div key={i} style={{ background: step.bg, border: step.border, borderRadius: 12, padding: "52px 52px" }}>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 3, color: step.numColor, marginBottom: 16, textTransform: "uppercase" }}>{step.num}</p>
              <h2 style={{ fontFamily: PLAYFAIR, fontSize: 28, fontWeight: 400, color: step.titleColor, lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 16 }}>
                {step.title}
              </h2>
              <p style={{ fontSize: 16, fontWeight: 300, color: step.textColor, lineHeight: 1.8, maxWidth: 580 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Certaines fiches se construisent à deux */}
      <section style={{ background: BG, borderTop: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}`, padding: "80px 52px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 400, lineHeight: 1.25, letterSpacing: -0.5, color: CON, marginBottom: 24 }}>
            Certaines fiches se construisent à deux.
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 20 }}>
            Une grand-mère qui raconte ses habitudes à voix haute pendant qu&apos;on remplit sa fiche pour elle. Un parent qui partage doucement ses préférences. Un proche qui complète la sienne au fil des conversations.
          </p>
          <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 16, fontWeight: 400, color: COND, lineHeight: 1.75 }}>
            Une fois créée, une fiche peut ensuite être partagée avec les proches choisis. Un même profil, autant de relations qu&apos;il compte.
          </p>
        </div>
      </section>

      {/* 6 situation cards */}
      <section style={{ background: WHITE, borderTop: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}`, padding: "80px 52px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 16, textAlign: "center" }}>Dans la vraie vie</p>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 32, fontWeight: 400, color: CON, letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 48, textAlign: "center" }}>
            Candice agit dans toutes les situations.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { emoji: "🍽️", title: "Après un dîner", text: "Tu remarques que Manon n'allait pas fort. Candice te propose un geste pour la semaine prochaine." },
              { emoji: "👗", title: "En balade", text: "Julie s'arrête devant une vitrine. Tu l'enregistres dans Candice. Ça devient un cadeau parfait pour son anniversaire dans 6 semaines." },
              { emoji: "🍼", title: "Une grande nouvelle", text: "Camille vient d'accoucher à l'étranger. Candice propose une livraison locale adaptée en quelques minutes." },
              { emoji: "✈️", title: "Un départ en voyage", text: "Candice prépare un carnet de voyage personnalisé pour ton proche qui part la semaine prochaine." },
              { emoji: "👴", title: "Un proche seul", text: "Tu sens que papa est un peu seul. Candice suggère un week-end père-enfant clé en main." },
              { emoji: "🥂", title: "Une victoire à célébrer", text: "Ton associé vient de décrocher un gros contrat. Candice expédie une bouteille à son bureau dans l'heure." },
            ].map((card, i) => (
              <div key={i} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "24px 20px" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{card.emoji}</div>
                <p style={{ fontSize: 13, fontWeight: 500, color: CON, marginBottom: 8 }}>{card.title}</p>
                <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.7 }}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "88px 52px", textAlign: "center" }}>
        <h2 style={{ fontFamily: PLAYFAIR, fontSize: 36, fontWeight: 400, color: CON, letterSpacing: -0.8, marginBottom: 20 }}>
          Prêt à essayer ?
        </h2>
        <Link href="/register">
          <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "15px 36px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
            Essayer Candice gratuitement →
          </button>
        </Link>
      </section>

      <MarketingFooter />
    </main>
  );
}
