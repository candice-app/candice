// Fix minimal beacons — détail contact à 1,2 s sans feedback : squelette
// (prefetch + cache client + état immédiat).

export default function ContactLoading() {
  return (
    <div style={{ background: "#FEFEFB", minHeight: "100svh", padding: "calc(24px + env(safe-area-inset-top)) 16px" }}>
      <div style={{ width: 90, height: 12, borderRadius: 6, background: "rgba(23,62,49,.06)", marginBottom: 18 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(23,62,49,.08)", flexShrink: 0 }} />
        <div>
          <div style={{ width: 140, height: 20, borderRadius: 8, background: "rgba(23,62,49,.08)" }} />
          <div style={{ width: 90, height: 12, borderRadius: 6, background: "rgba(23,62,49,.05)", marginTop: 8 }} />
        </div>
      </div>
      {[180, 120, 140].map((h, i) => (
        <div key={i} style={{
          height: h, borderRadius: 16, background: "#fff",
          border: "1px solid rgba(23,62,49,.11)", marginBottom: 12,
          boxShadow: "0 10px 30px rgba(23,62,49,.07)",
        }} />
      ))}
    </div>
  );
}
