import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { BASE_URL } from "./metadata";

export const metadata: Metadata = {
  title: {
    absolute: "Candice — Votre copilote relationnel",
  },
  description:
    "Ne plus jamais oublier ce qui compte pour vos proches. Candice apprend, anticipe et agit pour que vos relations s'approfondissent.",
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

      {/* NAV */}
      <nav aria-label="Navigation principale" style={{ height: 60, padding: "0 52px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `0.5px solid ${BORDER}`, background: BG, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: CON }}>Candice</span>
          <span aria-hidden="true" style={{ width: 7, height: 7, background: TERRA, borderRadius: "50%", marginTop: 3, boxShadow: "0 0 8px rgba(196,122,74,0.5)", flexShrink: 0, display: "inline-block" }} />
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          <Link href="/concept" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Le concept</Link>
          <Link href="/comment-ca-marche" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Comment ça marche</Link>
          <Link href="/offre" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>L&apos;offre</Link>
          <Link href="/login" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>Se connecter</Link>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>Commencer</button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section id="main-content" style={{ padding: "96px 52px 88px", textAlign: "center", borderBottom: `0.5px solid ${BORDER}` }}>
        <h1 style={{ fontFamily: PLAYFAIR, fontSize: 64, fontWeight: 400, color: CON, lineHeight: 1.04, letterSpacing: -2.5, marginBottom: 12 }}>
          Votre copilote<br /><span style={{ color: TERRA }}>relationnel.</span>
        </h1>
        <p style={{ fontSize: 22, fontWeight: 300, color: TERRA, letterSpacing: -0.3, marginBottom: 44 }}>
          L&apos;attention juste, au bon moment.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>Ne plus jamais rater un moment →</button>
          </Link>
          <button style={{ background: "transparent", color: CON, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>Découvrir</button>
        </div>
      </section>

      {/* BRIDGE */}
      <div style={{ background: BG, borderBottom: `0.5px solid ${BORDER}`, padding: "28px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
        <p style={{ fontSize: 18, fontWeight: 300, color: CON, letterSpacing: -0.3, lineHeight: 1.3, maxWidth: 380 }}>
          Vivez pleinement les moments qui comptent.<br />
          <span style={{ color: TERRA }}>Candice s&apos;occupe du reste.</span>
        </p>
        <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.65, maxWidth: 400, borderLeft: `1.5px solid ${TERRA}`, paddingLeft: 20 }}>
          Candice <strong style={{ color: CON, fontWeight: 400 }}>apprend, anticipe et agit</strong> — pour que vos relations s&apos;approfondissent et que votre charge mentale disparaisse.
        </p>
      </div>

      {/* STATS BLOC */}
      <section style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}`, padding: "72px 52px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
          {/* Left — problem text */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20 }}>Le problème</p>
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: 32, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 20 }}>
              On pense à eux. On ne le montre pas toujours. Ou pas comme ils l&apos;aimeraient.
            </h2>
            <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85 }}>
              La vie va vite. Les petites attentions qu&apos;on voulait faire finissent dans un coin de notre tête, et n&apos;en ressortent jamais. Pas par manque d&apos;amour. Par manque de temps, d&apos;idées — ou parce qu&apos;on ne connaît pas toujours assez bien l&apos;autre pour lui faire vraiment plaisir.
            </p>
          </div>
          {/* Right — stat cards */}
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { stat: "66%", text: "oublient régulièrement les moments importants de leurs proches" },
                { stat: "54%", text: "ne savent tout simplement pas quoi faire" },
              ].map((s, i) => (
                <div key={i} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "28px 32px" }}>
                  <p style={{ fontFamily: PLAYFAIR, fontSize: 52, fontWeight: 400, color: TERRA, lineHeight: 1, marginBottom: 12, letterSpacing: -1.5 }}>{s.stat}</p>
                  <p style={{ fontSize: 14, fontWeight: 300, color: CON, lineHeight: 1.65 }}>{s.text}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, fontWeight: 300, color: COND, marginTop: 12, textAlign: "right" }}>
              (Étude Candice, 500 répondants, 2025)
            </p>
          </div>
        </div>
      </section>

      {/* CITATIONS */}
      <section aria-label="Témoignages" style={{ background: BG, padding: "64px 52px", borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 40, textAlign: "center" }}>
          Ils auraient voulu faire autrement.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { q: "Son anniversaire était passé. Je l'ai su le lendemain matin.", who: "Marie, 34 ans", frein: "Oubli" },
            { q: "Je savais exactement quoi faire. Je n'ai jamais eu le temps de le faire.", who: "Thomas, 41 ans", frein: "Manque de temps" },
            { q: "Je me suis dit que je m'en occuperais ce week-end. Le week-end est passé.", who: "Sophie, 29 ans", frein: "Procrastination" },
            { q: "Je voulais lui faire plaisir. Je n'avais aucune idée de ce qui lui ferait vraiment plaisir.", who: "Lucas, 38 ans", frein: "Pas d'idée" },
          ].map((c, i) => (
            <div key={i} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "32px 28px", display: "flex", flexDirection: "column" }}>
              <div aria-hidden="true" style={{ fontFamily: PLAYFAIR, fontSize: 32, fontWeight: 400, color: TERRA, opacity: 0.5, marginBottom: 14, lineHeight: 1 }}>"</div>
              <p style={{ fontSize: 14, fontWeight: 400, color: CON, lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{c.q}</p>
              <div style={{ height: "0.5px", background: BORDER, marginBottom: 14 }} />
              <p style={{ fontSize: 11, fontWeight: 300, color: COND }}>{c.who}</p>
              <p style={{ fontSize: 10, fontWeight: 500, color: TERRA, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{c.frein}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BÉNÉFICES */}
      <section aria-label="Fonctionnalités" style={{ background: WHITE, padding: "64px 52px", borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 36 }}>Ce que Candice change</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { num: "01 · Mémoire relationnelle", h: "Candice retient tout. Vous ne perdez plus rien.", p: "Goûts, habitudes, dates importantes, moments partagés — chaque information devient une opportunité de geste juste." },
            { num: "02 · Intelligence contextuelle", h: "La bonne suggestion. Pour la bonne personne. Au bon moment.", p: "Candice analyse le contexte de chacun de vos proches et propose uniquement ce qui a du sens — maintenant." },
            { num: "03 · Exécution complète", h: "Vous approuvez. Candice fait le reste.", p: "Commande, réservation, message rédigé — sans quitter l'application. L'intention reste la vôtre. L'effort, non." },
            { num: "04 · Zéro charge mentale", h: "Votre cerveau est libéré. Votre présence, entière.", p: "Plus d'anxiété des occasions manquées. Plus de culpabilité. Vos relations s'approfondissent naturellement." },
          ].map((b, i) => (
            <div key={i} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 36, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: 2, color: TERRA, textTransform: "uppercase" }}>{b.num}</p>
              <h2 style={{ fontFamily: PLAYFAIR, fontSize: 18, fontWeight: 400, lineHeight: 1.22, letterSpacing: -0.3, color: CON }}>{b.h}</h2>
              <p style={{ fontSize: 12, fontWeight: 300, lineHeight: 1.75, color: COND }}>{b.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCREENS PRODUIT */}
      <section aria-label="Aperçu de l'application" style={{ background: BG, padding: "64px 52px", borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 28, fontWeight: 400, color: CON, letterSpacing: -0.8, lineHeight: 1.25, marginBottom: 8 }}>
            Tout ce qui compte pour eux,<br />réuni en un seul endroit.
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.65 }}>
            Pour ne plus jamais rien oublier. Pour ne plus jamais manquer un moment.
          </p>
        </div>
        <div aria-hidden="true">
          <AppScreenshots />
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "88px 52px", textAlign: "center", background: WHITE }}>
        <h2 style={{ fontFamily: PLAYFAIR, fontSize: 40, fontWeight: 400, color: CON, letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 14, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
          Prêt à ne plus jamais rater<br /><span style={{ color: TERRA }}>ce qui compte vraiment ?</span>
        </h2>
        <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, marginBottom: 36, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          Candice <strong style={{ color: CON, fontWeight: 400 }}>apprend, anticipe et agit</strong> — pour que vos relations s&apos;approfondissent et que votre charge mentale disparaisse.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "15px 32px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>Commencer avec Candice →</button>
          </Link>
          <Link href="/login">
            <button style={{ background: "transparent", color: TERRA, border: `1px solid ${TERRA}`, borderRadius: 8, padding: "15px 32px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>Se connecter</button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: BG, padding: "20px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `0.5px solid ${BORDER}` }}>
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
      {/* Phone 1 — Proches */}
      <MiniPhone title="Mes proches" label="Liste de proches">
        {[["SM", "Sophie Martin", "Paris · Amie", "u", "Anniversaire J-4"], ["TL", "Thomas Leroy", "Lyon · Frère", "n", "2 mois sans contact"], ["PL", "Paul Lemaire", "Paris · Ami", "g", "Marathon dimanche"], ["CP", "Claire — Maman", "Bordeaux", "u", "Fête des mères J-8"], ["JR", "Julien R.", "Nantes · Ami", "n", "3 mois sans contact"]].map(([init, name, meta, type, badge], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 8px", background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 5, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: AVATARS[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 500, color: "#fff", flexShrink: 0 }}>{init}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 9, fontWeight: 400, color: CON }}>{name}</div><div style={{ fontSize: 7, fontWeight: 300, color: COND }}>{meta}</div></div>
            <span style={{ fontSize: 6, letterSpacing: .5, textTransform: "uppercase", padding: "2px 5px", borderRadius: 2, background: type === "u" ? "rgba(196,122,74,0.12)" : type === "g" ? "rgba(74,124,89,0.10)" : BORDER2, color: type === "u" ? TERRA : type === "g" ? "#4A7C59" : COND, border: `0.5px solid ${type === "u" ? "rgba(196,122,74,0.28)" : type === "g" ? "rgba(74,124,89,0.25)" : "transparent"}`, whiteSpace: "nowrap" }}>{badge}</span>
          </div>
        ))}
      </MiniPhone>

      {/* Phone 2 — Suggestions */}
      <MiniPhone title="Suggestions" label="Recommandations">
        {[{ who: "Sophie Martin", txt: "Bouquet de pivoines de chez Debeaulieu — livraison le 14 mai.", cta: "Commander", hi: true }, { who: "Paul Lemaire", txt: "Message d'encouragement pour son premier marathon. Prêt à envoyer.", cta: "Envoyer", hi: false }, { who: "Thomas Leroy", txt: "Déjeuner dimanche — créneau commun trouvé.", cta: "Confirmer", hi: false }].map((s, i) => (
          <div key={i} style={{ background: WHITE, border: `0.5px solid ${s.hi ? "rgba(196,122,74,0.35)" : BORDER}`, borderRadius: 5, padding: 9, marginBottom: 5 }}>
            <p style={{ fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", color: TERRA, marginBottom: 3 }}>{s.who}</p>
            <p style={{ fontSize: 8, fontWeight: 300, color: COND, lineHeight: 1.45, marginBottom: 6 }}>{s.txt}</p>
            <button style={{ background: TERRA, color: "#fff", fontSize: 7, padding: "3px 0", borderRadius: 2, border: "none", width: "100%", cursor: "pointer" }}>{s.cta}</button>
          </div>
        ))}
      </MiniPhone>

      {/* Phone 3 — Souvenirs */}
      <MiniPhone title="Souvenirs" label="Historique & souvenirs">
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
      <MiniPhone title="Sophie Martin" label="Fiche · KPIs · Matching">
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#C47A4A,#8A4020)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 500, color: "#fff", margin: "0 auto 5px" }}>SM</div>
        <p style={{ textAlign: "center", fontSize: 9, fontWeight: 500, color: CON, marginBottom: 1 }}>Sophie Martin</p>
        <p style={{ textAlign: "center", fontSize: 7, fontWeight: 300, color: COND, marginBottom: 8 }}>Amie proche · Paris</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
          {[["12", "Gestes"], ["94%", "Satisfaction"], ["J-4", "Anniversaire"], ["8", "Infos"]].map(([v, l]) => (
            <div key={l} style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 4, padding: 5, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 300, color: TERRA, letterSpacing: -.5, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 6, fontWeight: 300, color: COND, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 4, padding: 7 }}>
          <p style={{ fontSize: 6, letterSpacing: 1.5, textTransform: "uppercase", color: TERRA, marginBottom: 6 }}>Profil de réception</p>
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
