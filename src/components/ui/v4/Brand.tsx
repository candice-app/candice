/* .brand + .brand .o — verbatim from Candice_Redesign_Mockups_v4.html
   height:30px;flex:0 0 30px;display:flex;align-items:center;
   justify-content:center;gap:7px;font-family:Fraunces,serif;
   font-style:italic;font-size:14.5px;color:var(--pine);letter-spacing:.2px
   .o: width:14px;height:14px;border-radius:50%;
       background:radial-gradient(circle at 42% 34%,#27604B,#173E31 60%,#0D2A20);
       box-shadow:0 0 7px rgba(62,115,97,.45) */

export default function Brand() {
  return (
    <div style={{
      height: 30,
      flex: "0 0 30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      fontFamily: "var(--font-serif)",
      fontStyle: "italic",
      fontSize: 14.5,
      color: "var(--pine)",
      letterSpacing: ".2px",
    }}>
      <span style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "radial-gradient(circle at 42% 34%,#27604B,#173E31 60%,#0D2A20)",
        boxShadow: "0 0 7px rgba(62,115,97,.45)",
        display: "inline-block",
        flexShrink: 0,
      }} />
      Candice
    </div>
  );
}
