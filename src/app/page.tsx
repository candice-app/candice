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

export default function HomePage() {
  return (
    <main style={{ background: "var(--br)", fontFamily: "var(--font)", color: "var(--con)" }}>

      {/* NAV */}
      <nav aria-label="Navigation principale" style={{ height: 60, padding: "0 52px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid var(--brd)", background: "var(--br)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: "var(--con)" }}>Candice</span>
          <span aria-hidden="true" style={{ width: 7, height: 7, background: "var(--terra)", borderRadius: "50%", marginTop: 3, boxShadow: "0 0 8px rgba(196,122,74,0.6)", flexShrink: 0, display: "inline-block" }} />
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {["Le concept", "Fonctionnement", "Tarifs", "À propos"].map(l => (
            <a key={l} href="#" style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>Se connecter</Link>
          <Link href="/register"><button className="btn-primary">Commencer</button></Link>
        </div>
      </nav>

      {/* HERO */}
      <section id="main-content" style={{ padding: "96px 52px 88px", textAlign: "center", borderBottom: "0.5px solid var(--brd)" }}>
        <h1 style={{ fontSize: 64, fontWeight: 300, color: "var(--con)", lineHeight: 1.04, letterSpacing: -2.5, marginBottom: 12 }}>
          Votre copilote<br /><span style={{ color: "var(--terra)" }}>relationnel.</span>
        </h1>
        <p style={{ fontSize: 22, fontWeight: 300, color: "var(--terra)", letterSpacing: -0.3, marginBottom: 44 }}>
          L&apos;attention juste, au bon moment.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Link href="/register"><button className="btn-primary lg">Ne plus jamais rater un moment →</button></Link>
          <button className="btn-ghost">Découvrir</button>
        </div>
      </section>

      {/* BRIDGE */}
      <div style={{ background: "var(--br1)", borderBottom: "0.5px solid var(--brd)", padding: "28px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
        <p style={{ fontSize: 18, fontWeight: 300, color: "var(--con)", letterSpacing: -0.3, lineHeight: 1.3, maxWidth: 380 }}>
          Vivez pleinement les moments qui comptent.<br />
          <span style={{ color: "var(--terra)" }}>Candice s&apos;occupe du reste.</span>
        </p>
        <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65, maxWidth: 400, borderLeft: "1.5px solid var(--terra)", paddingLeft: 20 }}>
          Candice <strong style={{ color: "var(--con)", fontWeight: 400 }}>apprend, anticipe et agit</strong> — pour que vos relations s&apos;approfondissent et que votre charge mentale disparaisse.
        </p>
      </div>

      {/* CITATIONS */}
      <section aria-label="Témoignages" style={{ background: "var(--iv)", padding: "64px 52px", borderBottom: "0.5px solid var(--iv3)" }}>
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: "var(--terra)", marginBottom: 40, textAlign: "center" }}>
          Ils auraient voulu faire autrement.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "0.5px solid var(--iv3)", borderRadius: 6, overflow: "hidden" }}>
          {[
            { q: "Son anniversaire était passé. Je l'ai su le lendemain matin.", who: "Marie, 34 ans", frein: "Oubli" },
            { q: "Je savais exactement quoi faire. Je n'ai jamais eu le temps de le faire.", who: "Thomas, 41 ans", frein: "Manque de temps" },
            { q: "Je me suis dit que je m'en occuperais ce week-end. Le week-end est passé.", who: "Sophie, 29 ans", frein: "Procrastination" },
            { q: "Je voulais lui faire plaisir. Je n'avais aucune idée de ce qui lui ferait vraiment plaisir.", who: "Lucas, 38 ans", frein: "Pas d'idée" },
          ].map((c, i) => (
            <div key={i} style={{ background: "var(--iv)", padding: "32px 28px", borderRight: i < 3 ? "0.5px solid var(--iv3)" : "none", display: "flex", flexDirection: "column" }}>
              <div aria-hidden="true" style={{ fontSize: 28, fontWeight: 300, color: "var(--terra)", opacity: 0.6, marginBottom: 14, lineHeight: 1 }}>"</div>
              <p style={{ fontSize: 14, fontWeight: 400, color: "var(--txt)", lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{c.q}</p>
              <div style={{ height: "0.5px", background: "var(--iv3)", marginBottom: 14 }} />
              <p style={{ fontSize: 11, fontWeight: 300, color: "var(--txts)" }}>{c.who}</p>
              <p style={{ fontSize: 10, fontWeight: 500, color: "var(--terra)", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{c.frein}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BÉNÉFICES */}
      <section aria-label="Fonctionnalités" style={{ background: "var(--br)", padding: "64px 52px", borderBottom: "0.5px solid var(--brd)" }}>
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: "var(--terra)", marginBottom: 36 }}>Ce que Candice change</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--brd)", border: "0.5px solid var(--brd)", borderRadius: 6, overflow: "hidden" }}>
          {[
            { bg: "var(--br1)", colorH: "var(--con)", colorP: "var(--cond)", colorN: "var(--terra)", num: "01 · Mémoire relationnelle", h: "Candice retient tout. Vous ne perdez plus rien.", p: "Goûts, habitudes, dates importantes, moments partagés — chaque information devient une opportunité de geste juste." },
            { bg: "var(--terra)", colorH: "#fff", colorP: "rgba(255,255,255,0.7)", colorN: "rgba(255,255,255,0.5)", num: "02 · Intelligence contextuelle", h: "La bonne suggestion. Pour la bonne personne. Au bon moment.", p: "Candice analyse le contexte de chacun de vos proches et propose uniquement ce qui a du sens — maintenant." },
            { bg: "var(--iv)", colorH: "var(--txt)", colorP: "var(--txtm)", colorN: "var(--terra)", num: "03 · Exécution complète", h: "Vous approuvez. Candice fait le reste.", p: "Commande, réservation, message rédigé — sans quitter l'application. L'intention reste la vôtre. L'effort, non." },
            { bg: "var(--br2)", colorH: "var(--con)", colorP: "var(--cond)", colorN: "var(--terra)", num: "04 · Zéro charge mentale", h: "Votre cerveau est libéré. Votre présence, entière.", p: "Plus d'anxiété des occasions manquées. Plus de culpabilité. Vos relations s'approfondissent naturellement." },
          ].map((b, i) => (
            <div key={i} style={{ background: b.bg, padding: 36, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: 2, color: b.colorN }}>{b.num}</p>
              <h2 style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.22, letterSpacing: -0.3, color: b.colorH }}>{b.h}</h2>
              <p style={{ fontSize: 12, fontWeight: 300, lineHeight: 1.75, color: b.colorP }}>{b.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCREENS PRODUIT */}
      <section aria-label="Aperçu de l'application" style={{ background: "var(--br1)", padding: "64px 52px", borderBottom: "0.5px solid var(--brd)" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 300, color: "var(--con)", letterSpacing: -0.8, lineHeight: 1.25, marginBottom: 8 }}>
            Tout ce qui compte pour eux,<br />réuni en un seul endroit.
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65 }}>
            Pour ne plus jamais rien oublier. Pour ne plus jamais manquer un moment.
          </p>
        </div>
        <div aria-hidden="true">
          <AppScreenshots />
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "88px 52px", textAlign: "center" }}>
        <h2 style={{ fontSize: 40, fontWeight: 300, color: "var(--con)", letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 14, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
          Prêt à ne plus jamais rater<br /><span style={{ color: "var(--terra)" }}>ce qui compte vraiment ?</span>
        </h2>
        <p style={{ fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.75, marginBottom: 36, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          Candice <strong style={{ color: "var(--con)", fontWeight: 400 }}>apprend, anticipe et agit</strong> — pour que vos relations s&apos;approfondissent et que votre charge mentale disparaisse.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Link href="/register"><button className="btn-primary lg">Commencer avec Candice →</button></Link>
          <Link href="/login"><button className="btn-outline-terra">Se connecter</button></Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "var(--br1)", padding: "20px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid var(--brd)" }}>
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: "rgba(239,231,220,0.18)" }}>Candice ·</span>
        <nav aria-label="Liens légaux" style={{ display: "flex", gap: 24 }}>
          {["Confidentialité", "Conditions générales", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 11, fontWeight: 300, color: "rgba(239,231,220,0.18)" }}>{l}</a>
          ))}
        </nav>
      </footer>

    </main>
  );
}

