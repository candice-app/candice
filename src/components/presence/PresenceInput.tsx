"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LivePoint from "./LivePoint";

interface Props {
  onSubmit?: (text: string) => void;
  placeholder?: string;
}

export default function PresenceInput({ onSubmit, placeholder = "Dis quelque chose à Candice…" }: Props) {
  const [value, setValue] = useState("");
  const router = useRouter();

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (onSubmit && value.trim()) {
        onSubmit(value.trim());
        setValue("");
      } else {
        router.push("/parler-a-candice");
      }
    }
  };

  const handleVoiceClick = () => {
    if (!onSubmit) router.push("/parler-a-candice");
  };

  const handleInputClick = () => {
    if (!onSubmit) router.push("/parler-a-candice");
  };

  return (
    <div className="presence-input-wrap">
      <div className="presence-input-inner" style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "14px 18px",
        borderRadius: 20,
        background: "var(--white)",
        animation: "askGlow 4.5s ease-in-out infinite",
      }}>
        <LivePoint size={8} tone="glow" />
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          onClick={handleInputClick}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: 14.5,
            fontWeight: 300,
            color: value ? "var(--ink)" : "var(--ink-3)",
            outline: "none",
            padding: 0,
            width: "auto",
            boxShadow: "none",
          }}
        />
        <button
          type="button"
          aria-label="Message vocal"
          onClick={handleVoiceClick}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--pine)",
            boxShadow: "0 0 0 1px var(--champ-line)",
            padding: 0, flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
