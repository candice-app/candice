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

interface Props {
  contacts: FlowContact[];
  initialContactId: string | null;
}

type W2Step = "pick" | "input" | "analysis" | "brand" | "confidence" | "magic";

// ── Confidence labels ─────────────────────────────────────────────────────────

const CONFIDENCE_OPTIONS = [
  { value: "haute", label: "Elle/lui me l'a dit directement" },
  { value: "moyenne_haute", label: "Elle/lui l'a regardé / essayé / commenté" },
  { value: "moyenne", label: "Je pense que ça pourrait lui plaire" },
  { value: "moyenne_basse", label: "Je ne suis pas sûr(e)" },
] as const;

const CONFIDENCE_LABEL: Record<string, string> = {
  haute: "source directe",
  moyenne_haute: "source fiable",
  moyenne: "piste probable",
  moyenne_basse: "piste à confirmer",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Contact picker (shared with W1) ──────────────────────────────────────────

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
        Pour qui as-tu<br />repéré quelque chose ?
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

// ── Step 2: Input ─────────────────────────────────────────────────────────────

function InputStep({
  contact,
  photoFile,
  photoPreview,
  urlInput,
  description,
  onPhotoChange,
  onUrlChange,
  onDescriptionChange,
  onAnalyse,
  analysing,
  onBack,
  error,
}: {
  contact: FlowContact;
  photoFile: File | null;
  photoPreview: string | null;
  urlInput: string;
  description: string;
  onPhotoChange: (f: File | null, preview: string | null) => void;
  onUrlChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onAnalyse: () => void;
  analysing: boolean;
  onBack: () => void;
  error: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hasInput = !!photoFile || !!urlInput.trim() || !!description.trim();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) { onPhotoChange(null, null); return; }
    const url = URL.createObjectURL(file);
    onPhotoChange(file, url);
  }

  return (
    <div style={{ paddingTop: 40, paddingBottom: 32 }}>
      <button onClick={onBack} style={{
        background: "none", border: "none",
        fontSize: 12, color: "var(--ink-3)", fontWeight: 300, cursor: "pointer", padding: 0,
      }}>
        ← Retour
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 24px" }}>
        <Avatar initial={contact.name[0]} size={44} variant="g" />
        <div>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", marginBottom: 2 }}>
            Repéré pour
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
        lineHeight: 1.2, marginBottom: 24,
      } as React.CSSProperties}>
        Qu&apos;as-tu vu ?
      </h2>

      {/* Photo */}
      <div style={{ marginBottom: 16 }}>
        {photoPreview ? (
          <div style={{ position: "relative", marginBottom: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Aperçu"
              style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12 }}
            />
            <button
              onClick={() => onPhotoChange(null, null)}
              style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(0,0,0,.55)", border: "none",
                borderRadius: "50%", width: 28, height: 28,
                color: "#fff", fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", padding: "18px",
              border: "0.5px dashed rgba(23,62,49,.25)",
              borderRadius: 12, background: "rgba(23,62,49,.03)",
              cursor: "pointer", color: "var(--pine)",
              fontSize: 14, fontWeight: 300,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>📷</span>
            Ajouter une photo
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* URL */}
      <input
        type="url"
        value={urlInput}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="Lien vers l'article (optionnel)"
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "12px 16px",
          border: "0.5px solid var(--line)",
          borderRadius: 12,
          background: "var(--white)",
          fontSize: 14, fontWeight: 300, color: "var(--ink)",
          outline: "none", marginBottom: 12,
        }}
      />

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Ou décris ce que tu as vu…"
        rows={3}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "14px 16px",
          border: "0.5px solid rgba(23,62,49,.2)",
          borderRadius: 14,
          background: "var(--white)",
          fontSize: 15, fontWeight: 300, color: "var(--ink)",
          lineHeight: 1.7, outline: "none", resize: "none",
          fontFamily: "var(--font-sans)",
          marginBottom: 16,
        }}
      />

      {error && (
        <p style={{ fontSize: 12, color: "#c0392b", marginBottom: 10, fontWeight: 300 }}>{error}</p>
      )}

      <button
        onClick={onAnalyse}
        disabled={!hasInput || analysing}
        className="btn-primary"
        style={{ width: "100%" }}
      >
        {analysing ? "…" : "Analyser avec Candice →"}
      </button>
    </div>
  );
}

