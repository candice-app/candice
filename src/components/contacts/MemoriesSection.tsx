"use client";

import { useState } from "react";
import { getConfidencePastille } from "@/lib/brain/trust";

export interface MemoryRow {
  id: string;
  sanitized_summary: string;
  memory_type: string;
  category: string;
  sentiment: string;
  status: string;
  confidence_score: number;
  sensitivity_level: number;
  created_at: string;
}

interface Props {
  contactId: string;
  initialMemories: MemoryRow[];
}

const ACTION_LABELS = [
  { action: "actif",    label: "Toujours valable" },
  { action: "à_revalider", label: "Mettre à jour" },
  { action: "invalidé", label: "Plus valable" },
  { action: "archivé",  label: "Archiver" },
  { action: "masqué",   label: "Masquer" },
] as const;

type Action = (typeof ACTION_LABELS)[number]["action"];

// ── Pastille de confiance (sans chiffre — section 9) ─────────────────────────

function ConfidenceDot({ score }: { score: number }) {
  const tier = getConfidencePastille(score);
  const size = 7;
  const style: React.CSSProperties =
    tier === 'full'
      ? { background: 'var(--pine)', border: 'none' }
      : tier === 'outline'
        ? { background: 'transparent', border: '1.5px solid var(--ink-3)' }
        : { background: 'transparent', border: '1.5px dashed var(--ink-3)' };

  return (
    <span
      title={tier === 'full' ? 'Source fiable' : tier === 'outline' ? 'Source probable' : 'À confirmer'}
      style={{
        display: 'inline-block',
        width: size, height: size,
        borderRadius: '50%',
        flexShrink: 0,
        marginTop: 1,
        ...style,
      }}
      aria-label={tier === 'full' ? 'Source fiable' : tier === 'outline' ? 'Source probable' : 'À confirmer'}
    />
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  'goût_durable': '✦',
  'événement_de_vie': '◉',
  'situation_émotionnelle': '○',
  'deuil': '·',
  'réussite': '★',
  'fragilité': '○',
  'rêve': '◌',
  'préférence_cadeau': '◇',
  'préférence_expérience': '◈',
  'changement_de_vie': '◉',
};

// ── Status badge ──────────────────────────────────────────────────────────────

function sentimentColor(sentiment: string): string {
  if (sentiment.includes('négatif') || sentiment === 'très_négatif') return 'var(--ink-3)';
  if (sentiment === 'positif' || sentiment === 'très_positif') return 'var(--pine)';
  return 'var(--ink-3)';
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MemoriesSection({ initialMemories }: Props) {
  const [memories, setMemories] = useState<MemoryRow[]>(initialMemories);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = memories.filter(m => !['masqué', 'archivé'].includes(m.status));

  if (visible.length === 0) return null;

  async function handleAction(memoryId: string, action: Action) {
    if (updating) return;
    setUpdating(memoryId);
    try {
      const res = await fetch(`/api/memories/${memoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        setMemories(prev =>
          prev.map(m => m.id === memoryId ? { ...m, status: action } : m)
        );
        setExpanded(null);
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {visible.map(mem => {
        const isExpanded = expanded === mem.id;
        const icon = TYPE_ICONS[mem.memory_type] ?? '·';
        const isInvalidated = mem.status === 'invalidé';
        const pastilleTier = getConfidencePastille(mem.confidence_score);

        return (
          <div
            key={mem.id}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              border: `0.5px solid ${isInvalidated ? 'var(--line)' : 'rgba(23,62,49,.12)'}`,
              background: isInvalidated ? 'rgba(253,253,251,.4)' : 'var(--white)',
              opacity: isInvalidated ? 0.55 : 1,
            }}
          >
            {/* Content row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 12, color: sentimentColor(mem.sentiment), flexShrink: 0, marginTop: 2, width: 12, textAlign: 'center' }}>
                {icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 14, fontWeight: 300,
                  color: isInvalidated ? 'var(--ink-3)' : 'var(--ink)',
                  lineHeight: 1.6,
                  textDecoration: isInvalidated ? 'line-through' : 'none',
                }}>
                  {mem.sanitized_summary}
                </p>
                <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--ink-3)', marginTop: 4 }}>
                  {new Date(mem.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  {mem.status === 'à_revalider' && (
                    <span style={{ marginLeft: 8, color: 'var(--champ)' }}>· à revalider</span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <ConfidenceDot score={mem.confidence_score} />
                {!isInvalidated && (
                  <button
                    onClick={() => setExpanded(isExpanded ? null : mem.id)}
                    style={{
                      background: 'none', border: 'none',
                      fontSize: 11, fontWeight: 300, color: 'var(--ink-3)',
                      cursor: 'pointer', padding: '0 4px',
                    }}
                    title={pastilleTier === 'full' ? 'Source fiable' : pastilleTier === 'outline' ? 'Source probable' : 'À confirmer'}
                    aria-label="Actions"
                  >
                    {isExpanded ? '↑' : '···'}
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            {isExpanded && !isInvalidated && (
              <div style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '0.5px solid var(--line)',
                display: 'flex', flexWrap: 'wrap', gap: 6,
              }}>
                {ACTION_LABELS.filter(a => a.action !== mem.status).map(({ action, label }) => (
                  <button
                    key={action}
                    onClick={() => handleAction(mem.id, action)}
                    disabled={updating === mem.id}
                    style={{
                      padding: '6px 12px',
                      border: '0.5px solid var(--line)',
                      borderRadius: 20,
                      background: action === 'invalidé'
                        ? 'transparent'
                        : action === 'actif'
                          ? 'rgba(23,62,49,.06)'
                          : 'var(--white)',
                      cursor: 'pointer',
                      fontSize: 12, fontWeight: 300,
                      color: action === 'invalidé' ? 'var(--ink-3)' : 'var(--ink)',
                      opacity: updating === mem.id ? 0.5 : 1,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
