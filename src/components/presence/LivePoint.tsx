"use client";

export type LivePointTone = 'pine' | 'champ' | 'glow' | 'soft';

interface Props {
  size?: number;
  tone?: LivePointTone;
  live?: boolean;
  style?: React.CSSProperties;
}

const STYLES: Record<LivePointTone, React.CSSProperties> = {
  pine: {
    background: 'var(--pine)',
    boxShadow: '0 0 7px 1px rgba(23,62,49,.3)',
  },
  champ: {
    background: 'var(--champ)',
    boxShadow: '0 0 9px 1px rgba(205,185,135,.5)',
  },
  glow: {
    background: 'var(--pine-glow)',
    boxShadow: '0 0 11px 2px rgba(62,115,97,.5)',
  },
  soft: {
    background: 'var(--white)',
    boxShadow: '0 0 0 1.4px var(--pine)',
  },
};

export default function LivePoint({ size = 6, tone = 'pine', live = true, style }: Props) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        ...STYLES[tone],
        ...(live ? { animation: 'life 3.6s ease-in-out infinite' } : {}),
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
