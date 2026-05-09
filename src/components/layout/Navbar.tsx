"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface Props {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          className="topbar-hamburger"
          onClick={onToggleSidebar}
          aria-label="Ouvrir le menu"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
            <rect y="0" width="18" height="1.5" rx="0.75" fill="#2C1A0E" />
            <rect y="6" width="18" height="1.5" rx="0.75" fill="#2C1A0E" />
            <rect y="12" width="18" height="1.5" rx="0.75" fill="#2C1A0E" />
          </svg>
        </button>
        <Link href="/dashboard" className="topbar-logo">
          <span className="topbar-logo-text">Candice</span>
          <span className="topbar-logo-dot" />
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/contacts/new">
          <button className="btn-primary">+ Ajouter</button>
        </Link>
        <button
          onClick={handleSignOut}
          style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", background: "none", border: "none", cursor: "pointer" }}
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
