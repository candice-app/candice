"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        fontSize: 14,
        fontWeight: 300,
        color: "var(--ink-2)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "12px 0",
        borderBottom: "0.5px solid var(--line)",
        fontFamily: "var(--font-sans)",
        textAlign: "left",
      }}
    >
      <span>Se déconnecter</span>
      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
    </button>
  );
}
