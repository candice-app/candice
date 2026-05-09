import { UserPoint } from "@/types";

interface Props {
  points: UserPoint[];
}

const ACTION_META: Record<string, { icon: string; label: string }> = {
  profile_complete:  { icon: "✓", label: "Fiche complétée" },
  profile_update:    { icon: "✏️", label: "Fiche mise à jour" },
  friend_invited:    { icon: "👋", label: "Proche invité" },
  attention_executed:{ icon: "🎁", label: "Attention réalisée" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

const MAX_POINTS = 5000;

export default function CagnotteWidget({ points }: Props) {
  const total = points.reduce((sum, p) => sum + p.points, 0);
  const euros = (total * 0.01).toFixed(2).replace(".", ",");
  const pct = Math.min(Math.round((total / MAX_POINTS) * 100), 100);
  const remaining = Math.max(MAX_POINTS - total, 0);
  const recent = points.slice(0, 5);

  const motivationalMsg =
    pct < 20
      ? "Complète ta fiche pour gagner 500 points d'un coup 🎯"
      : pct < 50
      ? "Tu avances bien ! Continue pour débloquer tes premières réductions."
      : pct < 80
      ? `Bientôt ! Plus que ${remaining.toLocaleString("fr-FR")} points avant tes réductions Candice.`
      : "Presque là ! 🎁 Encore un effort et tes réductions sont débloquées.";

  return (
    <div
      style={{
        background: "var(--iv)",
        border: "1px solid var(--t3)",
        borderRadius: "var(--r-lg)",
        padding: 20,
        marginBottom: 24,
      }}
    >
      <p className="section-label" style={{ marginBottom: 12 }}>🎁 Ma cagnotte Candice</p>

      {/* Balance */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
        <span
          style={{
            fontSize: 48,
            fontWeight: 400,
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "var(--terra)",
            lineHeight: 1,
          }}
        >
          {total.toLocaleString("fr-FR")}
        </span>
        <span style={{ fontSize: 16, fontWeight: 300, color: "var(--txtm)" }}>pts</span>
      </div>

      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--txtm)", marginBottom: 20 }}>
        ={" "}
        <strong style={{ fontWeight: 500, color: "var(--con)" }}>{euros}€</strong> de réductions
      </p>

      {/* Progress bar */}
      <div style={{ marginBottom: recent.length > 0 ? 20 : 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 300, color: "var(--txts)" }}>
            {total.toLocaleString("fr-FR")} pts /{" "}
            {MAX_POINTS.toLocaleString("fr-FR")} pts pour débloquer tes réductions
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--terra)",
              marginLeft: 8,
              flexShrink: 0,
            }}
          >
            {pct}%
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--txts)",
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          {motivationalMsg}
        </p>
      </div>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div style={{ borderTop: "0.5px solid var(--iv3)", paddingTop: 14 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--txts)",
              marginBottom: 10,
            }}
          >
            Activité récente
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent.map((p) => {
              const meta = ACTION_META[p.action_type] ?? { icon: "⭐", label: p.action_type };
              return (
                <div
                  key={p.id}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: "center" }}>
                    {meta.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 300,
                      color: "var(--con)",
                      flex: 1,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--terra)",
                      flexShrink: 0,
                    }}
                  >
                    +{p.points} pts
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 300,
                      color: "var(--txts)",
                      flexShrink: 0,
                      marginLeft: 4,
                    }}
                  >
                    {formatDate(p.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
