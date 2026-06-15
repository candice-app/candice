"use client";
/* .intent — verbatim from Candice_Redesign_Mockups_v4.html
   display:flex;align-items:flex-start;gap:12px;padding:13px;
   border:1px solid var(--line);border-radius:16px;background:#fff;
   margin-bottom:10px;box-shadow:var(--shadow);cursor:pointer
   .ii: width:40px;height:40px;border-radius:12px;display:flex;
     align-items:center;justify-content:center;flex:0 0 40px
   .it2 b: font-size:14px
   .it2 small: display:block;font-size:11.5px;color:var(--ink2);
     margin-top:2px;line-height:1.35 */

import { Icon } from "./IconSprite";

export interface IntentCardProps {
  iconName: string;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
  onClick?: () => void;
}

export default function IntentCard({ iconName, iconBg, iconColor, title, sub, onClick }: IntentCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: 13,
        border: "1px solid var(--line)",
        borderRadius: 16,
        background: "#fff",
        marginBottom: 10,
        boxShadow: "var(--shadow)",
        cursor: "pointer",
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 40px",
        background: iconBg,
        color: iconColor,
      }}>
        <Icon name={iconName} size={19} />
      </div>
      <div style={{ flex: 1 }}>
        <b style={{ fontSize: 14, fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--ink)" }}>
          {title}
        </b>
        <small style={{
          display: "block",
          fontSize: 11.5,
          color: "var(--ink2)",
          marginTop: 2,
          lineHeight: 1.35,
          fontFamily: "var(--font-sans)",
          fontWeight: 300,
        }}>
          {sub}
        </small>
      </div>
    </div>
  );
}
