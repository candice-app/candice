/* .brand + .brand .o — base Candice_Redesign_Mockups_v4.html, taille relevée
   par le barème de corrections Phase 4 (14.5→18px, orb 14→17px) : le logo
   était quasi invisible sur device réel. */

export default function Brand() {
  return (
    <div style={{
      height: 36,
      flex: "0 0 36px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: "var(--font-serif)",
      fontStyle: "italic",
      fontSize: 18,
      color: "var(--pine)",
      letterSpacing: ".2px",
    }}>
      <span style={{
        width: 17,
        height: 17,
        borderRadius: "50%",
        background: "radial-gradient(circle at 42% 34%,#27604B,#173E31 60%,#0D2A20)",
        boxShadow: "0 0 8px rgba(62,115,97,.45)",
        display: "inline-block",
        flexShrink: 0,
      }} />
      Candice
    </div>
  );
}
