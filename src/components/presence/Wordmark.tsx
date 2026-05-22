"use client";

import Link from "next/link";
import LivePoint from "./LivePoint";

interface Props {
  tone?: 'on-light' | 'on-dark';
  href?: string;
}

export default function Wordmark({ tone = 'on-light', href }: Props) {
  const textColor = tone === 'on-dark' ? '#F6F3EA' : 'var(--ink)';
  const pointTone = tone === 'on-dark' ? 'champ' : 'pine';

  const inner = (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 21,
      letterSpacing: '.34em',
      textTransform: 'uppercase',
      color: textColor,
      paddingLeft: '.34em',
    }}>
      CANDICE
      <LivePoint size={6} tone={pointTone} live />
    </span>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
