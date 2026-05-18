"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuestionnaireForm from "@/components/questionnaire/QuestionnaireForm";

type Mode = "standard" | "incognito" | null;
type Relationship = "partner" | "friend" | "family" | "colleague" | "other";

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: "partner", label: "Partenaire" },
  { value: "friend", label: "Ami(e)" },
  { value: "family", label: "Famille" },
  { value: "colleague", label: "Collègue" },
  { value: "other", label: "Autre" },
];

function ModeCard({
  title,
  subtitle,
  description,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "20px",
        borderRadius: "var(--r-md)",
        border: active ? "1.5px solid var(--terra)" : "0.5px solid var(--brd)",
        background: active ? "var(--t2)" : "var(--bg)",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 500, color: active ? "var(--terra)" : "var(--con)", marginBottom: 2 }}>
        {title}
        <span style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)", marginLeft: 8 }}>{subtitle}</span>
      </p>
      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6, marginTop: 6 }}>
        {description}
      </p>
    </button>
  );
}

function IncognitoForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("friend");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/contacts/create-incognito", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), relationship, phone: phone.trim(), postal_address: address.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    const { contactId } = await res.json();
    router.push(`/contacts/${contactId}/questionnaire`);
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 300,
    border: "0.5px solid var(--brd)",
    borderRadius: "var(--r-sm)",
    background: "var(--bg)",
    color: "var(--con)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", display: "block", marginBottom: 6 }}>
          Prénom *
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex : Sophie"
          required
          style={fieldStyle}
        />
      </div>

      <div>
        <label style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", display: "block", marginBottom: 6 }}>
          Relation *
        </label>
        <select
          value={relationship}
          onChange={e => setRelationship(e.target.value as Relationship)}
          style={fieldStyle}
        >
          {RELATIONSHIPS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", display: "block", marginBottom: 6 }}>
          Téléphone *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Ex : +33 6 12 34 56 78"
          required
          style={fieldStyle}
        />
      </div>

      <div>
        <label style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", display: "block", marginBottom: 6 }}>
          Adresse postale * <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0 }}>(pour les livraisons)</span>
        </label>
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Ex : 12 rue de la Paix, 75001 Paris"
          required
          rows={2}
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </div>

      {/* Encart juridique */}
      <div style={{
        padding: "12px 14px",
        background: "var(--br3)",
        border: "0.5px solid var(--brd)",
        borderRadius: "var(--r-sm)",
      }}>
        <p style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6 }}>
          En saisissant ces informations, tu agis comme mandataire de ton proche pour les attentions à venir.{" "}
          <a href="/mentions-legales" style={{ color: "var(--terra)", textDecoration: "underline" }}>
            Voir nos conditions.
          </a>
        </p>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: "#E05252", fontWeight: 300 }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim() || !phone.trim() || !address.trim()}
        className="btn-primary"
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Création…" : "Créer le profil incognito →"}
      </button>
    </form>
  );
}

export default function NewContactFlow() {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Mode selection */}
      {mode === null && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ModeCard
              title="Mode standard"
              subtitle="recommandé"
              description="Tu invites le proche, il remplit lui-même son questionnaire. Il découvre Candice avec une analyse personnelle à la fin."
              active={false}
              onClick={() => setMode("standard")}
            />
            <ModeCard
              title="Mode incognito"
              subtitle=""
              description="Tu remplis tout toi-même, ton proche n'est pas informé. Idéal quand tu veux gérer les attentions de A à Z."
              active={false}
              onClick={() => setMode("incognito")}
            />
          </div>
        </>
      )}

      {/* Standard mode */}
      {mode === "standard" && (
        <>
          <button
            onClick={() => setMode(null)}
            style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
          >
            ← Changer de mode
          </button>
          <QuestionnaireForm />
        </>
      )}

      {/* Incognito mode */}
      {mode === "incognito" && (
        <>
          <button
            onClick={() => setMode(null)}
            style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
          >
            ← Changer de mode
          </button>
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--terra)", marginBottom: 4 }}>
              Mode incognito
            </p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6 }}>
              Renseigne les informations essentielles. Ton proche ne sera pas notifié.
            </p>
          </div>
          <IncognitoForm />
        </>
      )}
    </div>
  );
}
