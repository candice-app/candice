/* .mod (toujours imbriqué dans .card) — verbatim from Candice_Redesign_Mockups_v4.html
   .mod: padding:13px 14px;margin-bottom:10px
   .mh: display:flex;align-items:center;gap:9px;font-weight:600;font-size:13.5px
   .mh .icon: width:18px;height:18px;color:var(--pine)
   .md: font-size:12px;color:var(--ink2);margin:5px 0 8px;line-height:1.45 */

import React from "react";
import { Icon } from "./IconSprite";
import Chip from "./Chip";

export interface ModuleCardProps {
  iconName?: string;
  title: string;
  description?: string;
  chips?: string[];
  /** Override outer padding/margin if needed */
  style?: React.CSSProperties;
}

export default function ModuleCard({ iconName, title, description, chips, style }: ModuleCardProps) {
  return (
    <div style={{ padding: "13px 14px", marginBottom: 10, ...style }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        fontWeight: 600,
        fontSize: 13.5,
        fontFamily: "var(--font-sans)",
        color: "var(--ink)",
      }}>
        {iconName && (
          <Icon name={iconName} size={18} style={{ color: "var(--pine)", strokeWidth: 1.6 }} />
        )}
        {title}
      </div>
      {description && (
        <p style={{
          fontSize: 12,
          color: "var(--ink2)",
          margin: "5px 0 8px",
          lineHeight: 1.45,
          fontFamily: "var(--font-sans)",
        }}>
          {description}
        </p>
      )}
      {chips && chips.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {chips.map((c) => <Chip key={c}>{c}</Chip>)}
        </div>
      )}
    </div>
  );
}
