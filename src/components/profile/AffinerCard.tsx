import Link from "next/link";

export type CompletionLevel = 'empty' | 'started' | 'well_filled' | 'precise';

const LEVEL_META: Record<CompletionLevel, { badge: string | null; color: string }> = {
  empty:      { badge: null,          color: 'rgba(23,62,49,.04)' },
  started:    { badge: 'En cours',    color: 'rgba(23,62,49,.04)' },
  well_filled:{ badge: 'Bien rempli', color: 'rgba(23,62,49,.06)' },
  precise:    { badge: 'Très précis', color: 'rgba(205,185,135,.1)' },
};

interface Props {
  level: CompletionLevel;
}

export default function AffinerCard({ level }: Props) {
  const { badge, color } = LEVEL_META[level];

  return (
    <div style={{
      padding: '20px 20px 18px',
      borderRadius: 16,
      background: color,
      border: level === 'precise'
        ? '0.5px solid rgba(205,185,135,.35)'
        : '0.5px solid rgba(23,62,49,.1)',
      marginBottom: 24,
    }}>
      {badge && (
        <span style={{
          display: 'inline-block',
          fontSize: 10, fontWeight: 500,
          letterSpacing: '.22em', textTransform: 'uppercase',
          color: level === 'precise' ? 'var(--champ)' : 'var(--pine)',
          background: level === 'precise' ? 'rgba(205,185,135,.18)' : 'rgba(23,62,49,.08)',
          padding: '3px 10px', borderRadius: 20, marginBottom: 12,
        }}>
          {badge}
        </span>
      )}
      <p style={{
        fontSize: 14, fontWeight: 300, color: 'var(--ink-2)',
        lineHeight: 1.7, marginBottom: 18,
      }}>
        {level === 'precise'
          ? 'Candice te connaît bien — ceux qui t\'aiment peuvent maintenant viser juste.'
          : 'Candice te connaît de mieux en mieux. Pour que ceux qui t\'aiment visent juste.'}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link href="/moi/discovery" style={{ textDecoration: 'none', flex: 1 }}>
          <button style={{
            width: '100%', padding: '11px 14px',
            borderRadius: 12, border: '0.5px solid rgba(23,62,49,.2)',
            background: 'var(--white)',
            fontSize: 13, fontWeight: 300,
            color: 'var(--pine)',
            cursor: 'pointer', textAlign: 'center' as const,
          }}>
            Une seule question rapide
          </button>
        </Link>
        <Link href="/moi/discovery?mode=full" style={{ textDecoration: 'none', flex: 1 }}>
          <button style={{
            width: '100%', padding: '11px 14px',
            borderRadius: 12, border: 'none',
            background: 'var(--pine)',
            fontSize: 13, fontWeight: 400, color: 'var(--canvas)',
            cursor: 'pointer', textAlign: 'center' as const,
          }}>
            Affiner mon profil
          </button>
        </Link>
      </div>
    </div>
  );
}
