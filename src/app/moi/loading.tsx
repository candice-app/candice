// C2 STOP C — état de chargement léger de /moi. En Next 16, sa présence
// active le prefetch du shell et le cache client (30 s) sur page dynamique :
// la navigation devient instantanée, ce squelette couvre le streaming.

export default function MoiLoading() {
  return (
    <div style={{ background: "#FEFEFB", minHeight: "100svh" }}>
      <div style={{
        background: "linear-gradient(157deg,#1D5040,#0C2A20)",
        borderRadius: "0 0 30px 30px", padding: "calc(60px + env(safe-area-inset-top)) 22px 26px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 17 }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
          <div>
            <div style={{ width: 140, height: 28, borderRadius: 8, background: "rgba(255,255,255,.14)" }} />
            <div style={{ width: 190, height: 14, borderRadius: 7, background: "rgba(255,255,255,.10)", marginTop: 10 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <div style={{ flex: 1, height: 50, borderRadius: 6, background: "rgba(255,255,255,.14)" }} />
          <div style={{ flex: 1, height: 50, borderRadius: 6, background: "rgba(255,255,255,.08)" }} />
        </div>
      </div>
      <div style={{ padding: "26px 22px" }}>
        {[86, 64, 72].map((w, i) => (
          <div key={i} style={{
            width: `${w}%`, height: 15, borderRadius: 8,
            background: "rgba(23,62,49,.07)", marginBottom: 12,
          }} />
        ))}
        <div style={{
          height: 220, borderRadius: 18, background: "#fff",
          border: "1px solid rgba(23,62,49,.11)", marginTop: 18,
        }} />
      </div>
    </div>
  );
}
