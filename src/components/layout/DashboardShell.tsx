"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/presence/Wordmark";
import PresenceBottomNav from "@/components/presence/BottomNav";

interface Props {
  children: React.ReactNode;
  pendingCount?: number;
  noNav?: boolean;
}

const NAV_ITEMS = [
  {
    label: "Accueil",
    href: "/dashboard",
    activeOn: (p: string) => p === "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: "Proches",
    href: "/contacts",
    activeOn: (p: string) => p === "/contacts" || (p.startsWith("/contacts") && !p.includes("/new")),
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="3.2" /><circle cx="16.5" cy="10.5" r="2.4" />
        <path d="M3.5 19c.6-3 3-4.6 5.5-4.6s4.9 1.6 5.5 4.6M15 14.6c2 .1 3.9 1.5 4.4 4.1" />
      </svg>
    ),
  },
  {
    label: "Idées",
    href: "/idees",
    activeOn: (p: string) => p === "/idees",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </svg>
    ),
  },
  {
    label: "Échanges",
    href: "/historique",
    activeOn: (p: string) => p === "/historique",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 11.5a7.5 7.5 0 0 1-10.7 6.8L4 19.5l1.3-4.1A7.5 7.5 0 1 1 20 11.5Z" />
      </svg>
    ),
  },
  {
    label: "Profil",
    href: "/moi",
    activeOn: (p: string) => p.startsWith("/moi"),
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8.5" r="3.4" />
        <path d="M5.5 19.5c.8-3.4 3.4-5.2 6.5-5.2s5.7 1.8 6.5 5.2" />
      </svg>
    ),
  },
];

export default function DashboardShell({ children, noNav = false }: Props) {
  const pathname = usePathname();

  return (
    <div className="app-shell">

      {/* ── Desktop rail — hidden on mobile via CSS ── */}
      {!noNav && (
        <aside className="app-rail" aria-label="Navigation principale">
          <div style={{ marginBottom: 44 }}>
            <Wordmark href="/dashboard" />
          </div>
          <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {NAV_ITEMS.map(item => {
              const active = item.activeOn(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rail-item${active ? " rail-item-active" : ""}`}
                >
                  {item.icon}
                  <span style={{ fontSize: 14, letterSpacing: ".01em" }}>{item.label}</span>
                  <span
                    className="rail-champ"
                    style={{
                      width: 4, height: 4, borderRadius: "50%",
                      background: "var(--champ)", marginLeft: "auto", flexShrink: 0,
                    }}
                  />
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* ── Main content ── */}
      <main id="main-content" role="main" className="app-main">
        {children}
      </main>

      {/* ── Mobile bottom nav — hidden on desktop via CSS ── */}
      {!noNav && (
        <div className="app-bottom-nav">
          <PresenceBottomNav />
        </div>
      )}

    </div>
  );
}
