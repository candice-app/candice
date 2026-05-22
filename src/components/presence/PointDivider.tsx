"use client";

import LivePoint from "./LivePoint";

interface Props {
  label: string;
}

export default function PointDivider({ label }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      margin: '42px 0 18px',
    }}>
      <div style={{ flex: 1, height: '.5px', background: 'var(--line)' }} />
      <LivePoint size={5} tone="pine" />
      <span style={{
        fontSize: 10,
        letterSpacing: '.34em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '.5px', background: 'var(--line)' }} />
    </div>
  );
}