// ── Step 3: Analysis loading ──────────────────────────────────────────────────

function AnalysisLoading() {
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
        Candice regarde…
      </p>
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", textAlign: "center" }}>
        Je comprends ce que tu as repéré.
      </p>
    </div>
  );
}

// ── Step 4: Brand precision ───────────────────────────────────────────────────

const BRAND_OPTIONS = [
  { value: "known", label: "Oui, je connais la marque" },
  { value: "unknown", label: "Non, je ne sais pas" },
  { value: "window", label: "C'était en vitrine" },
  { value: "link", label: "J'ai un lien" },
  { value: "told", label: "Elle/lui m'en a parlé" },
  { value: "tried", label: "Elle/lui l'a essayé / regardé / commenté" },
] as const;

function BrandStep({
  itemDescription,
  brandOption,
  brandName,
  locationHint,
  urlInput,
  onBrandOption,
  onBrandName,
  onLocation,
  onUrl,
  onNext,
  onBack,
}: {
  itemDescription: string;
  brandOption: string;
  brandName: string;
  locationHint: string;
  urlInput: string;
  onBrandOption: (v: string) => void;
  onBrandName: (v: string) => void;
  onLocation: (v: string) => void;
  onUrl: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const canContinue = !!brandOption;

  return (
    <div style={{ paddingTop: 40, paddingBottom: 32 }}>
      <button onClick={onBack} style={{
        background: "none", border: "none",
        fontSize: 12, color: "var(--ink-3)", fontWeight: 300, cursor: "pointer", padding: 0,
        marginBottom: 20,
      }}>
        ← Retour
      </button>

      {/* Description card */}
      <div style={{
        padding: "14px 16px",
        borderRadius: 12,
        border: "0.5px solid rgba(23,62,49,.15)",
        background: "rgba(23,62,49,.03)",
        marginBottom: 28,
      }}>
        <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: ".36em", textTransform: "uppercase", color: "var(--pine)", marginBottom: 6 }}>
          Ce que Candice a vu
        </p>
        <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink)", lineHeight: 1.6 }}>
          {itemDescription}
        </p>
      </div>

      <h2 style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300, fontSize: 22,
        color: "var(--ink)", letterSpacing: "-.015em",
        lineHeight: 1.2, marginBottom: 20,
      } as React.CSSProperties}>
        Tu connais la marque, la boutique ou l&apos;endroit où tu l&apos;as vu ?
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {BRAND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onBrandOption(opt.value)}
            style={{
              padding: "13px 16px",
              border: brandOption === opt.value
                ? "0.5px solid var(--pine)"
                : "0.5px solid var(--line)",
              borderRadius: 12,
              background: brandOption === opt.value
                ? "rgba(23,62,49,.06)"
                : "var(--white)",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 14, fontWeight: brandOption === opt.value ? 400 : 300,
              color: "var(--ink)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {brandOption === "known" && (
        <input
          type="text"
          value={brandName}
          onChange={(e) => onBrandName(e.target.value)}
          placeholder="Nom de la marque…"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "12px 16px",
            border: "0.5px solid var(--line)", borderRadius: 12,
            background: "var(--white)",
            fontSize: 14, fontWeight: 300, color: "var(--ink)",
            outline: "none", marginBottom: 16,
          }}
        />
      )}

      {brandOption === "window" && (
        <input
          type="text"
          value={locationHint}
          onChange={(e) => onLocation(e.target.value)}
          placeholder="Ville ou quartier (optionnel)"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "12px 16px",
            border: "0.5px solid var(--line)", borderRadius: 12,
            background: "var(--white)",
            fontSize: 14, fontWeight: 300, color: "var(--ink)",
            outline: "none", marginBottom: 16,
          }}
        />
      )}

      {brandOption === "link" && (
        <input
          type="url"
          value={urlInput}
          onChange={(e) => onUrl(e.target.value)}
          placeholder="Lien vers l'article"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "12px 16px",
            border: "0.5px solid var(--line)", borderRadius: 12,
            background: "var(--white)",
            fontSize: 14, fontWeight: 300, color: "var(--ink)",
            outline: "none", marginBottom: 16,
          }}
        />
      )}

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="btn-primary"
        style={{ width: "100%" }}
      >
        Continuer →
      </button>
    </div>
  );
}

