"use client";

import { useState } from "react";
import Link from "next/link";
import SharedForm from "./SharedForm";

type Screen = "landing" | "account" | "form" | "done";

const PLAYFAIR: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontWeight: 400,
};

const PAGE_WRAP: React.CSSProperties = {
  minHeight: "100vh",
  background: "#FAF7F2",
  color: "#1E1208",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const HEADER: React.CSSProperties = {
  padding: "16px 24px",
  borderBottom: "0.5px solid rgba(30,18,8,0.1)",
  display: "flex",
  alignItems: "center",
};

const INNER: React.CSSProperties = {
  maxWidth: 540,
  margin: "0 auto",
  padding: "40px 20px 80px",
};

// ─── Screen 1: Landing ────────────────────────────────────────────────────────

function LandingScreen({
  senderName,
  onStart,
  onChat,
  toastVisible,
}: {
  senderName: string;
  onStart: () => void;
  onChat: () => void;
  toastVisible: boolean;
}) {
  return (
    <div style={PAGE_WRAP}>
      <header style={HEADER}>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: "#C47A4A" }}>
          candice
        </span>
      </header>

      <div style={INNER}>
        {/* Warm intro */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ ...PLAYFAIR, fontSize: 28, lineHeight: 1.25, color: "#1E1208", marginBottom: 16 }}>
            {senderName} veut mieux te connaître pour t&apos;offrir les attentions qui te ressemblent vraiment.
          </h1>
          <p style={{ fontSize: 16, fontWeight: 300, color: "#7A5E44", lineHeight: 1.7 }}>
            Réponds à quelques questions sur toi — tes goûts, tes envies, ce qui te touche vraiment. Plus tu es honnête(e), plus les attentions seront justes.
          </p>
        </div>

        {/* Confidentiality block */}
        <div style={{ background: "#2C1A0E", borderRadius: 12, padding: "22px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
            <p style={{ ...PLAYFAIR, fontSize: 16, color: "#FAF7F2", lineHeight: 1.35 }}>
              Tes réponses restent 100% confidentielles
            </p>
          </div>
          <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.75)", lineHeight: 1.7 }}>
            {senderName} ne lira jamais tes réponses. Candice les analyse en silence pour personnaliser les attentions — jamais tes mots exacts ne seront partagés.
          </p>
        </div>

        {/* Time indicator */}
        <p style={{ fontSize: 13, fontWeight: 300, color: "#A08060", marginBottom: 32, textAlign: "center" }}>
          ⏱ Environ 10 minutes · Sauvegarde automatique
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={onStart}
            style={{ background: "#C47A4A", color: "#fff", border: "none", borderRadius: 6, padding: "16px 24px", fontSize: 15, fontWeight: 500, cursor: "pointer", width: "100%", letterSpacing: 0.2 }}
          >
            Je réponds par écrit →
          </button>
          <button
            onClick={onChat}
            style={{ background: "transparent", color: "#C47A4A", border: "1.5px solid #C47A4A", borderRadius: 6, padding: "14px 24px", fontSize: 14, fontWeight: 400, cursor: "pointer", width: "100%" }}
          >
            💬 Je préfère en discuter avec Candice
          </button>
        </div>

        {/* Coming soon toast */}
        {toastVisible && (
          <div style={{ marginTop: 16, background: "#1E1208", color: "#FAF7F2", borderRadius: 8, padding: "12px 16px", fontSize: 13, fontWeight: 300, textAlign: "center" }}>
            Mode conversation bientôt disponible !
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screen 2: Account incentive ─────────────────────────────────────────────

function AccountScreen({ token, onSkip }: { token: string; onSkip: () => void }) {
  const BENEFITS = [
    "Retrouve tes réponses si tu dois t'arrêter en chemin",
    "Découvre l'analyse de ta personnalité une fois ta fiche complète",
    "Ajoute tes propres proches et reçois toi aussi des attentions personnalisées",
    "C'est gratuit, sans engagement, sans carte bancaire",
  ];

  return (
    <div style={PAGE_WRAP}>
      <header style={HEADER}>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: "#C47A4A" }}>
          candice
        </span>
      </header>

      <div style={INNER}>
        <h1 style={{ ...PLAYFAIR, fontSize: 24, lineHeight: 1.3, color: "#1E1208", marginBottom: 8 }}>
          Crée ton compte gratuit — c&apos;est 30 secondes.
        </h1>
        <p style={{ fontSize: 14, fontWeight: 300, color: "#7A5E44", lineHeight: 1.6, marginBottom: 28 }}>
          Ça te permettra de reprendre ta fiche plus tard et de voir ton profil complet.
        </p>

        {/* Benefits */}
        <div style={{ background: "#fff", border: "1px solid rgba(196,122,74,0.25)", borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "#C47A4A", fontWeight: 600, fontSize: 15, flexShrink: 0, marginTop: 1 }}>✦</span>
                <p style={{ fontSize: 14, fontWeight: 300, color: "#1E1208", lineHeight: 1.6, margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <Link href={`/register?redirect=/profil-partage/${token}`} style={{ width: "100%" }}>
            <button style={{ background: "#C47A4A", color: "#fff", border: "none", borderRadius: 6, padding: "16px 24px", fontSize: 15, fontWeight: 500, cursor: "pointer", width: "100%", letterSpacing: 0.2 }}>
              Créer mon compte gratuit →
            </button>
          </Link>
          <button
            onClick={onSkip}
            style={{ background: "none", border: "none", color: "#C47A4A", fontSize: 13, fontWeight: 400, cursor: "pointer", padding: "4px 8px", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Continuer sans compte →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 4: Done ───────────────────────────────────────────────────────────

function DoneScreen({ senderName, hasAccount }: { senderName: string; hasAccount: boolean }) {
  return (
    <div style={PAGE_WRAP}>
      <header style={HEADER}>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: "#C47A4A" }}>
          candice
        </span>
      </header>

      <div style={{ ...INNER, textAlign: "center" }}>
        <p style={{ fontSize: 48, marginBottom: 20 }}>🎉</p>
        <h1 style={{ ...PLAYFAIR, fontSize: 28, lineHeight: 1.25, color: "#1E1208", marginBottom: 12 }}>
          Merci ! Ta fiche est enregistrée.
        </h1>
        <p style={{ fontSize: 16, fontWeight: 300, color: "#7A5E44", lineHeight: 1.65, marginBottom: 40 }}>
          {senderName} pourra maintenant te faire des attentions vraiment personnalisées.
        </p>

        {!hasAccount && (
          <div style={{ background: "#fff", border: "1px solid rgba(196,122,74,0.25)", borderRadius: 12, padding: "28px 24px", textAlign: "left" }}>
            <p style={{ ...PLAYFAIR, fontSize: 18, color: "#1E1208", marginBottom: 8, lineHeight: 1.3 }}>
              Veux-tu voir l&apos;analyse de ta personnalité que Candice a établie ?
            </p>
            <p style={{ fontSize: 14, fontWeight: 300, color: "#7A5E44", lineHeight: 1.65, marginBottom: 20 }}>
              Et permettre à tes proches de faire pareil pour toi ? Crée ton compte gratuit — tes réponses y seront automatiquement associées.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <Link href="/register" style={{ width: "100%" }}>
                <button style={{ background: "#C47A4A", color: "#fff", border: "none", borderRadius: 6, padding: "14px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" }}>
                  Créer mon compte pour voir mon profil →
                </button>
              </Link>
              <Link
                href="https://candice.app"
                style={{ fontSize: 12, fontWeight: 300, color: "#A08060", textDecoration: "none" }}
              >
                Non merci
              </Link>
            </div>
          </div>
        )}

        {hasAccount && (
          <Link href="/dashboard">
            <button style={{ background: "#C47A4A", color: "#fff", border: "none", borderRadius: 6, padding: "14px 32px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Aller sur mon tableau de bord →
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Flow manager ─────────────────────────────────────────────────────────────

export default function SharedProfileFlow({
  token,
  senderName,
}: {
  token: string;
  senderName: string;
}) {
  const [screen, setScreen] = useState<Screen>("landing");
  const [toastVisible, setToastVisible] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);

  const showComingSoonToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  if (screen === "landing") {
    return (
      <LandingScreen
        senderName={senderName}
        onStart={() => setScreen("account")}
        onChat={showComingSoonToast}
        toastVisible={toastVisible}
      />
    );
  }

  if (screen === "account") {
    return <AccountScreen token={token} onSkip={() => setScreen("form")} />;
  }

  if (screen === "form") {
    return (
      <SharedForm
        token={token}
        senderName={senderName}
        onDone={(wasAuthenticated) => {
          setHasAccount(wasAuthenticated);
          setScreen("done");
        }}
      />
    );
  }

  return <DoneScreen senderName={senderName} hasAccount={hasAccount} />;
}
