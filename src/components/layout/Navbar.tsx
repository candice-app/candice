"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="topbar">
      <Link href="/dashboard" className="topbar-logo">
        <span className="topbar-logo-text">Candice</span>
        <span className="topbar-logo-dot" />
      </Link>

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
