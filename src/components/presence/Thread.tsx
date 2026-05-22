"use client";

import React, { useEffect, useRef } from "react";
import LivePoint from "./LivePoint";

interface ThreadItemProps {
  children: React.ReactNode;
  nodeType?: 'solid' | 'soft' | 'anticipe';
  voice?: boolean;
  dim?: boolean;
}

export function ThreadItem({ children, nodeType = 'solid', voice = false, dim = false }: ThreadItemProps) {
  const nodeBg =
    nodeType === 'soft'     ? 'var(--white)' :
    nodeType === 'anticipe' ? 'var(--pine)'  : 'var(--pine)';
  const nodeShadow =
    nodeType === 'soft'     ? '0 0 0 1.4px var(--pine)' :
    nodeType === 'anticipe' ? `0 0 0 3px var(--champ-soft)` :
                              '0 0 0 4px rgba(23,62,49,.05)';

  return (
    <div
      data-reveal
      style={{
        position: 'relative',
        padding: '18px 0',
        opacity: dim ? 0.45 : 1,
      }}
    >
      {/* nœud */}
      <span style={{
        position: 'absolute',
        left: -28,
        top: 22,
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: nodeBg,
        boxShadow: nodeShadow,
        flexShrink: 0,
      }} />

      {voice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 10,
          letterSpacing: '.26em',
          textTransform: 'uppercase',
          color: 'var(--pine)',
          fontWeight: 500,
          marginBottom: 9,
        }}>
          <LivePoint size={4} tone="pine" />
          Candice
        </div>
      )}

      {children}
    </div>
  );
}

interface ThreadProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Thread({ children, style }: ThreadProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const idx = Array.from(items).indexOf(el);
            setTimeout(() => {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }, idx * 90);
            io.unobserve(el);
          }
        });
      },
      { root: null, threshold: 0.1 }
    );

    items.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1)';
      io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        paddingLeft: 30,
        marginTop: 16,
        ...style,
      }}
    >
      {/* Fil vertical */}
      <div style={{
        position: 'absolute',
        left: 4,
        top: 10,
        bottom: 10,
        width: 1.5,
        borderRadius: 2,
        background: 'linear-gradient(var(--pine), rgba(23,62,49,.08))',
      }} />
      {/* Lueur qui parcourt le fil */}
      <div style={{
        position: 'absolute',
        left: 3,
        width: 3.5,
        height: 48,
        borderRadius: 3,
        top: 0,
        background: 'linear-gradient(rgba(62,115,97,0), rgba(62,115,97,.5), rgba(62,115,97,0))',
        filter: 'blur(1px)',
        animation: 'flow 6.5s ease-in-out infinite',
      }} />

      {children}
    </div>
  );
}
