"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/presence/Wordmark";

export default function LandingInvite({
  token,
  piloteFirstName,
}: {
  token: string;
  piloteFirstName: string;
}) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const P = piloteFirstName;

  return (
    <div style={{
      minHeight: "100svh",
      background: "var(--canvas)",
      fontFamily: "var(--font-sans)",
      color: "var(--ink)",
    }}>
      <header style={{ padding: "20px 24px", borderBottom: "0.5px solid rgba(23,62,49,.1)" }}>
        <Wordmark href="/" />
      </header>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "52px 24px 88px" }}>

        {/* En-tête */}
        <h1 style={{
          fontFamily: "var(--font-serif)", fontWeight: 300,
          fontSize: "clamp(26px, 5.5vw, 34px)",
          color: "var(--ink)", letterSpacing: "-.022em", lineHeight: 1.2,
          marginBottom: 14,
        } as React.CSSProperties}>
          {P} veut apprendre à te faire vraiment plaisir.
        </h1>

        {/* Sous-titre */}
        <p style={{
          fontSize: 16, fontWeight: 300,
          color: "rgba(26,26,26,.6)", lineHeight: 1.7,
          marginBottom: 36,
        }}>
          Pas un cadeau au hasard, une fois par an. Les bonnes attentions, au bon moment — celles qui te ressemblent.
        </p>

        {/* Corps */}
        <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)", lineHeight: 1.75, marginBottom: 10 }}>
          {P} utilise Candice pour mieux prendre soin des gens qui comptent. Là, c&apos;est à toi que {P} pense.
        </p>
        <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)", lineHeight: 1.75, marginBottom: 32 }}>
          Ce questionnaire, c&apos;est ta façon de lui dire — sans avoir à le dire — ce qui te touche, ce qui te fait
          plaisir, et ce qu&apos;il vaut mieux éviter. {P} n&apos;en verra qu&apos;une version résumée : les détails
          restent entre Candice et toi.
        </p>

        {/* Ce que tu y gagnes */}
        <div style={{
          background: "var(--white)",
          border: "0.5px solid rgba(23,62,49,.12)",
          borderRadius: 12,
          padding: "20px 22px",
          marginBottom: 32,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 500, color: "var(--pine)",
            textTransform: "uppercase", letterSpacing: ".1em",
            marginBottom: 12,
          }}>
            Ce que tu y gagnes
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)", lineHeight: 1.7, marginBottom: 10 }}>
            Et ce n&apos;est pas qu&apos;un cadeau pour {P}. En le remplissant, tu repars avec :
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              `ta propre fiche Candice, rien que pour toi ;`,
              `ce que tu découvres sur votre façon de fonctionner, ${P} et toi ;`,
              `un mois pour essayer Candice et mieux penser, toi aussi, à ceux que tu aimes.`,
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "var(--pine)", flexShrink: 0, fontSize: 15, lineHeight: "1.6" }}>•</span>
                <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)", lineHeight: 1.6, margin: 0 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pratique */}
        <p style={{
          fontSize: 13, fontWeight: 300, color: "rgba(26,26,26,.5)",
          lineHeight: 1.65, marginBottom: 36, textAlign: "center",
        }}>
          Compte une vingtaine de minutes, au calme. Tu ne le rempliras qu&apos;une fois dans ta vie — autant le faire
          bien. Candice t&apos;accompagne, une question à la fois.
        </p>

        {/* CTA */}
        <button
          onClick={() => accepted && router.push(`/register?invite_token=${encodeURIComponent(token)}`)}
          disabled={!accepted}
          style={{
            width: "100%",
            background: accepted ? "var(--pine)" : "rgba(23,62,49,.2)",
            color: "var(--canvas)",
            border: "none",
            borderRadius: 10,
            padding: "16px 24px",
            fontSize: 16,
            fontWeight: 500,
            cursor: accepted ? "pointer" : "not-allowed",
            fontFamily: "var(--font-sans)",
            marginBottom: 16,
            transition: "background .2s",
          }}
        >
          Créer mon compte et commencer
        </button>

        {/* Checkbox consentement */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
          <span
            onClick={() => setAccepted(v => !v)}
            style={{
              width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2,
              border: accepted ? "1.5px solid var(--pine)" : "1px solid rgba(23,62,49,.3)",
              background: accepted ? "var(--pine)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s, border .15s",
              cursor: "pointer",
            }}
          >
            {accepted && (
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                <path d="M1 4L4 7L10 1" stroke="#FDFDFB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span style={{ fontSize: 13, fontWeight: 300, color: "var(--ink)", lineHeight: 1.55 }}>
            J&apos;accepte les conditions et je démarre mon mois d&apos;essai gratuit — sans carte bancaire, sans
            engagement.
          </span>
        </label>

      </div>
    </div>
  );
}
