"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  pendingCount?: number;
}

const NAV = [
  { label: "Mes proches",  href: "/dashboard",  activeOn: (p: string) => p === "/dashboard" || (p.startsWith("/contacts") && !p.includes("/new")) },
  { label: "Idées",        href: "/idees",       activeOn: (p: string) => p === "/idees" },
  { label: "Ma fiche",    href: "/moi",         activeOn: (p: string) => p.startsWith("/moi") },
  { label: "Mes échanges", href: "/historique",  activeOn: (p: string) => p === "/historique" },
  { label: "Aide",        href: "/aide",        activeOn: (p: string) => p === "/aide" },
];

export default function BottomNav({ isOpen, onClose, pendingCount }: Props) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar${isOpen ? " sidebar-open" : ""}`}>
      {NAV.map(({ label, href, activeOn }) => {
        const active = activeOn(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`sidebar-item${active ? " active" : ""}`}
            onClick={onClose}
          >
            {href === "/aide" ? (
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke={active ? "var(--terra)" : "rgba(239,231,220,0.48)"} strokeWidth="1.5" />
                <text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="500" fill={active ? "var(--terra)" : "rgba(239,231,220,0.48)"} fontFamily="sans-serif">?</text>
              </svg>
            ) : (
              <span
                className="sidebar-item-dot"
                style={{ background: active ? "var(--terra)" : "rgba(239,231,220,0.35)" }}
              />
            )}
            {href === "/dashboard" && pendingCount && pendingCount > 0 ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {label}
                <span style={{
                  background: "var(--terra)", color: "#fff", borderRadius: 10,
                  fontSize: 9, fontWeight: 600, padding: "1px 5px", lineHeight: 1.6,
                }}>
                  {pendingCount}
                </span>
              </span>
            ) : label}
          </Link>
        );
      })}
    </aside>
  );
}
