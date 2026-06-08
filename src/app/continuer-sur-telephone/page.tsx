"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import Wordmark from "@/components/presence/Wordmark";

export default function ContinuerSurTelephonePage() {
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

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

      <div style={{
        maxWidth: 440,
        margin: "0 auto",
        padding: "80px 24px 88px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300,
          fontSize: "clamp(24px, 4vw, 30px)",
          letterSpacing: "-.018em",
          lineHeight: 1.25,
          color: "var(--pine)",
          marginBottom: 16,
        } as React.CSSProperties}>
          Continue sur ton téléphone
        </h1>

        <p style={{
          fontSize: 15,
          fontWeight: 300,
          color: "rgba(26,26,26,.6)",
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          Candice s&apos;ouvre sur mobile. Scanne ce code depuis ton téléphone pour accéder à ton espace.
        </p>

        {appUrl && (
          <div style={{
            background: "#fff",
            padding: 24,
            borderRadius: 14,
            display: "inline-block",
            border: "0.5px solid rgba(23,62,49,.1)",
            marginBottom: 28,
          }}>
            <QRCode value={appUrl} size={180} fgColor="var(--pine)" bgColor="#fff" />
          </div>
        )}

        <p style={{
          fontSize: 12,
          fontWeight: 300,
          color: "rgba(26,26,26,.4)",
          lineHeight: 1.6,
        }}>
          Ou tape <strong style={{ fontWeight: 400, color: "rgba(26,26,26,.55)" }}>{appUrl}</strong> dans ton navigateur mobile.
        </p>
      </div>
    </div>
  );
}
