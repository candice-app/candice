"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const NAV = [
  {
    section: "Réseau",
    items: [
      { label: "Mes proches", href: "/dashboard", activeOn: (p: string) => p === "/dashboard" || (p.startsWith("/contacts") && !p.includes("/new")) },
      { label: "Idées", href: "/idees", activeOn: (p: string) => p === "/idees" },
      { label: "Historique", href: "/historique", activeOn: (p: string) => p === "/historique" },
    ],
  },
  {
    section: "Mon profil",
    items: [
      { label: "Ma fiche", href: "/moi", activeOn: (p: string) => p.startsWith("/moi") },
      { label: "Mes partages", href: "/dashboard/sharing", activeOn: (p: string) => p === "/dashboard/sharing" },
      { label: "Archivés", href: "/dashboard/archives", activeOn: (p: string) => p === "/dashboard/archives" },
    ],
  },
  {
    section: "Support",
    items: [
      { label: "Aide", href: "/aide", activeOn: (p: string) => p === "/aide" },
    ],
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleReplayTour = () => {
    try { localStorage.setItem("candice_replay_tour", "true"); } catch { /* storage unavailable */ }
    router.push("/dashboard");
  };

  return (
    <aside className="sidebar">
      {NAV.map(({ section, items }) => (
        <div key={section}>
          <p className="sidebar-section-label">{section}</p>
          {items.map(({ label, href, activeOn }) => {
            const active = activeOn(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-item${active ? " active" : ""}`}
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
                {label}
              </Link>
            );
          })}
        </div>
      ))}

      {/* Revoir l'introduction */}
      <div>
        <p className="sidebar-section-label">Guide</p>
        <button
          onClick={handleReplayTour}
          className="sidebar-item"
          style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="rgba(239,231,220,0.35)" strokeWidth="1.5" />
            <text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="500" fill="rgba(239,231,220,0.35)" fontFamily="sans-serif">▶</text>
          </svg>
          Revoir l&apos;introduction
        </button>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <Link href="/contacts/new" style={{ display: "block", marginBottom: 8 }}>
          <button className="btn-primary" style={{ width: "100%", textAlign: "left" }}>
            + Ajouter un proche
          </button>
        </Link>
      </div>
    </aside>
  );
}
