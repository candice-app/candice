"use client";

import { useEffect, useRef, useState } from "react";
import LivePoint from "./LivePoint";

interface Props {
  lines: string[];
  cta?: { label: string; onClick: () => void };
  show: boolean;
}

export default function Moment({ lines, cta, show }: Props) {
  const [revealedLines, setRevealedLines] = useState<number[]>([]);
  const [ctaVisible, setCtaVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRevealedLines([]);
    setCtaVisible(false);

    if (!show) return;

    lines.forEach((_, i) => {
      const t = setTimeout(() => {
        setRevealedLines(prev => [...prev, i]);
      }, 900 + i * 800);
      timers.current.push(t);
    });

    const ctaTimer = setTimeout(() => {
      setCtaVisible(true);
    }, 900 + lines.length * 800 + 600);
    timers.current.push(ctaTimer);

    return () => timers.current.forEach(clearTimeout);
  }, [show, lines.length]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      opacity: show ? 1 : 0,
      visibility: show ? 'visible' : 'hidden',
      transition: 'opacity .9s cubic-bezier(.4,0,.2,1), visibility .9s',
      background: 'radial-gradient(135% 70% at 50% 40%, rgba(62,115,97,.20) 0%, rgba(62,115,97,0) 62%), #0E1A14',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 30px',
      zIndex: 500,
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <LivePoint size={7} tone="glow" style={{ marginBottom: 26 }} />

        {lines.map((line, i) => (
          <p
            key={i}
            style={{
              fontFamily: 'var(--font-serif)',
              fontOpticalSizing: 'auto',
              fontWeight: 300,
              fontSize: 'clamp(20px, 3.5vw, 25px)',
              lineHeight: 1.45,
              color: i === 0 ? 'rgba(252,251,247,.9)' : '#fff',
              letterSpacing: '-.01em',
              marginTop: i > 0 ? 16 : 0,
              opacity: revealedLines.includes(i) ? 1 : 0,
              transform: revealedLines.includes(i) ? 'none' : 'translateY(8px)',
              transition: 'opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)',
            } as React.CSSProperties}
          >
            {line}
          </p>
        ))}
      </div>

      {cta && (
        <div style={{
          paddingBottom: 48,
          opacity: ctaVisible ? 1 : 0,
          transition: 'opacity .6s ease',
        }}>
          <button
            type="button"
            onClick={cta.onClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              background: 'none',
              border: 'none',
              color: 'rgba(252,251,247,.85)',
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {cta.label} <span style={{ transition: 'transform .35s' }}>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
