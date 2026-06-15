"use client";
/* .nav, .it, .it.on, .center, .orb, .lbl — verbatim from Candice_Redesign_Mockups_v4.html
   Navigable version: wraps each tab in a Link, uses usePathname for active state */

import Link from "next/link";
import { usePathname } from "next/navigation";
import Orb from "./Orb";
import { Icon } from "./IconSprite";

export type NavTab = "home" | "people" | "cal" | "profile";

export interface BottomNavProps {
  active?: NavTab;
}

const TAB_S: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  fontSize: 9,
  letterSpacing: ".3px",
  textTransform: "uppercase",
  fontWeight: 600,
  flex: 1,
  fontFamily: "var(--font-sans)",
  textDecoration: "none",
  padding: "2px 0",
};

function isActive(pathname: string, tab: NavTab): boolean {
  if (tab === "home")    return pathname === "/dashboard";
  if (tab === "people")  return pathname === "/contacts" || (pathname.startsWith("/contacts") && !pathname.includes("/new"));
  if (tab === "cal")     return pathname === "/idees" || pathname.startsWith("/idees");
  if (tab === "profile") return pathname.startsWith("/moi");
  return false;
}

export default function BottomNav({ active: activeProp }: BottomNavProps) {
  const pathname = usePathname();
  const c = (tab: NavTab): React.CSSProperties => ({
    ...TAB_S,
    color: (activeProp ? activeProp === tab : isActive(pathname, tab)) ? "var(--pine)" : "var(--ink3)",
  });

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: 74,
      background: "rgba(255,255,255,.94)",
      backdropFilter: "blur(14px)",
      borderTop: "1px solid var(--line2)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-around",
      paddingTop: 10,
      paddingLeft: 8,
      paddingRight: 8,
      paddingBottom: "env(safe-area-inset-bottom)",
      zIndex: 50,
    }}>
      <Link href="/dashboard" style={c("home")}>
        <Icon name="i-home" size={20} style={{ strokeWidth: 1.5 }} />
        Le fil
      </Link>
      <Link href="/contacts" style={c("people")}>
        <Icon name="i-people" size={20} style={{ strokeWidth: 1.5 }} />
        Proches
      </Link>
      <div style={{ flex: "0 0 60px", marginTop: -24 }}>
        <Link href="/parler-a-candice" style={{ textDecoration: "none", display: "block" }}>
          <Orb size={54} dotSize={13} />
          <div style={{
            fontSize: 9,
            textAlign: "center",
            color: "var(--pine)",
            marginTop: 5,
            textTransform: "uppercase",
            fontWeight: 700,
            fontFamily: "var(--font-sans)",
            letterSpacing: ".3px",
          }}>
            Candice
          </div>
        </Link>
      </div>
      <Link href="/idees" style={c("cal")}>
        <Icon name="i-cal" size={20} style={{ strokeWidth: 1.5 }} />
        Agenda
      </Link>
      <Link href="/moi" style={c("profile")}>
        <Icon name="i-profile" size={20} style={{ strokeWidth: 1.5 }} />
        Profil
      </Link>
    </div>
  );
}
