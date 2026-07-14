// R0 perf — état de chargement de /moi/wishlist. Comme sur /moi : sa présence
// active en Next 16 le prefetch du shell + le cache client (staleTimes 180 s)
// sur page dynamique → la navigation devient instantanée sur revisite, ce
// squelette couvre le streaming (fin du « 2e passage aussi lent »).

export default function WishlistLoading() {
  const line = "rgba(255,255,255,.13)";
  const card = "rgba(23,62,49,.06)";
  return (
    <div style={{ background: "#FEFEFB", minHeight: "100svh", paddingBottom: 100 }}>
      {/* Header aplat vert */}
      <div style={{
        background: "linear-gradient(157deg,#1D5040,#0C2A20)",
        borderRadius: "0 0 28px 28px",
        padding: "calc(58px + env(safe-area-inset-top)) 22px 26px",
      }}>
        <div style={{ width: 150, height: 30, borderRadius: 8, background: line }} />
        <div style={{ width: "88%", height: 13, borderRadius: 7, background: "rgba(255,255,255,.09)", marginTop: 14 }} />
        <div style={{ width: "70%", height: 13, borderRadius: 7, background: "rgba(255,255,255,.09)", marginTop: 8 }} />
        <div style={{ width: 220, height: 30, borderRadius: 8, background: "rgba(255,255,255,.10)", marginTop: 16 }} />
      </div>

      {/* Bouton ajouter */}
      <div style={{ margin: "18px 14px 8px", height: 52, borderRadius: 7, background: "rgba(23,62,49,.10)" }} />

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, padding: "6px 14px 12px", overflow: "hidden" }}>
        {[70, 96, 104, 70].map((w, i) => (
          <div key={i} style={{ flex: "0 0 auto", width: w, height: 32, borderRadius: 20, background: card }} />
        ))}
      </div>

      {/* Cards */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          margin: "0 14px 12px", height: 118, borderRadius: 16,
          background: "#fff", border: "1px solid rgba(23,62,49,.11)",
          boxShadow: "0 10px 30px rgba(23,62,49,.07)", display: "flex", overflow: "hidden",
        }}>
          <div style={{ width: 104, background: "#EEF3F0" }} />
          <div style={{ flex: 1, padding: "14px 14px" }}>
            <div style={{ width: 70, height: 10, borderRadius: 5, background: card }} />
            <div style={{ width: "80%", height: 18, borderRadius: 7, background: card, marginTop: 8 }} />
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <div style={{ width: 60, height: 18, borderRadius: 6, background: card }} />
              <div style={{ width: 90, height: 18, borderRadius: 6, background: card }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
