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

const REGISTER_OPTIONS_INCOGNITO: { value: string; label: string; subtext: string }[] = [
  { value: "très_proche_fluide",     label: "Très proche et fluide",                   subtext: "Vous pouvez vous parler naturellement, sans trop réfléchir." },
  { value: "proche_quotidien",       label: "Proche, mais prise dans le quotidien",     subtext: "Le lien est là, mais il manque parfois de temps ou d'attention." },
  { value: "importante_distante",    label: "Importante, mais un peu distante",         subtext: "Vous tenez l'un à l'autre, mais le lien n'est pas toujours nourri." },
  { value: "compliquée_fragile",     label: "Compliquée ou fragile",                    subtext: "Il faut éviter les attentions trop intimes ou trop émotionnelles." },
  { value: "formelle_occasionnelle", label: "Plutôt formelle ou occasionnelle",         subtext: "Les attentions doivent rester simples, sobres et adaptées." },
  { value: "je_ne_sais_pas",         label: "Je ne sais pas trop",                      subtext: "Candice commencera doucement, sans supposer trop d'intimité." },
];

const GENDER_OPTIONS = [
  { value: "femme", label: "Elle (féminin)" },
  { value: "homme", label: "Il (masculin)" },
  { value: "non_binaire", label: "Iel (non-binaire)" },
  { value: "non_precise", label: "Je préfère ne pas préciser" },
];

function IncognitoForm() {
  const router = useRouter();
  const [infoStep, setInfoStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<string>("");
  const [relationship, setRelationship] = useState<Relationship>("friend");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [register, setRegister] = useState<string>("");
  const [complicatedContext, setComplicatedContext] = useState<string>("");
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
      body: JSON.stringify({ name: name.trim(), relationship, phone: phone.trim(), postal_address: address.trim(), relationship_register: register || null, gender: gender || null, complicated_context: (register === "compliquée_fragile" && complicatedContext.trim()) ? complicatedContext.trim() : null }),
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

  // Step 0 — basic info
  if (infoStep === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", display: "block", marginBottom: 6 }}>
            Prénom *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex : Sophie"
            style={fieldStyle}
            onKeyDown={e => e.key === "Enter" && name.trim() && setInfoStep(1)}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", display: "block", marginBottom: 8 }}>
            Pronom
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {GENDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(opt.value)}
                style={{
                  padding: "7px 13px", borderRadius: 20, fontSize: 13, fontWeight: 300,
                  border: gender === opt.value ? "1.5px solid var(--terra)" : "0.5px solid var(--brd)",
                  background: gender === opt.value ? "var(--t2)" : "transparent",
                  color: gender === opt.value ? "var(--terra)" : "var(--cond)",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => setInfoStep(1)}
          className="btn-primary"
          style={{ opacity: name.trim() ? 1 : 0.45 }}
        >
          Suivant →
        </button>
      </div>
    );
  }

  // Step 1 — register question
  if (infoStep === 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 400, color: "var(--con)", marginBottom: 4, lineHeight: 1.4 }}>
            Et aujourd&apos;hui, votre relation avec {name} ressemble plutôt à…
          </p>
          <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5 }}>
            Uniquement visible par vous. Candice adapte ses idées en conséquence.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {REGISTER_OPTIONS_INCOGNITO.map((opt) => {
            const selected = register === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRegister(opt.value)}
                style={{
                  textAlign: "left", padding: "12px 14px",
                  borderRadius: "var(--r-sm)",
                  border: selected ? "1.5px solid var(--terra)" : "0.5px solid var(--brd)",
                  background: selected ? "var(--t2)" : "var(--bg)",
                  cursor: "pointer",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: selected ? 500 : 400, color: selected ? "var(--terra)" : "var(--con)", marginBottom: 2 }}>
                  {opt.label}
                </p>
                <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", lineHeight: 1.45 }}>
                  {opt.subtext}
                </p>
              </button>
            );
          })}
        </div>

        {/* Expanding "compliquée" context block */}
        {register === "compliquée_fragile" && (
          <div style={{
            padding: "14px 13px",
            background: "var(--br3)",
            border: "0.5px solid var(--brd)",
            borderRadius: "var(--r-sm)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 3 }}>
              Tu veux nous en dire un peu plus ? <span style={{ fontWeight: 300, color: "var(--cond)" }}>(facultatif)</span>
            </p>
            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", lineHeight: 1.55, marginBottom: 10 }}>
              Cela nous aidera à proposer juste, sans tomber à côté.
            </p>
            <label style={{ fontSize: 11, fontWeight: 400, color: "var(--cond)", display: "block", marginBottom: 5 }}>
              Comment tu aimes entretenir le lien avec {name}, malgré ce qui est compliqué
            </label>
            <textarea
              value={complicatedContext}
              onChange={e => setComplicatedContext(e.target.value)}
              rows={4}
              placeholder="Par ex. : pour sa fête, je veux quand même un cadeau, mais sobre — qui montre que je connais ses goûts, sans démonstration affective. Plutôt un mot court qu'un long message. Pas d'appels surprise."
              style={{
                width: "100%", padding: "10px 12px", fontSize: 12, fontWeight: 300,
                lineHeight: 1.6, border: "0.5px solid var(--brd)", borderRadius: "var(--r-sm)",
                background: "var(--bg)", color: "var(--con)", resize: "vertical",
                outline: "none", boxSizing: "border-box", fontFamily: "var(--font-sans)",
              }}
            />
            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", lineHeight: 1.55, marginTop: 8, fontStyle: "italic" }}>
              Sur ce registre, Candice propose avec retenue. Tes retours après chaque attention nous aideront à viser juste.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setInfoStep(0)}
            className="btn-ghost"
            style={{ flex: "0 0 auto" }}
          >
            ← Retour
          </button>
          <button
            type="button"
            onClick={() => setInfoStep(2)}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            Suivant →
          </button>
        </div>
      </div>
    );
  }

  // Step 2 — rest of form
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button
        type="button"
        onClick={() => setInfoStep(1)}
        style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
      >
        ← Retour
      </button>

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
        disabled={loading || !phone.trim() || !address.trim()}
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
