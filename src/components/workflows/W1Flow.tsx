"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Avatar from "@/components/presence/Avatar";
import LivePoint from "@/components/presence/LivePoint";

interface FlowContact {
  id: string;
  name: string;
  photo_url: string | null;
}

interface W1Result {
  memoryId: string;
  sanitized_summary: string;
  sentiment: "très_négatif" | "négatif" | "neutre" | "positif" | "très_positif";
  category: string;
  emotional_intensity: "faible" | "moyen" | "élevé" | "très_élevé";
  sensitivity_level: number;
}

interface Props {
  contacts: FlowContact[];
  initialContactId: string | null;
}

type W1Step = "pick" | "input" | "loading" | "magic";

// ── Copy helpers ──────────────────────────────────────────────────────────────

function bloc2Copy(result: W1Result, firstName: string): string {
  if (result.sensitivity_level >= 4) {
    return `Ce que tu me confies est grave. Je reste attentive, mais cette situation mérite un soutien humain — un proche de confiance ou un professionnel. En France, le 15 et le 112 sont disponibles à tout moment.`;
  }
  if (result.sensitivity_level === 3) {
    return `Je suis désolée. C'est une nouvelle difficile. J'ai noté ça avec beaucoup de précaution. Je serai très discrète dans les semaines à venir.`;
  }
  if (result.sensitivity_level === 2 || result.sentiment === "négatif" || result.sentiment === "très_négatif") {
    return `Je comprends. J'ai noté ça et je serai attentive pour ${firstName}.`;
  }
  if (result.sentiment === "positif" || result.sentiment === "très_positif") {
    return `J'ai noté ça dans le profil de ${firstName}. Ça me donne quelques idées.`;
  }
  return `J'ai noté ça dans le profil de ${firstName}. Ça m'aidera à mieux comprendre ce qu'il/elle traverse.`;
}

// ── Block: contact picker ─────────────────────────────────────────────────────

function ContactPicker({
  contacts,
  search,
  onSearch,
  onSelect,
}: {
  contacts: FlowContact[];
  search: string;
  onSearch: (v: string) => void;
  onSelect: (c: FlowContact) => void;
}) {
  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingTop: 40, paddingBottom: 32 }}>
      <Link href="/parler-a-candice" style={{ textDecoration: "none" }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Retour</span>
      </Link>

      <h1 style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300, fontSize: 30,
        color: "var(--ink)", letterSpacing: "-.02em",
        lineHeight: 1.1, marginTop: 20, marginBottom: 24,
      } as React.CSSProperties}>
        Pour qui as-tu<br />une nouvelle ?
      </h1>

      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Chercher un proche…"
        autoFocus
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "13px 16px",
          border: "0.5px solid var(--line)",
          borderRadius: 12,
          background: "var(--white)",
          fontSize: 15, fontWeight: 300, color: "var(--ink)",
          outline: "none", marginBottom: 16,
        }}
      />

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 300, textAlign: "center", padding: "24px 0" }}>
          Aucun proche trouvé.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px",
                border: "0.5px solid var(--line)",
                borderRadius: 12,
                background: "var(--white)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Avatar initial={c.name[0]} size={42} variant={i % 2 === 0 ? "g" : "c"} />
              <span style={{ fontSize: 16, fontWeight: 400, color: "var(--ink)" }}>
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Block: text input ─────────────────────────────────────────────────────────