function AppScreenshots() {
  const AVATARS = ["linear-gradient(135deg,#C47A4A,#8A4020)", "linear-gradient(135deg,#4A7C59,#2A5C39)", "linear-gradient(135deg,#534AB7,#3C3489)", "linear-gradient(135deg,#9A3556,#72243E)", "linear-gradient(135deg,#BA7517,#854F0B)"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
      {/* Phone 1 — Proches */}
      <MiniPhone title="Mes proches" label="Liste de proches">
        {[["SM", "Sophie Martin", "Paris · Amie", "u", "Anniversaire J-4"], ["TL", "Thomas Leroy", "Lyon · Frère", "n", "2 mois sans contact"], ["PL", "Paul Lemaire", "Paris · Ami", "g", "Marathon dimanche"], ["CP", "Claire — Maman", "Bordeaux", "u", "Fête des mères J-8"], ["JR", "Julien R.", "Nantes · Ami", "n", "3 mois sans contact"]].map(([init, name, meta, type, badge], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 8px", background: "var(--br)", border: "0.5px solid var(--br3)", borderRadius: 5, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: AVATARS[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 500, color: "#fff", flexShrink: 0 }}>{init}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 9, fontWeight: 400, color: "var(--con)" }}>{name}</div><div style={{ fontSize: 7, fontWeight: 300, color: "var(--cond)" }}>{meta}</div></div>
            <span style={{ fontSize: 6, letterSpacing: .5, textTransform: "uppercase", padding: "2px 5px", borderRadius: 2, background: type === "u" ? "var(--t2)" : type === "g" ? "var(--green2)" : "var(--conb)", color: type === "u" ? "var(--terra)" : type === "g" ? "var(--green)" : "var(--cond)", border: `0.5px solid ${type === "u" ? "var(--t3)" : type === "g" ? "var(--green3)" : "transparent"}`, whiteSpace: "nowrap" }}>{badge}</span>
          </div>
        ))}
      </MiniPhone>
      {/* Phone 2 — Suggestions */}
      <MiniPhone title="Suggestions" label="Recommandations">
        {[{ who: "Sophie Martin", txt: "Bouquet de pivoines de chez Debeaulieu — livraison le 14 mai.", cta: "Commander", hi: true }, { who: "Paul Lemaire", txt: "Message d'encouragement pour son premier marathon. Prêt à envoyer.", cta: "Envoyer", hi: false }, { who: "Thomas Leroy", txt: "Déjeuner dimanche — créneau commun trouvé.", cta: "Confirmer", hi: false }].map((s, i) => (
          <div key={i} style={{ background: "var(--br)", border: `0.5px solid ${s.hi ? "var(--t3)" : "var(--br3)"}`, borderRadius: 5, padding: 9, marginBottom: 5 }}>
            <p style={{ fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--terra)", marginBottom: 3 }}>{s.who}</p>
            <p style={{ fontSize: 8, fontWeight: 300, color: "var(--cond)", lineHeight: 1.45, marginBottom: 6 }}>{s.txt}</p>
            <button style={{ background: "var(--terra)", color: "#fff", fontSize: 7, padding: "3px 0", borderRadius: 2, border: "none", width: "100%", cursor: "pointer", fontFamily: "var(--font)" }}>{s.cta}</button>
          </div>
        ))}
      </MiniPhone>
      {/* Phone 3 — Souvenirs */}
      <MiniPhone title="Souvenirs" label="Historique & souvenirs">
        {[{ d: "14", m: "Fév", who: "Sophie Martin", txt: "Bouquet de roses envoyé. Elle a adoré.", tag: "Réaction positive" }, { d: "02", m: "Jan", who: "Thomas Leroy", txt: "Message nouvel an. Lu et répondu.", tag: "Message · Lu" }, { d: "25", m: "Nov", who: "Claire", txt: "Dîner anniversaire. Excellent souvenir.", tag: "Expérience · Top" }, { d: "10", m: "Oct", who: "Paul Lemaire", txt: "Whisky Nikka lors de sa rupture.", tag: "Soutien · Impactant" }].map((mem, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, background: "var(--br)", border: "0.5px solid var(--br3)", borderRadius: 5, padding: 8, marginBottom: 4 }}>
            <div style={{ background: "var(--br2)", border: "0.5px solid var(--br3)", borderRadius: 3, padding: "3px 5px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: "var(--con)", lineHeight: 1 }}>{mem.d}</div>
              <div style={{ fontSize: 6, color: "var(--cond)", textTransform: "uppercase", letterSpacing: 1 }}>{mem.m}</div>
            </div>
            <div>
              <p style={{ fontSize: 7, fontWeight: 500, color: "var(--terra)", marginBottom: 2 }}>{mem.who}</p>
              <p style={{ fontSize: 8, fontWeight: 300, color: "var(--cond)", lineHeight: 1.4 }}>{mem.txt}</p>
              <span style={{ display: "inline-block", marginTop: 3, fontSize: 6, letterSpacing: 1, textTransform: "uppercase", padding: "1px 5px", borderRadius: 2, background: "var(--t1)", color: "var(--terra)" }}>{mem.tag}</span>
            </div>
          </div>
        ))}
      </MiniPhone>
      {/* Phone 4 — Fiche */}
      <MiniPhone title="Sophie Martin" label="Fiche · KPIs · Matching">
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#C47A4A,#8A4020)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 500, color: "#fff", margin: "0 auto 5px" }}>SM</div>
        <p style={{ textAlign: "center", fontSize: 9, fontWeight: 500, color: "var(--con)", marginBottom: 1 }}>Sophie Martin</p>
        <p style={{ textAlign: "center", fontSize: 7, fontWeight: 300, color: "var(--cond)", marginBottom: 8 }}>Amie proche · Paris</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
          {[["12", "Gestes"], ["94%", "Satisfaction"], ["J-4", "Anniversaire"], ["8", "Infos"]].map(([v, l]) => (
            <div key={l} style={{ background: "var(--br)", border: "0.5px solid var(--br3)", borderRadius: 4, padding: 5, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 300, color: "var(--terra)", letterSpacing: -.5, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 6, fontWeight: 300, color: "var(--cond)", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--br)", border: "0.5px solid var(--br3)", borderRadius: 4, padding: 7 }}>
          <p style={{ fontSize: 6, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--terra)", marginBottom: 6 }}>Profil de réception</p>
          {[["Cadeau", 85], ["Expé.", 72], ["Mots", 60], ["Geste", 45]].map(([l, v]) => (
            <div key={l as string} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              <span style={{ fontSize: 6, color: "var(--cond)", width: 28, textAlign: "right", flexShrink: 0 }}>{l}</span>
              <div style={{ flex: 1, height: 3, background: "var(--br3)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${v}%`, height: "100%", background: "var(--terra)", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 6, color: "var(--cond)", width: 16, textAlign: "right", flexShrink: 0 }}>{v}%</span>
            </div>
          ))}
        </div>
      </MiniPhone>
    </div>
  );
}

function MiniPhone({ title, label, children }: { title: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--br)", border: "0.5px solid var(--br3)", borderRadius: 18, padding: 8 }}>
      <div style={{ width: 32, height: 3, background: "var(--br3)", borderRadius: 2, margin: "0 auto 7px" }} />
      <div style={{ background: "var(--br1)", borderRadius: 12, padding: 9, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 7, borderBottom: "0.5px solid var(--brd)" }}>
          <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", color: "var(--con)" }}>{title}</span>
          <span style={{ fontSize: 7, color: "var(--terra)" }}>+ Ajouter</span>
        </div>
        {children}
      </div>
      <p style={{ textAlign: "center", marginTop: 8, fontSize: 10, fontWeight: 300, color: "var(--cond)" }}>{label}</p>
    </div>
  );
}
