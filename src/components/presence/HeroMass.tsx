"use client";

import React from "react";
import LivePoint from "./LivePoint";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: { label: string; onClick?: () => void; href?: string };
  rightSlot?: React.ReactNode;
}

export default function HeroMass({ eyebrow, title, subtitle, cta, rightSlot }: Props) {
  return (
    <div style={{
      position: 'relative',
      padding: '0 0 54px',
      borderRadius: '0 0 36px 36px',
      overflow: 'hidden',
      background: 'radial-gradient(130% 100% at 26% 0%, #1E4337 0%, #0E2219 44%, #060E0A 100%)',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 26px 0',
      }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 300,
          fontSize: 21,
          letterSpacing: '.34em',
          textTransform: 'uppercase',
          color: '#F6F3EA',
          paddingLeft: '.34em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
        }}>
          CANDICE
          <LivePoint size={6} tone="champ" />
        </span>
        {rightSlot}
      </div>

      {/* Content */}
      <div style={{ padding: '54px 28px 0' }}>
        {eyebrow && (
          <div style={{
            fontSize: 10.5,
            letterSpacing: '.4em',
            textTransform: 'uppercase',
            color: 'var(--champ)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 28,
          }}>
            <LivePoint size={5} tone="champ" />
            {eyebrow}
          </div>
        )}

        <p style={{
          fontFamily: 'var(--font-serif)',
          fontOpticalSizing: 'auto',
          fontWeight: 300,
          fontSize: 'clamp(28px, 5vw, 35px)',
          lineHeight: 1.2,
          color: '#FAF8F1',
          letterSpacing: '-.022em',
          marginBottom: subtitle ? 20 : 32,
        } as React.CSSProperties}>
          {title}
        </p>

        {subtitle && (
          <p style={{
            fontSize: 14.5,
            fontWeight: 300,
            color: 'rgba(244,241,232,.66)',
            lineHeight: 1.7,
            maxWidth: 290,
            marginBottom: 32,
          }}>
            {subtitle}
          </p>
        )}

        {/* Filet champagne */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, var(--champ-line), transparent)',
          marginBottom: 26,
        }} />

        {cta && (
          <button
            type="button"
            onClick={cta.onClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 400,
              color: '#F6F3EA',
              fontFamily: 'var(--font-sans)',
              padding: 0,
            }}
          >
            {cta.label}
            <span style={{ transition: 'transform .35s' }}>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
