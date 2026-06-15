/* .orb + .orb .d — verbatim from Candice_Redesign_Mockups_v4.html
   .orb: width:54px;height:54px;border-radius:50%;
     background:radial-gradient(circle at 42% 34%,#27604B 0%,#173E31 54%,#0D2A20 100%);
     box-shadow:0 9px 22px rgba(13,42,32,.45),inset 0 1px 3px rgba(255,255,255,.16);
     display:flex;align-items:center;justify-content:center;margin:0 auto
   .d: width:13px;height:13px;border-radius:50%;
     background:radial-gradient(circle at 40% 35%,#F3F8F4,#94C0AC);
     box-shadow:0 0 14px rgba(180,220,200,.85) */

export interface OrbProps {
  size?: number;
  dotSize?: number;
  style?: React.CSSProperties;
}

export default function Orb({ size = 54, dotSize = 13, style }: OrbProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "radial-gradient(circle at 42% 34%,#27604B 0%,#173E31 54%,#0D2A20 100%)",
      boxShadow: "0 9px 22px rgba(13,42,32,.45),inset 0 1px 3px rgba(255,255,255,.16)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto",
      flexShrink: 0,
      ...style,
    }}>
      <div style={{
        width: dotSize,
        height: dotSize,
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 35%,#F3F8F4,#94C0AC)",
        boxShadow: "0 0 14px rgba(180,220,200,.85)",
      }} />
    </div>
  );
}