function TextInput({
  contact,
  value,
  onChange,
  onSubmit,
  submitting,
  onBack,
  error,
}: {
  contact: FlowContact;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  onBack: () => void;
  error: string | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const firstName = contact.name.split(" ")[0];

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <div style={{ paddingTop: 40, paddingBottom: 32 }}>
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none",
          fontSize: 12, color: "var(--ink-3)", fontWeight: 300, cursor: "pointer", padding: 0,
        }}
      >
        ← Retour
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 24px" }}>
        <Avatar initial={contact.name[0]} size={44} variant="g" />
        <div>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", marginBottom: 2 }}>
            Nouvelle sur
          </p>
          <p style={{ fontSize: 17, fontWeight: 400, color: "var(--ink)" }}>
            {contact.name}
          </p>
        </div>
      </div>

      <h2 style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300, fontSize: 26,
        color: "var(--ink)", letterSpacing: "-.018em",
        lineHeight: 1.2, marginBottom: 6,
      } as React.CSSProperties}>
        Comment va {firstName} ?
      </h2>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", marginBottom: 20, lineHeight: 1.6 }}>
        Dis-moi ce qui se passe.
      </p>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); autoResize(); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim()) onSubmit();
        }}
        placeholder={`Raconte-moi ce qui se passe pour ${firstName}…`}
        rows={4}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "14px 16px",
          border: "0.5px solid rgba(23,62,49,.2)",
          borderRadius: 14,
          background: "var(--white)",
          fontSize: 15, fontWeight: 300, color: "var(--ink)",
          lineHeight: 1.7, outline: "none", resize: "none",
          minHeight: 110,
          fontFamily: "var(--font-sans)",
        }}
      />

      {error && (
        <p style={{ fontSize: 12, color: "#c0392b", marginTop: 8, fontWeight: 300 }}>{error}</p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button
          onClick={onSubmit}
          disabled={!value.trim() || submitting}
          className="btn-primary"
          style={{ minWidth: 120 }}
        >
          {submitting ? "…" : "Envoyer"}
        </button>
      </div>

      <p style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 300, marginTop: 10, textAlign: "right" }}>
        ⌘↵ pour envoyer
      </p>
    </div>
  );
}

// ── Block: loading ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{
      paddingTop: 80, paddingBottom: 40,
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 20,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "radial-gradient(130% 130% at 32% 24%, #1E4337 0%, #112a21 60%, #081710 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <LivePoint size={8} tone="champ" />
      </div>
      <p style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300, fontSize: 22,
        color: "var(--ink)", letterSpacing: "-.015em",
        textAlign: "center",
      } as React.CSSProperties}>
        Candice réfléchit…
      </p>
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", textAlign: "center" }}>
        Un instant, je comprends ce que tu m&apos;as confié.
      </p>
    </div>
  );
}

// ── Block: magic moment ───────────────────────────────────────────────────────

