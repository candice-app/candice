"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

const BG = "#FAF7F2";
const TERRA = "#C47A4A";
const CON = "#2C1A0E";
const BORDER = "rgba(44,26,14,0.08)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";

const NAV_LINKS = [
  { href: "/concept", label: "Le concept" },
  { href: "/fonctionnement", label: "Fonctionnement" },
  { href: "/offre", label: "Tarifs" },
];

export default function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        .mkt-nav { height: 64px; padding: 0 20px; }
        .mkt-nav-links { display: none; }
        .mkt-hamburger { display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; padding: 4px; }
        .mkt-cta-desktop { display: none; }
        @media (min-width: 768px) {
          .mkt-nav { height: 80px; padding: 0 52px; }
          .mkt-nav-links { display: flex; align-items: center; gap: 32px; }
          .mkt-hamburger { display: none; }
          .mkt-cta-desktop { display: flex; }
        }
      `}</style>

      <nav
        className="mkt-nav"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `0.5px solid ${BORDER}`,
          background: BG,
          position: "sticky",
          top: 0,
          zIndex: 100,
          fontFamily: DM,
        }}
      >
        {/* Logo */}
        <Logo size="lg" href="/" />

        {/* Desktop center links */}
        <div className="mkt-nav-links">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: 16,
                  fontWeight: active ? 400 : 300,
                  color: active ? TERRA : CON,
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Desktop right CTAs */}
        <div className="mkt-cta-desktop" style={{ gap: 12, alignItems: "center" }}>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "transparent",
                color: TERRA,
                border: `1.5px solid ${TERRA}`,
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 16,
                fontWeight: 400,
                cursor: "pointer",
                fontFamily: DM,
                height: 48,
                lineHeight: 1,
                transition: "opacity 0.15s",
              }}
            >
              Se connecter
            </button>
          </Link>
          <Link href="/register" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: TERRA,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 16,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: DM,
                height: 48,
                lineHeight: 1,
                transition: "opacity 0.15s",
              }}
            >
              Commencer
            </button>
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          className="mkt-hamburger"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            {open ? (
              <>
                <line x1="1" y1="1" x2="19" y2="13" stroke={CON} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="19" y1="1" x2="1" y2="13" stroke={CON} strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <rect y="0" width="20" height="1.5" rx="0.75" fill={CON} />
                <rect y="6" width="20" height="1.5" rx="0.75" fill={CON} />
                <rect y="12" width="20" height="1.5" rx="0.75" fill={CON} />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile fullscreen menu */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
            background: BG,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
            overflowY: "auto",
          }}
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  fontSize: 22,
                  fontWeight: active ? 400 : 300,
                  color: active ? TERRA : CON,
                  textDecoration: "none",
                  padding: "16px 0",
                  borderBottom: `0.5px solid ${BORDER}`,
                  display: "block",
                  fontFamily: DM,
                }}
              >
                {label}
              </Link>
            );
          })}
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
            <Link href="/login" onClick={() => setOpen(false)} style={{ textDecoration: "none" }}>
              <button style={{ width: "100%", background: "transparent", color: TERRA, border: `1.5px solid ${TERRA}`, borderRadius: 8, padding: "14px", fontSize: 16, fontWeight: 400, cursor: "pointer", fontFamily: DM }}>
                Se connecter
              </button>
            </Link>
            <Link href="/register" onClick={() => setOpen(false)} style={{ textDecoration: "none" }}>
              <button style={{ width: "100%", background: TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "14px", fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
                Commencer gratuitement →
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
