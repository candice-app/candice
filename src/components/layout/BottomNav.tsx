"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
];

export default function BottomNav() {
  const pathname = usePathname();

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
                <span
                  className="sidebar-item-dot"
                  style={{ background: active ? "var(--terra)" : "var(--br4)" }}
                />
                {label}
              </Link>
            );
          })}
        </div>
      ))}

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