function MagicMoment({
  contact,
  result,
  visibleBlocks,
}: {
  contact: FlowContact;
  result: W1Result;
  visibleBlocks: number;
}) {
  const firstName = contact.name.split(" ")[0];

  const blockStyle: React.CSSProperties = {
    animation: "revealUp 0.55s ease both",
    marginBottom: 16,
  };

  const cardStyle: React.CSSProperties = {
    padding: "18px 20px",
    borderRadius: 14,
    border: "0.5px solid var(--line)",
    background: "var(--white)",
  };

  const eyebrowStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 500,
    letterSpacing: ".36em",
    textTransform: "uppercase",
    color: "var(--pine)",
    marginBottom: 8,
  };

  return (
    <div style={{ paddingTop: 40, paddingBottom: 40 }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "radial-gradient(130% 130% at 32% 24%, #1E4337 0%, #081710 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <LivePoint size={6} tone="champ" live={false} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-2)" }}>
          Candice a compris.
        </p>
      </div>

      {/* Bloc 1 — reformulation */}
      {visibleBlocks >= 1 && (
        <div style={blockStyle}>
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Ce que Candice a compris</p>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)", lineHeight: 1.7 }}>
              {result.sanitized_summary}
            </p>
          </div>
        </div>
      )}

      {/* Bloc 2 — ce que Candice fait */}
      {visibleBlocks >= 2 && (
        <div style={blockStyle}>
          <div style={{
            ...cardStyle,
            background: result.sensitivity_level >= 3
              ? "rgba(240,236,230,.6)"
              : "rgba(23,62,49,.04)",
            border: result.sensitivity_level >= 3
              ? "0.5px solid rgba(192,152,100,.3)"
              : "0.5px solid rgba(23,62,49,.12)",
          }}>
            <p style={eyebrowStyle}>Ce que Candice fait</p>
            <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink)", lineHeight: 1.7 }}>
              {bloc2Copy(result, firstName)}
            </p>
          </div>
        </div>
      )}

      {/* Bloc 3 — notice (uniquement si sensitivity < 3) */}
      {visibleBlocks >= 3 && result.sensitivity_level < 3 && (
        <div style={blockStyle}>
          <div style={{
            ...cardStyle,
            background: "transparent",
            border: "0.5px solid var(--line)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6 }}>
              Candice est attentive.
              Les propositions pour {firstName} arrivent dans les prochaines heures.
            </p>
          </div>
        </div>
      )}

      {/* Bloc 4 — fiche */}
      {visibleBlocks >= 4 && (
        <div style={blockStyle}>
          <Link href={`/contacts/${contact.id}`} style={{ textDecoration: "none" }}>
            <div style={{
              ...cardStyle,
              display: "flex", alignItems: "center", gap: 14,
              cursor: "pointer",
              borderColor: "rgba(23,62,49,.18)",
            }}>
              <Avatar initial={contact.name[0]} size={44} variant="g" />
              <div>
                <p style={{ fontSize: 14, fontWeight: 400, color: "var(--ink)", marginBottom: 2 }}>
                  Voir la fiche de {firstName}
                </p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)" }}>
                  L&apos;élément vient d&apos;être ajouté au profil.
                </p>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 16, color: "var(--ink-3)" }}>→</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function W1Flow({ contacts, initialContactId }: Props) {
  const [step, setStep] = useState<W1Step>(() =>
    initialContactId ? "input" : "pick"
  );
  const [selectedContact, setSelectedContact] = useState<FlowContact | null>(() =>
    initialContactId ? (contacts.find((c) => c.id === initialContactId) ?? null) : null
  );
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<W1Result | null>(null);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Progressive block reveal in magic step
  useEffect(() => {
    if (step !== "magic" || !result) return;
    setVisibleBlocks(0);
    const t1 = setTimeout(() => setVisibleBlocks(1), 350);
    const t2 = setTimeout(() => setVisibleBlocks(2), 1900);
    const t3 = setTimeout(() => setVisibleBlocks(3), 3400);
    const t4 = setTimeout(() => setVisibleBlocks(4), 4900);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [step, result]);

  function handleSelectContact(c: FlowContact) {
    setSelectedContact(c);
    setStep("input");
    setError(null);
  }

  async function handleSubmit() {
    if (submitting || !inputText.trim() || !selectedContact) return;
    setSubmitting(true);
    setStep("loading");
    setError(null);

    try {
      const res = await fetch("/api/memories/w1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: selectedContact.id, text: inputText.trim() }),
      });

      if (!res.ok) throw new Error("api_error");
      const data = await res.json() as W1Result;

      setResult(data);
      setStep("magic");
    } catch {
      setError("Une erreur est survenue. Réessaie dans un instant.");
      setStep("input");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="content-col">
      {step === "pick" && (
        <ContactPicker
          contacts={contacts}
          search={search}
          onSearch={setSearch}
          onSelect={handleSelectContact}
        />
      )}

      {step === "input" && selectedContact && (
        <TextInput
          contact={selectedContact}
          value={inputText}
          onChange={setInputText}
          onSubmit={handleSubmit}
          submitting={submitting}
          onBack={() => setStep("pick")}
          error={error}
        />
      )}

      {step === "loading" && <LoadingState />}

      {step === "magic" && selectedContact && result && (
        <MagicMoment
          contact={selectedContact}
          result={result}
          visibleBlocks={visibleBlocks}
        />
      )}
    </div>
  );
}
