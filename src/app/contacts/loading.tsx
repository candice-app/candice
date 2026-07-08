// Fix minimal beacons — /contacts à 1,3 s sans feedback : ce squelette
// active prefetch + cache client (Next 16) et donne un état immédiat.

export default function ContactsLoading() {
  return (
    <div style={{ background: "#FEFEFB", minHeight: "100svh", padding: "calc(24px + env(safe-area-inset-top)) 16px" }}>
      <div style={{ width: 150, height: 26, borderRadius: 8, background: "rgba(23,62,49,.08)", marginBottom: 20 }} />
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 14, background: "#fff",
          border: "1px solid rgba(23,62,49,.11)", borderRadius: 16,
          padding: "16px", marginBottom: 10, boxShadow: "0 10px 30px rgba(23,62,49,.07)",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(23,62,49,.07)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: "45%", height: 14, borderRadius: 7, background: "rgba(23,62,49,.08)" }} />
            <div style={{ width: "65%", height: 11, borderRadius: 6, background: "rgba(23,62,49,.05)", marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
