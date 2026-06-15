"use client";
/* .opt — verbatim from Candice_Redesign_Mockups_v4.html
   border:1px solid var(--line);border-radius:18px;background:#fff;
   padding:15px;margin-bottom:12px;box-shadow:var(--shadow);
   position:relative;overflow:hidden
   .opt.sage: border-left:4px solid var(--pine)
   .opt.champ: border-left:4px solid var(--gold)
   .rk: font-size:10px;letter-spacing:1px;text-transform:uppercase;font-weight:700
     default color:var(--pine) / champ color:#9a7d2e
   .t (title): font-family:Fraunces;font-size:17px;margin:5px 0 4px;line-height:1.2
   .why: font-size:12px;color:var(--ink2);line-height:1.4
   .meta: display:flex;gap:6px;margin:10px 0;flex-wrap:wrap
   .acts span: font-size:11.5px;font-weight:600;padding:8px 12px;border-radius:11px;
     border:1px solid var(--line);color:var(--pine);background:#fff
   .acts span.pri: background:var(--pine);color:#fff;border-color:var(--pine) */

export type OptionCardVariant = "default" | "sage" | "champ";

export interface OptionCardAction {
  label: string;
  primary?: boolean;
  onClick?: () => void;
}

export interface OptionCardProps {
  variant?: OptionCardVariant;
  rank: string;
  title: string;
  why?: string;
  meta?: string[];
  actions?: OptionCardAction[];
  style?: React.CSSProperties;
}

const BORDER_LEFT: Record<OptionCardVariant, string> = {
  default: "1px solid var(--line)",
  sage:    "4px solid var(--pine)",
  champ:   "4px solid var(--gold)",
};

const RANK_COLOR: Record<OptionCardVariant, string> = {
  default: "var(--pine)",
  sage:    "var(--pine)",
  champ:   "#9a7d2e",
};

export default function OptionCard({ variant = "default", rank, title, why, meta, actions, style }: OptionCardProps) {
  return (
    <div style={{
      border: "1px solid var(--line)",
      borderLeft: BORDER_LEFT[variant],
      borderRadius: 18,
      background: "#fff",
      padding: 15,
      marginBottom: 12,
      boxShadow: "var(--shadow)",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: "1px",
        textTransform: "uppercase",
        fontWeight: 700,
        color: RANK_COLOR[variant],
        fontFamily: "var(--font-sans)",
      }}>
        {rank}
      </div>
      <div style={{
        fontFamily: "var(--font-serif)",
        fontSize: 17,
        margin: "5px 0 4px",
        lineHeight: 1.2,
        color: "var(--ink)",
      }}>
        {title}
      </div>
      {why && (
        <div style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.4, fontFamily: "var(--font-sans)" }}>
          {why}
        </div>
      )}
      {meta && meta.length > 0 && (
        <div style={{ display: "flex", gap: 6, margin: "10px 0", flexWrap: "wrap" }}>
          {meta.map((m) => (
            <span key={m} style={{
              display: "inline-block",
              padding: "5px 11px",
              border: "1px solid var(--line)",
              borderRadius: 999,
              fontSize: 11,
              color: "var(--ink2)",
              background: "var(--surface)",
              fontFamily: "var(--font-sans)",
            }}>
              {m}
            </span>
          ))}
        </div>
      )}
      {actions && actions.length > 0 && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {actions.map((a) => (
            <span
              key={a.label}
              onClick={a.onClick}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: "8px 12px",
                borderRadius: 11,
                cursor: a.onClick ? "pointer" : "default",
                fontFamily: "var(--font-sans)",
                ...(a.primary
                  ? { background: "var(--pine)", color: "#fff", border: "1px solid var(--pine)" }
                  : { border: "1px solid var(--line)", color: "var(--pine)", background: "#fff" }),
              }}
            >
              {a.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
