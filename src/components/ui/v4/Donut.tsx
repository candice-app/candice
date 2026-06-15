/* Donut — langage d'attention
   SVG copiée verbatim depuis Candice_Redesign_Mockups_v4.html (écrans 7 et 9).
   r=52, strokeWidth=26, cx=cy=70, viewBox="0 0 140 140"
   Segments définis par stroke-dasharray et stroke-dashoffset calculés sur
   la circonférence C = 2π×52 ≈ 326.73 px.
   Aucun chiffre / % affiché — règle de marque absolue. */

export interface DonutSegment {
  stroke: string;
  dasharray: string;   /* "88.22 238.51" */
  dashoffset: string;  /* "0.00" or "-88.22" etc. */
}

export interface DonutCenterLabel {
  top: string;        /* ex : "Mots" */
  bottom: string;     /* ex : "en tête" */
  topSize?: number;   /* default 13 */
  bottomSize?: number;/* default 9 */
}

export interface DonutProps {
  segments?: DonutSegment[];
  center?: DonutCenterLabel;
  /** Rendered width/height in px (default 140) */
  size?: number;
  style?: React.CSSProperties;
}

/* Default segments match screen 9 (Mon profil) from the reference HTML */
const DEFAULT_SEGMENTS: DonutSegment[] = [
  { stroke: "#173E31", dasharray: "88.22 238.51",  dashoffset: "0.00"    },
  { stroke: "#3E7361", dasharray: "65.35 261.38",  dashoffset: "-88.22"  },
  { stroke: "#8DA697", dasharray: "62.08 264.65",  dashoffset: "-153.56" },
  { stroke: "#CDB987", dasharray: "49.01 277.72",  dashoffset: "-215.64" },
  { stroke: "#B9A77C", dasharray: "39.21 287.52",  dashoffset: "-264.65" },
  { stroke: "#E0D3B0", dasharray: "22.87 303.85",  dashoffset: "-303.85" },
];

const DEFAULT_CENTER: DonutCenterLabel = { top: "Mots", bottom: "en tête" };

export default function Donut({ segments = DEFAULT_SEGMENTS, center = DEFAULT_CENTER, size = 140, style }: DonutProps) {
  const topSize = center.topSize ?? 13;
  const botSize = center.bottomSize ?? 9;
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" style={{ display: "block", ...style }}>
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx="70" cy="70" r="52"
          fill="none"
          stroke={seg.stroke}
          strokeWidth="26"
          strokeDasharray={seg.dasharray}
          strokeDashoffset={seg.dashoffset}
          transform="rotate(-90 70 70)"
        />
      ))}
      <circle cx="70" cy="70" r="34" fill="#fff" />
      <text x="70" y="66" textAnchor="middle" fontFamily="Fraunces" fontSize={topSize} fill="#173E31">
        {center.top}
      </text>
      <text x="70" y="82" textAnchor="middle" fontSize={botSize} fill="#6F6A61">
        {center.bottom}
      </text>
    </svg>
  );
}

/** Legend row — .legend-row / .l — used alongside Donut */
export interface DonutLegendItem {
  color: string;
  label: string;
}

export const DONUT_LEGEND_DEFAULTS: DonutLegendItem[] = [
  { color: "#173E31", label: "Mots justes"  },
  { color: "#3E7361", label: "Cadeaux"      },
  { color: "#8DA697", label: "Services"     },
  { color: "#CDB987", label: "Moments"      },
  { color: "#B9A77C", label: "Esthétique"   },
  { color: "#E0D3B0", label: "Surprises"    },
];

export function DonutLegend({ items = DONUT_LEGEND_DEFAULTS }: { items?: DonutLegendItem[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 10 }}>
      {items.map((item) => (
        <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink2)", fontFamily: "var(--font-sans)" }}>
          <i style={{ width: 9, height: 9, borderRadius: 3, background: item.color, display: "block" }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
