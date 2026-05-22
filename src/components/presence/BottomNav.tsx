"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Proches",
    href: "/contacts",
    activeOn: (p: string) => p === "/contacts" || (p.startsWith("/contacts") && !p.includes("/new")),
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="3.2" />
        <circle cx="16.5" cy="10.5" r="2.4" />
        <path d="M3.5 19c.6-3 3-4.6 5.5-4.6s4.9 1.6 5.5 4.6M15 14.6c2 .1 3.9 1.5 4.4 4.1" />
      </svg>
    ),
  },
  {
    label: "Idées",
    href: "/idees",
    activeOn: (p: string) => p === "/idees",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </svg>
    ),
  },
  { label: "", href: "/dashboard", center: true, activeOn: () => false, icon: null },
  {
    label: "Échanges",
    href: "/historique",
    activeOn: (p: string) => p === "/historique",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 11.5a7.5 7.5 0 0 1-10.7 6.8L4 19.5l1.3-4.1A7.5 7.5 0 1 1 20 11.5Z" />
      </svg>
    ),
  },
  {
    label: "Profil",
    href: "/moi",
    activeOn: (p: string) => p.startsWith("/moi"),
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8.5" r="3.4" />
        <path d="M5.5 19.5c.8-3.4 3.4-5.2 6.5-5.2s5.7 1.8 6.5 5.2" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 76,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 14px 14px',
        background: 'linear-gradient(to top, var(--white) 64%, rgba(255,255,255,0))',
        zIndex: 100,
      }}
    >
      {/* Filet */}
      <div style={{
        position: 'absolute',
        left: 26,
        right: 26,
        top: 8,
        height: '.5px',
        background: 'var(--line)',
      }} />

      {NAV_ITEMS.map((item, i) => {
        if (item.center) {
          return (
            <Link
              key="center"
              href="/dashboard"
              aria-label="Accueil Candice"
              style={{
                flex: '0 0 auto',
                margin: '0 4px',
                transform: 'translateY(-11px)',
                textDecoration: 'none',
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(130% 130% at 32% 24%, #1E4337 0%, #112a21 60%, #081710 100%)',
                boxShadow: '0 0 0 4px var(--white), 0 0 0 5px var(--champ-line), 0 10px 24px -8px rgba(8,23,16,.6)',
                cursor: 'pointer',
              }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#EAF3EE',
                  boxShadow: '0 0 10px 2px rgba(234,243,238,.6)',
                  animation: 'life 3.4s ease-in-out infinite',
                  display: 'block',
                }} />
              </div>
            </Link>
          );
        }

        const active = item.activeOn(pathname);
        return (
          <Link
            key={item.href + i}
            href={item.href}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              color: active ? 'var(--pine)' : 'var(--ink-3)',
              textDecoration: 'none',
              flex: 1,
              transition: 'color .3s',
            }}
          >
            {item.icon}
            <span style={{
              fontSize: 9.5,
              letterSpacing: '.06em',
              fontWeight: active ? 500 : 300,
            }}>
              {item.label}
            </span>
            {active && (
              <span style={{
                position: 'absolute',
                top: 14,
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'var(--champ)',
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
