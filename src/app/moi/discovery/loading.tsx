// C2 STOP C — état de chargement léger de /moi/discovery (le rendu serveur
// attend le moteur + la reformulation) : squelette de question.

export default function DiscoveryLoading() {
  return (
    <div style={{ background: "#FEFEFB", minHeight: "100svh", padding: "calc(40px + env(safe-area-inset-top)) 20px" }}>
      <div style={{ width: 120, height: 12, borderRadius: 6, background: "rgba(23,62,49,.08)" }} />
      <div style={{ height: 4, borderRadius: 3, background: "rgba(23,62,49,.06)", margin: "14px 0 24px" }} />
      <div style={{ width: "85%", height: 24, borderRadius: 8, background: "rgba(23,62,49,.08)", marginBottom: 10 }} />
      <div style={{ width: "60%", height: 24, borderRadius: 8, background: "rgba(23,62,49,.08)", marginBottom: 26 }} />
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          height: 52, borderRadius: 16, background: "#fff",
          border: "1.5px solid rgba(23,62,49,.11)", marginBottom: 10,
          boxShadow: "0 10px 30px rgba(23,62,49,.07)",
        }} />
      ))}
    </div>
  );
}