// ── Step 5: Confidence ────────────────────────────────────────────────────────

function ConfidenceStep({
  selected,
  onSelect,
  onSave,
  saving,
  onBack,
  error,
}: {
  selected: string;
  onSelect: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  onBack: () => void;
  error: string | null;
}) {
  return (
    <div style={{ paddingTop: 40, paddingBottom: 32 }}>
      <button onClick={onBack} style={{
        background: "none", border: "none",
        fontSize: 12, color: "var(--ink-3)", fontWeight: 300, cursor: "pointer", padding: 0,
        marginBottom: 20,
      }}>
        ← Retour
      </button>

      <h2 style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300, fontSize: 24,
        color: "var(--ink)", letterSpacing: "-.015em",
        lineHeight: 1.2, marginBottom: 8,
      } as React.CSSProperties}>
        Cette envie vient de qui ?
      </h2>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.6 }}>
        Ça aide Candice à calibrer la confiance accordée à cette piste.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {CONFIDENCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              padding: "15px 18px",
              border: selected === opt.value
                ? "0.5px solid var(--pine)"
                : "0.5px solid var(--line)",
              borderRadius: 12,
              background: selected === opt.value
                ? "rgba(23,62,49,.06)"
                : "var(--white)",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 14, fontWeight: selected === opt.value ? 400 : 300,
              color: "var(--ink)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <p style={{ fontSize: 12, color: "#c0392b", marginBottom: 10, fontWeight: 300 }}>{error}</p>
      )}

      <button
        onClick={onSave}
        disabled={!selected || saving}
        className="btn-primary"
        style={{ width: "100%" }}
      >
        {saving ? "…" : "Enregistrer →"}
      </button>
    </div>
  );
}

// ── Step 6: Magic moment ──────────────────────────────────────────────────────

