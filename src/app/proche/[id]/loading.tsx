// Cache client sur revisite (apprentissage R0 perf) : loading.tsx active le
// prefetch + le cache Router. Squelette = header aplat + placeholder.

export default function EspaceProcheLoading() {
  const line = "rgba(255,255,255,.13)";
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100svh", background: "#FEFEFB" }}>
      <div style={{
        background: "linear-gradient(157deg,#1D5040,#0C2A20)",
        borderRadius: "0 0 30px 30px",
        padding: "calc(60px + env(safe-area-inset-top)) 22px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 17 }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: line }} />
          <div>
            <div style={{ width: 150, height: 32, borderRadius: 8, background: line }} />
            <div style={{ width: 180, height: 14, borderRadius: 7, background: "rgba(255,255,255,.09)", marginTop: 12 }} />
          </div>
        </div>
      </div>
      <div style={{ margin: "24px 14px", height: 140, borderRadius: 18, background: "#fff", border: "1px solid rgba(23,62,49,.11)" }} />
    </div>
  );
}
