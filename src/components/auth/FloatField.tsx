"use client";

// F4 STOP final — champ d'auth à LABEL FLOTTANT : le libellé vit DANS le
// champ (toute la zone est cliquable) et remonte à la saisie/au focus.
// DA Candice, cibles ≥44px, erreurs françaises sous le champ.

import { useState } from "react";

export default function FloatField({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  autoComplete,
  inputMode,
  prefix,
  error,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  /** préfixe visuel (ex. « @ ») affiché quand le label est remonté */
  prefix?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ position: "relative", display: "block", cursor: "text" }}>
        <span style={{
          position: "absolute",
          left: floated && prefix ? 34 : 16,
          top: floated ? 7 : "50%",
          transform: floated ? "none" : "translateY(-50%)",
          fontSize: floated ? 11 : 16,
          fontWeight: floated ? 500 : 300,
          letterSpacing: floated ? 0.6 : 0,
          textTransform: floated ? "uppercase" : "none",
          color: error ? "#C44A4A" : floated ? "var(--pine)" : "var(--ink-3)",
          transition: "all .15s ease",
          pointerEvents: "none",
          zIndex: 1,
        }}>
          {label}{required ? " *" : ""}
        </span>
        {prefix && floated && (
          <span style={{
            position: "absolute", left: 16, bottom: 11, fontSize: 16,
            fontWeight: 300, color: "var(--ink-3)", pointerEvents: "none",
          }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoCapitalize={type === "email" || prefix ? "none" : undefined}
          spellCheck={false}
          style={{
            width: "100%", boxSizing: "border-box", height: 58,
            padding: `22px 16px 6px ${floated && prefix ? 34 : 16}px`,
            fontSize: 16, fontWeight: 300,
            background: "var(--white)",
            border: error ? "1px solid rgba(196,74,74,.55)" : "0.5px solid var(--line)",
            borderRadius: 8, color: "var(--ink)",
            fontFamily: "var(--font-sans)", outline: "none",
            transition: "border-color 0.15s",
          }}
        />
      </label>
      <div style={{ minHeight: 22, paddingTop: 4 }}>
        {error
          ? <p style={{ fontSize: 12.5, color: "#C44A4A", margin: 0, lineHeight: 1.4 }}>{error}</p>
          : hint
            ? <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", margin: 0, lineHeight: 1.4 }}>{hint}</p>
            : null}
      </div>
    </div>
  );
}
