// Refonte Profil V2 — fondations UI, pixel-fidèles à la maquette gelée
// design/redisign/Candice_Maquette_Profil_V2_REFERENCE_GELEE.html.
// Tokens V4, Fraunces + DM Sans, cibles ≥44px, jamais d'émoji.

export const T2 = {
  canvas: "#FEFEFB", surface: "#FFFFFF", mist: "#EEF3F0",
  ink: "#16150E", ink2: "#5F5A51", ink3: "#ABA699",
  pine: "#173E31", pine2: "#1B4D3E", pineLite: "#2A7B5C", glow: "#3E7361",
  sage: "#8DA697", sageBg: "#E9F0EC",
  champ: "#CDB987", gold: "#C7A85A", champSoft: "#FBF8F0",
  coral: "#B9583F", coralBg: "#F7ECE7",
  aplat: "linear-gradient(157deg,#1D5040,#0C2A20)",
  line: "rgba(23,62,49,.11)", line2: "rgba(23,62,49,.06)",
  shadow: "0 10px 30px rgba(23,62,49,.07)",
} as const;

// Pictos stroke (jamais d'émoji)
export const IC: Record<string, React.ReactNode> = {
  pencil:  <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
  gear:    <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z" /></>,
  camera:  <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
  plus:    <path d="M12 5v14M5 12h14" />,
  table:   <path d="M3 11h18M5 11V7a2 2 0 012-2h10a2 2 0 012 2v4M4 11v9M20 11v9" />,
  globe:   <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>,
  music:   <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  star:    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />,
  lock:    <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
  back:    <path d="M15 18l-6-6 6-6" />,
  share:   <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5" /></>,
};

export function Icon({ name, size = 20, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" style={{
      width: size, height: size, stroke: "currentColor", fill: "none",
      strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0,
      ...style,
    }}>
      {IC[name]}
    </svg>
  );
}

/** Point signature VERT (glow) des titres de sections et insights. */
export function Pt({ style }: { style?: React.CSSProperties }) {
  return (
    <span style={{
      display: "inline-block", width: 5, height: 5, borderRadius: "50%",
      background: T2.glow, boxShadow: "0 0 6px rgba(62,115,97,.75)", flexShrink: 0,
      ...style,
    }} />
  );
}

/** Séparateur de section : point vert + libellé uppercase + filets. */
export function DivTxt2({ children }: { children: React.ReactNode }) {
  const line: React.CSSProperties = { content: '""', flex: 1, height: 1, background: T2.line2 };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, margin: "26px 20px 13px",
      fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase",
      color: T2.ink3, fontWeight: 700,
    }}>
      <span style={line} />
      <Pt />
      {children}
      <span style={line} />
    </div>
  );
}

/** Card .mod maquette (radius 18, marges 14/12, padding 17/16). */
export function Mod({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T2.surface, border: `1px solid ${T2.line}`, borderRadius: 18,
      boxShadow: T2.shadow, margin: "0 14px 12px", padding: "17px 16px",
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Tag — DEUX familles : vert = toi, champagne doré = à éviter (warn). */
export function Tag({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: "6px 11px", borderRadius: 9,
      color: warn ? "#7a4b1e" : T2.pine2,
      background: warn ? "rgba(205,185,135,.22)" : "rgba(23,62,49,.06)",
    }}>
      {children}
    </span>
  );
}

export function Tags({ items, warnItems, style }: { items?: string[]; warnItems?: string[]; style?: React.CSSProperties }) {
  if (!(items?.length || warnItems?.length)) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 13, ...style }}>
      {(items ?? []).map((t, i) => <Tag key={i}>{t}</Tag>)}
      {(warnItems ?? []).map((t, i) => <Tag key={`w${i}`} warn>{t}</Tag>)}
    </div>
  );
}

/** Titre de module Fraunces (mh maquette). */
export function Mh({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 450, marginBottom: 4 }}>
      {children}
    </div>
  );
}
