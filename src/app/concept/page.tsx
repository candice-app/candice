import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import MarketingNav from "@/components/layout/MarketingNav";
import MarketingFooter from "@/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Candice — Le concept",
  description:
    "Candice vous aide à mieux gérer les personnes qui comptent. Profils intelligents, mémoire relationnelle, recommandations personnalisées et exécution assistée — un copilote relationnel premium.",
};

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const DEEP = "#2C1A0E";
const WARM = "#F5EDE3";
const BORDER = "rgba(30,18,8,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

export default function ConceptPage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <style>{`
        html { scroll-behavior: smooth; }

        /* ── Mobile base ── */
        .cpt-hero    { padding: 72px 20px 64px; }
        .cpt-section { padding: 64px 20px; }
        .cpt-grid-4  { grid-template-columns: 1fr !important; gap: 40px !important; }
        .cpt-nav     { padding: 0 20px !important; }
        .cpt-nav-links { display: none !important; }

        .cpt-cta-group { flex-direction: column !important; gap: 10px !important; }
        .cpt-cta-btn   { width: 100% !important; box-sizing: border-box !important; text-align: center !important; display: block !important; }

        .cpt-exec-cols { flex-direction: column !important; gap: 48px !important; }

        /* ── Tablet ── */
        @media (min-width: 640px) {
          .cpt-grid-4  { grid-template-columns: 1fr 1fr !important; gap: 40px 48px !important; }
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .cpt-hero    { padding: 120px 64px 96px; }
          .cpt-section { padding: 96px 64px; }
          .cpt-grid-4  { grid-template-columns: repeat(4, 1fr) !important; gap: 40px 48px !important; }
          .cpt-nav     { padding: 0 52px !important; }
          .cpt-nav-links { display: flex !important; }

          .cpt-cta-group { flex-direction: row !important; gap: 12px !important; }
          .cpt-cta-btn   { width: auto !important; display: inline-block !important; }

          .cpt-exec-cols { flex-direction: row !important; gap: 64px !important; align-items: flex-start !important; }
        }
      `}</style>

      <MarketingNav />

      {/* ── S1 — HERO ── */}
      <section id="main-content" className="cpt-hero" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 36 }}>Concept</p>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400, color: CON, lineHeight: 1.1, letterSpacing: -1.5, margin: 0 }}>
              <span style={{ display: "block", fontSize: "clamp(40px, 8vw, 80px)" }}>Le travail.</span>
              <span style={{ display: "block", fontSize: "clamp(40px, 8vw, 80px)" }}>La famille.</span>
              <span style={{ display: "block", fontSize: "clamp(40px, 8vw, 80px)" }}>Les amis.</span>
              <span style={{ display: "block", fontSize: "clamp(40px, 8vw, 80px)" }}>Le quotidien.</span>
            </h1>
          </div>
          <p style={{ fontFamily: PLAYFAIR, fontSize: "clamp(17px, 2.5vw, 22px)", fontWeight: 400, color: CON, lineHeight: 1.4, marginBottom: 20, maxWidth: 600 }}>
            Candice vous aide à ne plus laisser les attentions importantes se perdre au milieu du reste.
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.8, marginBottom: 44, maxWidth: 580 }}>
            Profils intelligents, mémoire relationnelle, recommandations personnalisées et exécution assistée&nbsp;: Candice vous aide à mieux gérer les personnes qui comptent — avec moins de charge mentale, moins d&apos;oublis et plus d&apos;attentions qui tombent juste.
          </p>
          <div className="cpt-cta-group" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <button className="cpt-cta-btn" style={{ background: TERRA, color: BG, border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
                Commencer avec Candice
              </button>
            </Link>
            <a href="#comment-ca-marche" style={{ textDecoration: "none" }}>
              <button className="cpt-cta-btn" style={{ background: "transparent", color: CON, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 32px", fontSize: 14, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
                Voir comment Candice fonctionne
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── S2 — LE VRAI PROBLÈME ── */}
      <section className="cpt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 40 }}>
            Les intentions existent déjà.
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 24 }}>
            Le problème n&apos;est pas de ne pas penser aux autres.<br />
            Le problème, c&apos;est de réussir à tout gérer en même temps.
          </p>
          <div style={{ margin: "32px 0", display: "flex", flexDirection: "column", gap: 2 }}>
            {["Le travail.", "Les enfants.", "Les amis.", "Le couple.", "La famille.", "Le quotidien."].map((line) => (
              <p key={line} style={{ fontFamily: PLAYFAIR, fontSize: 20, fontWeight: 400, fontStyle: "italic", color: CON, margin: 0, lineHeight: 1.7 }}>{line}</p>
            ))}
          </div>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 40 }}>
            Et au milieu de tout ça&nbsp;: les idées se perdent. Les attentions arrivent trop tard. Les rappels s&apos;accumulent. Les captures d&apos;écran disparaissent. Les bonnes intentions restent dans la tête… puis passent.
          </p>
          <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 16, fontWeight: 400, color: COND, lineHeight: 1.75, borderTop: `0.5px solid ${BORDER}`, paddingTop: 32 }}>
            Candice devient l&apos;endroit où ces informations restent organisées, utiles et vivantes.
          </p>
        </div>
      </section>

      {/* ── S3 — CE QU'EST CANDICE (scènes de vie) ── */}
      <section id="comment-ca-marche" className="cpt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ maxWidth: 640, marginBottom: 64 }}>
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 16 }}>
              Un copilote relationnel intelligent.
            </h2>
            <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.8, marginBottom: 10 }}>
              Candice centralise ce qui compte pour les personnes importantes de votre vie&nbsp;: leurs goûts, leurs habitudes, leurs envies, les moments qu&apos;elles traversent et les attentions qui les touchent vraiment.
            </p>
            <p style={{ fontSize: 13, fontWeight: 300, color: COND, lineHeight: 1.75, opacity: 0.75 }}>
              Plus vous utilisez Candice, plus elle comprend le contexte relationnel autour de vous.
            </p>
          </div>

          <div className="cpt-grid-4" style={{ display: "grid" }}>
            {[
              {
                label: "Une photo",
                text: "Votre femme regarde une robe en vitrine. Vous prenez une photo. Candice l'ajoute à son profil. Deux mois plus tard, au bon moment, elle vous la repropose.",
              },
              {
                label: "Une conversation",
                text: "Votre mère parle souvent d'un restaurant qu'elle adore. Candice le retient. Quelques semaines plus tard, elle vous suggère une réservation pour son anniversaire.",
              },
              {
                label: "Un moment important",
                text: "Vous notez simplement : 'Paul traverse une période difficile.' Candice s'en souvient. Et vous aide à agir au bon moment.",
              },
              {
                label: "Une mémoire partagée",
                text: "Votre grand-mère raconte ses habitudes à voix haute. Vous complétez sa fiche avec elle. Une fois créée, elle peut ensuite être partagée avec les proches qu'elle choisit.",
              },
            ].map((bloc) => (
              <div key={bloc.label} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: 2.5, textTransform: "uppercase", color: TERRA, margin: 0 }}>{bloc.label}</p>
                <div style={{ width: 24, height: 1, background: TERRA, opacity: 0.4 }} />
                <p style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.85, margin: 0 }}>{bloc.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── S4 — COMMENT CANDICE DEVIENT PLUS PRÉCISE ── */}
      <section className="cpt-section" style={{ background: BG, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 32 }}>
            Candice commence à aider immédiatement.
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 20 }}>
            Dès les premières informations, Candice peut déjà proposer des attentions plus pertinentes qu&apos;une idée générique.
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 20 }}>
            Puis chaque détail enrichit sa compréhension&nbsp;: une habitude, une envie, une conversation, une photo, une attention réussie, un changement de vie.
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 48 }}>
            Au fil du temps, Candice devient plus précise, plus personnelle et plus utile.
          </p>
          <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 400, color: CON, lineHeight: 1.45, borderLeft: `2px solid ${TERRA}`, paddingLeft: 24 }}>
            Comme un deuxième cerveau relationnel&nbsp;: Candice retient ce que vous n&apos;avez plus besoin de garder en tête.
          </p>
        </div>
      </section>

      {/* ── S5 — L'EXÉCUTION ── */}
      <section className="cpt-section" style={{ background: WARM, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div className="cpt-exec-cols" style={{ display: "flex" }}>
            {/* Left — texte */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 24 }}>
                Candice ne se contente pas de suggérer.
              </h2>
              <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 36 }}>
                L&apos;objectif n&apos;est pas seulement de ne rien oublier. L&apos;objectif est de réduire la friction entre ce que vous voulez faire… et ce que vous faites réellement.
              </p>
              <div style={{ marginBottom: 36, display: "flex", flexDirection: "column", gap: 6 }}>
                {["Message.", "Idée cadeau.", "Réservation.", "Livraison.", "Rappel au bon moment."].map((line) => (
                  <p key={line} style={{ fontSize: 14, fontWeight: 400, color: CON, margin: 0, lineHeight: 1.6 }}>— {line}</p>
                ))}
              </div>
              <p style={{ fontFamily: PLAYFAIR, fontSize: "clamp(18px, 2vw, 22px)", fontWeight: 400, color: CON, lineHeight: 1.4, marginBottom: 36 }}>
                Candice prépare l&apos;action. Vous validez.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  "Moins de charge mentale.",
                  "Moins d'oublis.",
                  "Moins d'hésitations.",
                  "Moins d'erreurs.",
                  "Plus d'attentions qui tombent juste.",
                ].map((line) => (
                  <p key={line} style={{ fontSize: 13, fontWeight: 300, color: COND, margin: 0, lineHeight: 1.65 }}>{line}</p>
                ))}
              </div>
            </div>

            {/* Right — mockup conversationnel */}
            <div style={{ flexShrink: 0, width: "clamp(240px, 35%, 320px)" }}>
              <ConversationMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── S6 — L'AUTHENTICITÉ ── */}
      <section className="cpt-section" style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: CON, marginBottom: 32 }}>
            L&apos;attention reste la vôtre.
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 20 }}>
            L&apos;authenticité, ce n&apos;est pas l&apos;exécution spontanée. C&apos;est la connaissance de l&apos;autre et l&apos;intention de lui faire plaisir.
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85, marginBottom: 40 }}>
            Un bouquet générique acheté à la dernière minute est souvent moins personnel qu&apos;une attention choisie parce que vous savez que votre sœur adore les pivoines.
          </p>
          <div style={{ borderLeft: `2px solid ${TERRA}`, paddingLeft: 24, marginBottom: 40, display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 300, color: CON, lineHeight: 1.8, margin: 0 }}>C&apos;est vous qui construisez les profils.</p>
            <p style={{ fontSize: 14, fontWeight: 300, color: CON, lineHeight: 1.8, margin: 0 }}>C&apos;est vous qui donnez les informations.</p>
            <p style={{ fontSize: 14, fontWeight: 300, color: CON, lineHeight: 1.8, margin: 0 }}>C&apos;est vous qui voulez faire plaisir.</p>
          </div>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.85 }}>
            Candice vous aide simplement à ne pas perdre les bonnes intentions en route.
          </p>
        </div>
      </section>

      {/* ── S7 — CONFIDENTIALITÉ ── */}
      <section className="cpt-section" style={{ background: DEEP, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.8, color: BG, marginBottom: 32 }}>
            Vous pouvez être honnête. Candice garde les détails.
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: "rgba(250,247,242,0.7)", lineHeight: 1.85, marginBottom: 20 }}>
            Vos réponses détaillées restent privées entre vous et Candice. Si vous partagez votre profil, vos proches ne voient pas vos mots exacts, vos réponses personnelles ou vos confidences.
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: "rgba(250,247,242,0.7)", lineHeight: 1.85, marginBottom: 40 }}>
            Candice transforme ces informations en une compréhension utile&nbsp;: votre façon de recevoir les attentions, ce qui vous touche vraiment et les gestes qui comptent pour vous.
          </p>
          <p style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 16, fontWeight: 400, color: "rgba(250,247,242,0.65)", lineHeight: 1.75, borderTop: "0.5px solid rgba(250,247,242,0.15)", paddingTop: 32, marginBottom: 24 }}>
            Plus vous êtes précis, plus Candice peut aider vos proches à viser juste — sans jamais exposer ce que vous avez confié en détail.
          </p>
          <Link href="/confidentialite" style={{ fontSize: 12, color: TERRA, textDecoration: "none", fontWeight: 400 }}>
            Notre engagement confidentialité →
          </Link>
        </div>
      </section>

      {/* ── S8 — CTA FINAL ── */}
      <section className="cpt-section" style={{ background: BG, textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 400, color: CON, lineHeight: 1.15, letterSpacing: -1.2, marginBottom: 20 }}>
            Les bonnes intentions existent déjà.<br />Candice aide à les transformer en actions.
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: COND, lineHeight: 1.8, marginBottom: 44, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Dans une vie saturée, les attentions importantes se perdent facilement entre deux urgences. Candice les organise, les retient et vous aide à agir au bon moment.
          </p>
          <div className="cpt-cta-group" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <button className="cpt-cta-btn" style={{ background: TERRA, color: BG, border: "none", borderRadius: 8, padding: "15px 36px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
                Commencer avec Candice
              </button>
            </Link>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <button className="cpt-cta-btn" style={{ background: "transparent", color: CON, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "15px 36px", fontSize: 15, fontWeight: 300, cursor: "pointer", fontFamily: DM }}>
                Se connecter
              </button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

function ConversationMockup() {
  const C_BG = "#FAF7F2";
  const C_WHITE = "#FFFFFF";
  const C_CON = "#1E1208";
  const C_COND = "#7A5E44";
  const C_TERRA = "#C47A4A";
  const C_BORDER = "rgba(30,18,8,0.1)";

  return (
    <div style={{ background: C_BG, border: `0.5px solid ${C_BORDER}`, borderRadius: 20, padding: 10, boxShadow: "0 4px 24px rgba(30,18,8,0.08)" }}>
      {/* Notch */}
      <div style={{ width: 28, height: 3, background: C_BORDER, borderRadius: 2, margin: "0 auto 10px" }} />
      <div style={{ background: C_WHITE, borderRadius: 12, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: `0.5px solid ${C_BORDER}` }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: C_TERRA, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 600, color: "#fff", flexShrink: 0 }}>C</div>
          <p style={{ fontSize: 9, fontWeight: 500, color: C_CON, margin: 0 }}>Candice</p>
          <span style={{ marginLeft: "auto", fontSize: 6, color: C_COND, opacity: 0.5 }}>il y a 2 min</span>
        </div>

        {/* Message */}
        <div style={{ padding: "14px 12px 10px" }}>
          <div style={{ background: C_BG, borderRadius: "4px 12px 12px 12px", padding: "10px 12px", border: `0.5px solid ${C_BORDER}`, marginBottom: 14 }}>
            <p style={{ fontSize: 8, fontWeight: 300, color: C_CON, lineHeight: 1.6, margin: 0 }}>
              Pour l&apos;anniversaire de Sophie samedi, je propose un brunch chez Holybelly. Réservation prête pour deux à 11h30.
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ flex: 1, background: C_TERRA, color: "#fff", fontSize: 8, fontWeight: 500, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Valider
            </button>
            <button style={{ flex: 1, background: "transparent", color: C_CON, fontSize: 8, fontWeight: 300, padding: "8px 0", borderRadius: 6, border: `0.5px solid ${C_BORDER}`, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Modifier
            </button>
          </div>
        </div>

        {/* Typing indicator */}
        <div style={{ padding: "0 12px 12px", display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: C_TERRA, opacity: 0.4 }} />
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: C_TERRA, opacity: 0.25 }} />
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: C_TERRA, opacity: 0.15 }} />
          <p style={{ fontSize: 7, fontWeight: 300, color: C_COND, margin: 0, marginLeft: 4 }}>Candice prépare la suite…</p>
        </div>
      </div>
    </div>
  );
}
