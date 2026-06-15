/* Radar — style attentionnel / matching
   SVG copiée verbatim depuis Candice_Redesign_Mockups_v4.html (écrans 10 et 11).
   viewBox="0 0 200 200", centre (100,100), heptagone à 3 niveaux.
   Peut afficher 1 ou 2 polygones (single profile / matching).
   Aucun chiffre / % — règle de marque absolue. */

export interface RadarPolygon {
  points: string;
  fill: string;
  stroke: string;
  strokeWidth?: number;
}

export interface RadarProps {
  polygons?: RadarPolygon[];
  /** Rendered width in px (default 220) */
  width?: number;
  /** Rendered height in px (default 200) */
  height?: number;
  style?: React.CSSProperties;
}

/* Grid heptagons — verbatim coordinates from reference HTML */
const GRID = [
  "100.0,74.3 120.1,84.0 125.1,105.7 111.2,123.2 88.8,123.2 74.9,105.7 79.9,84.0",
  "100.0,48.5 140.2,67.9 150.2,111.5 122.3,146.4 77.7,146.4 49.8,111.5 59.8,67.9",
  "100.0,22.0 161.0,51.4 176.0,117.4 133.8,170.3 66.2,170.3 24.0,117.4 39.0,51.4",
];

/* Axes from centre (100,100) to outer vertices */
const AXES: [number, number, number, number][] = [
  [100, 100, 100.0, 22.0],
  [100, 100, 161.0, 51.4],
  [100, 100, 176.0, 117.4],
  [100, 100, 133.8, 170.3],
  [100, 100, 66.2, 170.3],
  [100, 100, 24.0, 117.4],
  [100, 100, 39.0, 51.4],
];

/* Label positions verbatim from reference HTML */
const LABELS = [
  { x: 100, y: 8,   anchor: "middle" as const, text: "Précision"      },
  { x: 172, y: 43,  anchor: "start"  as const, text: "Émotion"        },
  { x: 190, y: 120, anchor: "start"  as const, text: "Surprise"       },
  { x: 140, y: 183, anchor: "start"  as const, text: "Esthétique"     },
  { x: 60,  y: 183, anchor: "end"    as const, text: "Utilité"        },
  { x: 10,  y: 120, anchor: "end"    as const, text: "Temps partagé"  },
  { x: 28,  y: 43,  anchor: "end"    as const, text: "Discrétion"     },
];

/* Default = single profile polygon from screen 10 of reference HTML */
const DEFAULT_POLYGONS: RadarPolygon[] = [
  {
    points: "100.0,29.8 142.7,66.0 122.8,105.2 128.8,159.7 79.7,142.2 62.0,108.7 51.2,61.1",
    fill: "rgba(23,62,49,.14)",
    stroke: "var(--pine)",
    strokeWidth: 1.6,
  },
];

/* Dual polygons from screen 11 (matching view) */
export const RADAR_MATCHING_POLYGONS: RadarPolygon[] = [
  {
    points: "100.0,28.2 143.9,65.0 122.8,105.2 128.8,159.7 79.7,142.2 58.2,109.5 51.2,61.1",
    fill: "rgba(23,62,49,.16)",
    stroke: "var(--pine)",
    strokeWidth: 1.6,
  },
  {
    points: "100.0,53.2 125.6,79.6 124.3,105.6 115.2,131.6 70.2,161.8 45.2,112.5 63.4,70.8",
    fill: "rgba(205,185,135,.22)",
    stroke: "var(--champ)",
    strokeWidth: 1.6,
  },
];

export default function Radar({ polygons = DEFAULT_POLYGONS, width = 220, height = 200, style }: RadarProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 200" style={{ display: "block", ...style }}>
      {/* Grid heptagons */}
      {GRID.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(23,62,49,.08)" strokeWidth="1" />
      ))}
      {/* Axes */}
      {AXES.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(23,62,49,.12)" strokeWidth="1" />
      ))}
      {/* Data polygons */}
      {polygons.map((p, i) => (
        <polygon
          key={i}
          points={p.points}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth ?? 1.6}
        />
      ))}
      {/* Labels */}
      {LABELS.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor}
          fontSize="8"
          fill="#6F6A61"
          dominantBaseline="middle"
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}

export function RadarLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", justifyContent: "center" }}>
      {items.map((item) => (
        <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink2)", fontFamily: "var(--font-sans)" }}>
          <i style={{ width: 9, height: 9, borderRadius: 3, background: item.color, display: "block" }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
