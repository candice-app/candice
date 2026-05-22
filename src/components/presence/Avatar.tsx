"use client";

interface Props {
  initial: string;
  size?: number;
  variant?: 'g' | 'c';
}

export default function Avatar({ initial, size = 46, variant = 'g' }: Props) {
  const bg = variant === 'g'
    ? 'radial-gradient(120% 120% at 30% 22%, #FFFFFF, #EDF4F0 50%, #D2E1D9)'
    : 'radial-gradient(120% 120% at 30% 22%, #FFFFFF, #F6F0E1 50%, #E7D8B4)';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: bg,
      boxShadow: '0 0 0 1px var(--champ-line)',
      fontFamily: 'var(--font-serif)',
      fontOpticalSizing: 'auto',
      fontSize: size * 0.39,
      color: 'var(--pine)',
    } as React.CSSProperties}>
      {initial.toUpperCase()}
    </span>
  );
}
