"use client";
/* Shell V4 — mobile: Brand + scroll + BottomNav · desktop ≥1024px: rail V11 re-teinté V4.
   Chaque page V4 utilise ce shell à la place de DashboardShell.
   Le className="v4" sur la racine scope tous les tokens V4. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import IconSprite from "@/components/ui/v4/IconSprite";
import Brand from "@/components/ui/v4/Brand";
import V4BottomNav from "@/components/ui/v4/BottomNav";
import LivePoint from "@/components/presence/LivePoint";
import ScrollMemory from "@/components/layout/ScrollMemory";

interface Props {
  children: React.ReactNode;
  active?: "home" | "people" | "cal" | "profile";
  /** V3.2 : pages qui portent leur propre marque (header vert de la fiche)
   *  — la topbar globale est masquée pour ne jamais doubler « Candice ». */
  noBrandBar?: boolean;
}

const RAIL_ITEMS = [
  {
    label: "Le fil",
    href: "/dashboard",
    match: (p: string) => p === "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11l8-6 8 6M6 10v9h12v-9M10 19v-5h4v5" />
      </svg>
    ),
  },
  {
    label: "Proches",
    href: "/contacts",
    match: (p: string) => p === "/contacts" || (p.startsWith("/contacts") && !p.includes("/new")),
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M16 6.5a3 3 0 010 5.8M18 20c0-2.5-1-4.6-3-5.6" />
      </svg>
    ),
  },
  {
    label: "Candice",
    href: "/parler-a-candice",
    match: (p: string) => p.startsWith("/parler-a-candice"),
    center: true,
  },
  {
    label: "Agenda",
    href: "/idees",
    match: (p: string) => p.startsWith("/idees"),
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 9h16M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    label: "Profil",
    href: "/moi",
    match: (p: string) => p.startsWith("/moi"),
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0115 0" />
      </svg>
    ),
  },
];

export default function V4Shell({ children, active, noBrandBar = false }: Props) {
  const pathname = usePathname();

  return (
    <div className="v4 app-shell">
      <IconSprite />
      {/* V3.1 : restauration du scroll par onglet (la nav push remet à zéro) */}
      <ScrollMemory />

      {/* ── Desktop rail ≥1024px (hidden on mobile via .app-rail CSS) ── */}
      <aside className="app-rail" aria-label="Navigation principale">
        {/* Brand instead of Wordmark */}
        <div style={{ marginBottom: 40 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <Brand />
          </Link>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {RAIL_ITEMS.map(item => {
            const isOn = item.match(pathname);
            if (item.center) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rail-item${isOn ? " rail-item-active" : ""}`}
                  style={{ gap: 10 }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "radial-gradient(circle at 42% 34%,#27604B,#173E31 60%,#0D2A20)",
                    flexShrink: 0,
                  }}>
                    <LivePoint size={5} tone="champ" />
                  </span>
                  <span className="rail-label">{item.label}</span>
                  <span className="rail-champ" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--champ)", marginLeft: "auto" }} />
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rail-item${isOn ? " rail-item-active" : ""}`}
              >
                {item.icon}
                <span className="rail-label">{item.label}</span>
                <span className="rail-champ" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--champ)", marginLeft: "auto" }} />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main id="main-content" role="main" className="app-main">
        {/* Brand bar — mobile only (≥1024px hidden via CSS). Masquée quand la
            page porte sa propre marque (V3.2 : jamais deux « Candice »). */}
        {!noBrandBar && (
          <div className="v4-brand-bar">
            <Brand />
          </div>
        )}
        {children}
      </main>

      {/* ── V4 BottomNav — mobile only (hidden on desktop via .app-bottom-nav CSS) ── */}
      <div className="app-bottom-nav">
        <V4BottomNav active={active} />
      </div>
    </div>
  );
}
