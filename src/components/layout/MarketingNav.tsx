"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BG = "#FAF7F2";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const BORDER = "rgba(30,18,8,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";

const LINKS = [
  { href: "/concept", label: "Candice" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/offre", label: "Tarifs" },
  { href: "/login", label: "Se connecter" },
];

export default function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className="mkt-nav"
        style={{
          height: 60, padding: "0 52px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `0.5px solid ${BORDER}`, background: BG,
          position: "sticky", top: 0, zIndex: 100,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "flex-start", gap: 4, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: CON, fontFamily: DM }}>Candice</span>
          <span style={{ width: 7, height: 7, background: TERRA, borderRadius: "50%", marginTop: 3, flexShrink: 0, display: "inline-block" }} />
        </Link>

        {/* Desktop links */}
        <div className="mkt-nav-links" style={{ display: "flex", gap: 28 }}>
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{ fontSize: 12, fontWeight: active ? 400 : 300, color: active ? TERRA : COND, textDecoration: "none" }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side: CTA + hamburger */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/register">
            <button style={{ background: TERRA, color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
              Commencer
            </button>
          </Link>
          {/* Hamburger — shown on mobile via CSS */}
          <button
            className="mkt-hamburger"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
              {open ? (
                <>
                  <line x1="1" y1="1" x2="17" y2="13" stroke={CON} strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="17" y1="1" x2="1" y2="13" stroke={CON} strokeWidth="1.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <rect y="0" width="18" height="1.5" rx="0.75" fill={CON} />
                  <rect y="6" width="18" height="1.5" rx="0.75" fill={CON} />
                  <rect y="12" width="18" height="1.5" rx="0.75" fill={CON} />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {open && (
        <div
          style={{
            position: "fixed", top: 60, left: 0, right: 0, zIndex: 99,
            background: BG, borderBottom: `0.5px solid ${BORDER}`,
            padding: "16px 20px", display: "flex", flexDirection: "column", gap: 0,
            boxShadow: "0 8px 24px rgba(30,18,8,0.08)",
          }}
        >
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  fontSize: 15, fontWeight: active ? 500 : 300,
                  color: active ? TERRA : CON,
                  textDecoration: "none",
                  padding: "13px 4px",
                  borderBottom: `0.5px solid ${BORDER}`,
                  display: "block",
                }}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            style={{ display: "block", marginTop: 16 }}
          >
            <button style={{ width: "100%", background: TERRA, color: "#fff", border: "none", borderRadius: 6, padding: "13px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: DM }}>
              Commencer gratuitement →
            </button>
          </Link>
        </div>
      )}
    </>
  );
}