function W2MagicMoment({
  contact,
  itemDescription,
  confidenceLevel,
  visibleBlocks,
}: {
  contact: FlowContact;
  itemDescription: string;
  confidenceLevel: string;
  visibleBlocks: number;
}) {
  const firstName = contact.name.split(" ")[0];
  const confLabel = CONFIDENCE_LABEL[confidenceLevel] ?? confidenceLevel;

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
          Candice a enregistré.
        </p>
      </div>

      {/* Bloc 1 */}
      {visibleBlocks >= 1 && (
        <div style={blockStyle}>
          <div style={{
            ...cardStyle,
            background: "rgba(23,62,49,.04)",
            border: "0.5px solid rgba(23,62,49,.12)",
          }}>
            <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: ".36em", textTransform: "uppercase", color: "var(--pine)", marginBottom: 8 }}>
              Ce que Candice garde
            </p>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)", lineHeight: 1.7 }}>
              {itemDescription}
            </p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginTop: 8 }}>
              Source : {confLabel}
            </p>
          </div>
        </div>
      )}

      {/* Bloc 2 */}
      {visibleBlocks >= 2 && (
        <div style={blockStyle}>
          <div style={{ ...cardStyle }}>
            <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink)", lineHeight: 1.7 }}>
              J&apos;ai ajouté cette piste au profil de {firstName}. Je la garde précieusement —
              elle peut nous servir pour un anniversaire, une fête ou une attention spontanée.
            </p>
          </div>
        </div>
      )}

      {/* Bloc 3 */}
      {visibleBlocks >= 3 && (
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
                  L&apos;article a été ajouté à ses pistes.
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

export default function W2Flow({ contacts, initialContactId }: Props) {
  const [step, setStep] = useState<W2Step>(() =>
    initialContactId ? "input" : "pick"
  );
  const [selectedContact, setSelectedContact] = useState<FlowContact | null>(() =>
    initialContactId ? (contacts.find((c) => c.id === initialContactId) ?? null) : null
  );
  const [search, setSearch] = useState("");

  // Step 2
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [analysing, setAnalysing] = useState(false);

  // Step 3 → result
  const [itemDescription, setItemDescription] = useState("");

  // Step 4
  const [brandOption, setBrandOption] = useState("");
  const [brandName, setBrandName] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [brandUrlInput, setBrandUrlInput] = useState("");

  // Step 5
  const [confidenceLevel, setConfidenceLevel] = useState("");

  // Step 6
  const [saving, setSaving] = useState(false);
  const [visibleBlocks, setVisibleBlocks] = useState(0);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "magic") return;
    setVisibleBlocks(0);
    const t1 = setTimeout(() => setVisibleBlocks(1), 350);
    const t2 = setTimeout(() => setVisibleBlocks(2), 1900);
    const t3 = setTimeout(() => setVisibleBlocks(3), 3400);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [step]);

  function handleSelectContact(c: FlowContact) {
    setSelectedContact(c);
    setStep("input");
    setError(null);
  }

  async function handleAnalyse() {
    if (analysing || (!photoFile && !urlInput.trim() && !descriptionInput.trim())) return;
    setAnalysing(true);
    setStep("analysis");
    setError(null);

    try {
      let photoBase64: string | null = null;
      let mimeType: string | null = null;

      if (photoFile) {
        const dataUrl = await readFileAsDataURL(photoFile);
        const [prefix, b64] = dataUrl.split(",");
        photoBase64 = b64;
        mimeType = prefix.split(":")[1].split(";")[0];
      }

      const res = await fetch("/api/memories/w2-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoBase64,
          mimeType,
          sourceLink: urlInput.trim() || null,
          description: descriptionInput.trim() || null,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json() as { itemDescription: string };
      setItemDescription(data.itemDescription);
      setStep("brand");
    } catch {
      setError("Une erreur est survenue. Réessaie dans un instant.");
      setStep("input");
    } finally {
      setAnalysing(false);
    }
  }

  async function handleSave() {
    if (saving || !selectedContact || !confidenceLevel) return;
    setSaving(true);
    setError(null);

    try {
      const effectiveUrl = brandOption === "link" ? brandUrlInput.trim() : urlInput.trim();

      const res = await fetch("/api/memories/w2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContact.id,
          description: itemDescription,
          sourceLink: effectiveUrl || null,
          brandOption,
          brandName: brandName.trim() || null,
          locationHint: locationHint.trim() || null,
          confidenceLevel,
        }),
      });

      if (!res.ok) throw new Error();
      setStep("magic");
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setSaving(false);
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
        <InputStep
          contact={selectedContact}
          photoFile={photoFile}
          photoPreview={photoPreview}
          urlInput={urlInput}
          description={descriptionInput}
          onPhotoChange={(f, p) => { setPhotoFile(f); setPhotoPreview(p); }}
          onUrlChange={setUrlInput}
          onDescriptionChange={setDescriptionInput}
          onAnalyse={handleAnalyse}
          analysing={analysing}
          onBack={() => setStep("pick")}
          error={error}
        />
      )}

      {step === "analysis" && <AnalysisLoading />}

      {step === "brand" && selectedContact && (
        <BrandStep
          itemDescription={itemDescription}
          brandOption={brandOption}
          brandName={brandName}
          locationHint={locationHint}
          urlInput={brandUrlInput}
          onBrandOption={setBrandOption}
          onBrandName={setBrandName}
          onLocation={setLocationHint}
          onUrl={setBrandUrlInput}
          onNext={() => setStep("confidence")}
          onBack={() => setStep("input")}
        />
      )}

      {step === "confidence" && (
        <ConfidenceStep
          selected={confidenceLevel}
          onSelect={setConfidenceLevel}
          onSave={handleSave}
          saving={saving}
          onBack={() => setStep("brand")}
          error={error}
        />
      )}

      {step === "magic" && selectedContact && (
        <W2MagicMoment
          contact={selectedContact}
          itemDescription={itemDescription}
          confidenceLevel={confidenceLevel}
          visibleBlocks={visibleBlocks}
        />
      )}
    </div>
  );
}
