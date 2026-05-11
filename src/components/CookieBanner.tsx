"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie_consent";

export type ConsentValue = "accepted" | "refused" | null;

export function getConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(STORAGE_KEY) as ConsentValue) ?? null;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const handleConsent = (value: "accepted" | "refused") => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      aria-modal="false"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "#FFFFFF",
        borderTop: "1px solid #E8C4A0",
        boxShadow: "0 -4px 24px rgba(44,26,14,0.08)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      {/* Text */}
      <div style={{ flex: 1, minWidth: 260 }}>
        <p style={{ fontSize: 13, fontWeight: 400, color: "#2C1A0E", marginBottom: 4, lineHeight: 1.5 }}>
          🍪 Candice utilise des cookies pour faire fonctionner l&apos;application et, si vous l&apos;acceptez, pour analyser l&apos;usage de façon anonyme.
        </p>
        <p style={{ fontSize: 11, fontWeight: 300, color: "#9E7B5A", lineHeight: 1.5 }}>
          Cookies nécessaires toujours actifs.{" "}
          <Link href="/confidentialite" style={{ color: "#C47A4A", textDecoration: "underline", textUnderlineOffset: 2 }}>
            Politique de confidentialité
          </Link>
        </p>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexShrink: 0,
          flexWrap: "wrap",
          width: "100%",
          maxWidth: 320,
        }}
      >
        <button
          onClick={() => handleConsent("refused")}
          style={{
            flex: 1,
            background: "transparent",
            color: "#9E7B5A",
            border: "1px solid #E8C4A0",
            borderRadius: 6,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 400,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          Refuser
        </button>
        <button
          onClick={() => handleConsent("accepted")}
          style={{
            flex: 1,
            background: "#C47A4A",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          Tout accepter
        </button>
      </div>

      <style>{`
        @media (max-width: 600px) {
          [role="dialog"][aria-label="Gestion des cookies"] {
            flex-direction: column;
            align-items: stretch;
          }
          [role="dialog"][aria-label="Gestion des cookies"] > div:last-child {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
