"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  contactId: string;
  contactName: string;
  onClose: () => void;
}

type ArchiveReason = 'deceased' | 'lost_contact' | 'end_of_relationship' | 'other';

const REASONS: { value: ArchiveReason; label: string; description: string }[] = [
  { value: 'deceased', label: 'Décès', description: 'Ce proche nous a quittés.' },
  { value: 'lost_contact', label: 'Contact perdu', description: 'Vous n\'êtes plus en contact.' },
  { value: 'end_of_relationship', label: 'Fin de relation', description: 'La relation s\'est terminée.' },
  { value: 'other', label: 'Autre raison', description: '' },
];

export default function ArchiveDialog({ contactId, contactName, onClose }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState<ArchiveReason | null>(null);
  const [memoryMode, setMemoryMode] = useState(false);
  const [anniversaryOptIn, setAnniversaryOptIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason) return;
    setLoading(true);
    setError(null);

    const res = await fetch('/api/contacts/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId,
        reason,
        is_memory: reason === 'deceased' ? memoryMode : false,
        memory_anniversary_opt_out: reason === 'deceased' && memoryMode ? !anniversaryOptIn : true,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Une erreur est survenue.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(18, 10, 4, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg)', borderRadius: 'var(--r-lg)',
        padding: '28px 24px', width: '100%', maxWidth: 420,
        border: '0.5px solid var(--brd)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--con)', marginBottom: 4 }}>
            Archiver {contactName}
          </p>
          <p style={{ fontSize: 12, fontWeight: 300, color: 'var(--cond)', lineHeight: 1.6 }}>
            Le profil sera conservé mais Candice ne générera plus de suggestions actives.
          </p>
        </div>

        {/* Raison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--cond)' }}>
            Raison
          </p>
          {REASONS.map(r => (
            <button
              key={r.value}
              onClick={() => {
                setReason(r.value);
                if (r.value === 'deceased') setMemoryMode(true);
              }}
              style={{
                textAlign: 'left', padding: '12px 14px',
                borderRadius: 'var(--r-sm)',
                border: reason === r.value ? '1.5px solid var(--terra)' : '0.5px solid var(--brd)',
                background: reason === r.value ? 'var(--t2)' : 'var(--bg)',
                cursor: 'pointer',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: reason === r.value ? 500 : 300, color: reason === r.value ? 'var(--terra)' : 'var(--con)' }}>
                {r.label}
              </p>
              {r.description && (
                <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--cond)', marginTop: 2 }}>{r.description}</p>
              )}
            </button>
          ))}
        </div>

        {/* Mode souvenir (décès uniquement) */}
        {reason === 'deceased' && (
          <div style={{ padding: '14px', background: 'var(--br3)', borderRadius: 'var(--r-sm)', border: '0.5px solid var(--brd)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={memoryMode}
                onChange={e => setMemoryMode(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <div>
                <p style={{ fontSize: 12, fontWeight: 400, color: 'var(--con)', marginBottom: 2 }}>
                  Conserver en mode souvenir
                </p>
                <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--cond)', lineHeight: 1.5 }}>
                  Le profil reste accessible en lecture, avec un design discret.
                </p>
              </div>
            </label>

            {memoryMode && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={anniversaryOptIn}
                  onChange={e => setAnniversaryOptIn(e.target.checked)}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--cond)', lineHeight: 1.5 }}>
                  Me rappeler la date d&apos;anniversaire chaque année
                </p>
              </label>
            )}
          </div>
        )}

        {error && <p style={{ fontSize: 12, color: '#E05252', fontWeight: 300 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ fontSize: 12 }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason || loading}
            className="btn-primary"
            style={{ fontSize: 12, opacity: (!reason || loading) ? 0.5 : 1 }}
          >
            {loading ? 'Archivage…' : 'Archiver'}
          </button>
        </div>
      </div>
    </div>
  );
}
