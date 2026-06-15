"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/v4/IconSprite";

interface ProfileSectionProps {
  icon: string;
  iconName?: string;
  iconBg?: string;
  iconColor?: string;
  title: string;
  summary?: string | null;
  chips?: string[];
  filled: boolean;
  editHref?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sectionKey?: string;
  children?: React.ReactNode;
}

export default function ProfileSection({
  icon, iconName, iconBg, iconColor,
  title, summary, chips = [], filled, editHref, ctaLabel, ctaHref, sectionKey, children,
}: ProfileSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      borderRadius: 14,
      border: `0.5px solid ${filled ? 'rgba(23,62,49,.14)' : 'var(--line)'}`,
      background: filled ? 'var(--white)' : 'rgba(253,253,251,.5)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => filled ? setExpanded(e => !e) : undefined}
        style={{
          width: '100%', padding: '15px 16px',
          background: 'none', border: 'none',
          cursor: filled ? 'pointer' : 'default',
          textAlign: 'left',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}
        aria-expanded={expanded}
      >
        {iconName ? (
          <div style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            background: iconBg ?? 'var(--mist)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: iconColor ?? 'var(--pine)',
          }}>
            <Icon name={iconName} size={20} />
          </div>
        ) : (
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{icon}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <p style={{
              fontSize: 14, fontWeight: filled ? 400 : 300,
              color: filled ? 'var(--ink)' : 'var(--ink-3)',
              lineHeight: 1.3,
            }}>
              {title}
            </p>
            {filled && (
              <span style={{
                fontSize: 12, color: 'var(--ink-3)', flexShrink: 0,
                transition: 'transform 0.18s',
                transform: expanded ? 'rotate(180deg)' : 'none',
                display: 'inline-block',
              }}>
                ▾
              </span>
            )}
          </div>

          {/* Summary preview (collapsed) */}
          {filled && summary && !expanded && (
            <p style={{
              fontSize: 13, fontWeight: 300, color: 'var(--ink-2)',
              lineHeight: 1.6, marginTop: 3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            } as React.CSSProperties}>
              {summary}
            </p>
          )}

          {/* Chips row (collapsed) */}
          {filled && chips.length > 0 && !expanded && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
              {chips.slice(0, 5).map((chip, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 300,
                  padding: '3px 9px', borderRadius: 20,
                  background: 'rgba(23,62,49,.06)',
                  border: '0.5px solid rgba(23,62,49,.12)',
                  color: 'var(--pine)',
                }}>
                  {chip}
                </span>
              ))}
              {chips.length > 5 && (
                <span style={{ fontSize: 11, fontWeight: 300, color: 'var(--ink-3)', alignSelf: 'center' }}>
                  +{chips.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Empty state */}
          {!filled && (
            <p style={{ fontSize: 12, fontWeight: 300, color: 'var(--ink-3)', marginTop: 2 }}>
              Pas encore renseigné
            </p>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && filled && (
        <div style={{ borderTop: '0.5px solid var(--line)', padding: '14px 16px 16px' }}>
          {summary && (
            <p style={{
              fontSize: 14, fontWeight: 300, color: 'var(--ink-2)',
              lineHeight: 1.7, marginBottom: chips.length > 0 ? 12 : 0,
            }}>
              {summary}
            </p>
          )}
          {chips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: children ? 12 : 0 }}>
              {chips.map((chip, i) => (
                <span key={i} style={{
                  fontSize: 12, fontWeight: 300,
                  padding: '5px 12px', borderRadius: 20,
                  background: 'rgba(23,62,49,.06)',
                  border: '0.5px solid rgba(23,62,49,.12)',
                  color: 'var(--pine)',
                }}>
                  {chip}
                </span>
              ))}
            </div>
          )}
          {children}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {editHref && (
              <Link href={editHref} style={{
                display: 'inline-block',
                fontSize: 12, fontWeight: 400, color: 'var(--pine)',
                textDecoration: 'none',
                padding: '6px 14px',
                border: '0.5px solid rgba(23,62,49,.2)',
                borderRadius: 20,
                background: 'rgba(23,62,49,.04)',
              }}>
                Modifier
              </Link>
            )}
            {ctaLabel && (
              ctaHref ? (
                <Link href={ctaHref} style={{ textDecoration: 'none' }}>
                  <button
                    data-section={sectionKey}
                    style={{
                      fontSize: 12, fontWeight: 400,
                      color: 'var(--pine)',
                      padding: '6px 14px',
                      border: '0.5px solid rgba(23,62,49,.2)',
                      borderRadius: 20,
                      background: 'rgba(23,62,49,.04)',
                      cursor: 'pointer',
                    }}
                  >
                    {ctaLabel}
                  </button>
                </Link>
              ) : (
                <button
                  disabled
                  data-section={sectionKey}
                  style={{
                    fontSize: 12, fontWeight: 300,
                    color: 'var(--ink-3)',
                    padding: '6px 14px',
                    border: '0.5px solid var(--line)',
                    borderRadius: 20,
                    background: 'none',
                    cursor: 'not-allowed',
                    opacity: 0.6,
                  }}
                >
                  {ctaLabel}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Empty + has edit link */}
      {!filled && editHref && (
        <div style={{ padding: '0 16px 13px 46px' }}>
          <Link href={editHref} style={{
            fontSize: 12, fontWeight: 300, color: 'var(--ink-3)',
            textDecoration: 'none',
          }}>
            Compléter →
          </Link>
        </div>
      )}
    </div>
  );
}
