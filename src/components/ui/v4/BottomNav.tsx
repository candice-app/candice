/* .nav, .it, .it.on, .center, .orb, .lbl — verbatim from Candice_Redesign_Mockups_v4.html
   .nav: height:74px;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);
     border-top:1px solid var(--line2);display:flex;align-items:flex-start;
     justify-content:space-around;padding:10px 8px 0;z-index:20
   .it: flex-direction:column;align-items:center;gap:3px;font-size:9px;
     letter-spacing:.3px;color:var(--ink3);flex:1;text-transform:uppercase;font-weight:600
   .it.on: color:var(--pine)
   .center: flex:0 0 60px;margin-top:-24px
   .lbl: font-size:9px;text-align:center;color:var(--pine);margin-top:5px;
     text-transform:uppercase;font-weight:700 */

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
};

export default function BottomNav({ active }: BottomNavProps) {
  const c = (tab: NavTab) => ({ ...TAB_S, color: active === tab ? "var(--pine)" : "var(--ink3)" });

  return (
    <div style={{
      height: 74,
      background: "rgba(255,255,255,.94)",
      backdropFilter: "blur(14px)",
      borderTop: "1px solid var(--line2)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-around",
      padding: "10px 8px 0",
      zIndex: 20,
    }}>
      <div style={c("home")}>
        <Icon name="i-home" size={20} style={{ strokeWidth: 1.5 }} />
        Le fil
      </div>
      <div style={c("people")}>
        <Icon name="i-people" size={20} style={{ strokeWidth: 1.5 }} />
        Proches
      </div>
      <div style={{ flex: "0 0 60px", marginTop: -24 }}>
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
      </div>
      <div style={c("cal")}>
        <Icon name="i-cal" size={20} style={{ strokeWidth: 1.5 }} />
        Agenda
      </div>
      <div style={c("profile")}>
        <Icon name="i-profile" size={20} style={{ strokeWidth: 1.5 }} />
        Profil
      </div>
    </div>
  );
}
